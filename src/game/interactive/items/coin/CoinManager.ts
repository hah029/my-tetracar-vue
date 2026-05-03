import * as THREE from "three";
import { Golden } from "./Golden";
import { Energon } from "./Energon";
import { Car } from "@/game/car/Car";
import type { BaseItem } from "../BaseItem";
import type { CoinType } from "./types";
import type { CoinItem } from "./CoinItem";
import { usePlayerStore } from "@/store/playerStore";

export class CoinManager {
  private static instance: CoinManager | null = null;
  private coins: CoinItem[] = [];
  private magnetCoins: CoinItem[] = [];
  private scene!: THREE.Scene;

  public static getInstance(): CoinManager {
    if (!CoinManager.instance) {
      CoinManager.instance = new CoinManager();
    }
    return CoinManager.instance;
  }

  public initialize(scene: THREE.Scene) {
    this.scene = scene;
  }

  /* =======================
     SPAWN
     ======================= */

  public spawnGolden(
    laneIndex: number,
    zPos: number,
    yPos?: number,
    value?: number,
  ): void {
    const coin = new Golden(laneIndex, zPos, yPos, value);
    this.coins.push(coin);
    this.scene.add(coin);
  }

  public spawnEnergon(
    laneIndex: number,
    zPos: number,
    yPos?: number,
    value?: number,
  ): void {
    const coin = new Energon(laneIndex, zPos, yPos, value);
    this.coins.push(coin);
    this.scene.add(coin);
  }

  /* =======================
     UPDATE
     ======================= */

