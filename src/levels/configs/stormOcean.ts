import type { LevelConfig } from "@/levels/types";

const stormOcean = {
  id: "storm_ocean",
  name: "Storm Ocean",
  description:
    "Dark coastal route with blue storm lighting and heavier obstacle pressure.",

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
      backgroundColor: "#122948",
      fogColor: "#122948",
      fogNear: 0.01,
      fogFar: 150,
      toneMappingExposure: 0.78,
      bloomStrength: 1.35,
      bloomRadius: 0.12,
      bloomThreshold: 0.95,
    },

    lighting: {
      ambientLightColor: "#1a304e",
      ambientLightIntensity: 0.12,
      directionalLightColor: "#AACCFF",
      directionalLightPosition: [12, 18, -8],
      directionalLightIntensity: 0.22,
      fillLightColor: "#7EA6D8",
      fillLightPosition: [-8, 8, 10],
      fillLightIntensity: 0.55,
      backAccentLightColor: "#66AAFF",
      backAccentLightPosition: [0, 2, 18],
      backAccentLightIntensity: 2.2,
    },
  },

  environment: {
    road: {
      color: "#30353B",
      emissiveColor: "#C9D3E3",
      emissiveIntensity: 0.12,
      opacity: 0.28,
      laneColor: "#66AAFF",
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
      decorations: ["buoy", "container", "ship", "oil_platform", "light_tower"],
      layers: [
        {
          type: "water_surface",
          xMin: -360,
          xMax: 360,
          zStart: -360,
          zEnd: 80,
          spacing: 1,
          speedFactor: 0.07,
          minHeight: 1,
          maxHeight: 1,
          minWidth: 1,
          maxWidth: 1,
          y: -3.6,
          color: "#102640",
          secondaryColor: "#1D4562",
          emissiveColor: "#2A5E7E",
          emissiveIntensity: 0.16,
          opacity: 0.86,
          waveAmplitude: 3.1,
          waveFrequency: 0.045,
          waveSpeed: 1.35,
        },
      ],
    },

    weather: {
      rain: {
        enabled: true,
        count: 1450,
        color: "#A9D8FF",
        opacity: 0.68,
        areaWidth: 86,
        areaDepth: 135,
        height: 78,
        dropLength: 7.4,
        fallSpeed: 92,
        windX: -16,
        windZ: 5,
      },
      lightning: {
        enabled: true,
        color: "#D8ECFF",
        minInterval: 2.2,
        maxInterval: 5.8,
        duration: 0.36,
        intensity: 10.5,
        position: [-40, 125, -180],
      },
      headlights: {
        enabled: true,
        color: "#CFEAFF",
        intensity: 74,
        distance: 74,
        angle: 0.38,
        penumbra: 0.82,
        decay: 1.35,
        targetDistance: 58,
        positionOffsets: [
          [-1.15, 1.15, -1.6],
          [1.15, 1.15, -1.6],
        ],
        beamLength: 58,
        beamRadius: 10.5,
        beamOpacity: 0.105,
      },
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
