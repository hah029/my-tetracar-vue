export interface CityLayerConfig {
  type:
    | "city"
    | "hills"
    | "ocean"
    | "water_surface"
    | "terrain_surface"
    | "lava_flow"
    | "basalt_spire";
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
  waveAmplitude?: number;
  waveFrequency?: number;
  waveSpeed?: number;
  secondaryColor?: number;
}
