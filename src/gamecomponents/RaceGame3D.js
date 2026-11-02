import React, { useRef, useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations, Text, Sky } from "@react-three/drei";
import * as THREE from "three";

// ── Constants ─────────────────────────────────────────────────────
const RACE_LENGTH   = 300;
const LANE_WIDTH    = 4.5;
const LANES         = 4;
const BASE_SPEED    = 0.12;
const MAX_SPEED     = 0.22;
const STAMINA_DRAIN = 8.0;
const STAMINA_REGEN = 0.12;
const HOLD_BOOST    = 0.010;
const RELEASE_DECAY = 0.012; // fast decay — short clicks give almost no benefit
const MIN_HOLD_MS   = 150;   // must hold at least 150ms before boost activates

const laneZ = (lane) => (lane - (LANES - 1) / 2) * LANE_WIDTH;

// The one model with working animation and correct direction
const HORSE_MODEL = "/assets/horse_trot.glb";
useGLTF.preload(HORSE_MODEL);

const HORSE_TINTS = ["#9333ea", "#c8601a", "#555555", "#d4a96e"];

function HorseModel({ index, isGalloping, raceStarted }) {
  const group = useRef();
  const { scene, animations } = useGLTF(HORSE_MODEL);
  const { actions, names }    = useAnimations(animations, group);

  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse(child => {
      // Hide the ground plane that comes baked into the model
      if (child.name === "Ground_PlaneShape1_2_0") {
        child.visible = false;
        return;
      }
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        // Tint: multiply existing color by our tint
        const tint = new THREE.Color(HORSE_TINTS[index] || "#ffffff");
        child.material.color.multiply(tint);
        child.material.emissiveMap       = null;
        child.material.emissive          = new THREE.Color(0x000000);
        child.material.emissiveIntensity = 0;
        child.material.needsUpdate       = true;
      }
    });
    return c;
  }, [scene, index]);

  // Scale to 2.2 world units tall, sit on ground
  const { s, yOff } = useMemo(() => {
    // Measure only the horse mesh, not the hidden ground plane
    const box = new THREE.Box3();
    cloned.traverse(child => {
      if (child.isMesh && child.visible) box.expandByObject(child);
    });
    if (box.isEmpty()) return { s: 1, yOff: 0 };
    const sz = new THREE.Vector3();
    box.getSize(sz);
    const maxDim = Math.max(sz.x, sz.y, sz.z);
    const scale  = maxDim > 0 ? 2.2 / maxDim : 1;
    return { s: scale, yOff: -box.min.y * scale };
  }, [cloned]);

  // Start animation — no cleanup, keep running
  useEffect(() => {
    if (!names.length) return;
    const action = actions[names[0]];
    if (!action) return;
    action.reset().play();
  }, [actions, names]);

  // Adjust speed without restarting — 0 when race not started (static pose)
  useFrame(() => {
    if (!names.length) return;
    const action = actions[names[0]];
    if (!action) return;
    if (!raceStarted) {
      action.timeScale = 0;
      action.paused = true;
    } else {
      action.paused = false;
      action.timeScale = isGalloping ? 1.8 : 0.5;
    }
  });

  // Horses face +X — Math.PI/2 was correct, restore it
  return (
    <group rotation={[0, Math.PI / 2, 0]}>
      <group scale={s} position={[0, yOff, 0]}>
        <group ref={group}>
          <primitive object={cloned} />
        </group>
      </group>
    </group>
  );
}

