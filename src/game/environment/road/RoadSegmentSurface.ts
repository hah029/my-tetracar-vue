import * as THREE from "three";
import type { RoadConfig } from "./types";
import { loadTexture } from "@/helpers/loaders";

export type RoadSegmentSurfaceCoverage = {
  lanes: number[];
  rowStart: number;
  rowEnd: number;
};

export type RoadSegmentSurfaceCurve = {
  direction: "left" | "right";
  /** Полный угол дуги в радианах */
  totalAngleRad: number;
  /** Радиус дуги (вычисляется из totalAngleRad и длины сегмента) */
  radius: number;
  /** X-позиция pivot'а (центра окружности) в локальном пространстве группы */
  pivotX: number;
  rowStart: number;
  rowEnd: number;
  rotateStartZ: number;
  rotateEndZ: number;
};

export type RoadSegmentSurfaceInterval = {
  lane: number;
  back: number;
  front: number;
};

type SurfaceMeshRecord = {
  mesh: THREE.Mesh;
  lane: number;
  length: number;
  rowIndex?: number;
  leftX?: number;
  rightX?: number;
  frontZ?: number;
  backZ?: number;
};

type CurveSideObjectRecord = {
  mesh: THREE.Mesh;
  side: "left" | "right";
  rowIndex: number;
  localZ: number;
  localX: number;
};

export class RoadSegmentSurface {
  private static readonly SAFE_REMOVE_Z = 90;
  private static readonly OCCLUSION_EPSILON = 0.08;
  private static readonly TEXTURE_TILE_SIZE = 2;
  private group = new THREE.Group();
  /** Дочерняя группа для curved-сегментов: вращается вокруг pivot */
  private pivotGroup: THREE.Group | null = null;
  private meshes: THREE.Mesh[] = [];
  private surfaceMeshes: SurfaceMeshRecord[] = [];
  private curveSideObjects: CurveSideObjectRecord[] = [];
  private readonly loop: boolean;
  private loopOcclusionProvider: (() => RoadSegmentSurfaceInterval[]) | null =
    null;

  constructor(
    private scene: THREE.Scene,
    private config: RoadConfig,
    private lanePositions: number[],
    private laneWidth: number,
    private baseZ: number,
    private rowLength: number,
    private rowCount: number,
    private coverage: RoadSegmentSurfaceCoverage[],
    options: { loop?: boolean; curve?: RoadSegmentSurfaceCurve } = {},
  ) {
    this.loop = options.loop ?? false;
    this.curve = options.curve ?? null;
    this.group.position.z = this.loop ? 0 : baseZ;

    // Для curved-сегментов создаём pivotGroup
    if (this.curve) {
      this.pivotGroup = new THREE.Group();
      this.pivotGroup.position.set(this.curve.pivotX, 0, 0);
      this.group.add(this.pivotGroup);
    }

    this.createMeshes();
    this.updatePivotRotation();
    this.scene.add(this.group);
  }

  private readonly curve: RoadSegmentSurfaceCurve | null;

  public update(deltaTime: number, speed: number): boolean {
    if (this.loop) {
      this.updateLoopRows(deltaTime, speed);
      return false;
    }

    this.group.position.z += deltaTime * speed;
    this.updatePivotRotation();

    return this.getBackEdgeZ() > RoadSegmentSurface.SAFE_REMOVE_Z;
  }

  public setLoopOcclusionProvider(
    provider: (() => RoadSegmentSurfaceInterval[]) | null,
  ): void {
    this.loopOcclusionProvider = provider;
  }

  private updateLoopRows(deltaTime: number, speed: number): void {
    const move = deltaTime * speed;
    const wrapDistance = this.rowCount * this.rowLength;
    const intervals = this.loopOcclusionProvider?.() ?? [];

    for (const row of this.surfaceMeshes) {
      const { mesh, lane } = row;
      mesh.position.z += move;

      if (mesh.position.z > RoadSegmentSurface.SAFE_REMOVE_Z) {
        mesh.position.z -= wrapDistance;
      }

      mesh.visible = !this.overlapsAnyInterval(
        mesh.position.z - this.rowLength / 2,
        mesh.position.z + this.rowLength / 2,
        lane,
        intervals,
      );
    }
  }

