import { Link, useLocation } from "react-router-dom";
import { BiBriefcase, BiUser } from "react-icons/bi";
import logoCompletaVetor from "../../assets/logoCompletaVetor.svg";
import "../img-nav-trabalhador/style.css";

export default function ImgNavTrabalhador({
  logoSrc = logoCompletaVetor,
  logoAlt = "Logo da RE9AÇÃO",
}) {
  const location = useLocation();

  const isCompanyPage = ["/CompanySignIn", "/companySignUp1"].includes(
    location.pathname
  );
  const isUserPage = ["/UserSignIn", "/userSignUp1", "/userSignUp2"].includes(
    location.pathname
  );

  return (
    <div className='containerImg'>
      <div className='boxImg'>
        <img src={logoSrc} alt={logoAlt} />
      </div>
      <div className='BoxButton'>
        <Link
          to='/Login'
          className={`empresaButton ${isCompanyPage ? "active" : ""}`}
          style={{
            backgroundColor: isCompanyPage ? "#ec6c03" : undefined,
          }}
        >
          <BiBriefcase className='briefcase-icon' />
          Sou Empresa
        </Link>
        <Link
          to='/LoginTrabalhador'
          className={`userButton ${isUserPage ? "active" : ""}`}
          style={{
            backgroundColor: isUserPage ? "#ec6c03" : undefined,
          }}
        >
          <BiUser className='user-icon' />
          Sou Candidato
        </Link>
      </div>
    </div>
  );
}
