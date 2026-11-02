import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import { NextProviders } from "../src/NextProviders";

export const metadata = {
  title: "MetaRace",
  description: "Play, stake, earn, and own in the MetaRace horse racing ecosystem.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <NextProviders>{children}</NextProviders>
      </body>
    </html>
  );
}
