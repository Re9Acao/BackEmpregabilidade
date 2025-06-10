import React from "react";
import "./button.css";
import Likendin from "../../assets/PNG/Likendin.png";
import Google from "../../assets/PNG/Google.png";

// Interface para as props do componente
interface LoginButtonProps {
  onClick?: () => void; // Função personalizada para login com Google
  disabled?: boolean; // Estado de desabilitado
}

// Componente para botões de login com redes sociais
export default function LoginButton({ onClick, disabled }: LoginButtonProps) {
  // Manipula o clique no botão de Google, chamando a função fornecida via prop
  const handleGoogleSignIn = () => {
    if (onClick && !disabled) {
      onClick();
    }
  };

  return (
    <div className='boxLoginBtn'>
      <button
        className='LoginBtn'
        onClick={handleGoogleSignIn}
        disabled={disabled}
      >
        <img src={Google} alt='Google' className='social-icon' />
        Entre com Google
      </button>

      <button className='LoginBtn disabled' disabled>
        <img src={Likendin} alt='LinkedIn' className='social-icon' />
        Entre com LinkedIn
      </button>
    </div>
  );
}
