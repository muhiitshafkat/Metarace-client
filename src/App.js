import React from "react";
import { LandingPage } from "./landingcomponents/LandingPage";
import { NextProviders } from "./NextProviders";

const App = () => {
  return (
    <NextProviders>
      <LandingPage />
    </NextProviders>
  );
};

export default App;
