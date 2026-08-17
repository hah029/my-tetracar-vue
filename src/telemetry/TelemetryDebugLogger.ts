import { Telemetry } from "./Telemetry";

/**
 * Dev-only observer. Он логирует момент публикации, а не момент доставки
 * analytics batch, поэтому порядок и occurredAt отражают реальный gameplay.
 */
export function installTelemetryDebugLogger(): () => void {
  if (!import.meta.env.DEV) return () => undefined;
  return Telemetry.subscribe((event) => {
    console.debug("[telemetry:event]", event.type, event);
  });
}

