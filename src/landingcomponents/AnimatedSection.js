import React from "react";
import { useIsInViewport } from "./useIsInViewport";
export const AnimatedSection = ({ getStyles, children }) => {
  const elementRef = React.useRef();
  const isInViewport = useIsInViewport(elementRef);

  return (
    <section style={getStyles(isInViewport)}>
      <div className="rectangle" ref={elementRef}>
        {children}
      </div>
    </section>
  );
};
