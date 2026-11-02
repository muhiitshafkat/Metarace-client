import React, { useState, useEffect, useRef } from "react";
import Slide1 from "../images/Slide-1.jpg";
import Slide2 from "../images/Slide-2.jpg";
import Slide3 from "../images/Slide-3.jpg";
import SlideL from "../images/SlideL.svg";
import SlideR from "../images/SlideR.svg";
import SlideLBtn2 from "../images/SlideLBtn2.svg";
import SlideRBtn2 from "../images/SlideRBtn2.svg";
import SlideLBtnHo2 from "../images/SlideLBtnHo2.svg";
import SlideRBtnHo2 from "../images/SlideRBtnHo2.svg";
import fix from "../images/fotor.png";

const images = [Slide1, Slide2, Slide3];
const delay = 4500;

export const Slide = () => {
  const [index, setIndex] = useState(0);
  const [isHoveredL, setIsHoveredL] = useState(false);
  const [isHoveredR, setIsHoveredR] = useState(false);
  const timeoutRef = useRef(null);

  const resetTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  useEffect(() => {
    resetTimeout();
    timeoutRef.current = setTimeout(
      () => setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1)),
      delay
    );
    return resetTimeout;
  }, [index]);

  return (
    <div>
      <div className="gradient gradient--c"></div>
      <div className="slideshow">

        {/* Flex track — shifts by exactly 100% per slide */}
        <div
          className="slideshowSlider"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {images.map((item, i) => (
            <div
              className="slideHorse"
              key={i}
              style={{ backgroundImage: `url(${item})` }}
            />
          ))}
        </div>

        <div className="slideTools">
          <img
            src={isHoveredL ? SlideLBtnHo2 : SlideLBtn2}
            alt="prev"
            id="slideLBtn"
            onMouseEnter={() => setIsHoveredL(true)}
            onMouseLeave={() => setIsHoveredL(false)}
            onClick={() => setIndex(index === 0 ? images.length - 1 : index - 1)}
          />
          <img
            src={isHoveredR ? SlideRBtnHo2 : SlideRBtn2}
            alt="next"
            id="slideRBtn"
            onMouseEnter={() => setIsHoveredR(true)}
            onMouseLeave={() => setIsHoveredR(false)}
            onClick={() => setIndex(index === images.length - 1 ? 0 : index + 1)}
          />
          <img src={SlideL} alt="" id="slideL" />
          <img src={SlideR} alt="" id="slideR" />
          <div id="lineL" style={{ zIndex: "50" }}></div>
          <div id="lineR"></div>
          <div className="fix">
            <div className="fixSlide">
              <div className="fixTop">
                <div
                  className="miniHorse1"
                  style={{ backgroundImage: `url(${fix})` }}
                ></div>
              </div>
              <div>
                <div className="fixMiddle">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore mmpor inc
                </div>
                <div className="fixBottom">
                  <div className="fixBtn">PLAY NOW</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
