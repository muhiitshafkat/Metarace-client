import React from "react";

export const FundingContext = React.createContext({
  activeBtn: "left",
  account: null,
  availableNfts: [],
  stakedNfts: [],
  availableNftIds: [],
  stakedNftIds: [],
  isStaked: [],
  tokenId: 0,
  currentStaked: false,
  resetTokenID: () => {},
  resetCurrentStaked: () => {},
  setAccount: () => {},
});
