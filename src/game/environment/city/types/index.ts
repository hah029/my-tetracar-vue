export interface CityLayerConfig {
  type: "city";
  xMin: number;
  xMax: number;
  zStart: number;
  zEnd: number;
  spacing: number;
  speedFactor: number;
  minHeight: number;
  maxHeight: number;
  minWidth: number;
  maxWidth: number;
  y: number;
  color: number;
  emissive?: number;
  emissiveIntensity?: number;
  opacity?: number;
}
