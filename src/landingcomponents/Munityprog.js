import MunityprogImg from "../images/Munitypro.jpg";
import { AnimatedSection } from "./AnimatedSection";
export const Munityprog = () => {
  const getFadeTopStyles = (isFadeLeftInViewPort) => ({
    transition: "all 1s ease-in",
    opacity: isFadeLeftInViewPort ? "1" : "0",
    transform: isFadeLeftInViewPort ? "" : "translateY(40px)",
  });
   return (
    <div className="Munityprog">
      <div className="bottomImg">
        <div
          className="daoImg"
          style={{
            backgroundImage: `url(${MunityprogImg})`,
          }}
        >
          <div className="daoImg" style={{ position: "relative", left: "15%" }}>
            <AnimatedSection getStyles={getFadeTopStyles}>
              <div className="topTitle">
                <div>
                  <div className="text">
                    <span className="title title1">MetaRace</span>{" "}
                    <span className="title title1">Creator</span>{" "}
                    <span className="title title1">Program</span>
                  </div>
                </div>
              </div>
            </AnimatedSection>
            <AnimatedSection getStyles={getFadeTopStyles}>
              <div className="centerTitle1">Apply Our Creator Program</div>
            </AnimatedSection>
            <AnimatedSection getStyles={getFadeTopStyles}>
              <div className="centerTitle2">
                Passionate about Web3 gaming and{" "}
                <span style={{ color: "white" }}>MetaRace</span>? Earn exclusive
                MRT rewards through our Creator Program by producing content on
                YouTube, X, TikTok and more. Fast to apply — we're always
                welcoming new creators.
              </div>
            </AnimatedSection>
            <div className="bottomTitle">
              <span>
                Join Now
                <i className="bi bi-chevron-right"></i>
              </span>{" "}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
