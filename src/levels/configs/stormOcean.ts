import type { LevelConfig } from "@/levels/types";

const stormOcean = {
  id: "storm_ocean",
  name: "Storm Ocean",

  visual: {
    camera: {
      distance: 25,
      height: 20,
      fov: 65,
      fovMax: 105,
      tilt: 0.35,
      lookahead: 20,
      followSpeed: 0.65,
      distanceReductionFactor: 0.85,
    },

    render: {
      backgroundColor: "#03060D",
      fogColor: "#1A2330",
      fogNear: 15,
      fogFar: 60,
      toneMappingExposure: 0.85,
    },

    lighting: {
      ambientLightColor: "#404060",
      ambientLightIntensity: 0.2,
      directionalLightColor: "#AACCFF",
      directionalLightIntensity: 0.5,
      fillLightColor: "#7EA6D8",
      fillLightIntensity: 1.6,
      backAccentLightColor: "#66AAFF",
      backAccentLightIntensity: 4.0,
    },
  },

  environment: {
    road: {
      color: "#30353B",
      emissiveColor: "#C9D3E3",
      emissiveIntensity: 0.12,
      opacity: 0.28,
      laneColor: "#C9D3E3",
      length: 800,
      edges: {
        color: "#66AAFF",
        height: 10,
        opacity: 0,
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
  },

  music: {
    gameTrack: "music_background",
  },

  rewards: {
    coins: 150,
  },
} satisfies LevelConfig;

export default stormOcean;
