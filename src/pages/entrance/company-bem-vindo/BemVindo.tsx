import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Nav from "../../../components/nav/Nav";
import { MdEditSquare } from "react-icons/md";
import { FaUsersGear } from "react-icons/fa6";
import { auth, getUserName } from "../../../firebaseConfig/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import "./BemVindo.css";
import "../../../App.css";

function Bemvindo() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>("");
  const [greeting, setGreeting] = useState<string>("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/CompanySignIn");
      } else {
        try {
          const name = await getUserName(user.uid);
          setUserName(name);
          setGreeting(getGreeting());
        } catch (error) {
          console.error("Erro ao buscar nome do usuário:", error);
          setUserName("Usuário");
          setGreeting(getGreeting());
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return "Bom dia";
    } else if (hour < 18) {
      return "Boa tarde";
    } else {
      return "Boa noite";
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
              <p>
                <span className='tempo'>{greeting}</span>{" "}
                <span className='nome'>{userName}</span>, o que vamos fazer
                hoje?
              </p>
            </div>
            <div className='BoxAtividades'>
              <Link to='/CompanyVagas' className='criarVagas'>
                <FaUsersGear className='icon' />
                Criar vagas
              </Link>
              <Link to='/HomeEmpresa' className='editar'>
                <MdEditSquare className='icon' />
                Editar cadastro
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default Bemvindo;
