export const Slider = ({
  slide,
  current,
  handleSlideClick,
  handleMouseMove,
  handleMouseLeave,
  x,
  y,
}) => {
  let classNames = "slide";
  if (current === slide.index) {
    classNames += " slide--current";
  }

  return (
    <li
      className={classNames}
      onClick={() => handleSlideClick(slide.index)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="slide__image-wrapper"
      >
        <img
          alt={slide.headline}
          src={slide.src}
          width={172.84}
          height={161.19}
          style={{ borderRadius: "20px" }}
        />
      </div>
    </li>
  );
};
