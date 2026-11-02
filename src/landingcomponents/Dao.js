import DaoImg from "../images/Dao.png";
import { AnimatedSection } from "./AnimatedSection";
export const Dao = () => {
  const getFadeTopStyles = (isFadeLeftInViewPort) => ({
    transition: "all 1s ease-in",
    opacity: isFadeLeftInViewPort ? "1" : "0",
    transform: isFadeLeftInViewPort ? "" : "translateY(40px)",
  });

  return (
    <div className="Dao">
      <AnimatedSection getStyles={getFadeTopStyles}>
        <div className="topTitle">
          <div id="line"></div>
          <div>
            <div className="text">
              <span className="title title2">MetaRace </span>{" "}
              <span className="title title1">Governance</span>
            </div>
          </div>

          <div id="line"></div>
        </div>
      </AnimatedSection>

      <div className="bottomImg">
        <AnimatedSection getStyles={getFadeTopStyles}>
          <div
            className="daoImg"
            style={{
              backgroundImage: `url(${DaoImg})`,
            }}
          ></div>
        </AnimatedSection>
        <div className="rightText">
          <AnimatedSection getStyles={getFadeTopStyles}>
            <div>
              <span className="type1 lgText">
                MRT{" "}
                <span className="type2 lgText">
                  Token Holders Vote On Key Decisions That Shape The Future Of{" "}
                </span>
                <span className="type1 lgText">MetaRace </span>
                <span className="type2 lgText">
                  — Including Game Development, Reward Structures, And New
                  Feature Rollouts.
                </span>
              </span>
            </div>
          </AnimatedSection>
          <AnimatedSection getStyles={getFadeTopStyles}>
            <div>
              <span className="type3">
                MetaRace governance gives every MRT holder a voice. Propose
                new tracks, vote on reward pool allocations, and shape the
                roadmap. Decentralized decisions, community-driven growth.{" "}
                <span className="type4">Read More.</span>
              </span>
            </div>
          </AnimatedSection>
          <AnimatedSection getStyles={getFadeTopStyles}>
            <div>
              <div className="bottomBtn">
                View Governance{" "}
                <span>
                  <i className="bi bi-chevron-right"></i>
                </span>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
};
