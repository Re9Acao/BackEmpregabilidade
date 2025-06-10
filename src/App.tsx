import React from "react";
import "./App.css"; // Importação do arquivo CSS para estilização
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Importação dos componentes de páginas públicas
import Home from "./pages/home/Home";
import HomeEntrance from "./pages/entrance/homeEntrance/index";
import LoginEntrance from "./pages/entrance/index";// Escolher tipo de Login

// Importação dos componentes de autenticação de usuárioi
import CadastroTrabalhador from "./pages/entrance/cadastroTrabalhador/index"; // Página de cadastro do trabalhador

// Importação dos componentes de autenticação de empresa
import CadastroEmpresa from "./pages/entrance/cadastroEmpresa/index";
import BemVindo from "./pages/entrance/company-bem-vindo/BemVindo";
import CompanyVagas from "./pages/entrance/company-vagas/index";

// Importação dos componentes de autenticação - Login
import Login from "./pages/entrance/login/index"; // Página de login do Empresa
import LoginTrabalhador from "./pages/entrance/login-Trabalhador/index"; // Página de login do trabalhador
import BemVindoUser from "./pages/entrance/user-bem-vindo/index";

// Importação dos componentes de páginas específicas
import VejaMais from "./pages/entrance/vejamais/index"; // Página de detalhes de uma vaga
import HomeEmpresa from "./pages/entrance/homeEmpresa/homeEmpresa"; // Página inicial para empresas
import Mapa from "./pages/mapa/index"; // Página do mapa

// Importação do componente de proteção de rotas
import ProtectedRoute from "./firebaseConfig/ProtectedRoute/ProtectedRoute";

// Componente principal da aplicação
function App() {
  return (
    <>
      {/* Configuração do roteamento com BrowserRouter */}
      <Router>
        <Routes>
          {/* Rota para a página inicial (landing page) */}
          <Route path='/' element={<Home />} />
          {/* Rota para a página de entrada (escolha entre login e cadastro) */}
          <Route path='/homeEntrance' element={<HomeEntrance />} />
          {/* Rota para a página de entrada (escolha entre login e cadastro) */}
          <Route path='/loginEntrance' element={<LoginEntrance />} />
          {/* Rota para a página principal do usuário */}
          <Route path='/home' element={<Home />} />       

          {/* Rota para a página de Login (login page) */}
          <Route path='/login' element={<Login />} />
          <Route path='/loginTrabalhador' element={<LoginTrabalhador />} />

          {/* Rotas para o processo de cadastro do Trabalhador */}
          <Route path='/cadastroTrabalhador' element={<CadastroTrabalhador />} />
          {/* Rotas para o processo de cadastro de empresa */}
          <Route path='/cadastroEmpresa' element={<CadastroEmpresa />} />

          {/* Rotas protegidas - acessíveis apenas para usuários autenticados */}
          <Route element={<ProtectedRoute />}>
            {/* Rota para a página de boas-vindas da empresa */}
            <Route path='/BemVindo' element={<BemVindo />} />
            {/* Rota para a página de boas-vindas do candidato */}
            <Route path='/UserBemVindo' element={<BemVindoUser />} />
            {/* Rota para a página de gerenciamento de vagas da empresa */}
            <Route path='/CompanyVagas' element={<CompanyVagas />} />
            {/* Rota para a página inicial da empresa */}
            <Route path='/HomeEmpresa' element={<HomeEmpresa />} />
            {/* Rota para a página de mapa */}
            <Route path='/mapa' element={<Mapa />} />
            {/* Rota dinâmica para a página de detalhes de uma vaga */}
            <Route path='/vejamais/:id' element={<VejaMais />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
