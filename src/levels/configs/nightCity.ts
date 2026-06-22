import type { LevelConfig } from "@/levels/types";

const nightCity = {
  id: "night_city",
  name: "Night City",

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
      backgroundColor: "#222222",
      fogColor: "#222222",
      fogNear: 0.01,
      fogFar: 200,
      toneMappingExposure: 0.9,
    },

    lighting: {
      ambientLightColor: "#404060",
      ambientLightIntensity: 0.3,
      directionalLightColor: "#aaccff",
      directionalLightIntensity: 2.0,
      fillLightColor: "#ccddff",
      fillLightIntensity: 2.0,
      backAccentLightColor: "#ffaa66",
      backAccentLightIntensity: 5.0,
    },
  },

  environment: {
    road: {
      color: "#eeeeee",
      emissiveColor: "#eeeeee",
      emissiveIntensity: 0.1,
      opacity: 0.25,
      laneColor: "#FFFFFF",
      length: 800,
      edges: {
        color: "#00ffff",
        height: 10,
        opacity: 0,
      },
    },

    scenery: {
      scenerySets: ["city"],
      sceneryDensity: 1.0,
      decorations: ["building", "lamp", "billboard"],
    },
  },

  interactive: {
    coinSets: ["default"],
    boosterSets: ["default"],
    obstacleSets: ["default"],
    jumpSets: ["default"],
    density: 1.0,
    obstacleDensity: 1.0,
  },

  player: {
    carSet: "default",
    effectSet: "default",
  },

  music: {
    menuTrack: "music_intro",
    gameTrack: "music_background",
  },

  rewards: {
    coins: 100,
  },
} satisfies LevelConfig;

export default nightCity;
