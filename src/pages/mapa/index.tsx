import { useLocation, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useMemo } from "react";
import Nav from "../../components/nav/Nav";
import "leaflet/dist/leaflet.css";
import "./style.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  MapContainerProps,
  MarkerProps,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { FaMapMarker, FaBriefcase } from "react-icons/fa";
import { divIcon, LeafletMouseEvent } from "leaflet";
import { renderToString } from "react-dom/server";
import { db, auth } from "../../firebaseConfig/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import L from "leaflet";

// Configuração dos ícones padrão do Leaflet para marcadores
import marker from "/images/leaflet/marker-icon.png";
import marker2x from "/images/leaflet/marker-icon-2x.png";
import markerShadow from "/images/leaflet/marker-shadow.png";

delete (L.Icon.Default.prototype as { _getIconUrl?: () => string | undefined })
  ._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker,
  shadowUrl: markerShadow,
});

// Interface para os dados brutos das vagas armazenados no Firestore
interface VagaDataFirebase {
  cargo: string;
  cep?: string;
  dataCriacao: { seconds: number; nanoseconds: number } | Date;
  descricao: string;
  emailEmpresa: string;
  empresaId?: string;
  nomeEmpresa: string;
  tipoContratacao: string;
  latitude: number | null;
  longitude: number | null;
}

// Interface para as vagas processadas, incluindo cidade e estado
interface VagaMapa {
  id: string;
  cargo: string;
  cep?: string;
  dataCriacao: Date;
  descricao: string;
  emailEmpresa: string;
  empresaId?: string;
  nomeEmpresa: string;
  tipoContratacao: string;
  latitude: number;
  longitude: number;
  cidade?: string;
  estado?: string;
}

// Função para normalizar strings (remove acentos e converte para minúsculas)
const normalizeString = (str: string): string => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

// Cache em memória para armazenar resultados de geocodificação
const locationCache: Map<string, { cidade?: string; estado?: string }> =
  new Map();

// Função para obter cidade e estado a partir do CEP
const getLocationFromCEP = async (
  cep: string
): Promise<{ cidade?: string; estado?: string }> => {
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.erro) {
      throw new Error("CEP inválido");
    }
    return {
      cidade: data.localidade || "Não especificada",
      estado: data.uf || "Não especificado",
    };
  } catch (error) {
    return { cidade: "Não especificada", estado: "Não especificado" };
  }
};

// Função para obter cidade e estado a partir de coordenadas com retry
const getLocationFromCoordinates = async (
  latitude: number,
  longitude: number,
  cep?: string,
  retries = 5,
  delay = 1500
): Promise<{ cidade?: string; estado?: string }> => {
  const cacheKey = `${latitude},${longitude}`;
  if (locationCache.has(cacheKey)) {
    return locationCache.get(cacheKey)!;
  }

  const attemptFetch = async (
    attempt: number
  ): Promise<{ cidade?: string; estado?: string }> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const result = {
        cidade:
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          "Não especificada",
        estado: data.address?.state || "Não especificado",
      };
      locationCache.set(cacheKey, result);
      return result;
    } catch (error) {
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return attemptFetch(attempt + 1);
      }
      if (cep) {
        return getLocationFromCEP(cep);
      }
      return { cidade: "Não especificada", estado: "Não especificado" };
    }
  };

  return attemptFetch(1);
};

