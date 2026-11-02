import React, { useEffect, useState } from "react";
import heroHorse from "../images/Horse/beautiful-black-horse-galloping-through-a-golden-field-during-the-golden-hour-free-photo.jpeg";

// Thin wrapper — keeps GamePage.js interface unchanged
export const StutengardGame = ({ stakedCount, multiplier, playerStats, onGameOver }) => {
  const [RaceGame3D, setRaceGame3D] = useState(null);

  useEffect(() => {
    let mounted = true;
    import("./RaceGame3D").then((mod) => {
      if (mounted) setRaceGame3D(() => mod.RaceGame3D);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      {/* Hero image above game */}
      <div style={{
        width: "100%", maxWidth: 800, height: 200, borderRadius: 12,
        overflow: "hidden", marginBottom: 16,
        background: `url(${heroHorse}) center/cover`,
        position: "relative",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(13,13,26,0.85))",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          padding: "20px",
        }}>
          <div style={{
            fontSize: 28, fontWeight: 900, color: "white",
            textShadow: "0 2px 20px rgba(0,0,0,0.8)", letterSpacing: 2,
            fontFamily: "Arial Black, sans-serif",
          }}>
            🐴 STUTENGARDEN RACING
          </div>
        </div>
      </div>

      {RaceGame3D ? (
        <RaceGame3D
          multiplier={multiplier}
          stakedCount={stakedCount}
          onRaceEnd={onGameOver}
        />
      ) : (
        <div style={{
          width: "100%",
          maxWidth: 1000,
          minHeight: 420,
          display: "grid",
          placeItems: "center",
          border: "1px solid rgba(95,61,255,0.25)",
          borderRadius: 12,
          background: "rgba(255,255,255,0.04)",
          color: "rgba(255,255,255,0.65)",
          fontWeight: 700,
        }}>
          Loading race...
        </div>
      )}
    </>
  );
};
