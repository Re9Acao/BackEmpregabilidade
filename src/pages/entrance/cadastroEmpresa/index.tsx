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
import {
  createUserWithEmailAndPassword, // Função para criar novo usuário
  fetchSignInMethodsForEmail, // Função para verificar se o email já está registrado
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; // Funções para manipulação de dados no Firestore
import { db, auth } from "../../../firebaseConfig/firebaseConfig.js"; // Configuração do Firebase

// Define a estrutura dos dados da empresa
interface CompanyData {
  name: string; // Nome da empresa
  email: string; // Email da empresa
  phone: string; // Telefone da empresa
  CNPJ: string; // CNPJ da empresa
  password?: string; // Senha para autenticação
  confirmPassword?: string; // Confirmação da senha
  registrationDate?: string; // Data de cadastro (formato ISO)
  type?: string; // Tipo de usuário ("Empresa")
}

// Componente principal para cadastro de empresas
function CadastroEmpresa() {
  // Estado para armazenar os dados do formulário
  const [newCompany, setNewCompany] = useState<CompanyData>({
    name: "",
    email: "",
    phone: "",
    CNPJ: "",
    password: "",
    confirmPassword: "",
    registrationDate: new Date().toISOString(), // Inicializa com a data atual
    type: "Empresa", // Define o tipo como "Empresa"
  });

  // Estados para mensagens de erro e visibilidade da senha
  const [emailError, setEmailError] = useState<string>(""); // Erro de validação do email
  const [passwordError, setPasswordError] = useState<string>(""); // Erro de validação da senha
  const [showPassword, setShowPassword] = useState<boolean>(false); // Controla visibilidade da senha

  // Hook para navegação programática
  const navigate = useNavigate();

  // Referência ao campo de email para foco em caso de erro
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Valida o formato do email com expressão regular
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex para formato de email
    return regex.test(email);
  };

  // Valida se a senha tem pelo menos 6 caracteres
  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  // Formata o CNPJ no padrão XX.XXX.XXX/XXXX-XX
  const formatCNPJ = (cnpj: string) => {
    const cleanedCNPJ = cnpj.replace(/\D/g, ""); // Remove caracteres não numéricos
    if (cleanedCNPJ.length <= 14) {
      return cleanedCNPJ
        .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5") // Aplica formato
        .substring(0, 18); // Limita a 18 caracteres
    }
    return cnpj; // Retorna original se inválido
  };

  // Formata o telefone no padrão (XX)XXXXX-XXXX
  const formatPhone = (phone: string) => {
    const cleanedPhone = phone.replace(/\D/g, ""); // Remove caracteres não numéricos
    if (cleanedPhone.length <= 11) {
      return cleanedPhone
        .replace(/(\d{2})(\d{5})(\d{4})/, "($1)$2-$3") // Aplica formato
        .substring(0, 14); // Limita a 14 caracteres
    }
    return phone; // Retorna original se inválido
  };

  // Manipula o envio do formulário para criar uma nova empresa
  const createCompany = async (e: FormEvent) => {
    e.preventDefault(); // Impede o comportamento padrão do formulário
    setEmailError(""); // Limpa erro de email anterior
    setPasswordError(""); // Limpa erro de senha anterior

    // Valida campos obrigatórios
    if (!newCompany.name) {
      alert("Preencha o campo Nome da empresa.");
      return;
    }
    if (!newCompany.CNPJ) {
      alert("Preencha o campo CNPJ.");
      return;
    }
    if (!newCompany.phone) {
      alert("Preencha o campo Telefone.");
      return;
    }
    if (!newCompany.email) {
      alert("Preencha o campo E-mail.");
      return;
    }
    if (!newCompany.password) {
      alert("Preencha o campo Senha.");
      return;
    }
    if (!newCompany.confirmPassword) {
      alert("Preencha o campo Confirme sua senha.");
      return;
    }

    // Valida formato do email
    if (!validateEmail(newCompany.email)) {
      setEmailError("Email inválido.");
      alert("Email inválido.");
      return;
    }

    // Valida comprimento da senha
    if (!validatePassword(newCompany.password!)) {
      setPasswordError("Senha deve ter pelo menos 6 caracteres.");
      alert("Senha deve ter pelo menos 6 caracteres.");
      return;
    }

    // Verifica se as senhas coincidem
    if (newCompany.password !== newCompany.confirmPassword) {
      alert("As senhas não coincidem.");
      return;
    }

    try {
      // Verifica se o email já está registrado no Firebase
      const signInMethods = await fetchSignInMethodsForEmail(
        auth,
        newCompany.email
      );
      if (signInMethods && signInMethods.length > 0) {
        alert("Este email já está cadastrado!");
        setNewCompany({ ...newCompany, email: "" }); // Limpa o campo de email
        if (emailInputRef.current) {
          emailInputRef.current.focus(); // Foca no campo de email
        }
        return;
      }

      // Cria um novo usuário com Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newCompany.email,
        newCompany.password!
      );

      const user = userCredential.user; // Obtém o usuário criado

      // Armazena os dados da empresa no Firestore usando o UID do usuário
      await setDoc(doc(db, "Empresas", user.uid), {
        name: newCompany.name,
        CNPJ: newCompany.CNPJ,
        phone: newCompany.phone,
        email: newCompany.email,
        registrationDate: newCompany.registrationDate, // Armazena data de cadastro
        type: newCompany.type, // Armazena tipo como "Empresa"
      });

      console.log("Empresa cadastrada com sucesso!");
      alert("Cadastro efetuado com sucesso!");
      navigate("/Login"); // Redireciona para a página de login empresarial
    } catch (error) {
      // Trata erros durante o cadastro
      if (error instanceof Error) {
        console.error("Erro ao cadastrar empresa:", error);
        if (error.message.includes("auth/email-already-in-use")) {
          alert("Este email já está cadastrado!");
          setNewCompany({ ...newCompany, email: "" });
          if (emailInputRef.current) {
            emailInputRef.current.focus();
          }
        } else {
          alert(`Erro ao tentar se cadastrar: ${error.message}`);
        }
      } else {
        console.error("Erro desconhecido ao cadastrar empresa:", error);
        alert(`Erro desconhecido ao tentar se cadastrar.`);
      }
    }
  };

  // Manipula mudanças nos campos do formulário, aplicando formatação
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Aplica formatação para CNPJ e telefone
    if (name === "CNPJ") {
      formattedValue = formatCNPJ(value);
    } else if (name === "phone") {
      const cleanedValue = value.replace(/\D/g, "").substring(0, 11); // Limita a 11 dígitos
      formattedValue = formatPhone(cleanedValue);
    }

    // Atualiza o estado com o novo valor
    setNewCompany({ ...newCompany, [name]: formattedValue });
  };

  // Manipulador específico para o campo CNPJ
  const handleCNPJChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").substring(0, 14); // Limita a 14 dígitos
    setNewCompany({ ...newCompany, CNPJ: formatCNPJ(value) });
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

        {/* Seção principal do formulário de cadastro */}
        <section className='sectionContainer'>
          <div className='Box'>
            <div className='titleContainer'>
              <h1>Cadastre sua Empresa</h1>
            </div>

            <form className='formContainer' onSubmit={createCompany}>
              {/* Campos de nome da empresa e CNPJ */}
              <div className='inputContainer'>
                <div className='input-Form'>
                  <label htmlFor='company-name'>Nome da empresa</label>
                  <input
                    type='text'
                    id='company-name'
                    name='name'
                    placeholder='Exemplo S.A.'
                    value={newCompany.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className='input-Form'>
                  <label htmlFor='cnpj'>CNPJ</label>
                  <input
                    type='text'
                    id='cnpj'
                    name='CNPJ'
                    placeholder='XX.XXX.XXX/XXXX-XX'
                    value={newCompany.CNPJ}
                    onChange={handleCNPJChange}
                    required
                  />
                </div>
              </div>
              {/* Campos de telefone e email */}
              <div className='inputContainer'>
                <div className='input-Form'>
                  <label htmlFor='phone'>Telefone</label>
                  <input
                    type='tel'
                    id='phone'
                    name='phone'
                    placeholder='(00)00000-0000'
                    value={newCompany.phone}
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
                    value={newCompany.email}
                    onChange={handleInputChange}
                    required
                  />
                  {emailError && <p className='error'>{emailError}</p>}
                </div>
              </div>
              {/* Campos de senha e confirmação de senha */}
              <div className='inputContainer'>
                <div className='input-Form'>
                  <label htmlFor='company-password'>Senha</label>
                  <div className='BoxSenha'>
                    <input
                      type={showPassword ? "text" : "password"}
                      id='company-password'
                      name='password'
                      placeholder='Digite a senha'
                      value={newCompany.password}
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
                  <label htmlFor='company-password-confirm'>
                    Confirme sua senha
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    id='company-password-confirm'
                    name='confirmPassword'
                    placeholder='Repita a senha'
                    value={newCompany.confirmPassword}
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
                Já tem uma conta? <Link to='/Login'>Entrar</Link>
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
export default CadastroEmpresa;
