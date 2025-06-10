// src/context/PesquisarUtils.ts
import { useContext } from "react";
import { PesquisarContext } from "./PesquisarProvider";

// Lista estática de estados brasileiros para autocompletar
export const estadosBrasil: string[] = [
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

// Hook personalizado para acessar o contexto
export const usePesquisar = () => {
  const context = useContext(PesquisarContext);
  if (!context) {
    throw new Error("usePesquisar must be used within a PesquisarProvider");
  }
  return context;
};
