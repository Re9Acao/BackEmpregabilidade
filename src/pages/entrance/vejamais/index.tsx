// Importa hooks do React para gerenciar estado, efeitos colaterais e memoização
import { useEffect, useState, useCallback } from "react";
// Importa hooks do React Router para acessar parâmetros da URL e navegação
import { useParams, useNavigate } from "react-router-dom";
// Importa funções do Firebase para Firestore e autenticação
import { db, auth } from "../../../firebaseConfig/firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
// Importa o componente de navegação
import Nav from "../../../components/nav/Nav";
// Importa estilos CSS
import "./style.css";
import "../../../App.css";

// Define a interface para os dados da vaga armazenados no Firestore
interface VagaData {
  cargo: string; // Cargo da vaga (ex.: "Design")
  cep: string; // CEP do local da vaga
  descricao: string; // Descrição da vaga
  emailEmpresa: string; // E-mail da empresa para envio da candidatura
  nomeEmpresa: string; // Nome da empresa
  tipoContratacao: string; // Tipo de contratação (ex.: "CLT", "PJ")
}

// Define a interface para os dados de endereço retornados pela API ViaCEP
interface AddressData {
  logradouro: string; // Nome da rua
  bairro: string; // Bairro
  localidade: string; // Cidade
  uf: string; // Estado
  erro?: boolean; // Indica se o CEP é inválido
}

// Define a interface para os dados do trabalhador armazenados no Firestore
interface WorkerData {
  name: string; // Nome do trabalhador
  surname: string; // Sobrenome do trabalhador
  cpf: string; // CPF do trabalhador
  phone: string; // Telefone do trabalhador
  email: string; // E-mail do trabalhador
  cep: string; // CEP do trabalhador
  curriculumName: string; // Nome do arquivo do currículo
}

