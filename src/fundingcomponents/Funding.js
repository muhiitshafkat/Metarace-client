import { Content } from "./Content";
import { Header } from "../landingcomponents/Header";

// Wallet state is now global (App.js → FundingContext)
// No local account state needed here
export const Funding = () => {
  return (
    <div>
      <Header />
      <Content />
    </div>
  );
};
