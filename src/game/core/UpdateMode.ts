// src/game/core/UpdateMode.ts
export const UpdateMode = {
  Gameplay: "Gameplay",
  Destruction: "Destruction",
} as const;

export type UpdateMode = (typeof UpdateMode)[keyof typeof UpdateMode];