// ── Track ─────────────────────────────────────────────────────────
function Track() {
  const tw = LANES * LANE_WIDTH + 4;
  return (
    <group>
      {/* Grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[RACE_LENGTH / 2, -0.02, 0]} receiveShadow>
        <planeGeometry args={[RACE_LENGTH + 60, 60]} />
        <meshStandardMaterial color="#2d5a1b" />
      </mesh>
      {/* Dirt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[RACE_LENGTH / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[RACE_LENGTH + 8, tw]} />
        <meshStandardMaterial color="#c8a96e" roughness={0.9} />
      </mesh>
      {/* Lane lines */}
      {Array.from({ length: LANES - 1 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}
          position={[RACE_LENGTH / 2, 0.01, (i + 1) * LANE_WIDTH - (LANES * LANE_WIDTH) / 2]}>
          <planeGeometry args={[RACE_LENGTH, 0.1]} />
          <meshStandardMaterial color="white" opacity={0.4} transparent />
        </mesh>
      ))}
      {/* Start line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3, 0.02, 0]}>
        <planeGeometry args={[0.4, tw]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* Finish checkered */}
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}
          position={[RACE_LENGTH - 2, 0.02, -tw / 2 + i * (tw / 14) + tw / 28]}>
          <planeGeometry args={[0.8, tw / 14]} />
          <meshStandardMaterial color={i % 2 === 0 ? "white" : "black"} />
        </mesh>
      ))}
      {/* Finish posts */}
      {[-tw / 2 - 1, tw / 2 + 1].map((z, i) => (
        <mesh key={i} position={[RACE_LENGTH - 2, 3, z]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 6, 8]} />
          <meshStandardMaterial color="white" />
        </mesh>
      ))}
      {/* Finish banner */}
      <mesh position={[RACE_LENGTH - 2, 6.2, 0]}>
        <boxGeometry args={[0.25, 0.5, tw + 2]} />
        <meshStandardMaterial color="#c03dff" emissive="#7936d9" emissiveIntensity={0.5} />
      </mesh>
      {/* Fence */}
      {[-tw / 2 - 1.5, tw / 2 + 1.5].map((z, si) => (
        <group key={si}>
          {Array.from({ length: 40 }, (_, i) => (
            <mesh key={i} position={[(i / 40) * RACE_LENGTH, 0.6, z]} castShadow>
              <boxGeometry args={[0.12, 1.2, 0.12]} />
              <meshStandardMaterial color="#8B4513" />
            </mesh>
          ))}
          <mesh position={[RACE_LENGTH / 2, 0.85, z]}>
            <boxGeometry args={[RACE_LENGTH, 0.08, 0.08]} />
            <meshStandardMaterial color="#A0522D" />
          </mesh>
          <mesh position={[RACE_LENGTH / 2, 0.45, z]}>
            <boxGeometry args={[RACE_LENGTH, 0.08, 0.08]} />
            <meshStandardMaterial color="#A0522D" />
          </mesh>
        </group>
      ))}
      {/* Grandstand */}
      <mesh position={[RACE_LENGTH / 2, 3, -tw / 2 - 8]}>
        <boxGeometry args={[RACE_LENGTH, 6, 4]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      {/* Crowd */}
      {Array.from({ length: 70 }, (_, i) => (
        <mesh key={i} position={[i * 4.3, 2.5 + (i % 3) * 0.7, -tw / 2 - 7 + (i % 2) * 1.2]}>
          <sphereGeometry args={[0.22, 6, 6]} />
          <meshStandardMaterial color={`hsl(${(i * 53) % 360},70%,60%)`} />
        </mesh>
      ))}
      {/* Natural trees — varied sizes, both sides */}
      {Array.from({ length: 60 }, (_, i) => {
        const x    = (i / 60) * (RACE_LENGTH + 20) - 10;
        const side = i % 2 === 0 ? -tw / 2 - 3 - (i % 5) * 1.2 : tw / 2 + 3 + (i % 4) * 1.0;
        const h    = 3 + (i % 5) * 1.5;
        const r    = 1.2 + (i % 3) * 0.6;
        const green = `hsl(${110 + (i % 6) * 8}, ${55 + (i % 4) * 8}%, ${22 + (i % 5) * 4}%)`;
        return (
          <group key={i} position={[x, 0, side]}>
            {/* Trunk */}
            <mesh position={[0, h * 0.25, 0]} castShadow>
              <cylinderGeometry args={[0.12, 0.2, h * 0.5, 6]} />
              <meshStandardMaterial color="#5c3317" roughness={1} />
            </mesh>
            {/* Foliage — 3 stacked cones for natural look */}
            <mesh position={[0, h * 0.6, 0]} castShadow>
              <coneGeometry args={[r, h * 0.55, 7]} />
              <meshStandardMaterial color={green} roughness={0.9} />
            </mesh>
            <mesh position={[0, h * 0.78, 0]} castShadow>
              <coneGeometry args={[r * 0.72, h * 0.42, 7]} />
              <meshStandardMaterial color={green} roughness={0.9} />
            </mesh>
            <mesh position={[0, h * 0.92, 0]} castShadow>
              <coneGeometry args={[r * 0.44, h * 0.28, 6]} />
              <meshStandardMaterial color={green} roughness={0.9} />
            </mesh>
          </group>
        );
      })}
      {/* Distant hills */}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[i * 28 - 20, 6, -38]}>
          <sphereGeometry args={[8 + (i % 3) * 4, 8, 6]} />
          <meshStandardMaterial color={`hsl(${120 + i * 5},40%,${18 + i % 4 * 3}%)`} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

