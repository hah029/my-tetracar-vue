import type { LevelConfig } from "@/levels/types";

const mistyHills = {
  id: "misty_hills",
  name: "Misty Hills",

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
      bloomStrength: 0.7,
      bloomRadius: 0.05,
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
      laneColor: "#ff0000",
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
      layers: [],
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
