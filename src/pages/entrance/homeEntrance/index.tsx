import Nav from "../../../components/nav/Nav";
import ImgNav from "../../../components/img-nav/img-nav";
import "./style.css";
import "../../../App.css";

function HomeEntrance() {
  return (
    <>
      <main>
        <div className='containerNav'>
          <Nav /> {/* Remove a prop isLoggedIn */}
        </div>
        <section className='sectionContainer'>
          <div className='Box'>
            <ImgNav />
          </div>
        </section>
      </main>
    </>
  );
}

export default HomeEntrance;
