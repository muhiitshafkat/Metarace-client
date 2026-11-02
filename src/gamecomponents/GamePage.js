import React, { useState, useEffect, useCallback, useContext } from "react";
import { useRouter } from "next/navigation";
import { StutengardGame } from "./StutengardGame";
import { GameRewards } from "./GameRewards";
import { Leaderboard } from "./Leaderboard";
import { PreRaceLobby, ENTRY_FEE, WELCOME_MRT, FREE_TRIAL } from "./PreRaceLobby";
import { UsernameModal } from "./UsernameModal";
import { getNftTotalStaked, getMrtBalance } from "../utils/Contract";
import { MyContext } from "../landingcomponents/MyContext";
import { FundingContext } from "../fundingcomponents/FundingContext";
import { saveGameSession, fetchPlayerStats, claimWelcomeBonus, recordEntry } from "./gameApi";
import { copyToClipboard } from "../utils/copyToClipboard";
import { Wallnetbtn } from "../fundingcomponents/Walletbtn";

const WELCOME_CLAIMED_KEY = "mrt_welcome_claimed_";
const UNLIMITED_GAMEPLAY = process.env.REACT_APP_UNLIMITED_GAMEPLAY === "true";

function calcMultiplier(count) {
  if (count >= 3) return 300;
  if (count === 2) return 200;
  if (count === 1) return 150;
  return 100;
}

