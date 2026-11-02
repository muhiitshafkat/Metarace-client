// TAIL — append this to RaceGame3D.js manually or via build step
// This completes the RaceGame3D export

/*
FINISH OVERLAY + MOBILE BUTTON + CANVAS + STYLES
*/

// ── HUD overlay ───────────────────────────────────────────────────
function HUD({ stamina, rank, multiplier, boosting }) {
  const staminaColor = stamina > 50 ? "#00cc44" : stamina > 25 ? "#ffaa00" : "#ff3300";
  const posLabels = ["1st 🥇", "2nd 🥈", "3rd 🥉", "4th"];
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
      padding: "10px 20px", background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", gap: 24,
      fontFamily: "Arial Black, sans-serif", pointerEvents: "none",
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 160 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, color: "#aaffaa", letterSpacing: 1 }}>STAMINA</span>
          <span style={{ fontSize: 10, color: staminaColor }}>{stamina}%</span>
        </div>
        <div style={{ background: "#333", borderRadius: 4, height: 12, width: 160 }}>
          <div style={{
            background: staminaColor, height: "100%", borderRadius: 4,
            width: `${stamina}%`, transition: "width 0.1s, background 0.3s",
            boxShadow: boosting ? `0 0 10px ${staminaColor}` : "none",
          }} />
        </div>
      </div>
      <div style={{ flex: 1, textAlign: "center", fontSize: 18, color: "white", letterSpacing: 2 }}>
        {posLabels[rank - 1] || "4th"}
      </div>
      <div style={{ fontSize: 13, color: "#c03dff", fontWeight: 900 }}>
        ×{(multiplier / 100).toFixed(1)} MRT
      </div>
      <div style={{ fontSize: 12, minWidth: 80, textAlign: "right" }}>
        {boosting
          ? <span style={{ color: "#ffd700", textShadow: "0 0 8px #ffd700" }}>⚡ BOOST</span>
          : <span style={{ color: "rgba(255,255,255,0.4)" }}>Hold SPACE</span>}
      </div>
    </div>
  );
}

