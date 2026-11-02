import React, { useState, useContext } from "react";
import { MRTStakingModal } from "./MRTStakingModal";
import walletIcon from "../images/Wallet.svg";
import { FundingContext } from "./FundingContext";
import { mrtTokenAddress } from "../utils/constants";
import { copyToClipboard } from "../utils/copyToClipboard";

// ── Buy MRT panel ─────────────────────────────────────────────────
const BuyMunityPanel = ({ account }) => (
  <div className="EthereumModal">
    <div className="centerModal" style={{ padding: "36px 0 28px" }}>

      <div className="btnGroup firstGroup">
        <div className="ethBtn ethBtn1 ethIconBtn" style={{ width: 180 }}>
          🪙 MetaRace Token
        </div>
        <div className="ethBtn1" style={{ fontSize: 12, color: "#c03dff" }}>
          MRT · Polygon
        </div>
      </div>

      {/* Token info */}
      <div className="btnGroup">
        <div className="ethBtn2 infoBtn">
          <span className="iSpan">Token Symbol</span>
          <span className="cSpan">MRT</span>
        </div>
        <div className="ethBtn2 infoBtn">
          <span className="iSpan">Network</span>
          <span className="cSpan" style={{ fontSize: 14 }}>Polygon</span>
        </div>
      </div>

      <div className="btnGroup">
        <div className="ethBtn2 infoBtn">
          <span className="iSpan">Total Supply</span>
          <span className="cSpan" style={{ fontSize: 14 }}>100,000,000</span>
        </div>
        <div className="ethBtn2 infoBtn">
          <span className="iSpan">Decimals</span>
          <span className="cSpan">18</span>
        </div>
      </div>

      {/* Contract address */}
      <div className="btnGroup">
        <div className="ethBtn2" style={{ width: 468, cursor: "pointer" }}
          onClick={() => copyToClipboard(mrtTokenAddress).catch(() => {})}>
          <span className="iSpan">Contract Address (click to copy)</span>
          <span className="cSpan" style={{ fontSize: 11, wordBreak: "break-all" }}>
            {mrtTokenAddress}
          </span>
        </div>
      </div>

      {/* Tokenomics */}
      <div className="btnGroup">
        <span className="cover1" style={{ maxWidth: 420, textAlign: "center", lineHeight: "20px" }}>
          <span className="cover2">40%</span> Game Rewards &nbsp;·&nbsp;
          <span className="cover2">25%</span> Staking &nbsp;·&nbsp;
          <span className="cover2">10%</span> Liquidity &nbsp;·&nbsp;
          <span className="cover2">15%</span> Team &nbsp;·&nbsp;
          <span className="cover2">10%</span> Marketing
        </span>
      </div>

      {/* How to get MRT */}
      <div className="btnGroup" style={{ flexDirection: "column", gap: 12 }}>
        <span className="cover1" style={{ fontWeight: 700, color: "white" }}>
          How to earn MRT:
        </span>
        <span className="cover1" style={{ textAlign: "center", lineHeight: "22px" }}>
          🏇 Win races → earn MRT automatically<br />
          📈 Stake MRT → earn up to <span className="cover2">40% APY</span><br />
          🦊 Add to MetaMask → paste contract address above
        </span>
      </div>

      {/* Add to MetaMask */}
      <div className="btnGroup">
        <div
          className="ethBtn5"
          onClick={async () => {
            if (!window.ethereum) return;
            await window.ethereum.request({
              method: "wallet_watchAsset",
              params: {
                type: "ERC20",
                options: {
                  address: mrtTokenAddress,
                  symbol: "MRT",
                  decimals: 18,
                },
              },
            });
          }}
        >
          🦊 Add MRT to MetaMask
        </div>
      </div>

      {/* Polygonscan link */}
      <div className="btnGroup" style={{ paddingBottom: 20 }}>
        <span className="cover1">
          View on{" "}
          <a
            href={`https://polygonscan.com/token/${mrtTokenAddress}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#c03dff", fontWeight: 700 }}
          >
            Polygonscan ↗
          </a>
        </span>
      </div>

    </div>
  </div>
);

// ── Tabcontrol ────────────────────────────────────────────────────
export const Tabcontrol = () => {
  const [activeBtn, setActiveBtn] = useState("right");
  const { account, setAccount } = useContext(FundingContext);
  const isConnected = !!account;

  const shortAddress = account
    ? `${account.slice(0, 9)}......${account.slice(-5)}`
    : "";

  return (
    <div className="Toptabcontrol">
      <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>

        {/* Tab switcher */}
        <div className="Tabcontrol">
          <button
            className="tabButton"
            onClick={() => setActiveBtn("left")}
            style={
              activeBtn === "left"
                ? { background: "rgb(139,56,228)", color: "#FFF", borderRight: "none" }
                : { background: "none", color: "#BABABA", borderRight: "none" }
            }
          >
            BUY MRT
          </button>
          <button
            className="tabButton"
            onClick={() => setActiveBtn("right")}
            style={
              activeBtn === "right"
                ? { background: "rgb(139,56,228)", color: "#FFF", borderLeft: "none" }
                : { background: "none", color: "#BABABA", borderLeft: "none" }
            }
          >
            STAKING
          </button>
        </div>

        {/* Connected wallet address */}
        {isConnected && (
          <div className="yourCode">
            <div className="codeBox" style={{ display: "flex", justifyContent: "center" }}>
              <div className="walletBox" style={{ display: "flex", justifyContent: "center" }}>
                <img src={walletIcon} alt="wallet" style={{ position: "relative" }} />
                <div className="codeGroup" style={{ display: "flex" }}>
                  <p>{shortAddress}</p>
                  <div
                    className="codeBG"
                    onClick={() => copyToClipboard(account).catch(() => {})}
                    title="Copy address"
                  >
                    <i className="bi bi-copy" style={{ position: "relative" }} />
                    <span className="tooltiptext">copy code</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab content */}
      {activeBtn === "left" && (
        <BuyMunityPanel account={account} />
      )}

      {activeBtn === "right" && (
        isConnected ? (
          <MRTStakingModal
            address={account}
            onDisconnect={() => setAccount(null)}
          />
        ) : (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "40px" }}>
            <div style={{ opacity: "40%", pointerEvents: "none" }}>
              <MRTStakingModal address={null} onDisconnect={() => {}} />
            </div>
          </div>
        )
      )}
    </div>
  );
};
