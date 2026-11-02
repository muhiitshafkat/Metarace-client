import { ISlide } from "./ISlide";
import { IContent1 } from "./IContent1";
import { IContent2 } from "./IContent2";
import { IContent3 } from "./IContent3";
import { IContent4 } from "./IContent4";
import { IContent5 } from "./IContent5";
import { IContent6 } from "./IContent6";
import { IContent7 } from "./IContent7";
import { IContent8 } from "./IContent8";
import { IContent9 } from "./IContent9";
import { IContent10 } from "./IContent10";

export const IphoneContent = () => {
  return (
    <div className="IphoneContent">
      <ISlide />
      <IContent1 />
      <IContent2 />
      <IContent3 />
      <IContent4 />
      <IContent5 />
      <IContent6 />
      <IContent7 />
      <IContent8 />
      {/* <IContent9 /> */}
      <IContent10 />
    </div>
  );
};
