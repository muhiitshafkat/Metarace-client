import React, { useState } from "react";
import HomeBtn from "../images/HomeBtn.svg"; // Import the SVG file for the initial src
import ChangeHomeBtn from "../images/HomeBtn2.svg";
import logo from "../images/logo.png";
import Link from "next/link";
export const HeaderLeft = () => {
  const [imgHomeBtn, setImgHomeBtn] = useState(HomeBtn);

  const handleHomeEnter = () => {
    setImgHomeBtn(ChangeHomeBtn);
  };

  const handleHomeLeave = () => {
    setImgHomeBtn(HomeBtn);
  };
  return (
    <div className="leftHeader">
      <Link href="/">
        <img src={logo} alt="logo" className="leftHeadImg" />
      </Link>
      <span id="leftHeaderSpan">METARACE</span>
      <Link href="/">
        <img
          src={imgHomeBtn}
          alt="My"
          id="homeBtn"
          onMouseEnter={handleHomeEnter}
          onMouseLeave={handleHomeLeave}
        />
      </Link>
    </div>
  );
};
