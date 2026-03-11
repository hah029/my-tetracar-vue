// src/game/environment/city/CityManager.ts

import * as THREE from "three";
import { CityLayerInstanced } from "./CityLayerInstanced";

export class CityManager {
  private static instance: CityManager | null = null;
  private layers: CityLayerInstanced[] = [];

  public static getInstance(): CityManager {
    if (!CityManager.instance) {
      CityManager.instance = new CityManager();
    }
    return CityManager.instance;
  }

  public initialize(scene: THREE.Scene) {
    // Первый слой (левая сторона)
    this.layers.push(
      new CityLayerInstanced(scene, {
        xMin: -30,
        xMax: 30,
        zStart: -300,
        zEnd: 10,
        spacing: 2,
        speedFactor: 0.3,
        minHeight: 10,
        maxHeight: 25,
        minWidth: 2,
        maxWidth: 5,
        color: 0x444466, // цвет пока не используется, можно применить к материалу при желании
      }),
    );

    // Второй слой (правая сторона)
    this.layers.push(
      new CityLayerInstanced(scene, {
        xMin: 0,
        xMax: 50,
        zStart: -400,
        zEnd: 10,
        spacing: 12,
        speedFactor: 0.25,
        minHeight: 20,
        maxHeight: 40,
        minWidth: 2,
        maxWidth: 5,
        color: 0x333355,
      }),
    );
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
