"use client";

import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { MyContext } from "./landingcomponents/MyContext";
import { FundingContext } from "./fundingcomponents/FundingContext";

export function NextProviders({ children }) {
  const [account, setAccount] = useState(null);
  const [tokenId, setTokenId] = useState(0);
  const [currentStaked, setCurrentStaked] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;
    const onAccounts = (accounts) => setAccount(accounts?.[0] || null);
    window.ethereum.on("accountsChanged", onAccounts);
    return () => window.ethereum.removeListener("accountsChanged", onAccounts);
  }, []);

  const fundingValue = {
    activeBtn: "left",
    account,
    setAccount,
    availableNfts: [],
    stakedNfts: [],
    availableNftIds: [],
    stakedNftIds: [],
    isStaked: [],
    tokenId,
    currentStaked,
    resetTokenID: (id) => setTokenId(id),
    resetCurrentStaked: (val) => setCurrentStaked(val),
  };

  const setAlert = (obj) => {
    const options = {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "colored",
    };
    if (obj.status === "success") toast.success(obj.msg, options);
    else toast.error(obj.msg, options);
  };

  return (
    <MyContext.Provider value={{ setAlert }}>
      <FundingContext.Provider value={fundingValue}>
        <ToastContainer toastStyle={{ backgroundColor: "#7936d9" }} />
        {children}
      </FundingContext.Provider>
    </MyContext.Provider>
  );
}