export const RaceGame3D = ({ multiplier, stakedCount, onRaceEnd }) => {
  const [phase, setPhase]         = useState("idle");
  const [countdown, setCountdown] = useState(3);
  const [stamina, setStamina]     = useState(100);
  const [rank, setRank]           = useState(1);
  const [boosting, setBoosting]   = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const holdingBoost = useRef(false);
  const containerRef = useRef();

  useEffect(() => {
    const iv = setInterval(() => {
      if (window.__raceStamina !== undefined) setStamina(window.__raceStamina);
      if (window.__raceRank    !== undefined) setRank(window.__raceRank);
      setBoosting(holdingBoost.current);
    }, 50);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const onDown = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); holdingBoost.current = true; }
    };
    const onUp = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") holdingBoost.current = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup",   onUp);
    return () => { window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); };
  }, []);

  const enterFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (el.requestFullscreen)            el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const startRace = useCallback(() => {
    setPhase("intro");
    enterFullscreen();
    let cd = 3;
    setCountdown(3);
    setTimeout(() => {
      setPhase("countdown");
      const iv = setInterval(() => {
        cd--;
        setCountdown(cd);
        if (cd <= 0) { clearInterval(iv); setPhase("racing"); }
      }, 900);
    }, 2500);
  }, [enterFullscreen]);

  const handleRaceEnd = useCallback(({ placement }) => {
    setPhase("finished");
    const baseRewards = [50, 30, 15, 5];
    const mrtEarned = Math.round((baseRewards[placement - 1] || 5) * multiplier / 100);
    setTimeout(() => onRaceEnd({ score: mrtEarned, placement, multiplier }), 3000);
  }, [multiplier, onRaceEnd]);

  const baseRewards = [50, 30, 15, 5];
  const posLabels   = ["🥇 VICTORY!", "🥈 2nd Place", "🥉 3rd Place", "4th Place"];
  const posColors   = ["#ffd700", "#c0c0c0", "#cd7f32", "#ffffff"];

  return (
    <div className="GameArena">
      {phase === "idle" && (
        <>
          <div className="gameStats">
            <div className="stat"><span className="statLabel">Staked NFTs</span><span className="statValue">{stakedCount || 0}</span></div>
            <div className="stat"><span className="statLabel">MRT Bonus</span><span className="statValue">×{(multiplier / 100).toFixed(1)}</span></div>
          </div>
          <div className="raceIdleScreen">
            <div className="raceIdleTitle">🐴 STUTENGARDEN</div>
            <div className="raceIdleSub">
              Hold <strong>SPACE</strong> or <strong>↑</strong> to boost!<br />
              Release to recover stamina. Manage energy to win.
            </div>
            <div className="raceRewardPreview">
              {baseRewards.map((base, i) => (
                <div className="rewardItem" key={i}>
                  {["🥇","🥈","🥉","4th"][i]} → {Math.round(base * multiplier / 100)} MRT
                </div>
              ))}
            </div>
            {multiplier > 100 && <div className="multiplierBadge">🚀 Staking Bonus: ×{(multiplier/100).toFixed(1)}</div>}
            <button className="startBtn" onClick={startRace}>🏇 START RACE</button>
            <div className="HowToPlay" style={{ marginTop: 0 }}>
              <span>Hold SPACE / ↑</span> = boost &nbsp;|&nbsp; Release = recover &nbsp;|&nbsp; Opens <span>fullscreen</span>
            </div>
          </div>
        </>
      )}

      {phase !== "idle" && (
        <div
          ref={containerRef}
          style={{
            width: isFullscreen ? "100vw" : "100%",
            maxWidth: isFullscreen ? "100vw" : 800,
            height: isFullscreen ? "100vh" : 460,
            position: isFullscreen ? "fixed" : "relative",
            top: isFullscreen ? 0 : "auto",
            left: isFullscreen ? 0 : "auto",
            zIndex: isFullscreen ? 9999 : 1,
            background: "#87ceeb",
            borderRadius: isFullscreen ? 0 : 12,
            overflow: "hidden",
            border: isFullscreen ? "none" : "2px solid rgba(95,61,255,0.5)",
          }}
          onMouseDown={() => { holdingBoost.current = true; }}
          onMouseUp={()   => { holdingBoost.current = false; }}
          onTouchStart={() => { holdingBoost.current = true; }}
          onTouchEnd={()   => { holdingBoost.current = false; }}
        >
          {phase === "racing" && <HUD stamina={stamina} rank={rank} multiplier={multiplier} boosting={boosting} />}

          {phase === "intro" && (
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              alignItems: "flex-end", justifyContent: "center", paddingBottom: 80,
              zIndex: 30, pointerEvents: "none",
              background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)",
            }}>
              <span style={{ fontSize: 32, fontFamily: "Arial Black", color: "white",
                textShadow: "0 2px 20px rgba(0,0,0,0.9)", letterSpacing: 6 }}>
                STUTENGARDEN HORSE RACE
              </span>
            </div>
          )}

          {phase === "countdown" && (
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.4)", zIndex: 30,
            }}>
              <span style={{
                fontSize: 140, fontFamily: "Arial Black",
                color: countdown > 1 ? "#c03dff" : "#00ff88",
                textShadow: "0 0 60px currentColor",
              }}>
                {countdown > 0 ? countdown : "GO!"}
              </span>
            </div>
          )}

          {phase === "finished" && (
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.65)", zIndex: 30,
              flexDirection: "column", gap: 20,
            }}>
              <span style={{
                fontSize: 72, fontFamily: "Arial Black",
                color: posColors[rank - 1] || "#fff",
                textShadow: "0 0 50px currentColor",
              }}>
                {posLabels[rank - 1] || "Finished!"}
              </span>
              <span style={{ fontSize: 28, color: "#ffd700", fontFamily: "Arial Black",
                textShadow: "0 0 20px #ffd700" }}>
                +{Math.round((baseRewards[rank - 1] || 5) * multiplier / 100)} MRT earned
              </span>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
                Saving results...
              </span>
            </div>
          )}

          {/* Mobile boost button */}
          {phase === "racing" && (
            <button
              onTouchStart={(e) => { e.preventDefault(); holdingBoost.current = true; }}
              onTouchEnd={(e)   => { e.preventDefault(); holdingBoost.current = false; }}
              onMouseDown={() => { holdingBoost.current = true; }}
              onMouseUp={()   => { holdingBoost.current = false; }}
              style={{
                position: "absolute", bottom: 24, right: 24,
                width: 90, height: 90, borderRadius: "50%",
                background: boosting ? "rgba(255,215,0,0.9)" : "rgba(121,54,217,0.9)",
                border: `3px solid ${boosting ? "#ffd700" : "#c03dff"}`,
                color: "white", fontSize: 13, fontFamily: "Arial Black",
                cursor: "pointer", zIndex: 25,
                boxShadow: `0 0 20px ${boosting ? "rgba(255,215,0,0.6)" : "rgba(192,61,255,0.5)"}`,
                userSelect: "none", touchAction: "none",
                transition: "background 0.1s, border 0.1s",
              }}
            >
              ⚡<br />BOOST
            </button>
          )}

          <Canvas shadows camera={{ position: [-8, 4.5, 14], fov: 60 }}
            style={{ width: "100%", height: "100%" }}>
            <fog attach="fog" args={["#87ceeb", 100, 350]} />
            <Sky sunPosition={[100, 20, 100]} />
            <RaceScene
              multiplier={multiplier}
              phase={phase}
              onRaceEnd={handleRaceEnd}
              holdingBoost={holdingBoost}
            />
          </Canvas>
        </div>
      )}

      <style>{`
        @keyframes countPulse {
          0%   { transform: scale(0.4); opacity: 0; }
          60%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
