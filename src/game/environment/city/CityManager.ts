// src/game/environment/city/CityManager.ts

import * as THREE from "three";
import { watch, type WatchStopHandle } from "vue";
import { CityLayerInstanced } from "./CityLayerInstanced";
import { ProceduralSceneryLayerInstanced } from "./ProceduralSceneryLayerInstanced";
import { WaterSurfaceLayer } from "./WaterSurfaceLayer";
import { WeatherEffects } from "./WeatherEffects";
import { useEnvironmentStore } from "@/store/environmentStore";

import building1 from "@/assets/models/building_1.glb";
import building2 from "@/assets/models/building_2.glb";
import building3 from "@/assets/models/building_3.glb";
import type { CityLayerConfig } from "./types";
import type { SceneryLayerConfig } from "@/levels/types";

export class CityManager {
  private static instance: CityManager | null = null;
  private layers: (
    | CityLayerInstanced
    | ProceduralSceneryLayerInstanced
    | WaterSurfaceLayer
  )[] = [];
  private weatherEffects: WeatherEffects | null = null;
  private scene: THREE.Scene | null = null;
  private stopEnvironmentWatcher: WatchStopHandle | null = null;
  private rebuildToken = 0;

  public static getInstance(): CityManager {
    if (!CityManager.instance) {
      CityManager.instance = new CityManager();
    }
    return CityManager.instance;
  }

  public initialize(scene: THREE.Scene) {
    this.scene = scene;
    this.stopEnvironmentWatcher?.();

    const environmentStore = useEnvironmentStore();
    this.stopEnvironmentWatcher = watch(
      () => ({
        scenery: environmentStore.currentScenery,
        weather: environmentStore.currentWeather,
      }),
      () => {
        this.rebuildFromCurrentEnvironment();
      },
      { immediate: true, deep: true },
    );
  }

  public update(
    deltaTime: number,
    speed: number,
    carPosition?: THREE.Vector3,
  ): void {
    for (const layer of this.layers) {
      layer.update(deltaTime, speed);
    }
    this.weatherEffects?.update(deltaTime, speed, carPosition);
  }

  public dispose() {
    this.rebuildToken++;
    this.stopEnvironmentWatcher?.();
    this.stopEnvironmentWatcher = null;
    this.scene = null;
    this.disposeLayers();
    this.disposeWeather();
  }

  private async rebuildFromCurrentEnvironment() {
    if (!this.scene) return;

    const token = ++this.rebuildToken;
    const environmentStore = useEnvironmentStore();
    const scenery = environmentStore.currentScenery;
    const weather = environmentStore.currentWeather;
    const layers = scenery.layers ?? [];

    this.disposeLayers();
    this.disposeWeather();

    if (weather) {
      this.weatherEffects = new WeatherEffects(this.scene, weather);
    }

    if (layers.length === 0) return;

    for (const layerConfig of layers) {
      if (token !== this.rebuildToken || !this.scene) return;

      const resolvedConfig = this.resolveLayerConfig(
        layerConfig,
        scenery.sceneryDensity,
      );

      const layer =
        layerConfig.type === "city"
          ? await this.createCityLayer(resolvedConfig, scenery.scenerySets)
          : layerConfig.type === "water_surface" ||
              layerConfig.type === "terrain_surface"
            ? new WaterSurfaceLayer(this.scene, resolvedConfig)
            : new ProceduralSceneryLayerInstanced(this.scene, resolvedConfig);

      if (!layer) continue;

      if (token !== this.rebuildToken || !this.scene) {
        layer.dispose();
        return;
      }

      this.layers.push(layer);
    }
  }

  private async createCityLayer(
    config: CityLayerConfig,
    scenerySets: string[],
  ): Promise<CityLayerInstanced | null> {
    if (!this.scene) return null;

    const modelUrls = this.getModelUrls(scenerySets);
    if (modelUrls.length === 0) return null;

    return CityLayerInstanced.create(this.scene, config, modelUrls);
  }

  private getModelUrls(scenerySets: string[]): string[] {
    if (!scenerySets.includes("city")) return [];

    return [building1, building2, building3];
  }

  private resolveLayerConfig(
    config: SceneryLayerConfig,
    density: number,
  ): CityLayerConfig {
    return {
      ...config,
      spacing: config.spacing / Math.max(density, 0.1),
      color: Number.parseInt(config.color.replace("#", ""), 16),
      emissive: config.emissiveColor
        ? Number.parseInt(config.emissiveColor.replace("#", ""), 16)
        : undefined,
      emissiveIntensity: config.emissiveIntensity,
      opacity: config.opacity,
      waveAmplitude: config.waveAmplitude,
      waveFrequency: config.waveFrequency,
      waveSpeed: config.waveSpeed,
      secondaryColor: config.secondaryColor
        ? Number.parseInt(config.secondaryColor.replace("#", ""), 16)
        : undefined,
    };
  }

  private disposeLayers() {
    for (const layer of this.layers) {
      layer.dispose();
    }
    this.layers = [];
  }

  private disposeWeather() {
    this.weatherEffects?.dispose();
    this.weatherEffects = null;
  }
}
