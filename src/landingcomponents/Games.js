import GameImg from "../images/Games.png";
import Game1   from "../images/Horse/majestic-brown-horse-0410-5706220.webp";
import Game2   from "../images/Horse/luminous-spirit-horse-stockcake.webp";
import Game3   from "../images/Horse/celestial-horse-galloping-stockcake.webp";
import { AnimatedSection } from "./AnimatedSection";
import { useRouter } from "next/navigation";
const getFadeTopStyles = (isFadeLeftInViewPort) => ({
  transition: "all 1s ease-in",
  opacity: isFadeLeftInViewPort ? "1" : "0",
  transform: isFadeLeftInViewPort ? "" : "translateY(100px)",
});
const getFadeTopStylesL = (isFadeLeftInViewPort) => ({
  transition: "all 1s ease-in",
  opacity: isFadeLeftInViewPort ? "1" : "0",
  transform: isFadeLeftInViewPort ? "" : "translateY(100px)",
});
const getFadeTopStylesC = (isFadeLeftInViewPort) => ({
  transition: "all 1.5s ease-in",
  opacity: isFadeLeftInViewPort ? "1" : "0",
  transform: isFadeLeftInViewPort ? "" : "translateY(100px)",
});
const getFadeTopStylesR = (isFadeLeftInViewPort) => ({
  transition: "all 0.5s ease-in",
  opacity: isFadeLeftInViewPort ? "1" : "0",
  transform: isFadeLeftInViewPort ? "" : "translateY(100px)",
});
export const Games = () => {
  const router = useRouter();
  return (
    <div className="Games">
      <div className="gradient gradient--3"></div>
      <AnimatedSection getStyles={getFadeTopStyles}>
        <div className="topTitle">
          <div id="line"></div>

          <div>
            <div className="text">
              <span className="title title1">
                GAMES <span style={{ color: "#5F3DFF" }}>&</span> DAPPS
              </span>
            </div>
          </div>

          <div id="line"></div>
        </div>
      </AnimatedSection>
      <AnimatedSection getStyles={getFadeTopStyles}>
        <div className="topText">
          <div>
            <img src={GameImg} alt="GImg" />
          </div>
          <div id="letter">
            <span>
              The <span style={{ color: "white" }}>MetaRace</span> universe
              awaits your command! Master the art of horse racing, build your
              NFT stable, and compete for glory and MRT rewards. Only the
              sharpest jockeys rise to the top.
            </span>
          </div>
        </div>
      </AnimatedSection>

      <div className="imgTitle">
        <AnimatedSection getStyles={getFadeTopStylesL}>
          <div className="leftTitle">
            <div
              className="GameImage"
              style={{
                backgroundImage: `url(${Game1})`,
              }}
            >
              <div className="boldText">
                <span>
                  STUTEN GARDEN: <br></br>Horse Catching RPG
                </span>
              </div>
              <div className="lineText">
                <span>
                  Compete in live races, earn MRT rewards, and climb the global leaderboard.
                </span>
              </div>
              <div className="buttonWrap">
                <div className="bottomBtn" onClick={() => router.push("/game")}>
                  PLAY NOW<i className="bi bi-play-fill"></i>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
        <AnimatedSection getStyles={getFadeTopStylesC}>
          <div className="centerTitle">
            <div
              className="GameImage"
              style={{
                backgroundImage: `url(${Game2})`,
              }}
            >
              <div className="boldText">
                <span>METARACE ARENA</span>
              </div>
              <div className="lineText">
                <span>
                  Multiplayer racing leagues with on-chain prize pools and seasonal tournaments.
                </span>
              </div>
              <div className="buttonWrap">
                <div className="bottomBtn2">COMING SOON</div>
              </div>
            </div>
          </div>
        </AnimatedSection>
        <AnimatedSection getStyles={getFadeTopStylesR}>
          <div className="rightTitle">
            <div
              className="GameImage"
              style={{
                backgroundImage: `url(${Game3})`,
              }}
            >
              <div className="boldText">
                <span>NFT MARKETPLACE</span>
              </div>
              <div className="lineText">
                <span>
                  Trade, breed, and upgrade your MetaHorse NFTs. Rare horses command premium value.
                </span>
              </div>
              <div className="buttonWrap">
                <div className="bottomBtn2">COMING SOON</div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
};
