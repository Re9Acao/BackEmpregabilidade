import Nav from "../../components/nav/Nav";
import ImgNavTrabalhador from "../../components/img-nav-trabalhador/index";
import "./style.css";
import "../../App.css";

function LoginEntrance() {
  return (
    <>
      <main>
        <div className='containerNav'>
          <Nav /> {/* Remove a prop isLoggedIn */}
        </div>
        <section className='sectionContainer'>
          <div className='Box'>
            <ImgNavTrabalhador />
          </div>
        </section>
      </main>
    </>
  );
}

export default LoginEntrance;
