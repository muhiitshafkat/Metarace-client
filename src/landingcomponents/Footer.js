import logo from "../images/logo.png";
import footer2 from "../images/footer2.svg";
import footer3 from "../images/footer3.svg";
import footer4 from "../images/footer4.svg";
import footer5 from "../images/footer5.svg";
import footer6 from "../images/footer6.svg";
import footer7 from "../images/footer7.svg";
export const Footer = () => {
  return (
    <div className="footer">
      <div className="leftFooter">
        <div className="markFooter">
            <img src={logo} alt="footermark" width={90} />
          <span style={{ color: "white" }}>© 2026 MetaRace Unity</span>
        </div>
        <div className="iconFooter1">
            <img src={footer2} alt="footermark" className="iconF" />
            <img src={footer3} alt="footermark" className="iconF" />
            <img src={footer4} alt="footermark" className="iconF" />
            <img src={footer5} alt="footermark" className="iconF" />
            <img src={footer6} alt="footermark" className="iconF" />
            <img src={footer7} alt="footermark" className="iconF" />
        </div>
        <div className="iconFooter2">
          <div>
              <img src={footer2} alt="footermark" className="iconF" />
              <img src={footer3} alt="footermark" className="iconF" />
          </div>
          <div>
              <img src={footer4} alt="footermark" className="iconF" />
              <img src={footer5} alt="footermark" className="iconF" />
          </div>
          <div>
              <img src={footer6} alt="footermark" className="iconF" />
              <img src={footer7} alt="footermark" className="iconF" />
          </div>
        </div>
      </div>
      <div className="linkFooter">
        <span>About US</span>
        <span>White paper</span>
        <span>Terms of Use</span>
        <span>Code of Conduct</span>
        <span>Privacy Policy</span>
      </div>
    </div>
  );
};
