import Game1 from "../images/Game1.png";
import Game2 from "../images/Game2.png";
import Game3 from "../images/Game3.png";

export const IContent2 = () => {
  return (
    <div className="IContent2">
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

      <div className="topText">
        <div id="letter">
          <span>
            The <span style={{ color: "white" }}>MetaRace</span> universe
            awaits! Master horse racing, build your NFT stable, and compete
            for MRT rewards. Only the sharpest jockeys rise to the top.
          </span>
        </div>
      </div>

      <div className="imgTitle">
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
              <span>Compete in live races, earn MRT rewards, and climb the global leaderboard.</span>
            </div>
            <div className="buttonWrap">
              <div className="bottomBtn">
                PLAY NOW<i className="bi bi-play-fill"></i>
              </div>
            </div>
          </div>
        </div>

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
              <span>Multiplayer racing leagues with on-chain prize pools.</span>
            </div>
            <div className="buttonWrap">
              <div className="bottomBtn2">COMING SOON</div>
            </div>
          </div>
        </div>

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
              <span>Trade, breed, and upgrade your MetaHorse NFTs.</span>
            </div>
            <div className="buttonWrap">
              <div className="bottomBtn2">COMING SOON</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
