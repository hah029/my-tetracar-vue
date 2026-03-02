import * as THREE from "three";
import { RoadEdge } from "@/game/road/edges/RoadEdge";
import { RoadManager } from "@/game/road/RoadManager";
import { type CubeConfig, type CubeUserData } from "@/game/car/types";
import type { PhysicsConfig } from "../physics/types";
import { CubePhysics } from "@/game/physics/CubePhysics";
import { ObstacleManager } from "./ObstacleManager";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export class ObstacleFromCubes extends THREE.Group {
  private cubeModelCache: THREE.Group | null = null;
  private cubes: THREE.Object3D[] = [];
  private isDestroyed: boolean = false;
  private physicsConfig: Required<PhysicsConfig>;
  private scene: THREE.Scene; // сохраняем ссылку на сцену

  constructor(
    laneIndex: number,
    zPos: number,
    formConfig: CubeConfig[],
    scene: THREE.Scene, // передаём сцену в конструктор
    useGLB = false,
    cubeModelUrl = "",
    customConfig?: Partial<PhysicsConfig>,
  ) {
    super();
    this.scene = scene;
    this.physicsConfig = {
      gravity: 0.01,
      bounceFactor: 0.4,
      friction: 0.85,
      collisionFactor: 0.2,
      removalHeight: -10,
      explosionForce: 0.5,
      explosionUpward: 0.3,
      cubeRotationSpeed: 0.05,
      ...customConfig,
    };

    const roadManager = RoadManager.getInstance();
    const x = roadManager.getLanePosition(laneIndex);
    this.position.set(x, 0, zPos);

    this.build(formConfig, useGLB, cubeModelUrl);
  }

  private async build(
    formConfig: CubeConfig[],
    useGLB: boolean,
    cubeModelUrl: string,
  ) {
    const cubes: THREE.Object3D[] = [];

    if (useGLB && cubeModelUrl) {
      try {
        // console.log("📦 Loading GLB model from:", cubeModelUrl);
        const cubeModel = await this.loadCubeModel(cubeModelUrl);
        // console.log("✅ GLB model loaded, building cubes...");

        formConfig.forEach((config, index) => {
          const cube = this.createCubeFromGLB(cubeModel, config, index);
          this.add(cube);
          cubes.push(cube);
          // if (onCubeCreated) onCubeCreated(cube);
        });
      } catch (error) {
        console.error(
          "❌ Error loading GLB model, falling back to primitives:",
          error,
        );
        return this.buildFromPrimitives(formConfig);
      }
    } else {
      // console.log("🔨 Building car from primitives");
      return this.buildFromPrimitives(formConfig);
    }

    return cubes;
  }

  /**
   * Создание кубика из GLB модели
   */
  private createCubeFromGLB(
    model: THREE.Group,
    config: CubeConfig,
    index: number,
  ): THREE.Object3D {
    const cube = model.clone();
    cube.position.set(config.pos[0], config.pos[1], config.pos[2]);
    cube.scale.set(config.scale[0], config.scale[1], config.scale[2]);

    // Обходим все меши и заменяем материалы на MeshStandardMaterial
    cube.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        // mesh.material = new THREE.MeshStandardMaterial({
        //   // color: config.color,
        //   roughness: 0.5,
        //   metalness: 0.1,
        // });
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    cube.userData = this.createCubeUserData(config, index);
    return cube;
  }

  /**
   * Построение кубиков из примитивов
   */
  private buildFromPrimitives(formConfig: CubeConfig[]): THREE.Object3D[] {
    const cubes: THREE.Object3D[] = [];

    formConfig.forEach((config, index) => {
      const cube = this.createPrimitiveCube(config, index);
      this.add(cube);
      cubes.push(cube);
    });

    return cubes;
  }

  /**
   * Создание одного примитивного кубика
   */
  private createPrimitiveCube(config: CubeConfig, index: number): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(1, 0.5, 1);
    const material = new THREE.MeshStandardMaterial({
      color: config.color,
      roughness: 0.5,
      metalness: 0.1,
    });
    const cube = new THREE.Mesh(geometry, material);

    cube.position.set(config.pos[0], config.pos[1], config.pos[2]);
    cube.scale.set(config.scale[0], config.scale[1], config.scale[2]);

    cube.castShadow = true;
    cube.receiveShadow = true;

    cube.userData = this.createCubeUserData(config, index);
    return cube;
  }

  /**
   * Создание userData для кубика
   */
  private createCubeUserData(config: CubeConfig, index: number): CubeUserData {
    return {
      originalPos: [...config.pos],
      originalScale: [...config.scale],
      configIndex: index,
      velocity: new THREE.Vector3(0, 0, 0),
      rotationSpeed: new THREE.Vector3(0, 0, 0),
    };
  }

  public update(speed: number): boolean {
    if (!this.isDestroyed) {
      // Двигаем всю группу
      this.position.z += speed;
      // Возвращаем true, если пора удалить (ушло далеко за камеру)
      return this.position.z > 10;
    } else {
      // Обновляем разлетающиеся кубики
      // console.log("Updating destroyed cubes, count:", this.cubes.length);
      this.updateDestroyedCubes();
      // console.log("After updateDestroyedCubes, count:", this.cubes.length);
      // Если все кубики удалены, возвращаем true для удаления группы
      return this.cubes.length === 0;
    }
  }

  private updateDestroyedCubes() {
    const edges = RoadManager.getInstance()
      .getEdges()
      .filter((e) => e instanceof RoadEdge) as RoadEdge[];

    CubePhysics.updateCubes(this.cubes, this.physicsConfig, edges, (cube) => {
      this.scene.remove(cube);
    });
  }

  public destroy(impactPoint?: THREE.Vector3) {
    if (this.isDestroyed) return;
    console.log("ObstacleFromCubes.destroy called");
    this.isDestroyed = true;

    // Отсоединяем кубики от группы и добавляем в сцену
    this.cubes.forEach((cube) => {
      const worldPos = cube.getWorldPosition(new THREE.Vector3());
      const worldRot = cube.getWorldQuaternion(new THREE.Quaternion());
      this.remove(cube);
      this.scene.add(cube);
      cube.position.copy(worldPos);
      cube.quaternion.copy(worldRot);
      // console.log("Cube added to scene:", this.scene.children.includes(cube));
      const ud = cube.userData as any;
      ud.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * this.physicsConfig.explosionForce,
        Math.random() * this.physicsConfig.explosionUpward + 0.1,
        (Math.random() - 0.5) * this.physicsConfig.explosionForce,
      );
      // console.log(
      //   `Cube velocity: ${ud.velocity.x}, ${ud.velocity.y}, ${ud.velocity.z}`,
      // );
      if (impactPoint) {
        const dir = cube.position.clone().sub(impactPoint).normalize();
        ud.velocity.copy(dir.multiplyScalar(this.physicsConfig.explosionForce));
      }
      ud.rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * this.physicsConfig.cubeRotationSpeed,
        (Math.random() - 0.5) * this.physicsConfig.cubeRotationSpeed,
        (Math.random() - 0.5) * this.physicsConfig.cubeRotationSpeed,
      );
    });

    // Регистрируем кубики в менеджере для последующей очистки при reset
    ObstacleManager.getInstance().registerDynamicCubes(this.cubes);
  }

  public getCollider(): THREE.Box3 | null {
    if (this.isDestroyed) return null;
    const box = new THREE.Box3();
    this.cubes.forEach((cube) => box.expandByObject(cube));
    return box;
  }

  public getCubes(): THREE.Object3D[] {
    return this.cubes;
  }

  public isFullyDestroyed() {
    return this.isDestroyed && this.cubes.length === 0;
  }

  /**
   * Загрузка GLB модели с кешированием
   */
  private async loadCubeModel(url: string): Promise<THREE.Group> {
    if (this.cubeModelCache) return this.cubeModelCache.clone();

    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(
        url,
        (gltf) => {
          this.cubeModelCache = gltf.scene;
          resolve(gltf.scene.clone());
        },
        undefined,
        reject,
      );
    });
  }
}
