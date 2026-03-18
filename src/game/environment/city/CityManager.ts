// src/game/environment/city/CityManager.ts

import * as THREE from "three";
import { CityLayerInstanced } from "./CityLayerInstanced";

import building1 from "@/assets/models/building_1.glb";
import building2 from "@/assets/models/building_2.glb";
import building3 from "@/assets/models/building_3.glb";

export class CityManager {
  private static instance: CityManager | null = null;
  private layers: CityLayerInstanced[] = [];

  public static getInstance(): CityManager {
    if (!CityManager.instance) {
      CityManager.instance = new CityManager();
    }
    return CityManager.instance;
  }

  public async initialize(scene: THREE.Scene) {
    // Массив URL трёх разных GLB-моделей
    const modelUrls = [building1, building2, building3];

    const MIN_SCALE = 1 / 8;
    const MAX_SCALE = 1 / 4;
    const DEFAULT_CONFIG = {
      // z positions range
      zStart: -100,
      zEnd: 10,
      //
      minHeight: MIN_SCALE,
      maxHeight: MAX_SCALE,
      minWidth: MIN_SCALE,
      maxWidth: MAX_SCALE,

      spacing: 1,

      speedFactor: 0.3,
      color: 0x333355,
    };

    // Первый слой (левая сторона)
    const layer1 = await CityLayerInstanced.create(
      scene,
      {
        ...DEFAULT_CONFIG,
        xMin: -50,
        xMax: 50,
      },
      modelUrls,
    );
    this.layers.push(layer1);

    // Второй слой (правая сторона)
    const layer2 = await CityLayerInstanced.create(
      scene,
      {
        ...DEFAULT_CONFIG,
        xMin: -50,
        xMax: 50,
      },
      modelUrls,
    );
    this.layers.push(layer2);
  }

  public update(deltaTime: number, speed: number): void {
    for (const layer of this.layers) {
      layer.update(deltaTime, speed);
    }
  }

  public dispose() {
    for (const layer of this.layers) {
      layer.dispose();
    }
    this.layers = [];
  }
}
