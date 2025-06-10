import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "../../../components/nav/Nav";
import { auth, db } from "../../../firebaseConfig/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { MdEdit } from "react-icons/md";
import { BsTrash3Fill } from "react-icons/bs";
import "../user-bem-vindo/stile.css";
import "../../../App.css";

function BemVindoUser() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [greeting, setGreeting] = useState("");
  const [loading, setLoading] = useState(true);
  const [cep, setCep] = useState("");
  const [cpf, setCpf] = useState("");
  const [curriculumName, setCurriculumName] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [surname, setSurname] = useState("");
  const [editCep, setEditCep] = useState(false);
  const [editCpf, setEditCpf] = useState(false);
  const [editName, setEditName] = useState(false);
  const [editPhone, setEditPhone] = useState(false);
  const [editSurname, setEditSurname] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const cepInputRef = useRef<HTMLInputElement | null>(null);
  const cpfInputRef = useRef<HTMLInputElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const surnameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (isDeleting) return;

      if (!user || !user.email) {
        navigate("/login");
      } else {
        try {
          const trabalhadoresRef = collection(db, "Trabalhador");
          const q = query(trabalhadoresRef, where("email", "==", user.email));
          const querySnapshot = await getDocs(q);
          if (querySnapshot.empty) {
            throw new Error("Documento não encontrado na coleção Trabalhador");
          }
          const userData = querySnapshot.docs[0].data();
          setCep(userData.cep || "");
          setCpf(userData.cpf || "");
          setCurriculumName(userData.curriculumName || "");
          setName(userData.name || "");
          setPhone(userData.phone || "");
          setSurname(userData.surname || "");
          const fullName =
            `${userData.name || ""} ${userData.surname || ""}`.trim() ||
            "Usuário";
          setUserName(fullName);
          setGreeting(getGreeting());
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
          setUserName("Usuário");
          setGreeting(getGreeting());
        } finally {
          setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, [navigate, isDeleting]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const formatCEP = (value: string) => {
    const cleanedCEP = value.replace(/\D/g, "");
    if (cleanedCEP.length <= 8) {
      setCep(cleanedCEP.replace(/(\d{5})(\d{3})/, "$1-$2").substring(0, 9));
    }
  };

  const formatCPF = (value: string) => {
    const cleanedCPF = value.replace(/\D/g, "");
    if (cleanedCPF.length <= 11) {
      setCpf(
        cleanedCPF
          .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
          .substring(0, 14)
      );
    }
  };

  const formatPhone = (value: string) => {
    const cleanedPhone = value.replace(/\D/g, "");
    if (cleanedPhone.length <= 11) {
      setPhone(
        cleanedPhone
          .replace(/(\d{2})(\d{5})(\d{4})/, "($1)$2-$3")
          .substring(0, 14)
      );
    }
  };

  const handleEditClick = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    ref: React.MutableRefObject<HTMLInputElement | null>
  ) => {
    setter(true);
    if (ref.current) ref.current.focus();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCurriculumName(file.name);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Deseja realmente excluir o seu cadastro?"
    );
    if (confirmDelete && auth.currentUser) {
      try {
        setIsDeleting(true);
        setLoading(true);
        const trabalhadoresRef = collection(db, "Trabalhador");
        const q = query(
          trabalhadoresRef,
          where("email", "==", auth.currentUser.email)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          await deleteDoc(doc(db, "Trabalhador", querySnapshot.docs[0].id));
          await auth.currentUser.delete();
          alert("Conta excluída com sucesso!");
          navigate("/", { replace: true });
        } else {
          throw new Error("Documento do usuário não encontrado");
        }
      } catch (error) {
        console.error("Erro ao excluir conta:", error);
        alert("Erro ao excluir a conta. Tente novamente.");
      } finally {
        setLoading(false);
        setIsDeleting(false);
      }
    }
  };

  const handleAtualizarClick = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    if (auth.currentUser) {
      try {
        const trabalhadoresRef = collection(db, "Trabalhador");
        const q = query(
          trabalhadoresRef,
          where("email", "==", auth.currentUser.email)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          await updateDoc(doc(db, "Trabalhador", querySnapshot.docs[0].id), {
            cep,
            cpf,
            curriculumName,
            name,
            phone,
            surname,
          });
          alert("Atualização efetuada com sucesso!");
          navigate("/Home");
        } else {
          throw new Error("Documento do usuário não encontrado");
        }
      } catch (error) {
        console.error("Erro ao atualizar dados:", error);
        alert("Erro ao atualizar dados. Tente novamente.");
      }
    }
  };

  return (
    <main className='container'>
      <div className='containerNav'>
        <Nav /> {/* Remove a prop isLoggedIn */}
      </div>
      <section className='sectionContainer'>
        <div className='Box'>
          {loading ? (
            <p>Carregando...</p>
          ) : (
            <>
              <p>
                <span className='tempo'>{greeting}</span>{" "}
                <span className='nome'>{userName}</span>, Seja Bem-vindo(a) ao
                nosso sistema
              </p>
              <div>
                <form className='formContainer'>
                  <div className='BoxInput'>
                    <label>Nome: </label>
                    <div className='input-icon-wrapper'>
                      <input
                        type='text'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        readOnly={!editName}
                        ref={nameInputRef}
                        maxLength={30}
                        className='input-Form'
                      />
                      <MdEdit
                        className='icon'
                        onClick={() =>
                          handleEditClick(setEditName, nameInputRef)
                        }
                      />
                    </div>
                  </div>
                  <div className='BoxInput'>
                    <label>Sobrenome: </label>
                    <div className='input-icon-wrapper'>
                      <input
                        type='text'
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        readOnly={!editSurname}
                        ref={surnameInputRef}
                        maxLength={30}
                        className='input-Form'
                      />
                      <MdEdit
                        className='icon'
                        onClick={() =>
                          handleEditClick(setEditSurname, surnameInputRef)
                        }
                      />
                    </div>
                  </div>
                  <div className='BoxInput'>
                    <label>CPF: </label>
                    <div className='input-icon-wrapper'>
                      <input
                        type='text'
                        value={cpf}
                        onChange={(e) => formatCPF(e.target.value)}
                        readOnly={!editCpf}
                        ref={cpfInputRef}
                        inputMode='numeric'
                        className='input-Form'
                      />
                      <MdEdit
                        className='icon'
                        onClick={() => handleEditClick(setEditCpf, cpfInputRef)}
                      />
                    </div>
                  </div>
                  <div className='BoxInput'>
                    <label>CEP: </label>
                    <div className='input-icon-wrapper'>
                      <input
                        type='text'
                        value={cep}
                        onChange={(e) => formatCEP(e.target.value)}
                        readOnly={!editCep}
                        ref={cepInputRef}
                        inputMode='numeric'
                        className='input-Form'
                      />
                      <MdEdit
                        className='icon'
                        onClick={() => handleEditClick(setEditCep, cepInputRef)}
                      />
                    </div>
                  </div>
                  <div className='BoxInput'>
                    <label>Telefone: </label>
                    <div className='input-icon-wrapper'>
                      <input
                        type='tel'
                        value={phone}
                        onChange={(e) => formatPhone(e.target.value)}
                        readOnly={!editPhone}
                        ref={phoneInputRef}
                        inputMode='numeric'
                        placeholder='(00)00000-0000'
                        className='input-Form'
                      />
                      <MdEdit
                        className='icon'
                        onClick={() =>
                          handleEditClick(setEditPhone, phoneInputRef)
                        }
                      />
                    </div>
                  </div>
                  <div className='BoxInputFile'>
                    <label>Currículo: </label>
                    <div className='input-Form file-upload'>
                      <input
                        type='file'
                        accept='.pdf'
                        onChange={handleFileChange}
                      />
                      <span className='file-status'>
                        {curriculumName || "Nenhum arquivo selecionado"}
                      </span>
                    </div>
                  </div>
                  <button className='atualizar' onClick={handleAtualizarClick}>
                    Atualizar
                  </button>
                </form>
                <div className='BoxExcluir'>
                  <p>
                    Deseja excluir o seu cadastro?
                    <BsTrash3Fill
                      className='lixo'
                      onClick={handleDeleteAccount}
                    />
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default BemVindoUser;
