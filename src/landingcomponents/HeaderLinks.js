import React, { useState } from "react";
import Link from "next/link";
import gameIcon1 from "../images/game-1.png";
import gameIcon2 from "../images/game-2.png";
import gameIcon3 from "../images/game-3.png";

export const HeaderLinks = () => {
  const [gameIconIndex, setGameIconIndex] = useState(0);
  const handleGameEnter = (gameIndex) => setGameIconIndex(gameIndex);
  const handleGameLeave = () => setGameIconIndex(0);

  return (
    <nav className="headerLinks" aria-label="Primary navigation">
      <div className="gamesDropdown">
        <Link href="/game" className="navTag">
          Game
        </Link>
        <div className="gamesDropdownMenu">
          <Link
            href="/game"
            className="dropTag"
            onMouseEnter={() => handleGameEnter(1)}
            onMouseLeave={handleGameLeave}
          >
            <div style={{ height: "52px" }}>
              <img src={gameIcon1} alt="" id="logoTop" />
              Stutengarden
            </div>
            <div>
              <span>{gameIconIndex === 1 ? "Play Now" : "Play Now"}</span>
            </div>
          </Link>

          <Link
            href="/"
            className="dropTag"
            onMouseEnter={() => handleGameEnter(2)}
            onMouseLeave={handleGameLeave}
          >
            <div style={{ width: "192px", height: "52px" }}>
              <img
                src={gameIcon2}
                alt=""
                id="logoTop"
                style={{
                  width: "100px",
                  position: "relative",
                  margin: "-16px 12px -25px -1px",
                }}
              />
              MetaRace Unity
            </div>
            <div>
              <span>{gameIconIndex === 2 ? "Play Now" : "Coming Soon"}</span>
            </div>
          </Link>

          <Link
            href="/"
            className="dropTag"
            onMouseEnter={() => handleGameEnter(3)}
            onMouseLeave={handleGameLeave}
          >
            <div style={{ width: "195px" }}>
              <img
                src={gameIcon3}
                alt=""
                id="logoTop"
                style={{
                  position: "relative",
                  margin: "-5px 0px 2px 19px",
                }}
              />
              <div style={{ marginLeft: "33px" }}>M-Deed</div>
            </div>
            <div style={{ marginLeft: "30px" }}>
              <span style={{ width: "50px" }}>
                {gameIconIndex === 3 ? "Play Now" : "Coming Soon"}
              </span>
            </div>
          </Link>
        </div>
      </div>

      <Link href="/token" className="navTag">
        Token
      </Link>
      <Link href="/marketplace" className="navTag">
        MarketPlace
      </Link>
      <Link href="/profile" className="navTag">
        Profile
      </Link>
    </nav>
  );
};
