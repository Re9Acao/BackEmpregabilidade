import { useNavigate } from "react-router-dom";
import { useState, useEffect, ChangeEvent } from "react";
import { HiArrowUp } from "react-icons/hi";
import { IoLocationSharp } from "react-icons/io5";
import { AiOutlineClose } from "react-icons/ai";
import ReactDOM from "react-dom";
import Nav from "../../components/nav/Nav";
import "./Home.css";
import "../../App.css";
import Onibus from "../../assets/PNG/Onibus.png";
import Relogio from "../../assets/PNG/Relogio.png";
import Trabalhador from "../../assets/PNG/Lazer.png";
import Softex from "../../assets/PNG/Softex.png";
import { auth } from "../../firebaseConfig/firebaseConfig";

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

function Home() {
  const navigate = useNavigate();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isPesquisarOpen, setIsPesquisarOpen] = useState<boolean>(false);
  const [estadoInput, setEstadoInput] = useState<string>("");
  const [cidadeInput, setCidadeInput] = useState<string>("");
  const [cargoInput, setCargoInput] = useState<string>("");
  const [estadosFiltrados, setEstadosFiltrados] = useState<string[]>([]);

  // Efeito para controlar o botão "Voltar ao Topo"
  useEffect(() => {
    const handleScroll = () => {
      const section2 = document.querySelector(".section2");
      const section6 = document.querySelector(".section6");

      const section2Top = section2
        ? section2.getBoundingClientRect().top
        : Infinity;
      const section6Bottom = section6
        ? section6.getBoundingClientRect().bottom
        : -Infinity;

      if (section2Top <= window.innerHeight && section6Bottom > 0) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Efeito para monitorar o estado de autenticação
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
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

  const scrollToSection3 = () => {
    const section3 = document.querySelector(".section3");
    if (section3) {
      section3.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    const section1 = document.querySelector(".section1");
    if (section1) {
      section1.scrollIntoView({ behavior: "smooth" });
    }
  };

  const partners = [
    { id: 1, src: Softex, alt: "Logotipo da Softex" },
    { id: 2, src: Softex, alt: "Logotipo da Softex" },
    { id: 3, src: Softex, alt: "Logotipo da Softex" },
    { id: 4, src: Softex, alt: "Logotipo da Softex" },
    { id: 5, src: Softex, alt: "Logotipo da Softex" },
    { id: 6, src: Softex, alt: "Logotipo da Softex" },
    { id: 7, src: Softex, alt: "Logotipo da Softex" },
    { id: 8, src: Softex, alt: "Logotipo da Softex" },
  ];

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

  return (
    <>
      <main>
        <div className='containerNav'>
          <Nav />
        </div>
        <section className='section section1'>
          <div className='banner-content'>
            <div className='banner-text'>
              <h2>Não perca oportunidades!</h2>
              <p>Cadastre-se e fique à frente na busca por um emprego.</p>
              <p>
                Um clique pode transformar sua carreira. Junte-se à nossa
                comunidade de candidatos agora mesmo.
              </p>
              <div className='button-group'>
                <button
                  className='ripple-btn primary-btn'
                  onClick={() => navigate("/HomeEntrance")}
                >
                  Quero me cadastrar!
                </button>
                <button
                  className='ripple-btn secondary-btn'
                  onClick={scrollToSection3}
                >
                  Ver vantagens
                </button>
              </div>
            </div>
          </div>
        </section>
        <section className='section section2'>
          <div className='section2-content'>
            <div className='text-content'>
              <h2>
                Já pensou economizar tempo e evitar stress no deslocamento até o
                trabalho?
              </h2>
              <p>
                Aqui você encontra a vaga perfeita mais próxima à sua
                residência!
              </p>
            </div>
          </div>
        </section>
        <section className='section section3'>
          <div className='content'>
            <h2>Vantagens de usar nossa plataforma</h2>
            <p>
              Descubra como podemos ajudar você a alcançar seus objetivos
              profissionais.
            </p>
            <div className='cards-container'>
              <div className='card'>
                <div className='box-card-img'>
                  <img src={Onibus} alt='Ônibus' className='card-image' />
                </div>
                <h3>Menos gasto com transporte</h3>
                <p>Encontre vagas próximas e reduza custos com deslocamento.</p>
              </div>
              <div className='card'>
                <div className='box-card-img'>
                  <img src={Relogio} alt='Relógio' className='card-image' />
                </div>
                <h3>Menos tempo de deslocamento</h3>
                <p>
                  Deixe o trânsito para trás e invista seu tempo no que
                  verdadeiramente importa.
                </p>
              </div>
              <div className='card'>
                <div className='box-card-img'>
                  <img
                    src={Trabalhador}
                    alt='Trabalhador'
                    className='card-image'
                  />
                </div>
                <h3>Maior produtividade</h3>
                <p>Trabalhe mais perto de casa e aumente sua eficiência.</p>
              </div>
            </div>
          </div>
        </section>
        <section className='section section4'>
          <div className='section4-content'>
            <div className='image-content'>
              <img
                src='https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80'
                alt='Colaboração em equipe'
                className='section4-image'
              />
            </div>
            <div className='text-content'>
              <h2>Por que cadastrar sua empresa?</h2>
              <p>
                Com nossa plataforma, sua empresa encontra candidatos
                qualificados próximos à vaga, reduzindo custos de deslocamento e
                otimizando a compatibilidade geográfica. A geolocalização filtra
                perfis ideais, economizando tempo na seleção. Além disso, ao
                publicar vagas, você fortalece sua presença digital e atrai
                talentos locais, ampliando seu alcance no mercado.
              </p>
            </div>
          </div>
        </section>
        <section className='section section5'>
          <div className='content'>
            <h2>Conheça algumas empresas parceiras do projeto:</h2>
            <div className='partner-cards-container'>
              <div className='partner-cards-inner'>
                {partners.concat(partners).map((partner, index) => (
                  <div className='partner-card' key={`${partner.id}-${index}`}>
                    <img
                      src={partner.src}
                      alt={partner.alt}
                      className='partner-card-image'
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className='section section6'>
          <div className='content'>
            <h2>
              Encontre sua vaga ou candidato facilmente com nossa visualização
              em mapa!
            </h2>
            <button
              className='ripple-btn primary-btn'
              onClick={handlePesquisarToggle}
            >
              Explorar Mapa
            </button>
          </div>
        </section>
        <button
          className={`back-to-top ${showBackToTop ? "show" : ""}`}
          onClick={scrollToTop}
        >
          <HiArrowUp />
        </button>
        {isPesquisarOpen && ReactDOM.createPortal(PesquisarBox, document.body)}
      </main>
    </>
  );
}

export default Home;
