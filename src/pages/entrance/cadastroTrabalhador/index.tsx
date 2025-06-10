// Importa estilos globais e específicos do componente
import "../../../App.css"; // Estilos globais da aplicação
import "./style.css"; // Estilos específicos do componente
import "../../../components/nav/nav.css"; // Estilos do componente de navegação

// Importa ícones para alternar visibilidade da senha
import { BiHide, BiShowAlt } from "react-icons/bi";

// Importa o componente de navegação
import Nav from "../../../components/nav/Nav";

// Importa hooks do React para gerenciamento de estado, eventos e referências
import { useState, ChangeEvent, FormEvent, useRef } from "react";

// Importa utilitários do React Router para navegação e links
import { Link, useNavigate } from "react-router-dom";

// Importa funções de autenticação e Firestore do Firebase
import { createUserWithEmailAndPassword } from "firebase/auth"; // Função para criar novo usuário
import { doc, setDoc } from "firebase/firestore"; // Funções para manipulação de dados no Firestore
import {
  db,
  auth,
  checkUserExists,
} from "../../../firebaseConfig/firebaseConfig.js"; // Configuração e utilitários do Firebase

// Define a estrutura dos dados do trabalhador
interface WorkerData {
  name: string; // Nome do trabalhador
  surname: string; // Sobrenome do trabalhador
  cpf: string; // CPF do trabalhador
  birthDate: string; // Data de nascimento
  phone: string; // Telefone do trabalhador
  email: string; // Email do trabalhador
  cep: string; // CEP do trabalhador
  curriculum: File | null; // Arquivo de currículo (PDF)
  password?: string; // Senha para autenticação
  confirmPassword?: string; // Confirmação da senha
  registrationDate?: string; // Data de cadastro (formato ISO)
  type?: string; // Tipo de usuário ("Trabalhador")
}

