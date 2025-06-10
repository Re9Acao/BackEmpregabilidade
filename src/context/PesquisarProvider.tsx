// src/context/PesquisarContext.tsx
import React, { createContext, useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { estadosBrasil } from "./PesquisarUtils";

// Define a interface para o estado e funções do contexto
export interface PesquisarState {
  isPesquisarOpen: boolean; // Controla se o PesquisarBox está aberto
  cargoInput: string; // Valor do input de cargo
  cidadeInput: string; // Valor do input de cidade
  estadoInput: string; // Valor do input de estado
  estadosFiltrados: string[]; // Lista de estados filtrados para autocompletar
  togglePesquisar: () => void; // Função para abrir/fechar o PesquisarBox
  handleEstadoChange: (e: ChangeEvent<HTMLInputElement>) => void; // Atualiza o input de estado
  handleCidadeChange: (e: ChangeEvent<HTMLInputElement>) => void; // Atualiza o input de cidade
  handleCargoChange: (e: ChangeEvent<HTMLInputElement>) => void; // Atualiza o input de cargo
  handleLocalizacaoAtual: () => void; // Obtém a localização atual do usuário
  handlePesquisar: () => void; // Realiza a pesquisa e navega para o mapa
}

// Cria o contexto
export const PesquisarContext = createContext<PesquisarState | undefined>(
  undefined
);

// Componente provedor do contexto
export const PesquisarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Estados para gerenciar o PesquisarBox
  const [isPesquisarOpen, setIsPesquisarOpen] = useState<boolean>(false); // Visibilidade do PesquisarBox
  const [cargoInput, setCargoInput] = useState<string>(""); // Input de cargo
  const [cidadeInput, setCidadeInput] = useState<string>(""); // Input de cidade
  const [estadoInput, setEstadoInput] = useState<string>(""); // Input de estado
  const [estadosFiltrados, setEstadosFiltrados] = useState<string[]>([]); // Estados filtrados
  const navigate = useNavigate(); // Hook para navegação programática

  // Função para alternar a visibilidade do PesquisarBox
  const togglePesquisar = () => {
    setIsPesquisarOpen((prev) => !prev);
  };

  // Função para atualizar o input de estado e filtrar estados
  const handleEstadoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setEstadoInput(inputValue);
    const filtrados = estadosBrasil.filter((estado) =>
      estado.toLowerCase().startsWith(inputValue.toLowerCase())
    );
    setEstadosFiltrados(filtrados);
  };

  // Função para atualizar o input de cidade
  const handleCidadeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCidadeInput(e.target.value);
  };

  // Função para atualizar o input de cargo
  const handleCargoChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCargoInput(e.target.value);
  };

  // Função para obter a localização atual do usuário via geolocalização
  const handleLocalizacaoAtual = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Usa a API Nominatim para converter coordenadas em endereço
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

  // Função para realizar a pesquisa e navegar para o mapa
  const handlePesquisar = () => {
    // Navega para a rota do mapa com parâmetros de busca codificados
    navigate(
      `/mapa?cargo=${encodeURIComponent(
        cargoInput
      )}&cidade=${encodeURIComponent(cidadeInput)}&estado=${encodeURIComponent(
        estadoInput
      )}`
    );
    setIsPesquisarOpen(false); // Fecha o PesquisarBox
  };

  // Fornece o contexto aos componentes filhos
  return (
    <PesquisarContext.Provider
      value={{
        isPesquisarOpen,
        cargoInput,
        cidadeInput,
        estadoInput,
        estadosFiltrados,
        togglePesquisar,
        handleEstadoChange,
        handleCidadeChange,
        handleCargoChange,
        handleLocalizacaoAtual,
        handlePesquisar,
      }}
    >
      {children}
    </PesquisarContext.Provider>
  );
};
