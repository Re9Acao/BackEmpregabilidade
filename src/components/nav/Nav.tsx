import React, { useState, useRef, useEffect, ChangeEvent } from "react";
import ReactDOM from "react-dom";
import Re9Logo from "../../assets/PNG/Re9-3.png";
import "../nav/nav.css";
import "animate.css";
import { LuUserRound, LuUserRoundCheck } from "react-icons/lu";
import { AiOutlineHome } from "react-icons/ai";
import { CgMenuRight } from "react-icons/cg";
import { IoSearch } from "react-icons/io5";
import { AiOutlineClose } from "react-icons/ai";
import { MdEmail } from "react-icons/md";
import { FaSms } from "react-icons/fa";
import { IoLogoWhatsapp } from "react-icons/io";
import { IoLocationSharp } from "react-icons/io5";
import { auth, db } from "../../firebaseConfig/firebaseConfig";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";

// Componente principal de navegação
const Nav: React.FC = () => {
  // Estados para gerenciar a interface e dados do usuário
  const [isBoxListerOpen, setIsBoxListerOpen] = useState<boolean>(false);
  const [isPesquisarOpen, setIsPesquisarOpen] = useState<boolean>(false);
  const [estadoInput, setEstadoInput] = useState<string>("");
  const [cidadeInput, setCidadeInput] = useState<string>("");
  const [cargoInput, setCargoInput] = useState<string>("");
  const [estadosFiltrados, setEstadosFiltrados] = useState<string[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userType, setUserType] = useState<string | null>(null);
  const boxListerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  // Lista estática de estados brasileiros
  const estadosBrasil: string[] = [
    "Acre",
    "Alagoas",
    "Amapá",
    "Amazonas",
    "Bahia",
    "Ceará",
    "Distrito Federal",
    "Espírito Santo",
    "Goiás",
    "Maranhão",
    "Mato Grosso",
    "Mato Grosso do Sul",
    "Minas Gerais",
    "Pará",
    "Paraíba",
    "Paraná",
    "Pernambuco",
    "Piauí",
    "Rio de Janeiro",
    "Rio Grande do Norte",
    "Rio Grande do Sul",
    "Rondônia",
    "Roraima",
    "Santa Catarina",
    "São Paulo",
    "Sergipe",
    "Tocantins",
  ];

  // Efeito para monitorar o estado de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoggedIn(!!user); // Atualiza o estado de login
      if (user) {
        try {
          // Verifica se o usuário é uma empresa
          const empresasRef = collection(db, "Empresas");
          const qEmpresas = query(
            empresasRef,
            where("email", "==", user.email)
          );
          const empresasSnapshot = await getDocs(qEmpresas);

          if (!empresasSnapshot.empty) {
            const empresaData = empresasSnapshot.docs[0].data();
            setUserType(empresaData.type);
            return;
          }

          // Verifica se o usuário é um trabalhador
          const trabalhadoresRef = collection(db, "Trabalhador");
          const qTrabalhadores = query(
            trabalhadoresRef,
            where("email", "==", user.email)
          );
          const trabalhadoresSnapshot = await getDocs(qTrabalhadores);

          if (!trabalhadoresSnapshot.empty) {
            const trabalhadorData = trabalhadoresSnapshot.docs[0].data();
            setUserType(trabalhadorData.type);
          } else {
            setUserType(null);
          }
        } catch (error) {
          console.error("Erro ao buscar tipo de usuário:", error);
          setUserType(null);
        }
      } else {
        setUserType(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Função para alternar a visibilidade da caixa de pesquisa
  const handlePesquisarToggle = () => {
    if (!isLoggedIn) {
      window.alert("Faça o login para pesquisar oportunidades");
      return;
    }
    setIsPesquisarOpen((prev) => !prev);
  };

  // Funções para atualizar os inputs
  const handleEstadoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setEstadoInput(inputValue);
    const filtrados = estadosBrasil.filter((estado) =>
      estado.toLowerCase().startsWith(inputValue.toLowerCase())
    );
    setEstadosFiltrados(filtrados);
  };

  const handleCidadeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCidadeInput(e.target.value);
  };

  const handleCargoChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCargoInput(e.target.value);
  };

  // Função para obter localização atual
  const handleLocalizacaoAtual = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          )
            .then((response) => response.json())
            .then((data) => {
              if (data.address) {
                setCidadeInput(data.address.city || data.address.town || "");
                setEstadoInput(data.address.state || "");
              }
            })
            .catch((error) => {
              console.error("Erro ao obter localização:", error);
              window.alert("Não foi possível obter a localização.");
            });
        },
        (error) => {
          console.error("Erro ao obter localização:", error);
          window.alert("Não foi possível obter a localização.");
        }
      );
    } else {
      window.alert("Geolocalização não suportada pelo navegador.");
    }
  };

  // Função para realizar a pesquisa
  const handlePesquisar = () => {
    navigate(
      `/mapa?cargo=${encodeURIComponent(
        cargoInput
      )}&cidade=${encodeURIComponent(cidadeInput)}&estado=${encodeURIComponent(
        estadoInput
      )}`
    );
    setIsPesquisarOpen(false);
  };

  // Função para logout
  const handleLogout = () => {
    if (window.confirm("Deseja sair?")) {
      signOut(auth)
        .then(() => {
          console.log("Logout bem-sucedido");
          navigate("/Home");
        })
        .catch((error) => console.error("Erro durante o logout:", error));
    }
  };

  // Função para redirecionar ao login
  const handleLoginAlert = () => {
    navigate("/LoginEntrance");
  };

  // Função para alternar o menu lateral
  const handleBoxListerToggle = () => {
    setIsBoxListerOpen((prev) => !prev);
    if (boxListerRef.current) {
      boxListerRef.current.style.transition = "transform 0.3s ease-in-out";
      boxListerRef.current.style.transform = isBoxListerOpen
        ? "translateX(-100%)"
        : "translateX(0)";
    }
  };

  // Função para redirecionar à página inicial
  const handleHomeRedirect = () => {
    navigate("/");
  };

  // Componente da caixa de pesquisa
  const PesquisarBox = (
    <div className='Backdrop' onClick={handlePesquisarToggle}>
      <div
        className='BoxPesquisar animate__animated animate__rubberBand'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='BoxFecharPesquisar'>
          <AiOutlineClose
            className='FecharPesquisar'
            onClick={handlePesquisarToggle}
          />
        </div>
        <input
          type='text'
          placeholder='Cargo'
          value={cargoInput}
          onChange={handleCargoChange}
        />
        <input
          type='text'
          placeholder='Cidade'
          value={cidadeInput}
          onChange={handleCidadeChange}
        />
        <input
          type='text'
          placeholder='Estado'
          value={estadoInput}
          onChange={handleEstadoChange}
          list='estados-lista'
        />
        <datalist id='estados-lista'>
          {estadosFiltrados.map((estado) => (
            <option key={estado} value={estado} />
          ))}
        </datalist>
        <button onClick={handleLocalizacaoAtual} className='localizacao'>
          <IoLocationSharp className='locationIcon' />
          Localização Atual
        </button>
        <button className='pesquisar' onClick={handlePesquisar}>
          Pesquisar
        </button>
      </div>
    </div>
  );

  // Renderização do componente
  return (
    <div className='BoxNav'>
      <div className='BoxLogo' onClick={handleBoxListerToggle}>
        <CgMenuRight className='icone-abrir' />
        <img src={Re9Logo} alt='RE9' title='RE9' className='RE9' />
      </div>

      <div
        ref={boxListerRef}
        className='BoxLister'
        style={{
          transform: isBoxListerOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <div className='BoxFechar'>
          <AiOutlineClose className='Fechar' onClick={handleBoxListerToggle} />
          {isLoggedIn && <ul></ul>}
        </div>
        <div>
          <ul>
            <li>
              <Link to='/Home'>Home</Link>
            </li>
            <li>
              <Link to='/HomeEntrance'>Cadastro</Link>
            </li>
            {isLoggedIn && userType === "Empresa" && (
              <li>
                <Link to='/BemVindo'>Ferramentas</Link>
              </li>
            )}
            {isLoggedIn && userType === "Trabalhador" && (
              <li>
                <Link to='/UserBemVindo'>Ferramentas</Link>
              </li>
            )}
          </ul>
        </div>
        <div className='BoxContato'>
          <FaSms className='icone-contato' />
          <IoLogoWhatsapp className='icone-contato' />
          <MdEmail className='icone-contato' />
        </div>
      </div>

      <div className='BoxIcon'>
        <IoSearch className='icone-usuario' onClick={handlePesquisarToggle} />
        <AiOutlineHome className='icone-usuario' onClick={handleHomeRedirect} />
        {isLoggedIn ? (
          <LuUserRoundCheck
            className='icone-usuario'
            style={{
              color: "#00c900",
              cursor: "pointer",
              transition: "color 0.3s, transform 0.3s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = "#34f834";
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = "#00c900";
              e.currentTarget.style.transform = "scale(1)";
            }}
            onClick={handleLogout}
          />
        ) : (
          <LuUserRound className='icone-usuario' onClick={handleLoginAlert} />
        )}
      </div>

      {isPesquisarOpen && ReactDOM.createPortal(PesquisarBox, document.body)}
    </div>
  );
};

export default Nav;
