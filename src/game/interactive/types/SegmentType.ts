export type SegmentType =
  // | "safe"
  // | "coins"
  // | "jump"
  // | "obstacle"
  // | "challenge"
  // | "boost";
  "quick" | "scenario";

// Если нужен объект со значениями:
export const SegmentTypes = {
  // Safe: "safe",
  // Coins: "coins",
  // Jump: "jump",
  // Obstacle: "obstacle",
  // Challenge: "challenge",
  // Boost: "boost",
  Quick: "quick",
  Scenario: "scenario",
} as const;
