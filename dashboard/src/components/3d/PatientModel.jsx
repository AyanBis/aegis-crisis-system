import { useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import { Box3, Color, Vector3 } from "three";
import { useApp } from "../../context/AppContext";

const RISK_COLORS = {
  HIGH: "#ff5a5a",
  MEDIUM: "#ffb020",
  LOW: "#4cd964",
};

const ORGAN_ANCHORS = {
  Head:    { position: [0, 0.94, 0.2],   side: "right" },
  Heart:   { position: [-0.07, 0.29, 0.25], side: "right" },
  Lungs:   { position: [0.05, 0.34, 0.25],  side: "right" },
  Stomach: { position: [0, 0.08, 0.24],   side: "left" },
  Spine:   { position: [0, 0.14, -0.22],  side: "left" },
  Arm:     { position: [0.36, 0.24, 0.2], side: "right" },
  Leg:     { position: [0.13, -0.58, 0.18], side: "left" },
  Skin:    { position: [-0.3, 0.07, 0.22], side: "left" },
};

const LINE_COLOR = "#ffffff";
const LINE_LENGTH = 56; // px, the horizontal line segment
const DOT_RADIUS = 3;   // small static dot at anchor

const BodyModel = ({ risk, affectedOrgans = [], showLabels = false }) => {
  const { scene } = useGLTF("/human.glb");
  const model = useMemo(() => scene.clone(true), [scene]);
  const riskColor = RISK_COLORS[risk] || "#4da3ff";

  const markers = useMemo(() => {
    const unique = new Set(affectedOrgans);
    return [...unique]
      .map((name) => {
        const anchor = ORGAN_ANCHORS[name];
        if (!anchor) return null;
        return { name, position: anchor.position, side: anchor.side };
      })
      .filter(Boolean);
  }, [affectedOrgans]);

  useEffect(() => {
    const tint = new Color(riskColor);
    model.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      child.material = child.material.clone();
      child.material.color.lerp(tint, 0.88);
      child.material.metalness = 0.18;
      child.material.roughness = 0.62;
    });
  }, [model, riskColor]);

  const modelTransform = useMemo(() => {
    const box = new Box3().setFromObject(model);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());

    const safeY = Math.max(size.y, 0.001);
    const safeX = Math.max(size.x, 0.001);

    const targetHeight = 1.95;
    const targetWidth = 1.15;
    const scale = Math.min(targetHeight / safeY, targetWidth / safeX);

    const floorY = box.min.y * scale;
    const centeredX = -center.x * scale;
    const centeredZ = -center.z * scale;

    return { scale, position: [centeredX, -0.92 - floorY, centeredZ] };
  }, [model]);

  return (
    <group>
      <primitive
        object={model}
        scale={modelTransform.scale}
        position={modelTransform.position}
      />

      {showLabels &&
        markers.map((marker) => {
          const isRight = marker.side === "right";

          return (
            <group key={marker.name} position={marker.position}>
              {/* Small static dot at anchor point */}
              <mesh>
                <sphereGeometry args={[0.010, 12, 12]} />
                <meshStandardMaterial
                  color={LINE_COLOR}
                  emissive={LINE_COLOR}
                  emissiveIntensity={0.5}
                />
              </mesh>

              <Html
                center
                distanceFactor={12}
                position={isRight ? [0.28, 0.04, 0] : [-0.28, 0.04, 0]}
                style={{ pointerEvents: "none" }}
              >
                {/*
                  Layout (right side):  [dot] ——————  Label
                  Layout (left side):   Label  —————— [dot]
                  The SVG draws:
                    - a short diagonal from origin toward the horizontal line
                    - then a horizontal segment
                  We keep it simple: just a straight horizontal line.
                */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0,
                    flexDirection: isRight ? "row" : "row-reverse",
                    whiteSpace: "nowrap",
                    userSelect: "none",
                  }}
                >
                  {/* Horizontal line */}
                  <svg
                    width={LINE_LENGTH}
                    height="18"
                    viewBox={`0 0 ${LINE_LENGTH} 18`}
                    style={{ display: "block", flexShrink: 0 }}
                    aria-hidden="true"
                  >
                    {/* Tiny tick at body-side end */}
                    <circle
                      cx={isRight ? 0 : LINE_LENGTH}
                      cy="9"
                      r={DOT_RADIUS}
                      fill={LINE_COLOR}
                    />
                    {/* Horizontal rule */}
                    <line
                      x1={isRight ? DOT_RADIUS : 0}
                      y1="9"
                      x2={isRight ? LINE_LENGTH : LINE_LENGTH - DOT_RADIUS}
                      y2="9"
                      stroke={LINE_COLOR}
                      strokeWidth="1"
                    />
                  </svg>

                  {/* Label text */}
                  <span
                    style={{
                      color: LINE_COLOR,
                      fontSize: "11px",
                      fontWeight: 400,
                      letterSpacing: "0.04em",
                      lineHeight: 1,
                      paddingLeft: isRight ? "5px" : 0,
                      paddingRight: isRight ? 0 : "5px",
                      textShadow: "0 1px 3px rgba(0,0,0,0.85)",
                    }}
                  >
                    {marker.name}
                  </span>
                </div>
              </Html>
            </group>
          );
        })}
    </group>
  );
};

const PatientModel = ({
  risk,
  affectedOrgans,
  showLabels = false,
  height = 380,
}) => {
  const { theme } = useApp();
  const canvasHeight = typeof height === "number" ? `${height}px` : height;
  const canvasBackground = theme === "dark" ? "#050b14" : "#eef5ff";
  const pointLightColor = theme === "dark" ? "#9cc4ff" : "#8ab8ff";
  const ambientIntensity = theme === "dark" ? 0.78 : 1.05;
  const directionalIntensity = theme === "dark" ? 1.05 : 1.2;

  return (
    <Canvas
      camera={{ position: [0, 0.05, 4.2], fov: 30 }}
      style={{ height: canvasHeight, width: "100%" }}
    >
      <color attach="background" args={[canvasBackground]} />
      <ambientLight intensity={ambientIntensity} />
      <directionalLight position={[2.2, 3, 2.2]} intensity={directionalIntensity} />
      <pointLight position={[-2, 1.8, 1.8]} intensity={0.75} color={pointLightColor} />

      <BodyModel
        risk={risk}
        affectedOrgans={affectedOrgans}
        showLabels={showLabels}
      />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 2.3}
        maxPolarAngle={Math.PI / 1.86}
        minAzimuthAngle={-0.35}
        maxAzimuthAngle={0.35}
      />
    </Canvas>
  );
};

useGLTF.preload("/human.glb");

export default PatientModel;
