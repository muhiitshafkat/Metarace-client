import React from "react";

export const GameContext = React.createContext({
  account: null,
  setAccount: () => {},
});