// ── Camera follow ─────────────────────────────────────────────────
function CameraRig({ targetX, phase }) {
  const { camera } = useThree();
  const smoothX = useRef(0);
  const introT  = useRef(0);

  useFrame((_, dt) => {
    if (phase === "intro") {
      introT.current = Math.min(introT.current + dt * 0.4, 1);
      const t = introT.current;
      camera.position.set(
        THREE.MathUtils.lerp(-10, targetX - 8, t),
        THREE.MathUtils.lerp(10, 6, t),
        THREE.MathUtils.lerp(20, 16, t)
      );
      camera.lookAt(targetX + 4, 1.5, 0);
    } else {
      smoothX.current += (targetX - smoothX.current) * dt * 5;
      camera.position.set(smoothX.current - 8, 6, 16);
      camera.lookAt(smoothX.current + 4, 1.5, 0);
    }
  });
  return null;
}

// ── Dust ──────────────────────────────────────────────────────────
function Dust({ active }) {
  const ref = useRef();
  const t   = useRef(0);
  useFrame((_, dt) => {
    if (!ref.current) return;
    t.current += dt;
    ref.current.children.forEach((c, i) => {
      const life = ((t.current * 1.5 + i * 0.4) % 1);
      c.position.y = life * 0.5;
      c.position.x = -life * 0.8;
      c.material.opacity = active ? (1 - life) * 0.4 : 0;
      c.scale.setScalar(life * 0.2 + 0.05);
    });
  });
  return (
    <group ref={ref} position={[-0.5, 0.05, 0]}>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[0, 0, (i % 3 - 1) * 0.3]}>
          <sphereGeometry args={[0.1, 4, 4]} />
          <meshStandardMaterial color="#c8a96e" transparent opacity={0} />
        </mesh>
      ))}
    </group>
  );
}

