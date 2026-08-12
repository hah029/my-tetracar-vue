import type { LevelConfig } from "@/levels/types";

const nightCity = {
  id: "night_city",
  name: "Night City",
  description:
    "Baseline neon route with dense city scenery and balanced visibility.",

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
      bloomStrength: 0.3,
      bloomRadius: 0.5,
      bloomThreshold: 1.2,
    },

    lighting: {
      ambientLightColor: "#404060",
      ambientLightIntensity: 0.3,
      directionalLightColor: "#aaccff",
      directionalLightPosition: [-10, 20, 5],
      directionalLightIntensity: 2.0,
      fillLightColor: "#ccddff",
      fillLightPosition: [-5, 10, 5],
      fillLightIntensity: 2.0,
      backAccentLightColor: "#ffaa66",
      backAccentLightPosition: [0, 3, 15],
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
    //   length: 800,
      length: 200,
      segmentSurfaces: true,
      edges: {
        color: "#00ffff",
        height: 10,
        opacity: 0,
      },
      sideObjects: {
        enabled: true,
        color: "#FFFFFF",
        emissiveColor: "#222244",
        emissiveIntensity: 0,
        opacity: 1,
        spacing: 4,
        offset: 0.6,
        y: 0.4,
        scale: [1.75, 1.4, 1.75],
      },
    },

    scenery: {
      scenerySets: ["city"],
      sceneryDensity: 1.0,
      decorations: ["building", "lamp", "billboard"],
      layers: [
        {
          type: "city",
          xMin: -300,
          xMax: 300,
          zStart: -200,
          zEnd: 30,
          spacing: 2,
          speedFactor: 0.1,
          minHeight: 0.7,
          maxHeight: 1.5,
          minWidth: 0.7,
          maxWidth: 1.5,
          y: -100,
          color: "#333355",
        },
      ],
    },
  },

  interactive: {
    coinSets: ["default"],
    boosterSets: ["default"],
    obstacleSets: ["default"],
    jumpSets: ["default"],
    segmentSets: [
      "base",
      "traffic",
      "rewards",
      "jumpers",
      "hazards",
      "vertical",
      "turns",
    ],
    density: 1.0,
    obstacleDensity: 1.0,
  },

  player: {
    carSet: "default",
    effectSet: "default",
    visual: {
      defaultEmissionIntensity: 5,
      defaultBlinkDuration: 1,
      defaultBlinkSpeed: 10,
      emissiveColors: {
        default: "#000000",
        nitro: "#005500",
        shield: "#555555",
        damage: "#550000",
      },
      nitroTrail: {
        color: "#66ff66",
        width: 2.2,
        height: 0.8,
        offsetX: 0.85,
        offsetY: 0.25,
        offsetZ: 2,
        timeScale: 4,
      },
    },
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