// Função para criar um ícone personalizado para as vagas
const createJobIcon = () => {
  return divIcon({
    className: "custom-icon",
    html: renderToString(<FaBriefcase size={30} color='green' />),
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

// Componente para exibir o card de detalhes da vaga
const VagaCard: React.FC<{
  vaga: VagaMapa;
  position: { x: number; y: number };
  adjustLeft: boolean;
  adjustTop: boolean;
  onClose: () => void;
}> = ({ vaga, position, adjustLeft, adjustTop, onClose }) => {
  const navigate = useNavigate();

  return (
    <div
      className={`vaga-card ${adjustLeft ? "adjust-left" : ""} ${
        adjustTop ? "adjust-top" : ""
      }`}
      style={{ left: position.x, top: position.y }}
    >
      <button
        className='close-button'
        onClick={onClose}
        aria-label='Fechar card'
      >
        X
      </button>
      <div className='card-icon'>
        <FaBriefcase size={24} color='#28a745' />
      </div>
      <h3>{vaga.cargo}</h3>
      <p>
        <strong>Empresa:</strong> {vaga.nomeEmpresa}
      </p>
      <p>
        <strong>Tipo:</strong> {vaga.tipoContratacao}
      </p>
      <p>
        <strong>Cidade:</strong> {vaga.cidade || "Não especificada"}
      </p>
      <p>
        <strong>Estado:</strong> {vaga.estado || "Não especificado"}
      </p>
      <p>
        <strong>CEP:</strong> {vaga.cep || "Não especificado"}
      </p>
      <button
        className='see-more-button'
        onClick={() => navigate(`/vejamais/${vaga.id}`)}
        aria-label={`Veja mais sobre a vaga ${vaga.cargo}`}
      >
        Veja mais
      </button>
    </div>
  );
};

// Função para calcular o centro geográfico das vagas
const calculateVagasCenter = (
  vagas: VagaMapa[],
  userPosition: [number, number] | null
): [number, number] => {
  if (vagas.length === 0 && userPosition) {
    return userPosition;
  } else if (vagas.length === 0) {
    return [-8.057838, -34.882897]; // Fallback: Recife, Pernambuco
  }

  const total = vagas.reduce(
    (acc, vaga) => ({
      lat: acc.lat + vaga.latitude,
      lng: acc.lng + vaga.longitude,
    }),
    { lat: 0, lng: 0 }
  );

  return [total.lat / vagas.length, total.lng / vagas.length];
};

// Componente principal do mapa
function Mapa() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [vagas, setVagas] = useState<VagaMapa[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [clickedVaga, setClickedVaga] = useState<{
    vaga: VagaMapa;
    position: { x: number; y: number };
    adjustLeft: boolean;
    adjustTop: boolean;
  } | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const searchCity = normalizeString(queryParams.get("cidade") || "");
  const searchCargo = normalizeString(queryParams.get("cargo") || "");
  const searchEstado = normalizeString(queryParams.get("estado") || "");

  // Efeito para verificar o estado de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      if (!user) {
        navigate("/UserSignIn");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Efeito para buscar localização do usuário e vagas
  useEffect(() => {
    if (!isLoggedIn) return;

    // Obtém a localização do usuário
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          setPosition([-8.057838, -34.882897]); // Fallback: Recife
          setError("Não foi possível obter sua localização.");
        }
      );
    } else {
      setPosition([-8.057838, -34.882897]);
      setError("Geolocalização não suportada pelo navegador.");
    }

    // Busca vagas do Firestore
    const fetchVagasFromFirebase = async () => {
      setIsLoading(true);
      try {
        const vagasCollection = collection(db, "Vagas");
        const vagasSnapshot = await getDocs(vagasCollection);
        const vagasData: VagaMapa[] = [];

        for (const doc of vagasSnapshot.docs) {
          const data = doc.data() as VagaDataFirebase;

          if (
            typeof data.latitude !== "number" ||
            typeof data.longitude !== "number" ||
            isNaN(data.latitude) ||
            isNaN(data.longitude)
          ) {
            continue;
          }

          const { cidade, estado } = await getLocationFromCoordinates(
            data.latitude,
            data.longitude,
            data.cep // Passa o CEP como fallback
          );

          const dataCriacao =
            data.dataCriacao instanceof Date
              ? data.dataCriacao
              : new Date(data.dataCriacao.seconds * 1000);

          const vaga: VagaMapa = {
            id: doc.id,
            cargo: data.cargo,
            cep: data.cep,
            dataCriacao,
            descricao: data.descricao,
            emailEmpresa: data.emailEmpresa,
            empresaId: data.empresaId,
            nomeEmpresa: data.nomeEmpresa,
            tipoContratacao: data.tipoContratacao,
            latitude: data.latitude,
            longitude: data.longitude,
            cidade,
            estado,
          };

          // Filtragem com normalização
          const matchesCargo =
            !searchCargo || normalizeString(data.cargo).includes(searchCargo);
          const matchesCity =
            !searchCity ||
            (cidade && normalizeString(cidade).includes(searchCity));
          const matchesEstado =
            !searchEstado ||
            (estado && normalizeString(estado).includes(searchEstado));

          if (matchesCargo && matchesCity && matchesEstado) {
            vagasData.push(vaga);
          }
        }

        setVagas(vagasData);
      } catch (err) {
        setError("Erro ao carregar as vagas.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVagasFromFirebase();
  }, [searchCargo, searchCity, searchEstado, isLoggedIn]);

  const userLocationIcon = useMemo(
    () =>
      divIcon({
        className: "custom-icon",
        html: renderToString(<FaMapMarker size={30} color='blue' />),
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
      }),
    []
  );

  const handleMarkerClick = (e: LeafletMouseEvent, vaga: VagaMapa) => {
    const { clientX, clientY } = e.originalEvent;
    const cardWidth = 280;
    const cardHeight = 300;
    const offsetX = 20;
    const offsetY = 20;

    let x = clientX + offsetX;
    let y = clientY + offsetY;

    if (x + cardWidth > window.innerWidth) {
      x = clientX - cardWidth - offsetX;
    }
    if (y + cardHeight > window.innerHeight) {
      y = clientY - cardHeight - offsetY;
    }

    x = Math.max(10, Math.min(x, window.innerWidth - cardWidth - 10));
    y = Math.max(10, Math.min(y, window.innerHeight - cardHeight - 10));

    setClickedVaga({
      vaga,
      position: { x, y },
      adjustLeft: x !== clientX + offsetX,
      adjustTop: y !== clientY + offsetY,
    });
  };

  const handleMarkerClose = () => {
    setClickedVaga(null);
  };

  const mapCenter = useMemo(
    () => calculateVagasCenter(vagas, position),
    [vagas, position]
  );

  return (
    <main className='container' aria-label='Mapa de vagas'>
      <div className='containerNav'>
        <Nav />
      </div>
      {!isLoggedIn ? (
        <div className='login-message'>
          <p aria-live='assertive'>
            Você precisa estar logado para visualizar o mapa de vagas.
          </p>
        </div>
      ) : (
        <div className='containerMapa'>
          <div className='BoxMapa'>
            {isLoading && <p aria-live='polite'>Carregando vagas...</p>}
            {error && (
              <p className='error-message' aria-live='assertive'>
                {error}
              </p>
            )}
            {vagas.length === 0 && !isLoading && !error && (
              <p aria-live='polite'>
                Nenhuma vaga encontrada para o cargo "
                {queryParams.get("cargo") || "qualquer"}" na cidade "
                {queryParams.get("cidade") || "qualquer"}" e estado "
                {queryParams.get("estado") || "qualquer"}".
              </p>
            )}
            {position && !isLoading && (
              <MapContainer
                center={mapCenter}
                zoom={15}
                style={{ height: "100%", width: "100%" }}
                aria-label='Mapa interativo com vagas'
              >
                <TileLayer
                  attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">carto.com</a>'
                  url='https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
                />
                <Marker position={position} icon={userLocationIcon}>
                  <Popup>Você está aqui!</Popup>
                </Marker>
                <MarkerClusterGroup
                  chunkedLoading
                  maxClusterRadius={50}
                  showCoverageOnHover={true}
                >
                  {vagas.map((vaga) => (
                    <Marker
                      key={vaga.id}
                      position={[vaga.latitude, vaga.longitude]}
                      icon={createJobIcon()}
                      eventHandlers={{
                        click: (e) => handleMarkerClick(e, vaga),
                      }}
                    />
                  ))}
                </MarkerClusterGroup>
              </MapContainer>
            )}
            {!position && !isLoading && (
              <p aria-live='polite'>Carregando mapa...</p>
            )}
            {clickedVaga && (
              <VagaCard
                vaga={clickedVaga.vaga}
                position={clickedVaga.position}
                adjustLeft={clickedVaga.adjustLeft}
                adjustTop={clickedVaga.adjustTop}
                onClose={handleMarkerClose}
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default Mapa;
