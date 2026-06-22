// src/game/environment/city/CityManager.ts

import * as THREE from "three";
import { watch, type WatchStopHandle } from "vue";
import { CityLayerInstanced } from "./CityLayerInstanced";
import { useEnvironmentStore } from "@/store/environmentStore";

import building1 from "@/assets/models/building_1.glb";
import building2 from "@/assets/models/building_2.glb";
import building3 from "@/assets/models/building_3.glb";
import type { CityLayerConfig } from "./types";
import type { SceneryLayerConfig } from "@/levels/types";

export class CityManager {
  private static instance: CityManager | null = null;
  private layers: CityLayerInstanced[] = [];
  private scene: THREE.Scene | null = null;
  private stopSceneryWatcher: WatchStopHandle | null = null;
  private rebuildToken = 0;

  public static getInstance(): CityManager {
    if (!CityManager.instance) {
      CityManager.instance = new CityManager();
    }
    return CityManager.instance;
  }

  public initialize(scene: THREE.Scene) {
    this.scene = scene;
    this.stopSceneryWatcher?.();

    const environmentStore = useEnvironmentStore();
    this.stopSceneryWatcher = watch(
      () => environmentStore.currentScenery,
      () => {
        this.rebuildFromCurrentScenery();
      },
      { immediate: true, deep: true },
    );
  }

  public update(deltaTime: number, speed: number): void {
    for (const layer of this.layers) {
      layer.update(deltaTime, speed);
    }
  }

  public dispose() {
    this.rebuildToken++;
    this.stopSceneryWatcher?.();
    this.stopSceneryWatcher = null;
    this.scene = null;
    this.disposeLayers();
  }

  private async rebuildFromCurrentScenery() {
    if (!this.scene) return;

    const token = ++this.rebuildToken;
    const environmentStore = useEnvironmentStore();
    const scenery = environmentStore.currentScenery;
    const modelUrls = this.getModelUrls(scenery.scenerySets);
    const layers = scenery.layers ?? [];

    this.disposeLayers();

    if (modelUrls.length === 0 || layers.length === 0) return;

    for (const layerConfig of layers) {
      if (token !== this.rebuildToken || !this.scene) return;

      const layer = await CityLayerInstanced.create(
        this.scene,
        this.resolveLayerConfig(layerConfig, scenery.sceneryDensity),
        modelUrls,
      );

      if (token !== this.rebuildToken || !this.scene) {
        layer.dispose();
        return;
      }

      this.layers.push(layer);
    }
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
    };
  }

  private disposeLayers() {
    for (const layer of this.layers) {
      layer.dispose();
    }
    this.layers = [];
  }
}
