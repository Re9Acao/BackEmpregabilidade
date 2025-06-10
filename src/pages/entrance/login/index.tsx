import React, { useState, FormEvent, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BiShowAlt, BiHide } from "react-icons/bi";
import LoginButton from "../../../components/login-button/button";
import Nav from "../../../components/nav/Nav";
import {
  auth,
  db,
  checkUserExists,
} from "../../../firebaseConfig/firebaseConfig";
import {
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  signInWithPopup,
  GoogleAuthProvider,
  linkWithCredential,
  OAuthCredential,
} from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import "./style.css";
import "../../../App.css";

function LoginEmpresa() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const googleProvider = new GoogleAuthProvider();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Preencha todos os campos!");
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);

      const empresasRef = collection(db, "Empresas");
      const q = query(empresasRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await auth.signOut();
        throw new Error("user-not-empresa");
      }

      alert("Login efetuado com sucesso!");
      navigate("/BemVindo");
    } catch (err: unknown) {
      let errorMessage = "Ocorreu um erro desconhecido.";
      if (err instanceof Error) {
        if (err.message.includes("user-not-found")) {
          errorMessage = "Email não encontrado!";
        } else if (err.message.includes("wrong-password")) {
          errorMessage = "Senha inválida!";
        } else if (err.message.includes("invalid-email")) {
          errorMessage = "Email inválido!";
        } else if (err.message.includes("invalid-credential")) {
          errorMessage = "Email ou senha inválidos!";
        } else if (err.message.includes("user-not-empresa")) {
          errorMessage = "Usuário não registrado como Empresa!";
        } else {
          errorMessage = `Erro ao fazer login: ${err.message}`;
        }
        console.error("Erro de login:", err);
      } else {
        console.error("Erro desconhecido:", err);
      }
      alert(errorMessage);
      setEmail("");
      setPassword("");
      if (emailInputRef.current) {
        emailInputRef.current.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAlternativeLogin = async () => {
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      console.log("Usuário retornado do Google:", user);
      console.log("Email do usuário retornado do Google:", user.email);

      if (!user.email) {
        alert(
          "O login com o Google não foi possível porque seu email não foi compartilhado. " +
            "Por favor, tente fazer login com seu email e senha ou verifique as configurações de privacidade da sua conta Google."
        );
        setLoading(false);
        return;
      }

      const signInMethods = await fetchSignInMethodsForEmail(auth, user.email);
      if (
        signInMethods.includes("password") &&
        !signInMethods.includes("google.com")
      ) {
        if (
          window.confirm(
            "Este email já está registrado com senha. Deseja vincular sua conta Google?"
          )
        ) {
          const credential: OAuthCredential | null =
            GoogleAuthProvider.credentialFromResult(result);
          if (!credential) {
            throw new Error("no-credential");
          }
          await linkWithCredential(user, credential);
        } else {
          await auth.signOut();
          alert(
            "Login cancelado. Use o método de email/senha ou vincule sua conta Google."
          );
          setLoading(false);
          return;
        }
      }

      const userExists = await checkUserExists(user.email, "Empresas");
      if (!userExists) {
        await auth.signOut();
        alert("Usuário não registrado como Empresa!");
        setLoading(false);
        return;
      }

      alert("Login com Google efetuado com sucesso!");
      navigate("/BemVindo");
    } catch (err: unknown) {
      let errorMessage = "Ocorreu um erro desconhecido.";
      if (err instanceof Error) {
        if (err.message.includes("no-email")) {
          return;
        } else if (err.message.includes("no-credential")) {
          errorMessage = "Erro ao obter credencial do Google.";
        } else if (err.message.includes("user-not-empresa")) {
          errorMessage = "Usuário não registrado como Empresa!";
        } else if (
          err.message.includes("auth/account-exists-with-different-credential")
        ) {
          errorMessage =
            "Este email já está registrado com outro método de login. Use o método original ou vincule os métodos.";
        } else {
          errorMessage = `Erro ao fazer login com Google: ${err.message}`;
        }
        console.error("Erro de login alternativo:", err);
      } else {
        console.error("Erro desconhecido:", err);
      }
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      <main>
        <div className='containerNav'>
          <Nav /> {/* Remove a prop isLoggedIn */}
        </div>
        <section className='sectionContainer'>
          <div className='Box'>
            <div className='titleContainer'>
              <h1>Login Empresarial</h1>
            </div>
            <form className='formContainer' onSubmit={handleSubmit}>
              <div className='inputContainer'>
                <div className='input-Form'>
                  <label htmlFor='email'>Email</label>
                  <input
                    type='email'
                    id='email'
                    name='email'
                    placeholder='Digite seu email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    ref={emailInputRef}
                  />
                </div>
                <div className='input-Form'>
                  <label htmlFor='user-password'>Senha</label>
                  <div className='BoxSenha'>
                    <input
                      type={showPassword ? "text" : "password"}
                      id='user-password'
                      name='user-password'
                      placeholder='Digite sua senha'
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                      className='password-toggle'
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? <BiShowAlt /> : <BiHide />}
                    </span>
                  </div>
                </div>
              </div>
              <div className='buttonContainer'>
                <button type='submit' className='submit'>
                  {loading ? "Carregando..." : "ENTRAR"}
                </button>
              </div>
            </form>
            <hr />
            <div className='BoxLoginButton'>
              <LoginButton
                onClick={handleAlternativeLogin}
                disabled={loading}
              />
            </div>
            <div className='loginContainer'>
              <p>
                Não possui uma conta?{" "}
                <Link to='/CadastroEmpresa'>Cadastre-se</Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default LoginEmpresa;