// ── Race scene (horses + logic) ───────────────────────────────────
function RaceScene({ multiplier, phase, holdingBoost, holdStartTime, onRaceEnd }) {
  const stakingBonus = (multiplier - 100) * 0.0005;

  const hs = useRef([
    { x: 2, speed: BASE_SPEED + stakingBonus, stamina: 100, finished: false, placement: 0, isPlayer: true,  name: "You",     lane: 1 },
    { x: 2, speed: BASE_SPEED,                stamina: 100, finished: false, placement: 0, isPlayer: false, name: "Shadow",  lane: 0 },
    { x: 2, speed: BASE_SPEED,                stamina: 100, finished: false, placement: 0, isPlayer: false, name: "Thunder", lane: 2 },
    { x: 2, speed: BASE_SPEED,                stamina: 100, finished: false, placement: 0, isPlayer: false, name: "Blaze",   lane: 3 },
  ]);

  const placements    = useRef([]);
  const callbackFired = useRef(false);
  // Reset on each race start
  useEffect(() => {
    placements.current    = [];
    callbackFired.current = false;
    hs.current.forEach(h => {
      h.x = 2; h.speed = BASE_SPEED; h.stamina = 100;
      h.finished = false; h.placement = 0; h._ft = undefined;
    });
  }, []);
  const [pos, setPos] = useState(hs.current.map(h => h.x));
  const [galloping, setGalloping] = useState([false, false, false, false]);

  useFrame((_, dt) => {
    if (phase !== "racing" || callbackFired.current) return;
    const horses = hs.current;

    horses.forEach((h, i) => {
      if (h.finished) return;
      if (h.isPlayer) {
        // Boost only activates after MIN_HOLD_MS — short clicks do nothing
        const holdDuration = holdingBoost.current ? Date.now() - holdStartTime.current : 0;
        const boostActive  = holdingBoost.current && holdDuration >= MIN_HOLD_MS && h.stamina > 0;

        if (boostActive) {
          const staminaRatio = h.stamina / 100;
          const speedCeiling = BASE_SPEED + (MAX_SPEED - BASE_SPEED) * staminaRatio;
          h.speed   = Math.min(speedCeiling, h.speed + HOLD_BOOST * dt * 60);
          h.stamina = Math.max(0, h.stamina - STAMINA_DRAIN * dt);
        } else {
          h.speed   = Math.max(BASE_SPEED + stakingBonus, h.speed - RELEASE_DECAY * dt * 60);
          h.stamina = Math.min(100, h.stamina + STAMINA_REGEN * dt * 60);
        }
        // Hard ceiling based on stamina
        const staminaRatio = h.stamina / 100;
        const hardCeiling  = BASE_SPEED + (MAX_SPEED - BASE_SPEED) * staminaRatio;
        if (h.speed > hardCeiling) h.speed = hardCeiling;

        // Expose boost active state for HUD
        window.__boostActive = boostActive;
      } else {
        // AI speeds tuned for target distribution:
        // Shadow ~0.165 avg (fastest), Thunder ~0.155, Blaze ~0.150
        // Player BASE=0.12 loses to all AI passively
        // Player at MAX=0.22 beats all AI — but stamina limits this
        const t = Date.now() * 0.001;
        const surge = Math.sin(t * 0.9 + i * 2.1) * 0.025; // smaller variance
        const aiBase = i === 1 ? 0.165 : i === 2 ? 0.155 : 0.150;
        h.speed = aiBase + surge;
      }
      h.x += h.speed * dt * 60;

      if (h.x >= RACE_LENGTH && !h.finished) {
        h.finished  = true;
        h.placement = placements.current.length + 1;
        placements.current.push({ name: h.name, isPlayer: h.isPlayer, placement: h.placement });
      }
    });

    setPos(horses.map(h => h.x));
    setGalloping(horses.map(h => h.speed > BASE_SPEED + 0.02));

    // Expose to parent HUD
    window.__raceStamina = Math.round(horses[0].stamina);
    window.__raceSpeed   = Math.round(((horses[0].speed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED)) * 100);
    window.__raceCeiling = Math.round(horses[0].stamina); // ceiling % = stamina %
    window.__raceRank    = horses.filter(h => !h.isPlayer && h.x > horses[0].x).length + 1;

    // Race end
    if (horses.every(h => h.finished) && !callbackFired.current) {
      callbackFired.current = true;
      const sorted = [...placements.current].sort((a, b) => a.placement - b.placement);
      const placement = placements.current.find(p => p.isPlayer)?.placement || 4;
      setTimeout(() => onRaceEnd({ placement, results: sorted }), 2000);
    }
    // Safety: player finishes but AI stalls
    if (horses[0].finished && !callbackFired.current) {
      if (!horses[0]._ft) horses[0]._ft = Date.now();
      if (Date.now() - horses[0]._ft > 6000) {
        callbackFired.current = true;
        const sorted = [...placements.current].sort((a, b) => a.placement - b.placement);
        const placement = placements.current.find(p => p.isPlayer)?.placement || 4;
        setTimeout(() => onRaceEnd({ placement, results: sorted }), 1000);
      }
    }
  });

  return (
    <>
      <Track />
      <CameraRig targetX={pos[0]} phase={phase} />

      {hs.current.map((h, i) => (
        <group key={i} position={[pos[i], 0, laneZ(h.lane)]}>
          <Suspense fallback={null}>
            <HorseModel
              index={i}
              isGalloping={galloping[i]}
              raceStarted={phase === "racing"}
            />
          </Suspense>
          <Dust active={galloping[i] && h.speed > BASE_SPEED + 0.05} />
          <Text position={[0, 2.8, 0]} fontSize={0.4}
            color={i === 0 ? "#c03dff" : "#ffffff"}
            anchorX="center" outlineWidth={0.03} outlineColor="#000">
            {h.name}
          </Text>
        </group>
      ))}

      <ambientLight intensity={0.7} />
      <directionalLight position={[60, 40, 20]} intensity={1.4} castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={500}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />
      <hemisphereLight args={["#87ceeb", "#2d5a1b", 0.5]} />
    </>
  );
}

