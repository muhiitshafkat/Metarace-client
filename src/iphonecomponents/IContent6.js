import MunityprogImg from "../images/Munitypro.jpg";
export const IContent6 = () => {
  return (
    <div className="IContent6">
      <div className="bottomImg">
        <div
          className="daoImg"
          style={{
            backgroundImage: `url(${MunityprogImg})`,
          }}
        >
          <div className="topTitle">
            <div>
              <div className="text">
                <span className="title title1">MetaRace</span>{" "}
                <span className="title title1">Creator</span>{" "}
                <span className="title title1">Program</span>
              </div>
            </div>
          </div>

          <div className="centerTitle1">Apply Our Creator Program</div>
          <div className="centerTitle2">
            Passionate about Web3 gaming and{" "}
            <span style={{ color: "white" }}>MetaRace</span>? Earn exclusive
            MRT rewards through our Creator Program by producing content on
            YouTube, X, TikTok and more. Fast to apply — always welcoming
            new creators.
          </div>
          <div className="bottomTitle">
            <span>
              Join Now
              <i className="bi bi-chevron-right"></i>
            </span>{" "}
          </div>
        </div>
      </div>
    </div>
  );
};
