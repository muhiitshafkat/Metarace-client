"use client";

import { Header } from "../../src/landingcomponents/Header";
import { Legendary } from "../../src/landingcomponents/Legendary";
import { Footer } from "../../src/landingcomponents/Footer";
import { ScrollToTop } from "../../src/landingcomponents/ScrollToTop";

export default function MarketplaceRoute() {
  return (
    <div className="LandingPage">
      <Header />
      <div className="BContent">
        <Legendary />
      </div>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
