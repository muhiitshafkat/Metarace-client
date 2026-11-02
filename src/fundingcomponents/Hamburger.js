import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MenuItem } from "./MenuItem";
import { MenuButton } from "./MenuButton";
import { Menu } from "./Menu";

export const Hamburger = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const handleMenuClick = () => setMenuOpen(!menuOpen);

  const menuRoutes = {
    "Games":        "/game",
    "Token":        "/token",
    "Market Place": "/marketplace",
    "Profile":      "/profile",
  };

  const menu = ["Games", "Token", "Market Place", "Profile"];
  const menuItems = menu.map((val, index) => (
    <MenuItem key={index} delay={`${index * 0.1}s`} onClick={() => {
      setMenuOpen(false);
      router.push(menuRoutes[val]);
    }}>
      {val}
    </MenuItem>
  ));

  const styles = {
    container: {
      position: "absolute", top: 0, left: 0, zIndex: "600",
      opacity: 0.9, display: "flex", alignItems: "center",
      background: "black", width: "100%", color: "white", fontFamily: "Lobster",
    },
  };

  return (
    <div>
      <div style={styles.container}>
        <MenuButton open={menuOpen} onClick={handleMenuClick} color="white" />
      </div>
      <Menu open={menuOpen}>{menuItems}</Menu>
    </div>
  );
};

export default Hamburger;