// ── HUD overlay ───────────────────────────────────────────────────
function HUD({ stamina, speed, rank, multiplier, holding }) {
  const staminaColor = stamina > 50 ? "#00cc44" : stamina > 25 ? "#ffaa00" : "#ff3300";
  const speedColor   = "#4488ff";
  const labels = ["1st 🥇", "2nd 🥈", "3rd 🥉", "4th"];
  // Speed ceiling = stamina% — shown as a marker on the speed bar
  const ceiling = stamina;
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
      padding: "8px 16px", background: "rgba(0,0,0,0.65)",
      display: "flex", alignItems: "center", gap: 16,
      fontFamily: "Arial Black, sans-serif", pointerEvents: "none",
    }}>
      {/* Stamina bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 140 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 9, color: "#aaffaa", letterSpacing: 1 }}>STAMINA</span>
          <span style={{ fontSize: 9, color: staminaColor }}>{stamina}%</span>
        </div>
        <div style={{ background: "#222", borderRadius: 3, height: 10, width: 140 }}>
          <div style={{
            background: staminaColor, height: "100%", borderRadius: 3,
            width: `${stamina}%`, transition: "width 0.08s",
            boxShadow: holding && stamina > 0 ? `0 0 8px ${staminaColor}` : "none",
          }} />
        </div>
      </div>
      {/* Speed bar with ceiling marker */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 140 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 9, color: "#aaccff", letterSpacing: 1 }}>SPEED</span>
          <span style={{ fontSize: 9, color: speedColor }}>{speed}%</span>
        </div>
        <div style={{ background: "#222", borderRadius: 3, height: 10, width: 140, position: "relative" }}>
          {/* Speed fill */}
          <div style={{
            background: speedColor, height: "100%", borderRadius: 3,
            width: `${speed}%`, transition: "width 0.08s",
            boxShadow: holding ? `0 0 8px ${speedColor}` : "none",
          }} />
          {/* Ceiling marker — shows max speed achievable with current stamina */}
          <div style={{
            position: "absolute", top: 0, bottom: 0,
            left: `${ceiling}%`, width: 2,
            background: staminaColor, opacity: 0.8,
            transform: "translateX(-1px)",
          }} />
        </div>
        <span style={{ fontSize: 8, color: "rgba(255,255,255,0.35)" }}>
          Max: {ceiling}% (stamina limited)
        </span>
      </div>
      {/* Position */}
      <div style={{ flex: 1, textAlign: "center", fontSize: 18, color: "white" }}>
        {labels[rank - 1] || "4th"}
      </div>
      {/* Multiplier */}
      <div style={{ fontSize: 13, color: "#c03dff" }}>
        x{(multiplier / 100).toFixed(1)} MRT
      </div>
      {/* Boost indicator */}
      <div style={{
        fontSize: 11, minWidth: 80, textAlign: "right",
        color: holding ? (stamina > 0 ? "#ffd700" : "#ff3300") : "rgba(255,255,255,0.35)",
      }}>
        {holding ? (stamina > 0 ? "⚡ BOOST" : "⚠ EMPTY") : "Hold SPACE"}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
