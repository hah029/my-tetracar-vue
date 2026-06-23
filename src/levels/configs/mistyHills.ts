import type { LevelConfig } from "@/levels/types";

const mistyHills = {
  id: "misty_hills",
  name: "Misty Hills",
  description:
    "Soft daylight route with layered hills, lighter bloom and calmer scenery.",

  visual: {
    camera: {
      distance: 25,
      height: 20,
      fov: 60,
      fovMax: 100,
      tilt: 0.3,
      lookahead: 20,
      followSpeed: 0.7,
      distanceReductionFactor: 0.8,
    },

    render: {
      backgroundColor: "#DCE7F5",
      fogColor: "#DCE7F5",
      fogNear: 0.01,
      fogFar: 200,
      toneMappingExposure: 0.9,
      bloomStrength: 0.3,
      bloomRadius: 0.5,
      bloomThreshold: 1.25,
    },

    lighting: {
      ambientLightColor: "#DCE7F5",
      ambientLightIntensity: 1.0,
      directionalLightColor: "#FFEEDD",
      directionalLightPosition: [-8, 24, -4],
      directionalLightIntensity: 1.4,
      fillLightColor: "#CCDDFF",
      fillLightPosition: [6, 12, 8],
      fillLightIntensity: 2.0,
      backAccentLightColor: "#FFAA66",
      backAccentLightPosition: [0, 4, 12],
      backAccentLightIntensity: 3.0,
    },
  },

  environment: {
    road: {
      color: "#454545",
      emissiveColor: "#E6EDF5",
      emissiveIntensity: 0.06,
      opacity: 0.3,
      laneColor: "#BFD2C4",
      length: 800,
      edges: {
        color: "#7EA6D8",
        height: 10,
        opacity: 0,
      },
      sideObjects: {
        enabled: true,
        color: "#ffffff",
        emissiveColor: "#ababab",
        emissiveIntensity: 1.0,
        opacity: 1,
        spacing: 4,
        offset: 0.6,
        y: 0.4,
        scale: [1.75, 1.4, 1.75],
      },
    },

    scenery: {
      scenerySets: ["hills"],
      sceneryDensity: 1.2,
      decorations: ["tree", "rock", "fence", "windmill"],
      layers: [
        {
          type: "hills",
          xMin: -180,
          xMax: -70,
          zStart: -220,
          zEnd: 35,
          spacing: 18,
          speedFactor: 0.08,
          minHeight: 16,
          maxHeight: 34,
          minWidth: 36,
          maxWidth: 82,
          y: -18,
          color: "#8BAA8C",
          emissiveColor: "#BFD2C4",
          emissiveIntensity: 0.08,
          opacity: 0.86,
        },
        {
          type: "hills",
          xMin: 70,
          xMax: 180,
          zStart: -220,
          zEnd: 35,
          spacing: 18,
          speedFactor: 0.08,
          minHeight: 16,
          maxHeight: 34,
          minWidth: 36,
          maxWidth: 82,
          y: -18,
          color: "#7D9B86",
          emissiveColor: "#BFD2C4",
          emissiveIntensity: 0.08,
          opacity: 0.86,
        },
        {
          type: "hills",
          xMin: -320,
          xMax: 320,
          zStart: -260,
          zEnd: 20,
          spacing: 34,
          speedFactor: 0.035,
          minHeight: 30,
          maxHeight: 58,
          minWidth: 78,
          maxWidth: 150,
          y: -44,
          color: "#6D8791",
          emissiveColor: "#DCE7F5",
          emissiveIntensity: 0.04,
          opacity: 0.45,
        },
      ],
    },
  },

  interactive: {
    coinSets: ["default"],
    boosterSets: ["default"],
    obstacleSets: ["nature"],
    jumpSets: ["default"],
    density: 1.0,
    obstacleDensity: 1.0,
  },

  player: {
    carSet: "default",
    effectSet: "default",
    visual: {
      defaultEmissionIntensity: 4,
      defaultBlinkDuration: 1,
      defaultBlinkSpeed: 8,
      emissiveColors: {
        default: "#000000",
        nitro: "#335500",
        shield: "#557799",
        damage: "#884422",
      },
      nitroTrail: {
        color: "#b8ff66",
        width: 2.2,
        height: 0.8,
        offsetX: 0.85,
        offsetY: 0.25,
        offsetZ: 2,
        timeScale: 3.5,
      },
    },
  },

  music: {
    gameTrack: "music_background",
  },

  rewards: {
    coins: 100,
  },
} satisfies LevelConfig;

export default mistyHills;