// Componente principal que exibe detalhes de uma vaga e permite candidatura
function VejaMais() {
  // Obtém o ID da vaga da URL (ex.: /vaga/:id)
  const { id } = useParams<{ id: string }>();
  // Estado para armazenar os dados da vaga
  const [vaga, setVaga] = useState<VagaData | null>(null);
  // Estado para armazenar o endereço da vaga (obtido via ViaCEP)
  const [address, setAddress] = useState<string | null>(null);
  // Estado para indicar se os dados estão sendo carregados
  const [loading, setLoading] = useState<boolean>(true);
  // Estado para armazenar mensagens de erro
  const [error, setError] = useState<string | null>(null);
  // Estado para armazenar o usuário autenticado
  const [user, setUser] = useState<User | null>(null);
  // Hook para navegação programática
  const navigate = useNavigate();

  // Monitora o estado de autenticação do usuário
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
      },
      (error) => {
        setError("Erro ao verificar autenticação.");
      }
    );

    // Cancela o listener ao desmontar o componente
    return () => {
      unsubscribe();
    };
  }, []);

  // Função para limpar o nome do arquivo do currículo
  const cleanFileName = (fileName: string) => {
    return fileName
      .replace(/\.pdf\.pdf$/, ".pdf") // Remove extensões duplicadas
      .replace(/[^a-zA-Z0-9._-]/g, ""); // Remove caracteres especiais
  };

  // Função memoizada para buscar dados da vaga no Firestore e endereço via ViaCEP
  const fetchVaga = useCallback(async () => {
    if (!id) {
      setError("ID da vaga não fornecido.");
      setLoading(false);
      return;
    }

    try {
      const vagaDoc = doc(db, "Vagas", id);
      const vagaSnapshot = await getDoc(vagaDoc);

      if (!vagaSnapshot.exists()) {
        setError("Vaga não encontrada.");
        setLoading(false);
        return;
      }

      const vagaData = vagaSnapshot.data() as VagaData;
      setVaga(vagaData);

      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${vagaData.cep}/json/`,
          { signal: AbortSignal.timeout(5000) }
        );
        const data: AddressData = await response.json();

        if (data.erro) {
          setAddress("CEP não encontrado.");
        } else {
          setAddress(
            `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`
          );
        }
      } catch (err) {
        setAddress("Erro ao carregar endereço.");
      }
    } catch (err) {
      setError("Erro ao carregar os dados da vaga.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Executa fetchVaga quando o componente é montado ou o ID muda
  useEffect(() => {
    fetchVaga();
  }, [fetchVaga]);

  // Função para lidar com o clique no botão "Eu quero!" e abrir o cliente de e-mail
  const handleApply = async () => {
    if (!user) {
      alert("Por favor, faça login para se candidatar.");
      navigate("/LoginTrabalhador");
      return;
    }

    if (!vaga?.emailEmpresa) {
      alert("E-mail da empresa não disponível. Tente novamente mais tarde.");
      return;
    }

    try {
      const trabalhadoresRef = collection(db, "Trabalhador");
      const qTrabalhadores = query(
        trabalhadoresRef,
        where("email", "==", user.email)
      );
      const trabalhadoresSnapshot = await getDocs(qTrabalhadores);

      if (trabalhadoresSnapshot.empty) {
        alert(
          "Atenção! Para enviar sua candidatura, é necessário estar registrado e logado como trabalhador. Acesse /RegistrarTrabalhador para se registrar."
        );
        navigate("/loginTrabalhador");
        return;
      }

      const trabalhadorData =
        trabalhadoresSnapshot.docs[0].data() as WorkerData;

      if (!trabalhadorData.curriculumName) {
        alert(
          "Você precisa fazer upload de um currículo antes de se candidatar."
        );
        navigate("/PerfilTrabalhador");
        return;
      }

      let workerAddress = "Endereço não disponível";
      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${trabalhadorData.cep}/json/`,
          { signal: AbortSignal.timeout(5000) }
        );
        const addressData: AddressData = await response.json();

        if (!addressData.erro) {
          workerAddress = `${addressData.logradouro}, ${addressData.bairro}, ${addressData.localidade} - ${addressData.uf}`;
        }
      } catch (err) {
        // Endereço não disponível, mantém o valor padrão
      }

      const cleanedCurriculumName = cleanFileName(
        trabalhadorData.curriculumName
      );
      const emailSubject = encodeURIComponent(
        `Candidatura - ${vaga.cargo} - ${vaga.nomeEmpresa}`
      );
      const emailBody = encodeURIComponent(
        `Prezado(a) responsável pela ${vaga.nomeEmpresa},\n\n` +
          `Meu nome é ${trabalhadorData.name} ${trabalhadorData.surname} e estou me candidatando à vaga de ${vaga.cargo}.\n\n` +
          `Dados do Candidato:\n` +
          `Nome: ${trabalhadorData.name} ${trabalhadorData.surname}\n` +
          `CPF: ${trabalhadorData.cpf}\n` +
          `Telefone: ${trabalhadorData.phone}\n` +
          `E-mail: ${trabalhadorData.email}\n` +
          `Endereço: ${workerAddress}\n` +
          `Currículo: Em anexo (nome do arquivo: ${cleanedCurriculumName})\n\n` +
          `Aguardo retorno. Obrigado pela oportunidade!\n\n` +
          `Atenciosamente,\n${trabalhadorData.name} ${trabalhadorData.surname}`
      );

      const mailtoLink = `mailto:${vaga.emailEmpresa}?subject=${emailSubject}&body=${emailBody}`;
      window.location.href = mailtoLink;

      alert(
        `A janela de e-mail será aberta. Anexe o currículo agora. ('${cleanedCurriculumName}') ao e-mail antes de enviá-lo.`
      );
    } catch (err) {
      alert("Erro ao preparar sua candidatura. Tente novamente mais tarde.");
    }
  };

  // Renderiza a interface do componente
  return (
    <>
      {/* Contêiner principal */}
      <main className='container'>
        {/* Barra de navegação */}
        <div className='containerNav'>
          <Nav />
        </div>

        {/* Seção com os detalhes da vaga */}
        <section className='sectionContainer'>
          <div className='Box'>
            <h2>Descrição da Vaga</h2>
            {loading && <p className='loading'>Carregando...</p>}
            {error && <p className='error'>{error}</p>}
            {vaga && (
              <div className='job-details'>
                <div className='job-field'>
                  <span className='label'>Nome:</span>
                  <span className='value'>{vaga.nomeEmpresa}</span>
                </div>
                <div className='job-field'>
                  <span className='label'>Cargo:</span>
                  <span className='value'>{vaga.cargo}</span>
                </div>
                <div className='job-field'>
                  <span className='label'>Descrição:</span>
                  <span className='value'>{vaga.descricao}</span>
                </div>
                <div className='job-field'>
                  <span className='label'>Tipo:</span>
                  <span className='value'>{vaga.tipoContratacao}</span>
                </div>
                <div className='job-field'>
                  <span className='label'>Email:</span>
                  <span className='value'>{vaga.emailEmpresa}</span>
                </div>
                <div className='job-field'>
                  <span className='label'>Endereço:</span>
                  <span className='value'>
                    {address || (
                      <span className='loading'>Carregando endereço...</span>
                    )}
                  </span>
                </div>
                <div className='BoxBtn'>
                  <button
                    className='apply-button'
                    onClick={handleApply}
                    disabled={!vaga?.emailEmpresa}
                  >
                    Eu quero!
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

// Exporta o componente
export default VejaMais;