export const GamePage = () => {
  const router = useRouter();
  const AlertContext = useContext(MyContext);

  // ── Read wallet from global context ─────────────────────────
  const { account } = useContext(FundingContext);

  const [stakedIds, setStakedIds]         = useState([]);
  const [mrtBalance, setMrtBalance]       = useState(null);
  const [hasClaimed, setHasClaimed]       = useState(false);
  const [gameScore, setGameScore]         = useState(null);
  const [sessionId, setSessionId]         = useState(null);
  const [mrtRewarded, setMrtRewarded]     = useState(0);
  const [playerStats, setPlayerStats]     = useState(null);
  const [savingSession, setSavingSession] = useState(false);
  const [dailyLimitMessage, setDailyLimitMessage] = useState(null);
  const [dailyMrtEarned, setDailyMrtEarned]       = useState(0);
  const [dailyMrtCap, setDailyMrtCap]             = useState(500);
  const [dailyCapHit, setDailyCapHit]             = useState(false);
  const [_selectedHorse, setSelectedHorse] = useState(null);
  const [_selectedTrack, setSelectedTrack] = useState(null);
  const [phase, setPhase]                 = useState("lobby");
  const [username, setUsername]           = useState(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [freeTrialLeft, setFreeTrialLeft] = useState(FREE_TRIAL ?? 5);
  const [trialLoaded, setTrialLoaded]     = useState(false);

  const multiplier = calcMultiplier(stakedIds.length);

  // ── Load wallet data ─────────────────────────────────────────
  const loadWalletData = useCallback(async () => {
    if (!account) return;

    // Always check server for claim status — localStorage is only a perf cache
    // This ensures server restarts / cleared storage don't allow double-claiming
    const [ids, stats, bal, trialRes, profileRes, claimRes] = await Promise.allSettled([
      getNftTotalStaked(account),
      fetchPlayerStats(account),
      getMrtBalance(account),
      fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000/api/v1"}/game/trial/${account}`),
      fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000/api/v1"}/profile/${account}`),
      fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000/api/v1"}/game/welcome/status/${account}`),
    ]);

    setStakedIds(ids.status === "fulfilled" ? (ids.value || []) : []);

    if (stats.status === "fulfilled" && stats.value?.success) {
      const s = stats.value.stats;
      setPlayerStats({
        ...s,
        dailyMrtEarned: s.dailyMrtEarned || 0,
        dailyMrtCap:    s.dailyMrtCap    || 500,
        dailyCapHit:    s.dailyCapHit    || false,
      });
    }

    if (bal.status === "fulfilled") setMrtBalance(bal.value);

    // Free trial — server is authoritative, no fallback to localStorage
    if (trialRes.status === "fulfilled") {
      try {
        const trialData = await trialRes.value.json();
        if (trialData.success) {
          setFreeTrialLeft(UNLIMITED_GAMEPLAY ? Number.MAX_SAFE_INTEGER : trialData.freeLeft);
          setTrialLoaded(true);
        }
      } catch { /* non-fatal */ }
    }

    // Welcome claim status — server is authoritative
    if (claimRes.status === "fulfilled") {
      try {
        const response = claimRes.value;
        if (response.ok) {
          const claimData = await response.json();
          const alreadyClaimed = claimData.claimed === true;
          setHasClaimed(alreadyClaimed);
          if (alreadyClaimed) {
            localStorage.setItem(WELCOME_CLAIMED_KEY + account.toLowerCase(), "true");
          } else {
            localStorage.removeItem(WELCOME_CLAIMED_KEY + account.toLowerCase());
          }
        } else {
          // Server reachable but error (e.g. 429) — use localStorage cache
          const cached = localStorage.getItem(WELCOME_CLAIMED_KEY + account.toLowerCase()) === "true";
          setHasClaimed(cached);
        }
      } catch {
        const cached = localStorage.getItem(WELCOME_CLAIMED_KEY + account.toLowerCase()) === "true";
        setHasClaimed(cached);
      }
    } else {
      // Server unreachable — use localStorage cache
      const cached = localStorage.getItem(WELCOME_CLAIMED_KEY + account.toLowerCase()) === "true";
      setHasClaimed(cached);
    }

    // Username check
    if (profileRes.status === "fulfilled") {
      try {
        const data = await profileRes.value.json();
        if (data.success && data.profile?.username) {
          setUsername(data.profile.username);
        } else {
          setUsername("");
          setShowUsernameModal(true);
        }
      } catch {
        setUsername("");
      }
    }
  }, [account]);

  useEffect(() => { loadWalletData(); }, [loadWalletData]);

  // ── Welcome bonus claim ──────────────────────────────────────
  const handleClaimWelcome = useCallback(async () => {
    if (!account || hasClaimed) return;
    try {
      const data = await claimWelcomeBonus(account);
      if (data.success) {
        localStorage.setItem(WELCOME_CLAIMED_KEY + account.toLowerCase(), "true");
        setHasClaimed(true);
        AlertContext.setAlert({ status: "success", msg: `🎁 ${WELCOME_MRT} MRT claimed! Welcome to MetaRace!` });
        const bal = await getMrtBalance(account).catch(() => null);
        if (bal !== null) setMrtBalance(bal);
      } else {
        AlertContext.setAlert({ status: "danger", msg: data.error || "Claim failed." });
      }
    } catch (err) {
      if (err.message?.includes("rejected") || err.code === 4001) {
        AlertContext.setAlert({ status: "danger", msg: "Signature rejected." });
      } else {
        AlertContext.setAlert({ status: "danger", msg: "Could not connect to server." });
      }
    }
  }, [account, hasClaimed, AlertContext]);

  // ── Start race — pay 20 MRT entry fee on-chain ──────────────
  const handleStartRace = useCallback(async ({ horse, track }) => {
    setSelectedHorse(horse);
    setSelectedTrack(track);

    // Free trial — skip payment entirely
    if (UNLIMITED_GAMEPLAY || freeTrialLeft > 0) {
      setPhase("racing");
      return;
    }

    // Paid race — transfer 20 MRT on-chain
    try {
      AlertContext.setAlert({ status: "success", msg: "Confirm the 20 MRT entry fee in MetaMask..." });

      const eth = window.ethereum;
      if (!eth) throw new Error("MetaMask not installed");

      const { ethers } = await import("ethers");
      const provider = new ethers.providers.Web3Provider(eth);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();

      const MRT_ABI = [
        "function transfer(address to, uint256 amount) returns (bool)",
        "function balanceOf(address) view returns (uint256)",
      ];
      const mrtAddress    = process.env.REACT_APP_MRT_TOKEN_ADDRESS;
      const rewardWallet  = process.env.REACT_APP_REWARD_WALLET_ADDRESS ||
                            "0x7fD8d82A595e99Ebdb9a2812416f58DE1E72C761";
      const token = new ethers.Contract(mrtAddress, MRT_ABI, signer);
      const amountWei = ethers.utils.parseEther(String(ENTRY_FEE));

      // Check balance first
      const bal = await token.balanceOf(account);
      if (bal.lt(amountWei)) {
        AlertContext.setAlert({ status: "danger", msg: `Insufficient MRT. You need ${ENTRY_FEE} MRT to enter.` });
        return;
      }

      const tx = await token.transfer(rewardWallet, amountWei);
      AlertContext.setAlert({ status: "success", msg: "Entry fee sent! Starting race..." });
      await tx.wait();

      // Step 2: record entry on server (non-blocking, signed)
      recordEntry(account, ENTRY_FEE, tx.hash, horse.id, track.id).catch(() => {});

      // Refresh balance
      const newBal = await getMrtBalance(account).catch(() => null);
      if (newBal !== null) setMrtBalance(newBal);

    } catch (err) {
      if (err.code === 4001 || err.message?.includes("rejected")) {
        AlertContext.setAlert({ status: "danger", msg: "Entry fee rejected. Race cancelled." });
      } else {
        AlertContext.setAlert({ status: "danger", msg: err.message || "Entry fee failed." });
      }
      return; // don't start race if payment failed
    }

    setPhase("racing");
  }, [account, AlertContext, freeTrialLeft]);

  // ── Game over ────────────────────────────────────────────────
  const handleGameOver = useCallback(async ({ score, placement, multiplier: raceMultiplier }) => {
    setGameScore({ score, placement, multiplier: raceMultiplier });
    setPhase("finished"); // show results immediately — don't wait for chain
    setSavingSession(true);

    // Fire-and-forget — don't block the UI
    saveGameSession({
      walletAddress:  account,
      score,
      placement:      placement || 4,
      mrtMultiplier:  raceMultiplier || 100,
      stakedNftCount: stakedIds.length,
    }).then(async (result) => {
      if (result?.success) {
        setSessionId(result.session.id);
        setMrtRewarded(result.mrtRewarded || 0);
        setDailyMrtEarned(result.dailyMrtEarned || 0);
        setDailyMrtCap(result.dailyMrtCap || 500);
        setDailyCapHit(result.dailyCapHit || false);
        if (result.dailyLimitMessage) setDailyLimitMessage(result.dailyLimitMessage);

        // Refresh stats + trial count
        const [stats, trial, bal] = await Promise.allSettled([
          fetchPlayerStats(account),
          fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000/api/v1"}/game/trial/${account}`).then(r => r.json()),
          getMrtBalance(account),
        ]);
        if (stats.status === "fulfilled" && stats.value?.success) {
          const s = stats.value.stats;
          setPlayerStats({
            ...s,
            dailyMrtEarned: s.dailyMrtEarned || 0,
            dailyMrtCap:    s.dailyMrtCap    || 500,
            dailyCapHit:    s.dailyCapHit    || false,
          });
        }
        if (trial.status === "fulfilled" && trial.value?.success) {
          setFreeTrialLeft(UNLIMITED_GAMEPLAY ? Number.MAX_SAFE_INTEGER : trial.value.freeLeft);
        }
        if (bal.status === "fulfilled") setMrtBalance(bal.value);
      }
      setSavingSession(false);
    }).catch(() => setSavingSession(false));
  }, [account, stakedIds.length]);

  const handlePlayAgain = useCallback(async () => {
    setGameScore(null);
    setSessionId(null);
    setMrtRewarded(0);
    setDailyLimitMessage(null);
    setDailyCapHit(false);
    setPhase("lobby");

    // Refresh stats so lobby shows updated free trial count + daily progress
    if (account) {
      try {
        const [stats, trial, bal] = await Promise.allSettled([
          fetchPlayerStats(account),
          fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000/api/v1"}/game/trial/${account}`).then(r => r.json()),
          getMrtBalance(account),
        ]);
        if (stats.status === "fulfilled" && stats.value?.success) {
          const s = stats.value.stats;
          setPlayerStats({
            ...s,
            dailyMrtEarned: s.dailyMrtEarned || 0,
            dailyMrtCap:    s.dailyMrtCap    || 500,
            dailyCapHit:    s.dailyCapHit    || false,
          });
        }
        if (trial.status === "fulfilled" && trial.value?.success) {
          setFreeTrialLeft(UNLIMITED_GAMEPLAY ? Number.MAX_SAFE_INTEGER : trial.value.freeLeft);
        } else {
          const sData = stats.status === "fulfilled" ? stats.value?.stats : null;
          if (sData) setFreeTrialLeft(Math.max(0, 5 - (sData.totalGames || 0)));
        }
        if (bal.status === "fulfilled") setMrtBalance(bal.value);
      } catch { /* non-fatal */ }
    }
  }, [account]);

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="GamePage">
      {/* Username modal — shown on first visit */}
      {showUsernameModal && account && (
        <UsernameModal
          account={account}
          onComplete={(profile) => {
            setUsername(profile.username);
            setShowUsernameModal(false);
          }}
        />
      )}

      <div className="gameHeader">
        <button className="backBtn" onClick={() => router.push("/")}>← Back</button>
        <span className="gameTitle">STUTENGARDEN</span>
        {account ? (
          <div className="gamePlayerInfo">
            {username && (
              <span className="gamePlayerChip gamePlayerChip--name">
                👤 {username}
              </span>
            )}
            <span
              className="gamePlayerChip gamePlayerChip--address"
              title={account}
              onClick={() => copyToClipboard(account).catch(() => {})}
            >
              🔗 {account.slice(0, 6)}…{account.slice(-4)}
            </span>
            <span className="gamePlayerChip gamePlayerChip--balance">
              💰 {mrtBalance !== null ? `${mrtBalance.toFixed(2)} MRT` : "…"}
            </span>
          </div>
        ) : (
          <Wallnetbtn />
        )}
      </div>

      {!account ? (
        <div className="WalletGate">
          <h2>Connect Your Wallet</h2>
          <p>Connect MetaMask to play, earn MRT rewards, and compete on the leaderboard.</p>
          <Wallnetbtn />
          <Leaderboard />
        </div>

      ) : phase === "lobby" ? (
        <PreRaceLobby
          account={account}
          mrtBalance={mrtBalance}
          hasClaimed={hasClaimed}
          freeTrialLeft={freeTrialLeft}
          trialLoaded={trialLoaded}
          playerStats={playerStats}
          onClaimWelcome={handleClaimWelcome}
          onStartRace={handleStartRace}
        />

      ) : phase === "racing" ? (
        <>
          <StutengardGame
            stakedCount={stakedIds.length}
            multiplier={multiplier}
            playerStats={playerStats}
            onGameOver={handleGameOver}
          />
          <Leaderboard currentWallet={account} />
        </>

      ) : (
        <GameRewards
          account={account}
          placement={gameScore?.placement ?? 4}
          multiplier={gameScore?.multiplier ?? multiplier}
          mrtRewarded={mrtRewarded}
          sessionId={sessionId}
          playerStats={playerStats}
          savingSession={savingSession}
          dailyLimitMessage={dailyLimitMessage}
          dailyMrtEarned={dailyMrtEarned}
          dailyMrtCap={dailyMrtCap}
          dailyCapHit={dailyCapHit}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
};
