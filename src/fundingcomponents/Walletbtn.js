import { useState, useEffect, useContext } from "react";
import { FundingContext } from "./FundingContext";
import { copyToClipboard } from "../utils/copyToClipboard";

const METAMASK_INSTALL_URL = "https://metamask.io/download.html";
const EXPECTED_CHAIN_ID   = process.env.REACT_APP_CHAIN_HEX  || "0x89";
const EXPECTED_CHAIN_NAME = process.env.REACT_APP_CHAIN_NAME || "Polygon";

export const Wallnetbtn = () => {
  const [error,   setError]   = useState("");
  const [chainId, setChainId] = useState(null);
  const [copied,  setCopied]  = useState(false);
  const [mounted, setMounted] = useState(false);
  const { account, setAccount } = useContext(FundingContext);

  useEffect(() => { setMounted(true); }, []);

  const isMetaMaskInstalled =
    mounted &&
    typeof window !== "undefined" &&
    typeof window.ethereum !== "undefined" &&
    window.ethereum.isMetaMask === true;

  useEffect(() => {
    if (!isMetaMaskInstalled) return;
    setChainId(window.ethereum.chainId);
    const onAccounts = (accounts) => setAccount(accounts?.[0] || null);
    const onChain    = (id)       => setChainId(id);
    window.ethereum.on("accountsChanged", onAccounts);
    window.ethereum.on("chainChanged",    onChain);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccounts);
      window.ethereum.removeListener("chainChanged",    onChain);
    };
  }, [isMetaMaskInstalled, setAccount]);

  const connectWallet = async () => {
    if (!isMetaMaskInstalled) {
      window.open(METAMASK_INSTALL_URL, "_blank", "noopener,noreferrer");
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
      setChainId(window.ethereum.chainId);
      setError("");
    } catch {
      setError("Connection rejected.");
    }
  };

  const disconnectWallet = () => { setAccount(null); setError(""); };

  const copyAddress = () => {
    if (!account) return;
    copyToClipboard(account).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: EXPECTED_CHAIN_ID }],
      });
      setError("");
    } catch {
      setError(`Failed to switch to ${EXPECTED_CHAIN_NAME}.`);
    }
  };

  // Wrong network
  if (account && chainId && chainId.toLowerCase() !== EXPECTED_CHAIN_ID.toLowerCase()) {
    return (
      <div className="wc-container ms-lg-5">
        <button className="wc-wrong-network" onClick={switchNetwork}>
          Wrong network — Switch to {EXPECTED_CHAIN_NAME}
        </button>
        {error && <div className="wc-error">{error}</div>}
      </div>
    );
  }

  // Connected
  if (account) {
    return (
      <div className="wc-container ms-lg-5">
        <button className="wc-account" onClick={copyAddress} title="Click to copy address">
          <span className="wc-account-dot" />
          {account.slice(0, 6)}…{account.slice(-4)}
          <span className="wc-copy-icon">{copied ? "✓" : "⧉"}</span>
        </button>
        <button className="wc-disconnect" onClick={disconnectWallet}>
          Disconnect
        </button>
        {error && <div className="wc-error">{error}</div>}
      </div>
    );
  }

  // Not connected
  return (
    <div className="wc-container ms-lg-5">
      <button className="wc-connect-btn" onClick={connectWallet}>
        {isMetaMaskInstalled ? "Connect Wallet" : "Install MetaMask"}
      </button>
      {error && <div className="wc-error">{error}</div>}
    </div>
  );
};
