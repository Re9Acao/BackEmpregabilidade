import { MdEdit } from "react-icons/md";
import { BsTrash3Fill } from "react-icons/bs";
import Nav from "../../../components/nav/Nav";
import { useState, useEffect, useRef } from "react";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../../../firebaseConfig/firebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import React, { Dispatch, SetStateAction, MutableRefObject } from "react";
import "./homeEmpresa.css";
import "../../../App.css";

function HomeEmpresa() {
  const navigate = useNavigate();
  const [name, setName] = useState<string>("");
  const [cnpj, setCnpj] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [editName, setEditName] = useState<boolean>(false);
  const [editCnpj, setEditCnpj] = useState<boolean>(false);
  const [editPhone, setEditPhone] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const cnpjInputRef = useRef<HTMLInputElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (isDeleting) return;

      if (!user) {
        navigate("/CompanySignIn");
      } else {
        try {
          const userDoc = await getDoc(doc(db, "Empresas", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setName(userData.name || "");
            setCnpj(userData.CNPJ || "");
            setPhone(userData.phone || "");
            setEmail(userData.email || "");
          } else {
            console.log("Documento do usuário não encontrado!");
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
        }
      }
    });
    return () => unsubscribe();
  }, [navigate, isDeleting]);

  const formatCNPJ = (value: string) => {
    const cleanedCNPJ = value.replace(/\D/g, "");
    if (cleanedCNPJ.length <= 14) {
      setCnpj(
        cleanedCNPJ
          .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
          .substring(0, 18)
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
    setter: Dispatch<SetStateAction<boolean>>,
    ref: MutableRefObject<HTMLInputElement | null>
  ) => {
    setter(true);
    if (ref.current) {
      ref.current.focus();
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Deseja realmente excluir o seu cadastro?"
    );
    if (confirmDelete && auth.currentUser) {
      try {
        setIsDeleting(true);
        await deleteDoc(doc(db, "Empresas", auth.currentUser.uid));
        await auth.currentUser.delete();
        alert("Conta excluída com sucesso!");
        navigate("/", { replace: true });
      } catch (error) {
        console.error("Erro ao excluir conta:", error);
        alert("Erro ao excluir a conta. Tente novamente.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/\D/g, "").substring(0, 11);
    formatPhone(inputValue);
  };

  const handleAtualizarClick = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, "Empresas", auth.currentUser.uid), {
          name: name,
          CNPJ: cnpj,
          phone: phone,
          email: email,
        });
        alert("Atualização efetuada com sucesso!");
        navigate("/BemVindo");
      } catch (error) {
        console.error("Erro ao atualizar dados:", error);
        alert("Erro ao atualizar dados. Tente novamente.");
      }
    } else {
      console.error("Usuário não autenticado.");
    }
  };

  return (
    <>
      <main className='container'>
        <div className='containerNav'>
          <Nav /> {/* Remove a prop isLoggedIn */}
        </div>
        <section className='sectionContainer'>
          <div className='Box'>
            <div>
              <h2>Meu cadastro</h2>
            </div>
            <div className='FormContainer'>
              <form>
                <div className='BoxInput'>
                  <label>Nome: </label>
                  <input
                    type='text'
                    id='company-name'
                    name='name'
                    maxLength={30}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    readOnly={!editName}
                    ref={nameInputRef}
                  />
                  <MdEdit
                    className='icon'
                    onClick={() => handleEditClick(setEditName, nameInputRef)}
                  />
                </div>
                <div className='BoxInput'>
                  <label>CNPJ: </label>
                  <input
                    type='text'
                    id='cnpj'
                    name='CNPJ'
                    value={cnpj}
                    onChange={(e) => formatCNPJ(e.target.value)}
                    inputMode='numeric'
                    readOnly={!editCnpj}
                    ref={cnpjInputRef}
                  />
                  <MdEdit
                    className='icon'
                    onClick={() => handleEditClick(setEditCnpj, cnpjInputRef)}
                  />
                </div>
                <div className='BoxInput'>
                  <label>Telefone: </label>
                  <input
                    type='tel'
                    id='phone'
                    name='phone'
                    value={phone}
                    onChange={handlePhoneChange}
                    inputMode='numeric'
                    readOnly={!editPhone}
                    ref={phoneInputRef}
                    placeholder='(00)00000-0000'
                  />
                  <MdEdit
                    className='icon'
                    onClick={() => handleEditClick(setEditPhone, phoneInputRef)}
                  />
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
          </div>
        </section>
      </main>
    </>
  );
}

export default HomeEmpresa;