// Componente principal para cadastro de trabalhadores
function CadastroTrabalhador() {
  // Estado para armazenar os dados do formulário
  const [newWorker, setNewWorker] = useState<WorkerData>({
    name: "",
    surname: "",
    cpf: "",
    birthDate: "",
    phone: "",
    email: "",
    cep: "",
    curriculum: null,
    password: "",
    confirmPassword: "",
    registrationDate: new Date().toISOString(), // Inicializa com a data atual
    type: "Trabalhador", // Define o tipo como "Trabalhador"
  });

  // Estados para gerenciar mensagens de erro e interações da interface
  const [emailError, setEmailError] = useState<string>(""); // Erro do campo de email
  const [passwordError, setPasswordError] = useState<string>(""); // Erro do campo de senha
  const [fileError, setFileError] = useState<string>(""); // Erro do upload do currículo
  const [fileSelected, setFileSelected] = useState<string>(
    "Nenhum arquivo escolhido"
  ); // Texto exibido para o status do currículo
  const [showPassword, setShowPassword] = useState<boolean>(false); // Controla visibilidade da senha

  // Hooks para navegação e referência ao campo de email
  const navigate = useNavigate(); // Para redirecionamento após cadastro
  const emailInputRef = useRef<HTMLInputElement>(null); // Referência para foco no campo de email

  // Valida o formato do email com expressão regular
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Valida se a senha tem pelo menos 6 caracteres
  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  // Valida o arquivo de currículo (deve ser PDF e menor que 5MB)
  const validateFile = (file: File | null) => {
    if (!file) return false;
    if (file.type !== "application/pdf") return false;
    if (file.size > 5 * 1024 * 1024) return false; // Limite de 5MB
    return true;
  };

  // Formata o CPF no padrão XXX.XXX.XXX-XX
  const formatCPF = (cpf: string) => {
    const cleanedCPF = cpf.replace(/\D/g, "").substring(0, 11);
    return cleanedCPF
      .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
      .substring(0, 14);
  };

  // Formata o telefone no padrão (XX)XXXXX-XXXX
  const formatPhone = (phone: string) => {
    const cleanedPhone = phone.replace(/\D/g, "").substring(0, 11);
    return cleanedPhone
      .replace(/(\d{2})(\d{5})(\d{4})/, "($1)$2-$3")
      .substring(0, 14);
  };

  // Formata o CEP no padrão XXXXX-XXX
  const formatCEP = (cep: string) => {
    const cleanedCEP = cep.replace(/\D/g, "").substring(0, 8);
    return cleanedCEP.replace(/(\d{5})(\d{3})/, "$1-$2").substring(0, 9);
  };

  // Manipula o cadastro do trabalhador no Firebase
  const createWorker = async (e: FormEvent) => {
    e.preventDefault(); // Impede o comportamento padrão do formulário
    // Limpa mensagens de erro anteriores
    setEmailError("");
    setPasswordError("");
    setFileError("");

    // Valida campos obrigatórios
    if (!newWorker.name) {
      alert("Preencha o campo Nome.");
      return;
    }
    if (!newWorker.surname) {
      alert("Preencha o campo Sobrenome.");
      return;
    }
    if (!newWorker.cpf) {
      alert("Preencha o campo CPF.");
      return;
    }
    if (!newWorker.birthDate) {
      alert("Preencha o campo Data de Nascimento.");
      return;
    }
    if (!newWorker.phone) {
      alert("Preencha o campo Telefone.");
      return;
    }
    if (!newWorker.email) {
      alert("Preencha o campo E-mail.");
      return;
    }
    if (!newWorker.cep) {
      alert("Preencha o campo CEP.");
      return;
    }
    if (!newWorker.curriculum) {
      alert("Faça o upload do currículo.");
      return;
    }
    if (!newWorker.password) {
      alert("Preencha o campo Senha.");
      return;
    }
    if (!newWorker.confirmPassword) {
      alert("Preencha o campo Confirme sua senha.");
      return;
    }

    // Valida formato do email
    if (!validateEmail(newWorker.email)) {
      setEmailError("Email inválido.");
      alert("Email inválido.");
      return;
    }

    // Valida comprimento da senha
    if (!validatePassword(newWorker.password!)) {
      setPasswordError("Senha deve ter pelo menos 6 caracteres.");
      alert("Senha deve ter pelo menos 6 caracteres.");
      return;
    }

    // Verifica se as senhas coincidem
    if (newWorker.password !== newWorker.confirmPassword) {
      alert("As senhas não coincidem.");
      return;
    }

    // Valida o arquivo de currículo
    if (!validateFile(newWorker.curriculum)) {
      setFileError("O currículo deve ser um PDF de até 5MB.");
      alert("O currículo deve ser um PDF de até 5MB.");
      return;
    }

    try {
      // Verifica se o email já está cadastrado na coleção 'Trabalhador'
      const emailExists = await checkUserExists(newWorker.email, "Trabalhador");
      if (emailExists) {
        alert("Este email já está cadastrado!");
        setNewWorker({ ...newWorker, email: "" });
        if (emailInputRef.current) {
          emailInputRef.current.focus(); // Foca no campo de email
        }
        return;
      }

      // Cria um novo usuário com Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newWorker.email,
        newWorker.password!
      );

      const user = userCredential.user;

      // Armazena os dados do trabalhador na coleção 'Trabalhador' no Firestore
      await setDoc(doc(db, "Trabalhador", user.uid), {
        name: newWorker.name,
        surname: newWorker.surname,
        cpf: newWorker.cpf,
        birthDate: newWorker.birthDate,
        phone: newWorker.phone,
        email: newWorker.email,
        cep: newWorker.cep,
        curriculumName: newWorker.curriculum?.name, // Armazena o nome do arquivo
        registrationDate: newWorker.registrationDate, // Armazena data de cadastro
        type: newWorker.type, // Armazena tipo como "Trabalhador"
      });

      console.log("Trabalhador cadastrado com sucesso!");
      alert("Cadastro efetuado com sucesso!");
      navigate("/LoginTrabalhador"); // Redireciona para a página de login de trabalhador
    } catch (error) {
      if (error instanceof Error) {
        console.error("Erro ao cadastrar trabalhador:", error);
        if (error.message.includes("auth/email-already-in-use")) {
          alert("Este email já está cadastrado!");
          setNewWorker({ ...newWorker, email: "" });
          if (emailInputRef.current) {
            emailInputRef.current.focus();
          }
        } else {
          alert(`Erro ao tentar se cadastrar: ${error.message}`);
        }
      } else {
        console.error("Erro desconhecido ao cadastrar trabalhador:", error);
        alert(`Erro desconhecido ao tentar se cadastrar.`);
      }
    }
  };

  // Manipula mudanças nos campos do formulário e aplica formatação
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    let formattedValue = value;

    // Aplica formatação para CPF, telefone e CEP
    if (name === "cpf") {
      formattedValue = formatCPF(value);
    } else if (name === "phone") {
      formattedValue = formatPhone(value);
    } else if (name === "cep") {
      formattedValue = formatCEP(value);
    } else if (name === "curriculum" && files && files[0]) {
      // Valida e atualiza o arquivo de currículo
      if (validateFile(files[0])) {
        setNewWorker({ ...newWorker, curriculum: files[0] });
        setFileSelected(files[0].name); // Exibe o nome do arquivo
      } else {
        setFileSelected("Nenhum arquivo escolhido");
        setFileError("O currículo deve ser um PDF de até 5MB.");
      }
      return;
    }

    // Atualiza o estado com o valor formatado
    setNewWorker({ ...newWorker, [name]: formattedValue });
  };

  // Alterna a visibilidade da senha
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Renderiza a interface do componente
  return (
    <>
      <main>
        {/* Contêiner para a barra de navegação */}
        <div className='containerNav'>
          <Nav /> {/* Removida a prop isLoggedIn */}
        </div>

        {/* Seção principal do formulário */}
        <section className='sectionContainer'>
          <div className='Box'>
            <div className='titleContainer'>
              <h1>Cadastro do Trabalhador</h1>
            </div>

            <form className='formContainer' onSubmit={createWorker}>
              {/* Grupo de campos: Nome, Sobrenome, CPF, Data de Nascimento */}
              <div className='inputContainer'>
                <div className='input-Form'>
                  <label htmlFor='name'>Nome</label>
                  <input
                    type='text'
                    id='name'
                    name='name'
                    placeholder='Digite seu nome'
                    value={newWorker.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className='input-Form'>
                  <label htmlFor='surname'>Sobrenome</label>
                  <input
                    type='text'
                    id='surname'
                    name='surname'
                    placeholder='Digite seu sobrenome'
                    value={newWorker.surname}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className='input-Form'>
                  <label htmlFor='cpf'>CPF</label>
                  <input
                    type='text'
                    id='cpf'
                    name='cpf'
                    placeholder='XXX.XXX.XXX-XX'
                    value={newWorker.cpf}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className='input-Form'>
                  <label htmlFor='birthDate'>Data de Nascimento</label>
                  <input
                    type='date'
                    id='birthDate'
                    name='birthDate'
                    value={newWorker.birthDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              {/* Grupo de campos: Telefone, Email, CEP */}
              <div className='inputContainer'>
                <div className='input-Form'>
                  <label htmlFor='phone'>Telefone</label>
                  <input
                    type='tel'
                    id='phone'
                    name='phone'
                    placeholder='(XX)XXXXX-XXXX'
                    value={newWorker.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className='input-Form'>
                  <label htmlFor='email'>E-mail</label>
                  <input
                    type='email'
                    id='email'
                    name='email'
                    placeholder='example@email.com'
                    value={newWorker.email}
                    onChange={handleInputChange}
                    ref={emailInputRef}
                    required
                  />
                  {emailError && <p className='error'>{emailError}</p>}
                </div>
                <div className='input-Form'>
                  <label htmlFor='cep'>CEP</label>
                  <input
                    type='text'
                    id='cep'
                    name='cep'
                    placeholder='XXXXX-XXX'
                    value={newWorker.cep}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              {/* Grupo de campos: Currículo, Senha, Confirmação de Senha */}
              <div className='inputContainer'>
                <div className='input-Form file-upload'>
                  <label htmlFor='curriculum'>Currículo (PDF)</label>
                  <input
                    type='file'
                    id='curriculum'
                    name='curriculum'
                    accept='application/pdf'
                    onChange={handleInputChange}
                    required
                  />
                  <span className='file-status'>{fileSelected}</span>
                  {fileError && <p className='error'>{fileError}</p>}
                </div>
                <div className='input-Form'>
                  <label htmlFor='password'>Senha</label>
                  <div className='BoxSenha'>
                    <input
                      type={showPassword ? "text" : "password"}
                      id='password'
                      name='password'
                      placeholder='Digite a senha'
                      value={newWorker.password}
                      onChange={handleInputChange}
                      required
                    />
                    <span
                      className='password-toggle'
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? <BiShowAlt /> : <BiHide />}
                    </span>
                  </div>
                  {passwordError && <p className='error'>{passwordError}</p>}
                </div>
                <div className='input-Form'>
                  <label htmlFor='confirmPassword'>Confirme sua senha</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    id='confirmPassword'
                    name='confirmPassword'
                    placeholder='Repita a senha'
                    value={newWorker.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* Botão de envio */}
              <div className='buttonContainer'>
                <button type='submit' className='submit'>
                  CADASTRAR
                </button>
              </div>
            </form>

            {/* Link para a página de login */}
            <div className='loginContainer'>
              <p>
                Já tem uma conta? <Link to='/LoginTrabalhador'>Entrar</Link>
              </p>
            </div>

            {/* Informações sobre termos e políticas */}
            <div className='infoContainer'>
              <p>Ao criar uma conta, você concorda com nossos </p>
              <p>
                <a href=''>Termos de Serviço</a>,{" "}
                <a href=''>Política de Privacidade</a> e nossas{" "}
                <a href=''>Configurações de Notificação padrão</a>
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

// Exporta o componente
export default CadastroTrabalhador;
