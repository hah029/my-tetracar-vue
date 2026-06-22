import type { LevelConfig } from "@/levels/types";

const stormOcean = {
  id: "storm_ocean",
  name: "Storm Ocean",

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
      backgroundColor: "#1A2330",
      fogColor: "#1A2330",
      fogNear: 0.01,
      fogFar: 200,
      toneMappingExposure: 0.9,
      bloomStrength: 1.15,
      bloomRadius: 0.08,
      bloomThreshold: 1.1,
    },

    lighting: {
      ambientLightColor: "#404060",
      ambientLightIntensity: 0.2,
      directionalLightColor: "#AACCFF",
      directionalLightPosition: [12, 18, -8],
      directionalLightIntensity: 0.5,
      fillLightColor: "#7EA6D8",
      fillLightPosition: [-8, 8, 10],
      fillLightIntensity: 1.6,
      backAccentLightColor: "#66AAFF",
      backAccentLightPosition: [0, 2, 18],
      backAccentLightIntensity: 4.0,
    },
  },

  environment: {
    road: {
      color: "#30353B",
      emissiveColor: "#C9D3E3",
      emissiveIntensity: 0.12,
      opacity: 0.28,
      laneColor: "#0062ff",
      length: 800,
      edges: {
        color: "#66AAFF",
        height: 10,
        opacity: 0,
      },
      sideObjects: {
        enabled: true,
        color: "#C9D3E3",
        emissiveColor: "#66AAFF",
        emissiveIntensity: 0.25,
        opacity: 1,
        spacing: 4,
        offset: 0.6,
        y: 0.4,
        scale: [1.75, 1.4, 1.75],
      },
    },

    scenery: {
      scenerySets: ["ocean"],
      sceneryDensity: 0.8,
      decorations: [
        "wave",
        "buoy",
        "container",
        "ship",
        "oil_platform",
        "light_tower",
      ],
      layers: [],
    },
  },

  interactive: {
    coinSets: ["default"],
    boosterSets: ["default"],
    obstacleSets: ["storm"],
    jumpSets: ["default"],
    density: 1.0,
    obstacleDensity: 1.1,
  },

  player: {
    carSet: "default",
    effectSet: "default",
    visual: {
      defaultEmissionIntensity: 5,
      defaultBlinkDuration: 1,
      defaultBlinkSpeed: 12,
      emissiveColors: {
        default: "#000000",
        nitro: "#004466",
        shield: "#335577",
        damage: "#552244",
      },
      nitroTrail: {
        color: "#66aaff",
        width: 2.4,
        height: 0.9,
        offsetX: 0.85,
        offsetY: 0.25,
        offsetZ: 2,
        timeScale: 4.6,
      },
    },
  },

  music: {
    gameTrack: "music_background",
  },

  rewards: {
    coins: 150,
  },
} satisfies LevelConfig;

export default stormOcean;
