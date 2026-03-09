import * as THREE from "three";
import { CityLayer } from "./CityLayer";

export class CityManager {
  private static instance: CityManager | null = null;
  private layers: CityLayer[] = [];

  public static getInstance(): CityManager {
    if (!CityManager.instance) {
      CityManager.instance = new CityManager();
    }
    return CityManager.instance;
  }

  public initialize(scene: THREE.Scene) {
    this.layers.push(
      new CityLayer(scene, {
        xMin: -50,
        xMax: 0,
        zStart: -300,
        zEnd: 10,
        spacing: 8,
        speedFactor: 0.4,
        minHeight: 10,
        maxHeight: 25,
        minWidth: 2,
        maxWidth: 5,
        color: 0x444466,
      }),
    );

    this.layers.push(
      new CityLayer(scene, {
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
}