  public update(deltaTime: number, speed: number): void {
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      if (coin === undefined) continue;
      const shouldRemove = coin.update(deltaTime, speed);

      if (shouldRemove) {
        this.removeCoin(i);
      }
    }
  }

  private updateMagnetCoins(car: Car, deltaTime: number): void {
    const playerStore = usePlayerStore();

    const force = playerStore.magnetForce ?? 8;
    const dt = deltaTime / 1000;

    const carPos = car.position;
    const dir = new THREE.Vector3();

    const t = performance.now();

    for (let i = this.magnetCoins.length - 1; i >= 0; i--) {
      const coin = this.magnetCoins[i];

      dir.subVectors(carPos, coin.position);

      const dist = dir.length();

      if (dist > 0.01) {
        dir.normalize();

        coin.position.addScaledVector(dir, force * dt);
        coin.collider.center.copy(coin.position);
      }

      this.updateMagnetBeam(coin, carPos, t);
    }
  }

  // private updateMagnetBeam(
  //   coin: CoinItem,
  //   carPos: THREE.Vector3,
  //   time: number,
  // ) {
  //   const line = coin.userData.magnetLine as THREE.Line;
  //   if (!line) return;

  //   const arr = (line.geometry as THREE.BufferGeometry).attributes.position
  //     .array as Float32Array;

  //   // старт луча (машина)
  //   arr[0] = carPos.x;
  //   arr[1] = carPos.y + 0.45;
  //   arr[2] = carPos.z + 0.9;

  //   // конец луча (монета)
  //   arr[3] = coin.position.x;
  //   arr[4] = coin.position.y;
  //   arr[5] = coin.position.z;

  //   line.geometry.attributes.position.needsUpdate = true;

  //   // Пульсация прозрачности
  //   const mat = line.material as THREE.LineBasicMaterial;
  //   mat.opacity = 0.55 + Math.sin(time * 0.012 + coin.id) * 0.25;
  // }

  private updateMagnetBeam(
    coin: CoinItem,
    carPos: THREE.Vector3,
    time: number,
  ) {
    const beam = coin.userData.magnetLine as THREE.Mesh;
    if (!beam) return;

    const target = coin.position.clone();

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

  /* =======================
     COLLISION
     ======================= */

  /**
   * Проверка подбора монеток машиной
   * @returns сумма очков, собранных за этот кадр
   */
  public checkCarCollision(car: Car) {
    let collected = {
      golden: 0,
      energon: 0,
      total: 0,
    };
    const carCollider = car.getCollider();
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      if (coin === undefined) continue;

      if (carCollider.intersectsSphere(coin.collider)) {
        const itemType = coin.itemType as CoinType;
        collected[itemType] += coin.getValue();
        collected["total"] += coin.getValue();
        this.removeCoin(i);
      }
    }
    for (let i = this.magnetCoins.length - 1; i >= 0; i--) {
      const coin = this.magnetCoins[i];
      if (coin === undefined) continue;

      if (carCollider.intersectsSphere(coin.collider)) {
        console.log(
          "coin hit",
          coin.position,
          coin.collider.center,
          coin.collider.radius,
        );

        const itemType = coin.itemType as CoinType;
        collected[itemType] += coin.getValue();
        collected["total"] += coin.getValue();
        this.removeCoin(i, true);
      }
    }
    return collected;
  }

  /* =======================
     HELPERS
     ======================= */

  private removeCoin(index: number, magnet = false): void {
    const list = magnet ? this.magnetCoins : this.coins;

    const coin = list[index];
    if (!coin) return;

    const line = coin.userData.magnetLine as THREE.Mesh;

    if (line) {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    }

    this.scene.remove(coin);
    list.splice(index, 1);
  }

  /* =======================
     RESET / GETTERS
     ======================= */

  public reset(): void {
    [...this.coins, ...this.magnetCoins].forEach((c) => this.scene.remove(c));

    this.coins = [];
    this.magnetCoins = [];
  }

  public getCoins(): BaseItem[] {
    return this.coins;
  }

  public applyMagnet(car: Car, deltaTime: number): void {
    const playerStore = usePlayerStore();

    if (!playerStore.isMagnetEnabled) return;

    const radius = playerStore.magnetRadius ?? 4.5;
    const radiusSq = radius * radius;

    const carPos = car.position;

    // 1. переносим обычные монеты в магнитные
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      if (!coin) continue;

      const distSq = coin.position.distanceToSquared(carPos);

      if (distSq <= radiusSq) {
        this.magnetCoins.push(coin);
        coin.userData.magnetized = true;
        const line = this.createMagnetLine();
        this.scene.add(line);
        coin.userData.magnetLine = line;
        this.coins.splice(i, 1);
      }
    }

    // 2. обновляем магнитные
    this.updateMagnetCoins(car, deltaTime);
  }

  // private createMagnetLine(): THREE.Line {
  //   const geometry = new THREE.BufferGeometry();

  //   const points = new Float32Array(6); // 2 точки * xyz
  //   geometry.setAttribute("position", new THREE.BufferAttribute(points, 3));

  //   const material = new THREE.LineBasicMaterial({
  //     transparent: true,
  //     opacity: 0.85,
  //     blending: THREE.AdditiveBlending,
  //     depthWrite: false,
  //     toneMapped: false,
  //   });

  //   const line = new THREE.Line(geometry, material);

  //   return line;
  // }

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

      vertexShader: `
      varying vec2 vUv;
      uniform float time;

      void main() {
        vUv = uv;

        vec3 pos = position;

        // лёгкая волна
        pos.x += sin(uv.y * 12.0 - time * 8.0) * 0.03;

        gl_Position =
          projectionMatrix *
          modelViewMatrix *
          vec4(pos, 1.0);
      }
    `,

      fragmentShader: `
      varying vec2 vUv;
      uniform float time;
      uniform vec3 color;

      void main() {

        // центр луча
        float center = abs(vUv.x - 0.5);

        // мягкие края
        float beam = smoothstep(0.48, 0.08, center);

        // поток энергии
        float flow =
          sin(vUv.y * 18.0 - time * 12.0) * 0.5 + 0.5;

        // яркость
        float alpha = beam * (0.45 + flow * 0.7);

        gl_FragColor = vec4(color, alpha);
      }
    `,
    });

    return new THREE.Mesh(geometry, material);
  }
}