  public getFrontZ(): number {
    if (this.loop) {
      return this.surfaceMeshes.reduce(
        (front, row) => Math.max(front, row.mesh.position.z + row.length / 2),
        -Infinity,
      );
    }

    return this.group.position.z;
  }

  public getBackZ(): number {
    if (this.loop) {
      return this.surfaceMeshes.reduce(
        (back, row) => Math.min(back, row.mesh.position.z - row.length / 2),
        Infinity,
      );
    }

    return this.group.position.z - this.rowCount * this.rowLength;
  }

  public getFrontEdgeZ(): number {
    return this.getFrontZ();
  }

  public getBackEdgeZ(): number {
    return this.getBackZ();
  }

  public dispose(): void {
    this.scene.remove(this.group);

    for (const mesh of this.meshes) {
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material) => material.dispose());
      } else {
        mesh.material.dispose();
      }
    }

    this.group.clear();
    this.meshes = [];
    this.surfaceMeshes = [];
    this.curveSideObjects = [];
  }

  public getSurfaceIntervals(): RoadSegmentSurfaceInterval[] {
    return this.surfaceMeshes.map((row) => {
      const { mesh, lane, length } = row;
      if (row.frontZ !== undefined && row.backZ !== undefined) {
        return {
          lane,
          back: this.group.position.z + row.backZ,
          front: this.group.position.z + row.frontZ,
        };
      }

      const z = this.group.position.z + mesh.position.z;
      return {
        lane,
        back: z - length / 2,
        front: z + length / 2,
      };
    });
  }

  public getSideObjectOcclusionInterval(): {
    back: number;
    front: number;
  } | null {
    if (!this.curve) {
      return null;
    }

    return {
      back: this.getBackZ(),
      front: this.getFrontZ(),
    };
  }

  // ============================================================
  // Создание мешей
  // ============================================================

  private createMeshes(): void {
    if (this.loop) {
      this.createLoopMeshes();
    } else {
      this.createSegmentMeshes();
    }
  }

  private createLoopMeshes(): void {
    for (let rowIndex = 0; rowIndex < this.rowCount; rowIndex++) {
      for (let lane = 0; lane < this.lanePositions.length; lane++) {
        this.addSurfaceMesh(lane, this.getRowZ(rowIndex), this.rowLength);
      }
    }
  }

  private createSegmentMeshes(): void {
    if (this.curve) {
      this.createCurvedSegmentMeshes();
      return;
    }

    for (let lane = 0; lane < this.lanePositions.length; lane++) {
      let rowIndex = 0;

      while (rowIndex < this.rowCount) {
        if (this.isCovered(lane, rowIndex)) {
          rowIndex++;
          continue;
        }

        const rangeStart = rowIndex;
        while (rowIndex < this.rowCount && !this.isCovered(lane, rowIndex)) {
          rowIndex++;
        }

        const rangeEnd = rowIndex;
        const length = (rangeEnd - rangeStart) * this.rowLength;
        const centerZ = -((rangeStart + rangeEnd) * this.rowLength) / 2;
        this.addSurfaceMesh(lane, centerZ, length);
      }
    }
  }

  private addSurfaceMesh(lane: number, z: number, length: number): void {
    const geometry = new THREE.PlaneGeometry(this.laneWidth * 0.92, length);
    const worldBackZ = this.loop
      ? undefined
      : this.group.position.z + z - length / 2;
    const mesh = new THREE.Mesh(
      geometry,
      this.createMaterial(length, worldBackZ),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(this.getLaneX(lane), this.config.yPosition ?? 0, z);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    this.meshes.push(mesh);
    this.surfaceMeshes.push({ mesh, lane, length });
  }

  // ============================================================
  // Curved segment: pre-curved arc geometry
  // ============================================================

  private createCurvedSegmentMeshes(): void {
    if (!this.curve) return;

    const target = this.pivotGroup ?? this.group;

    // Создаём плоскую (прямую) геометрию в локальном пространстве pivotGroup.
    // Вращение pivotGroup создаёт иллюзию дуги.
    for (let rowIndex = 0; rowIndex < this.rowCount; rowIndex++) {
      const frontZ = -rowIndex * this.rowLength;
      const backZ = -(rowIndex + 1) * this.rowLength;

      for (let lane = 0; lane < this.lanePositions.length; lane++) {
        if (this.isCovered(lane, rowIndex)) {
          continue;
        }

        const laneCenter = this.getLaneX(lane);
        const halfWidth = this.laneWidth * 0.46;
        const leftEdge = laneCenter - halfWidth;
        const rightEdge = laneCenter + halfWidth;

        this.addCurvedSurfaceMesh(
          lane,
          rowIndex,
          leftEdge,
          rightEdge,
          frontZ,
          backZ,
          target,
        );
      }
    }

    this.addCurvedSideObjects(target);
  }

  /**
   * Создаёт один плоский quad для curved-сегмента.
   * Все меши добавляются в pivotGroup.
   * Вращение pivotGroup создаёт иллюзию дуги.
   */
  private addCurvedSurfaceMesh(
    lane: number,
    rowIndex: number,
    leftEdge: number,
    rightEdge: number,
    frontZ: number,
    backZ: number,
    target: THREE.Group,
  ): void {
    const positions = new Float32Array([
      leftEdge,
      0,
      frontZ,
      rightEdge,
      0,
      frontZ,
      leftEdge,
      0,
      backZ,
      rightEdge,
      0,
      backZ,
    ]);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute(
      "uv",
      new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), 2),
    );
    geometry.setIndex([0, 1, 2, 1, 3, 2]);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(
      geometry,
      this.createMaterial(
        this.rowLength,
        this.group.position.z - rowIndex * this.rowLength,
      ),
    );
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    target.add(mesh);
    this.meshes.push(mesh);
    this.surfaceMeshes.push({
      mesh,
      lane,
      length: this.rowLength,
      rowIndex,
      leftX: leftEdge,
      rightX: rightEdge,
      frontZ,
      backZ,
    });
  }

  // ============================================================
  // Вращение pivotGroup
  // ============================================================

  /**
   * Обновляет rotation.y pivotGroup на основе прогресса движения сегмента.
   * При спавне (progress=0) угол = totalAngleRad → сегмент максимально изогнут.
   * При достижении игрока (progress=1) угол = 0 → сегмент выпрямлен.
   */
  private updatePivotRotation(): void {
    if (!this.curve || !this.pivotGroup) return;

    const progress = this.getProgress();
    const angleSign = this.curve.direction === "left" ? 1 : -1;
    const angle = angleSign * this.curve.totalAngleRad * (1 - progress);
    this.pivotGroup.rotation.y = angle;
  }

  private getProgress(): number {
    if (!this.curve) return 1;

    const denominator = this.curve.rotateEndZ - this.curve.rotateStartZ;
    if (denominator === 0) return 1;

    const value =
      (this.group.position.z - this.curve.rotateStartZ) / denominator;
    const x = THREE.MathUtils.clamp(value, 0, 1);
    // smoothstep
    return x * x * (3 - 2 * x);
  }

  // ============================================================
  // Side objects на дуге
  // ============================================================

  private addCurvedSideObjects(target: THREE.Group): void {
    if (!this.curve || !this.config.sideObjects?.enabled) {
      return;
    }

    const sideConfig = this.config.sideObjects;
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: sideConfig.color,
      emissive: sideConfig.emissive ?? 0x000000,
      emissiveIntensity: sideConfig.emissiveIntensity ?? 0,
      transparent: (sideConfig.opacity ?? 1) < 1,
      opacity: sideConfig.opacity ?? 1,
    });
    const leftLane = this.lanePositions[0] ?? 0;
    const rightLane = this.lanePositions[this.lanePositions.length - 1] ?? 0;
    const leftX = leftLane - this.laneWidth * 0.5 - sideConfig.offset;
    const rightX = rightLane + this.laneWidth * 0.5 + sideConfig.offset;
    const rowStep = Math.max(
      1,
      Math.round(sideConfig.spacing / this.rowLength),
    );

    for (let rowIndex = 0; rowIndex < this.rowCount; rowIndex += rowStep) {
      const localZ = -(rowIndex + 0.5) * this.rowLength;
      this.addCurveSideObject(
        leftX,
        localZ,
        rowIndex,
        geometry,
        material,
        target,
      );
      this.addCurveSideObject(
        rightX,
        localZ,
        rowIndex,
        geometry,
        material,
        target,
      );
    }

    geometry.dispose();
    material.dispose();
  }

  private addCurveSideObject(
    localX: number,
    localZ: number,
    rowIndex: number,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    target: THREE.Group,
  ): void {
    const mesh = new THREE.Mesh(geometry.clone(), material.clone());
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.scale.set(...this.config.sideObjects!.scale);
    mesh.position.set(localX, this.config.sideObjects?.y ?? 0, localZ);
    target.add(mesh);
    this.meshes.push(mesh);
    this.curveSideObjects.push({
      mesh,
      side: "left",
      rowIndex,
      localX,
      localZ,
    });
  }

  // ============================================================
  // Вспомогательные методы
  // ============================================================

  private isCovered(lane: number, rowIndex: number): boolean {
    return this.coverage.some(
      (section) =>
        section.lanes.includes(lane) &&
        rowIndex >= section.rowStart &&
        rowIndex < section.rowEnd,
    );
  }

  private createMaterial(
    length: number,
    worldBackZ?: number,
  ): THREE.MeshStandardMaterial {
    const offsetY =
      worldBackZ === undefined ? undefined : this.getTexturePhase(worldBackZ);
    const map = this.config.textureUrl
      ? loadTexture(this.config.textureUrl, {
          wrapS: THREE.RepeatWrapping,
          wrapT: THREE.RepeatWrapping,
          repeat: {
            x: Math.max(this.laneWidth / 2, 1),
            y: Math.max(length / 2, 1),
          },
          offset:
            offsetY === undefined
              ? undefined
              : {
                  x: 0,
                  y: offsetY,
                },
        })
      : undefined;

    return new THREE.MeshStandardMaterial({
      map,
      color: this.config.color ?? 0xffffff,
      emissive: this.config.emissive ?? this.config.color ?? 0xffffff,
      emissiveIntensity: this.config.emissiveIntensity ?? 0.1,
      transparent: (this.config.opacity ?? 1) < 1,
      opacity: this.config.opacity ?? 1,
      roughness: 0.62,
      metalness: 0.08,
    });
  }

  private getLaneX(lane: number): number {
    const x = this.lanePositions[lane];
    if (x !== undefined) return x;
    return 0;
  }

  private getTexturePhase(worldZ: number): number {
    const phase = worldZ / RoadSegmentSurface.TEXTURE_TILE_SIZE;
    return ((phase % 1) + 1) % 1;
  }

  private getRowZ(rowIndex: number): number {
    if (this.loop) {
      return this.baseZ - (rowIndex + 0.5) * this.rowLength;
    }

    return -(rowIndex + 0.5) * this.rowLength;
  }

  private overlapsAnyInterval(
    back: number,
    front: number,
    lane: number,
    intervals: RoadSegmentSurfaceInterval[],
  ): boolean {
    return intervals.some(
      (interval) =>
        interval.lane === lane &&
        front > interval.back - RoadSegmentSurface.OCCLUSION_EPSILON &&
        back < interval.front + RoadSegmentSurface.OCCLUSION_EPSILON,
    );
  }
}
