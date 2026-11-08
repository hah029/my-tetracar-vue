export const AUDIO_CUES = {
  uiSelect: { sound: "sfx_ui_select", volume: 0.45 },
  actionRejected: { sound: "sfx_ui_select", volume: 0.3 },
  countdownThree: { sound: "sfx_countdown_3", volume: 0.7 },
  countdownTwo: { sound: "sfx_countdown_2", volume: 0.78 },
  countdownOne: { sound: "sfx_countdown_1", volume: 0.88 },
  countdownGo: { sound: "sfx_start", volume: 1 },
  laneChange: { sound: "sfx_moving", volume: 0.32 },
  jumpStart: { sound: "sfx_jump", volume: 0.65 },
  forcedLanding: { sound: "sfx_destroy_bot", volume: 0.45 },
  shot: { sound: "sfx_shot", volume: 0.72 },
  bulletHit: { sound: "sfx_destroy_bot", volume: 0.78 },
  outOfAmmo: { sound: "sfx_ui_select", volume: 0.38 },
  obstacleDestroy: { sound: "sfx_destroy_bot", volume: 0.85 },
  goldenPickup: { sound: "sfx_add_golden", volume: 0.52 },
  energonPickup: { sound: "sfx_add_energon", volume: 0.52 },
  ammoPickup: { sound: "sfx_add_patron", volume: 0.58 },
  nitroPickup: { sound: "sfx_add_nitro", volume: 0.7 },
  nitroActive: { sound: "sfx_moving", volume: 0.22 },
  nitroEnd: { sound: "sfx_moving", volume: 0.38 },
  shieldPickup: { sound: "sfx_add_armor", volume: 0.72 },
  shieldHit: { sound: "sfx_shot", volume: 0.42 },
  shieldBreak: { sound: "sfx_ui_select", volume: 0.5 },
  magnetPickup: { sound: "sfx_add_energon", volume: 0.62 },
  magnetActive: { sound: "sfx_add_energon", volume: 0.12 },
  magnetPull: { sound: "sfx_add_energon", volume: 0.22 },
  magnetEnd: { sound: "sfx_moving", volume: 0.34 },
  edgeBump: { sound: "sfx_shot", volume: 0.38 },
  offRoadFall: { sound: "sfx_moving", volume: 0.28 },
  newRecord: { sound: "sfx_new_record", volume: 0.9 },
} as const;

export type AudioCue = keyof typeof AUDIO_CUES;

export default {
  default_volume: 0.3,
  cues: AUDIO_CUES,
};
