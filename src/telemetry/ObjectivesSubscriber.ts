import { useObjectivesStore } from "@/store/objectivesStore";
import { Telemetry } from "./Telemetry";
import type { EventEnvelope, RunStatsBatch } from "./events";

function applyRunBatch(batch: RunStatsBatch): void {
  const objectives = useObjectivesStore();
  const { delta } = batch;
  if (delta.distance > 0) objectives.track("distance_travelled", delta.distance);
  if (delta.itemsCollected.golden) objectives.track("golden_collected", delta.itemsCollected.golden);
  if (delta.itemsCollected.energon) objectives.track("energon_collected", delta.itemsCollected.energon);

  const boosters =
    (delta.itemsCollected.ammo ?? 0) +
    (delta.itemsCollected.armor ?? 0) +
    (delta.itemsCollected.nitro ?? 0) +
    (delta.itemsCollected.magnet ?? 0);
  if (boosters > 0) objectives.track("booster_collected", boosters);
  if (delta.jumpsCompleted > 0) objectives.track("jump_performed", delta.jumpsCompleted);

  const obstaclesDestroyed = Object.values(delta.obstaclesDestroyed).reduce(
    (total, amount) => total + (amount ?? 0),
    0,
  );
  if (obstaclesDestroyed > 0) objectives.track("obstacle_destroyed", obstaclesDestroyed);
}

function applyObjectiveProgress(event: EventEnvelope): void {
  const objectives = useObjectivesStore();

  switch (event.type) {
    case "run.started":
      objectives.track("game_started");
      break;
    case "run.finished":
      applyRunBatch(event.batch);
      if (event.reason === "crash") objectives.track("game_finished");
      break;
    case "run.suspended":
    case "run.abandoned":
      applyRunBatch(event.batch);
      break;
  }
}

export function installObjectivesSubscriber(): () => void {
  return Telemetry.subscribe(applyObjectiveProgress);
}