export const RaceGame3D = ({ multiplier, stakedCount, onRaceEnd }) => {
  const [phase, setPhase]         = useState("idle");
  const [countdown, setCountdown] = useState(3);
  const [stamina, setStamina]     = useState(100);
  const [speed, setSpeed]         = useState(0);
  const [rank, setRank]           = useState(1);
  const [holding, setHolding]     = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [finalPlacement, setFinalPlacement] = useState(4);
  const [finalResults, setFinalResults]     = useState([]);
  const holdingBoost   = useRef(false);
  const holdStartTime  = useRef(0);   // when the current hold started
  const containerRef   = useRef();

  // Sync HUD values from scene
  useEffect(() => {
    const iv = setInterval(() => {
      if (window.__raceStamina !== undefined) setStamina(window.__raceStamina);
      if (window.__raceSpeed   !== undefined) setSpeed(window.__raceSpeed);
      if (window.__raceRank    !== undefined) setRank(window.__raceRank);
      // Show boost active only when hold duration threshold is met
      setHolding(!!window.__boostActive);
    }, 50);
    return () => clearInterval(iv);
  }, []);

  // Keyboard — hold to boost, minimum hold duration enforced
  useEffect(() => {
    const down = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (!holdingBoost.current) {
          holdingBoost.current = true;
          holdStartTime.current = Date.now();
        }
      }
    };
    const up = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") holdingBoost.current = false;
    };
    const release = () => { holdingBoost.current = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("mouseup", release);
    window.addEventListener("touchend", release);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("mouseup", release);
      window.removeEventListener("touchend", release);
    };
  }, []);

  // Fullscreen
  const enterFullscreen = useCallback(() => {
    // Small delay ensures the element is mounted and visible
    setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;
      try {
        if (el.requestFullscreen)            el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if (el.mozRequestFullScreen)    el.mozRequestFullScreen();
        else if (el.msRequestFullscreen)     el.msRequestFullscreen();
      } catch (e) {
        console.warn("Fullscreen failed:", e);
      }
    }, 100);
  }, []);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(
        !!(document.fullscreenElement ||
           document.webkitFullscreenElement ||
           document.mozFullScreenElement)
      );
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    document.addEventListener("mozfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
      document.removeEventListener("mozfullscreenchange", onChange);
    };
  }, []);

  const startRace = useCallback(() => {
    setPhase("intro");
    enterFullscreen();
    setTimeout(() => {
      setPhase("countdown");
      let cd = 3;
      setCountdown(3);
      const iv = setInterval(() => {
        cd--;
        setCountdown(cd);
        if (cd <= 0) { clearInterval(iv); setPhase("racing"); }
      }, 900);
    }, 2500);
  }, [enterFullscreen]);

  const handleRaceEnd = useCallback(({ placement, results }) => {
    setFinalPlacement(placement);
    setFinalResults(results || []);
    setPhase("finished");
    const base = [50, 30, 15, 5];
    const mrt  = Math.round((base[placement - 1] || 5) * multiplier / 100);
    setTimeout(() => onRaceEnd({ score: mrt, placement, multiplier }), 4000);
  }, [multiplier, onRaceEnd]);

  const base = [50, 30, 15, 5];
  const finishLabels = ["VICTORY!", "2nd Place", "3rd Place", "4th Place"];
  const finishColors = ["#ffd700", "#c0c0c0", "#cd7f32", "#ffffff"];

  return (
    <div className="GameArena">
      {/* Idle screen */}
      {phase === "idle" && (
        <div className="raceIdleScreen">
          <div className="raceIdleTitle">STUTENGARDEN 3D</div>
          <div className="raceIdleSub">
            Hold <strong>SPACE</strong> or <strong>Arrow Up</strong> to boost your horse.
            <br />Release to recover stamina. Race goes fullscreen automatically.
          </div>
          <div className="raceRewardPreview">
            {base.map((b, i) => (
              <div className="rewardItem" key={i}>
                {["1st","2nd","3rd","4th"][i]} &rarr; {Math.round(b * multiplier / 100)} MRT
              </div>
            ))}
          </div>
          {multiplier > 100 && (
            <div className="multiplierBadge">
              Staking Bonus: x{(multiplier / 100).toFixed(1)}
            </div>
          )}
          <button className="startBtn" onClick={startRace}>START RACE</button>
          <div className="HowToPlay" style={{ marginTop: 0 }}>
            <span>Hold SPACE / Up</span> = boost &nbsp;|&nbsp; Release = recover stamina
          </div>
        </div>
      )}

      {/* 3D canvas */}
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
        >
          {/* HUD */}
          {phase === "racing" && (
            <HUD stamina={stamina} speed={speed} rank={rank} multiplier={multiplier} holding={holding} />
          )}

          {/* Intro title */}
          {phase === "intro" && (
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.5)", zIndex: 30,
              pointerEvents: "none", flexDirection: "column", gap: 8,
            }}>
              <div style={{ fontSize: 38, fontFamily: "Arial Black", color: "white",
                textShadow: "0 2px 30px rgba(0,0,0,0.9)", letterSpacing: 6 }}>
                STUTENGARDEN
              </div>
              <div style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", letterSpacing: 4 }}>
                HORSE RACING
              </div>
            </div>
          )}

          {/* Countdown */}
          {phase === "countdown" && (
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.4)", zIndex: 30,
            }}>
              <div style={{
                fontSize: 130, fontFamily: "Arial Black",
                color: countdown > 1 ? "#c03dff" : "#00ff88",
                textShadow: "0 0 60px currentColor",
              }}>
                {countdown > 0 ? countdown : "GO!"}
              </div>
            </div>
          )}

          {/* Finish */}
          {phase === "finished" && (
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.78)", zIndex: 30,
              flexDirection: "column", gap: 14,
            }}>
              {/* Confetti strips */}
              {finalPlacement === 1 && Array.from({ length: 30 }, (_, i) => (
                <div key={i} style={{
                  position: "absolute",
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: 8, height: 18,
                  background: `hsl(${i * 37 % 360},90%,60%)`,
                  borderRadius: 2,
                  transform: `rotate(${Math.random() * 360}deg)`,
                  opacity: 0.85,
                  animation: `fall ${1 + Math.random() * 2}s linear infinite`,
                  animationDelay: `${Math.random() * 2}s`,
                }} />
              ))}

              {/* Medal */}
              <div style={{ fontSize: 90, lineHeight: 1 }}>
                {["🥇","🥈","🥉","🏅"][finalPlacement - 1] || "🏅"}
              </div>

              {/* Title */}
              <div style={{
                fontSize: 54, fontFamily: "Arial Black",
                color: finishColors[finalPlacement - 1] || "#fff",
                textShadow: "0 0 40px currentColor", letterSpacing: 4,
              }}>
                {finishLabels[finalPlacement - 1] || "Finished!"}
              </div>

              {/* MRT earned */}
              <div style={{
                fontSize: 24, color: "#ffd700", fontFamily: "Arial Black",
                textShadow: "0 0 20px #ffd700",
              }}>
                +{Math.round((base[finalPlacement - 1] || 5) * multiplier / 100)} MRT earned
              </div>

              {/* Race results table */}
              <div style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 14, padding: "14px 32px",
                display: "flex", flexDirection: "column", gap: 8, minWidth: 260,
              }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)",
                  letterSpacing: 2, textAlign: "center", marginBottom: 4 }}>
                  RACE RESULTS
                </div>
                {(finalResults.length > 0 ? finalResults : [
                  { placement: 1, name: "—" }, { placement: 2, name: "—" },
                  { placement: 3, name: "—" }, { placement: 4, name: "—" },
                ]).map((r, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "4px 8px", borderRadius: 8,
                    background: r.isPlayer ? "rgba(147,51,234,0.25)" : "transparent",
                    border: r.isPlayer ? "1px solid rgba(147,51,234,0.5)" : "1px solid transparent",
                  }}>
                    <span style={{ fontSize: 22, minWidth: 32 }}>
                      {["🥇","🥈","🥉","4️⃣"][i]}
                    </span>
                    <span style={{
                      fontSize: 15, fontFamily: "Arial Black",
                      color: r.isPlayer ? "#c03dff" : "rgba(255,255,255,0.8)",
                    }}>
                      {r.name}{r.isPlayer ? " (You)" : ""}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>
                Saving results...
              </div>
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
                background: holding ? "rgba(192,61,255,0.95)" : "rgba(121,54,217,0.85)",
                border: `3px solid ${holding ? "#ffd700" : "#c03dff"}`,
                color: "white", fontSize: 13, fontFamily: "Arial Black",
                cursor: "pointer", zIndex: 25,
                boxShadow: holding ? "0 0 30px rgba(255,215,0,0.5)" : "0 0 15px rgba(192,61,255,0.4)",
                userSelect: "none", touchAction: "none",
              }}
            >
              BOOST
            </button>
          )}

          {/* Three.js canvas */}
          {phase === "racing" && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 15,
              cursor: "crosshair", userSelect: "none", touchAction: "none",
            }}
              onMouseDown={() => { holdingBoost.current = true; holdStartTime.current = Date.now(); }}
              onMouseUp={()   => { holdingBoost.current = false; }}
              onMouseLeave={() => { holdingBoost.current = false; }}
              onTouchStart={(e) => { e.preventDefault(); holdingBoost.current = true; holdStartTime.current = Date.now(); }}
              onTouchEnd={(e)   => { e.preventDefault(); holdingBoost.current = false; }}
            />
          )}

          <Canvas shadows camera={{ position: [-6, 6, 16], fov: 55 }}
            style={{ width: "100%", height: "100%" }}>
            <fog attach="fog" args={["#87ceeb", 100, 350]} />
            <Sky sunPosition={[100, 20, 100]} />
            <RaceScene
              multiplier={multiplier}
              phase={phase}
              holdingBoost={holdingBoost}
              holdStartTime={holdStartTime}
              onRaceEnd={handleRaceEnd}
            />
          </Canvas>
        </div>
      )}
      <style>{`
        @keyframes fall {
          0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
