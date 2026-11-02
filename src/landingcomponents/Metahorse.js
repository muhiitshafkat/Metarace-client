import metahorseImg from "../images/Metahorse.png";
import { AnimatedSection } from "./AnimatedSection";
import Timeline0 from "../images/Timeline0.svg";
import vid1 from "../images/Horse/240_F_1748660692_MpFPk7fARJGAUUzbWZyRCPW7bSFgPABb_ST.mp4";
import vid2 from "../images/Horse/240_F_1767262147_VjZ4VBTm1YGjhPNvdhGDyyySTmxWjDax_ST.mp4";
import vid3 from "../images/Horse/240_F_1770136879_XQyeLfuoPBxsdR7Enl60AUfJA1goNlc3_ST.mp4";
import vid4 from "../images/Horse/240_F_178150231_nB5njmOJhn9usOLufRtuACsB9wOOenYI_ST.mp4";

export const Metahorse = () => {
  const getFadeTopStyles = (isFadeLeftInViewPort) => ({
    transition: "all 0.7s ease-in",
    opacity: isFadeLeftInViewPort ? "1" : "0",
    transform: isFadeLeftInViewPort ? "" : "translateY(50px)",
  });
  const getFadeLeftStyles = (isFadeLeftInViewPort) => ({
    transition: "all 1.5s ease-in",
    opacity: isFadeLeftInViewPort ? "1" : "0",
    transform: isFadeLeftInViewPort ? "" : "translateX(100%)",
  });

  const features = [
    {
      title: "Race With A Wide Variety Of MetaRace Classes",
      description: "Choose from multiple horse classes, each with unique abilities and racing styles",
    },
    {
      title: "Build Your Own MetaRace Stable",
      description: "Breed, train, and customize your NFT horses to build the ultimate racing stable",
    },
    {
      title: "Earn MRT Token Rewards",
      description: "Win races to earn MRT tokens, exclusive NFT items, and in-game resources",
    },
    {
      title: "Lead Your Horse To Victory",
      description: "Compete in tournaments, climb the leaderboards, and earn glory and prizes",
    },
  ];

  return (
    <div className="Metahorse">
      <div className="gradient gradient--4"></div>
      <div className="gradient gradient--5"></div>
      <AnimatedSection getStyles={getFadeLeftStyles}>
        <div className="topTitle">
          <div id="line1"></div>
          <div className="textWrap">
            <div className="text">
              <span className="title title1">Race With A Wide Variety Of </span>
              <span className="title title2">METARACE </span>
              <span className="title title1">Classes</span>
            </div>
            <div className="title3">
              <span>
                Experience the thrill of competitive horse racing in the metaverse.
                Build your stable, train your horses, and dominate the track.
              </span>
            </div>
          </div>
          <div id="line2"></div>
        </div>
      </AnimatedSection>

      <div className="bottomImg">
        <div className="metahorse-media-row">

          {/* Left — main image */}
          <div
            className="metahorseImg"
            style={{ backgroundImage: `url(${metahorseImg})` }}
          ></div>

          {/* Right — 2×2 video grid */}
          <div className="metahorse-videos">
            {[vid1, vid2, vid3, vid4].map((src, i) => (
              <video
                key={i}
                className="metahorse-video"
                src={src}
                autoPlay
                muted
                loop
                playsInline
              />
            ))}
          </div>

        </div>

        <AnimatedSection getStyles={getFadeTopStyles}>
          <div className="progressBar">
            <ul className="events">
              {features.map((feature, idx) => (
                <li key={idx}>
                  <div className="timeLine">
                    <div
                      className="timePointSVG"
                      style={
                        idx === 0
                          ? {
                              background: `URL(${Timeline0})`,
                              width: "24px",
                              height: "24px",
                              backgroundSize: "100% 100%",
                            }
                          : {}
                      }
                    ></div>
                    <div className="timePointLine"></div>
                  </div>
                  <div className="feature-content">
                    <strong>{feature.title}</strong>
                    <span>{feature.description}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
};
