import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  useRef,
} from "react";
import Nav from "../../../components/nav/Nav";
import { auth, db } from "../../../firebaseConfig/firebaseConfig";
import { doc, getDoc, collection, addDoc, deleteDoc } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import "../company-vagas/style.css";
import "../../../App.css";
import { useNavigate } from "react-router-dom";

interface UserData {
  name?: string;
  email?: string;
}

interface VagaData {
  nomeEmpresa: string;
  emailEmpresa: string;
  cargo: string;
  descricao: string;
  tipoContratacao: string;
  dataCriacao: Date;
  empresaId: string | undefined;
  cep: string;
  latitude: number | null;
  longitude: number | null;
}

const getCoordinatesFromAddress = async (
  address: string
): Promise<{ latitude: number | null; longitude: number | null }> => {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`
    );
    const data = await response.json();

    if (data.length > 0) {
      const { lat, lon } = data[0];
      return {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
      };
    } else {
      console.warn("Nenhuma coordenada encontrada para o endereço:", address);
      return { latitude: null, longitude: null };
    }
  } catch (error) {
    console.error("Erro ao obter coordenadas:", error);
    return { latitude: null, longitude: null };
  }
};

const getAddressFromCep = async (cep: string): Promise<string | null> => {
  try {
    const cleanCep = cep.replace(/\D/g, "");
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await response.json();

    if (data.erro) {
      return null;
    }

    return `${data.logradouro}, ${data.localidade} - ${data.uf}`;
  } catch (error) {
    console.error("Erro ao consultar ViaCEP:", error);
    return null;
  }
};

function Vagas() {
  const navigate = useNavigate();
  const [nome, setNome] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [cargo, setCargo] = useState<string>("");
  const [descricao, setDescricao] = useState<string>("");
  const [tipoContratacao, setTipoContratacao] = useState<string>("CLT");
  const [cep, setCep] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const cargoRef = useRef<HTMLInputElement>(null);
  const descricaoRef = useRef<HTMLTextAreaElement>(null);
  const cepRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) {
        console.log("Usuário não autenticado.");
        navigate("/CompanySignIn");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "Empresas", auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserData;
          setNome(userData.name || "");
          setEmail(userData.email || "");
        } else {
          console.log("Documento do usuário não encontrado!");
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
      }
    };

    fetchUserData();
  }, [navigate]);

  const formatCep = (value: string): string => {
    const cleanValue = value.replace(/\D/g, "");
    if (cleanValue.length <= 8) {
      return cleanValue.replace(/(\d{5})(\d{0,3})/, "$1-$2").substring(0, 9);
    }
    return value;
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    switch (name) {
      case "cargo":
        setCargo(value);
        break;
      case "descricao":
        setDescricao(value);
        break;
      case "tipoContratacao":
        setTipoContratacao(value);
        break;
      case "cep":
        setCep(formatCep(value));
        break;
      default:
        break;
    }
  };

  const scheduleAutomaticDeletion = async (
    vagaId: string,
    creationDate: Date
  ) => {
    const oneDayInMillis = 24 * 60 * 60 * 1000;
    const deletionTime = creationDate.getTime() + oneDayInMillis;
    const delay = deletionTime - Date.now();

    if (delay > 0) {
      setTimeout(async () => {
        try {
          await deleteDoc(doc(db, "Vagas", vagaId));
          console.log(`Vaga com ID ${vagaId} excluída automaticamente.`);
        } catch (error) {
          console.error(`Erro ao excluir vaga ${vagaId}:`, error);
        }
      }, delay);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!cargo || !descricao || !cep || cep.length !== 9) {
      alert("Por favor, preencha todos os campos corretamente.");
      return;
    }

    setIsSubmitting(true);
    const creationDate = new Date();

    try {
      const address = await getAddressFromCep(cep);
      if (!address) {
        alert("CEP inválido.");
        cepRef.current?.focus();
        return;
      }

      const coordinates = await getCoordinatesFromAddress(address);
      const vagasCollectionRef = collection(db, "Vagas");
      const vagaData: VagaData = {
        nomeEmpresa: nome,
        emailEmpresa: email,
        cargo,
        descricao,
        tipoContratacao,
        dataCriacao: creationDate,
        empresaId: auth.currentUser?.uid,
        cep,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      };

      const docRef = await addDoc(vagasCollectionRef, vagaData);
      alert("Oportunidade criada com sucesso!");
      console.log("Vaga criada com ID:", docRef.id);

      scheduleAutomaticDeletion(docRef.id, creationDate);

      setCargo("");
      setDescricao("");
      setCep("");
    } catch (error) {
      let errorMessage = "Não foi possível criar a vaga, tente novamente.";
      if (error instanceof FirebaseError) {
        errorMessage = `Erro Firebase: ${error.message}`;
      } else if (error instanceof Error) {
        errorMessage = `Erro: ${error.message}`;
      }
      console.error("Erro ao criar vaga:", error);
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className='container'>
      <div className='containerNav'>
        <Nav /> {/* Remove a prop isLoggedIn */}
      </div>
      <section className='sectionContainer'>
        <div className='Box'>
          <h2>Criar Vagas</h2>
          <div className='FormContainer'>
            <form onSubmit={handleSubmit}>
              <div className='BoxInput'>
                <label>Nome: </label>
                <input
                  type='text'
                  id='nome'
                  name='nome'
                  maxLength={30}
                  value={nome}
                  readOnly
                />
              </div>
              <div className='BoxInput'>
                <label>Email: </label>
                <input
                  type='email'
                  id='email'
                  name='email'
                  value={email}
                  readOnly
                />
              </div>
              <div className='BoxInput'>
                <label>Cargo: </label>
                <input
                  type='text'
                  id='cargo'
                  name='cargo'
                  maxLength={30}
                  value={cargo}
                  onChange={handleInputChange}
                  ref={cargoRef}
                />
              </div>
              <div className='BoxInput'>
                <label>Descrição: </label>
                <textarea
                  id='descricao'
                  name='descricao'
                  maxLength={300}
                  rows={4}
                  cols={50}
                  value={descricao}
                  onChange={handleInputChange}
                  ref={descricaoRef}
                />
              </div>
              <div className='BoxInput'>
                <label>CEP: </label>
                <input
                  type='text'
                  id='cep'
                  name='cep'
                  maxLength={9}
                  value={cep}
                  onChange={handleInputChange}
                  ref={cepRef}
                  placeholder='00000-000'
                />
              </div>
              <div className='BoxTipo'>
                <label>Tipo de contratação: </label>
              </div>
              <div className='ContainerTipo'>
                <div className='BoxTipo'>
                  <input
                    type='radio'
                    id='clt'
                    name='tipoContratacao'
                    value='CLT'
                    checked={tipoContratacao === "CLT"}
                    onChange={handleInputChange}
                  />
                  <label htmlFor='clt'>CLT</label>
                </div>
                <div className='BoxTipo'>
                  <input
                    type='radio'
                    id='contrato'
                    name='tipoContratacao'
                    value='Contrato'
                    checked={tipoContratacao === "Contrato"}
                    onChange={handleInputChange}
                  />
                  <label htmlFor='contrato'>Contrato</label>
                </div>
              </div>
              <div className='BoxTipo'>
                <input
                  type='radio'
                  id='estagio'
                  name='tipoContratacao'
                  value='Estágio'
                  checked={tipoContratacao === "Estágio"}
                  onChange={handleInputChange}
                />
                <label htmlFor='estagio'>Estágio</label>
              </div>
              <div className='BoxCriar'>
                <button className='criar' type='submit' disabled={isSubmitting}>
                  {isSubmitting ? "Criando..." : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Vagas;
