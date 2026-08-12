import type { Segment } from "./Segment";
import { BASE_SEGMENTS } from "./sets/baseSegments";
import { HAZARD_SEGMENTS } from "./sets/hazardsSegments";
import { JUMPER_SEGMENTS } from "./sets/jumpersSegments";
import { REWARD_SEGMENTS } from "./sets/rewardsSegments";
import { TRAFFIC_SEGMENTS } from "./sets/trafficSegments";
// import { TURN_SEGMENTS } from "./sets/turnSegments";
// import { VERTICAL_SEGMENTS } from "./sets/verticalSegments";

export const SEGMENT_SETS = {
  base: BASE_SEGMENTS,
  traffic: TRAFFIC_SEGMENTS,
  rewards: REWARD_SEGMENTS,
  jumpers: JUMPER_SEGMENTS,
  hazards: HAZARD_SEGMENTS,
//   vertical: VERTICAL_SEGMENTS,
//   turns: TURN_SEGMENTS,
} as const satisfies Record<string, Segment[]>;

export type SegmentSetId = keyof typeof SEGMENT_SETS;

export const DEFAULT_SEGMENT_SET_IDS: SegmentSetId[] = [
  "base",
  "traffic",
  "rewards",
  "jumpers",
  "hazards",
];

export const SEGMENTS: Segment[] = getSegmentsFromSets(DEFAULT_SEGMENT_SET_IDS);

export function getSegmentsFromSets(
  setIds: readonly string[] = DEFAULT_SEGMENT_SET_IDS,
): Segment[] {
  const validSetIds = setIds.filter(isSegmentSetId);
  const resolvedSetIds =
    validSetIds.length > 0 ? validSetIds : DEFAULT_SEGMENT_SET_IDS;

  return resolvedSetIds.flatMap((setId) => SEGMENT_SETS[setId]);
}

export function filterSegmentsByIds(
  segments: readonly Segment[],
  ids?: readonly string[],
): Segment[] {
  if (!ids || ids.length === 0) return [...segments];
  const allowed = new Set(ids);
  return segments.filter((segment) => allowed.has(segment.id));
}

export function getSegmentsForLevel(options?: {
  segmentSets?: readonly string[];
  segmentIds?: readonly string[];
}): Segment[] {
  return filterSegmentsByIds(
    getSegmentsFromSets(options?.segmentSets),
    options?.segmentIds,
  );
}

function isSegmentSetId(setId: string): setId is SegmentSetId {
  return setId in SEGMENT_SETS;
}
