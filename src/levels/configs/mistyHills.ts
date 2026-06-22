import type { LevelConfig } from "@/levels/types";

const mistyHills = {
  id: "misty_hills",
  name: "Misty Hills",

  visual: {
    camera: {
      distance: 25,
      height: 20,
      fov: 62,
      fovMax: 96,
      tilt: 0.25,
      lookahead: 20,
      followSpeed: 0.7,
      distanceReductionFactor: 0.75,
    },

    render: {
      backgroundColor: "#BFD9FF",
      fogColor: "#DCE7F5",
      fogNear: 20,
      fogFar: 80,
      toneMappingExposure: 0.9,
    },

    lighting: {
      ambientLightColor: "#DCE7F5",
      ambientLightIntensity: 1.0,
      directionalLightColor: "#FFEEDD",
      directionalLightIntensity: 1.4,
      fillLightColor: "#CCDDFF",
      fillLightIntensity: 2.0,
      backAccentLightColor: "#FFAA66",
      backAccentLightIntensity: 3.0,
    },
  },

  environment: {
    road: {
      color: "#454545",
      emissiveColor: "#E6EDF5",
      emissiveIntensity: 0.06,
      opacity: 0.3,
      laneColor: "#FFFFFF",
      length: 800,
      edges: {
        color: "#7EA6D8",
        height: 10,
        opacity: 0,
      },
    },

    scenery: {
      scenerySets: ["hills"],
      sceneryDensity: 1.2,
      decorations: ["tree", "rock", "fence", "windmill"],
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
  },

  music: {
    gameTrack: "music_background",
  },

  rewards: {
    coins: 100,
  },
} satisfies LevelConfig;

export default mistyHills;
