import * as THREE from "three";
// import { Golden } from "./Golden";
// import { Energon } from "./Energon";
import { Car } from "@/game/car/Car";
import type { BaseItem } from "@/game/interactive/items/BaseItem";
// import type { CoinType } from "./types";
// import type { Coin } from "./CoinItem";
import { usePlayerStore } from "@/store/playerStore";

import magnetLineVertex from "@/game/shaders/magnet/line/vertex.glsl";
import magnetLineFragment from "@/game/shaders/magnet/line/fragment.glsl";
// import magnetFieldVertex from "@/game/shaders/magnet/field/vertex.glsl";
// import magnetFieldFragment from "@/game/shaders/magnet/field/fragment.glsl";
// import { makeWeightedChoice } from "@/helpers/functions";
// import type { ItemType } from "../interactive/items/types";

export class MagnetSystem {
  private static instance: MagnetSystem | null = null;
  private scene!: THREE.Scene;

  public static getInstance(): MagnetSystem {
    if (!MagnetSystem.instance) {
      MagnetSystem.instance = new MagnetSystem();
    }
    return MagnetSystem.instance;
  }

  public initialize(scene: THREE.Scene) {
    this.scene = scene;
  }

  /* =======================
     SPAWN
     ======================= */

  public updateMagnetedItems(
    car: Car,
    magnetedItems: BaseItem[],
    deltaTime: number,
    now: number,
  ): void {
    if (magnetedItems.length == 0) return;

    const playerStore = usePlayerStore();

    const force = playerStore.magnetForce ?? 8;
    const dt = deltaTime / 1000;

    const carPos = car.position;
    const dir = new THREE.Vector3();

    for (let i = magnetedItems.length - 1; i >= 0; i--) {
      const item = magnetedItems[i];

      dir.subVectors(carPos, item.position);

      const dist = dir.length();

      if (dist > 0.01) {
        dir.normalize();

        item.position.addScaledVector(dir, force * dt);
        item.collider.center.copy(item.position);
      } else {
        // Если предмет уже очень близко к машине, считаем, что он подобран
        // Коллизия обработается в checkItemsCollision
      }

      this.updateMagnetBeam(item, carPos, now);
    }
  }

  private updateMagnetBeam(
    item: BaseItem,
    carPos: THREE.Vector3,
    time: number,
  ) {
    const beam = item.userData.magnetLine as THREE.Mesh;
    if (!beam) return;

    const target = item.position.clone();

    // середина между машиной и монетой
    const mid = new THREE.Vector3()
      .addVectors(carPos, target)
      .multiplyScalar(0.5);

    beam.position.copy(mid);

    // направление
    const dir = new THREE.Vector3().subVectors(target, carPos);

    const length = dir.length();

    beam.scale.z = length;

    beam.lookAt(target);

    const mat = beam.material as THREE.ShaderMaterial;
    mat.uniforms.time.value = time * 0.001;
  }

  public applyMagnet(car: Car, items: BaseItem[], types: (typeof BaseItem)[]) {
    const playerStore = usePlayerStore();
    if (playerStore.isMagnetEnabled) {
      const radius = playerStore.magnetRadius ?? 4.5;
      const radiusSq = radius * radius;
      const carPos = car.position;
      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (!item) continue;
        // Проверяем, что item является экземпляром хотя бы одного из переданных типов
        const isAllowedType = types.some((T) => item instanceof T);
        if (!isAllowedType) continue;

        const distSq = item.position.distanceToSquared(carPos);

        if (distSq <= radiusSq) {
          if (item.userData.magnetLine == undefined) {
            item.userData.status = "magnetized";
            const line = this.createMagnetLine();
            this.scene.add(line);
            item.userData.magnetLine = line;
          }
        }
      }
    }
  }

  private createMagnetLine(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(0.18, 1, 1, 20);
    geometry.rotateX(Math.PI / 2);

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,

      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color("#00eaff") },
      },

      vertexShader: magnetLineVertex,
      fragmentShader: magnetLineFragment,
    });

    return new THREE.Mesh(geometry, material);
  }

  //   public createMagnetField(): THREE.Mesh {
  //     const geometry = new THREE.SphereGeometry(2, 32, 32);

  //     const material = new THREE.ShaderMaterial({
  //       side: THREE.BackSide,
  //       transparent: true,
  //       depthWrite: false,
  //       blending: THREE.AdditiveBlending,

  //       uniforms: {
  //         time: { value: 0 },
  //         intensity: { value: 0.1 },
  //         color: { value: new THREE.Color("#00eaff") },
  //       },
  //       vertexShader: magnetFieldVertex,
  //       fragmentShader: magnetFieldFragment,
  //     });

  //     return new THREE.Mesh(geometry, material);
  //   }
}
