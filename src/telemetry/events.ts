export type TelemetryPlatform = "yandex" | "local";

export type TelemetryIdentity = {
  kind: "platform" | "anonymous";
  id: string;
};

export type EventContext = {
  eventId: string;
  occurredAt: string;
  sessionId: string;
  runId?: string;
  identity: TelemetryIdentity;
  platform: TelemetryPlatform;
  appVersion: string;
  buildTimestamp: number;
  locale: string;
};

export type ItemType =
  | "golden"
  | "energon"
  | "ammo"
  | "armor"
  | "nitro"
  | "magnet";

export type DestroyMethod = "bullet" | "shield" | "collision";
export type DefeatCause =
  | "obstacle_collision"
  | "lethal_magnet"
  | "off_road"
  | "unknown";
export type ObstacleKind = "static" | "enemy" | "moving";

export type ItemOutcomeStats = {
  spawned: number;
  collected: number;
  rejected: number;
  expiredUncollected: number;
};

export type ShieldStats = {
  activated: number;
  armorAddedWhileActive: number;
  hits: number;
  breaks: number;
  activeMs: number;
};

export type JumpStats = {
  manualAttempts: number;
  manualStarted: number;
  rampStarted: number;
  forcedLandings: number;
};

export type CombatStats = {
  shotsFired: number;
  shotsHit: number;
  shotsMissed: number;
  shotsBlockedNoAmmo: number;
  destroyedByObstacleKind: Partial<Record<ObstacleKind, number>>;
};
export type AdFormat = "interstitial" | "rewarded" | "sticky_banner";
export type AdPlacement =
  | "gameover_interstitial"
  | "gameover_continue"
  | "gameover_bonus"
  | "sticky_banner";

export type RunStats = {
  score: number;
  distance: number;
  itemsCollected: Partial<Record<ItemType, number>>;
  itemsRejected: Partial<Record<"ammo" | "armor", number>>;
  itemOutcomes: Partial<Record<ItemType, ItemOutcomeStats>>;
  shield: ShieldStats;
  jumps: JumpStats;
  combat: CombatStats;
  jumpsCompleted: number;
  obstaclesDestroyed: Partial<Record<DestroyMethod, number>>;
};

/**
 * Полностью самодостаточный snapshot + изменения с предыдущего checkpoint.
 * `sequence` монотонно возрастает в пределах run и позволяет корректно
 * восстановить состояние при повторной доставке или нарушении порядка логов.
 */
export type RunStatsBatch = {
  sequence: number;
  totals: RunStats;
  delta: RunStats;
};

export type TelemetryEvent =
  | { type: "app.opened"; launchType: "cold" | "restored" }
  | { type: "app.ready" }
  | { type: "app.backgrounded"; visibilityState: DocumentVisibilityState }
  | { type: "app.foregrounded"; visibilityState: DocumentVisibilityState }
  | {
      type: "identity.linked";
      previousIdentity: TelemetryIdentity;
      nextIdentity: TelemetryIdentity;
    }
  | {
      type: "navigation.state_changed";
      from: string;
      to: string;
      reason: NavigationReason;
    }
  | { type: "ui.action"; name: UiActionName; screen: string; source?: string }
  | { type: "ui.overlay_opened"; overlay: string; section?: string }
  | { type: "ui.overlay_closed"; overlay: string; section?: string }
  | { type: "run.started"; levelId: string; difficultyId?: string }
  | {
      type: "run.suspended";
      reason: "manual_pause" | "page_hidden";
      batch: RunStatsBatch;
      durationMs: number;
    }
  | { type: "run.resumed"; reason: "manual_resume" }
  | {
      type: "run.abandoned";
      previousRunId: string;
      levelId?: string;
      batch: RunStatsBatch;
      durationMs: number;
      reason: "unrecovered_previous_run";
    }
  | {
      type: "run.finished";
      reason: RunFinishReason;
      defeatCause?: DefeatCause;
      score: number;
      distance: number;
      batch: RunStatsBatch;
      durationMs: number;
      isNewRecord: boolean;
    }
  | { type: "economy.purchase_started"; productId: string; currency?: string }
  | { type: "economy.purchase_completed"; productId: string }
  | { type: "economy.purchase_failed"; productId: string; reason: string }
  | { type: "ad.requested"; placement: AdPlacement; format: AdFormat }
  | { type: "ad.opened"; placement: AdPlacement; format: AdFormat }
  | { type: "ad.closed"; placement: AdPlacement; format: AdFormat }
  | { type: "ad.failed"; placement: AdPlacement; format: AdFormat; reason: string }
  | {
      type: "ad.suppressed";
      placement: AdPlacement;
      format: AdFormat;
      reason: "ads_disabled_by_purchase" | "ad_already_showing" | "policy";
    }
  | { type: "ad.rewarded"; placement: AdPlacement; rewardId: string };

export type NavigationReason =
  | "system"
  | "play_button"
  | "level_confirmed"
  | "countdown_finished"
  | "pause_button"
  | "resume_button"
  | "crash"
  | "restart_button"
  | "quit_confirmed"
  | "menu_button";

export type RunFinishReason = "crash" | "quit";

export type UiActionName =
  | "play_clicked"
  | "restart_clicked"
  | "shop_opened"
  | "daily_gift_opened"
  | "fortune_wheel_opened"
  | "objectives_opened"
  | "settings_opened"
  | "leaderboards_opened"
  | "quit_requested"
  | "quit_cancelled"
  | "rewarded_ad_requested";

export type EventEnvelope<T extends TelemetryEvent = TelemetryEvent> = T & EventContext;
