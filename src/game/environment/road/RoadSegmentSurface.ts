import * as THREE from "three";
import type { RoadConfig } from "./types";
import { loadTexture } from "@/helpers/loaders";

export type RoadSegmentSurfaceCoverage = {
  lanes: number[];
  rowStart: number;
  rowEnd: number;
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
};

export class RoadSegmentSurface {
  private static readonly SAFE_REMOVE_Z = 90;
  private static readonly OCCLUSION_EPSILON = 0.08;
  private group = new THREE.Group();
  private meshes: THREE.Mesh[] = [];
  private surfaceMeshes: SurfaceMeshRecord[] = [];
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
    options: { loop?: boolean } = {},
  ) {
    this.loop = options.loop ?? false;
    this.group.position.z = this.loop ? 0 : baseZ;
    this.createMeshes();
    this.scene.add(this.group);
  }

  public update(deltaTime: number, speed: number): boolean {
    if (this.loop) {
      this.updateLoopRows(deltaTime, speed);
      return false;
    }

    this.group.position.z += deltaTime * speed;

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
        (front, row) => Math.max(front, row.mesh.position.z),
        -Infinity,
      );
    }

    return this.group.position.z;
  }

  public getBackZ(): number {
    if (this.loop) {
      return this.surfaceMeshes.reduce(
        (back, row) => Math.min(back, row.mesh.position.z),
        Infinity,
      );
    }

    return this.group.position.z - (this.rowCount - 1) * this.rowLength;
  }

  public getFrontEdgeZ(): number {
    return this.getFrontZ() + this.rowLength / 2;
  }

  public getBackEdgeZ(): number {
    return this.getBackZ() - this.rowLength / 2;
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
  }

  public getSurfaceIntervals(): RoadSegmentSurfaceInterval[] {
    return this.surfaceMeshes.map(({ mesh, lane, length }) => {
      const z = this.group.position.z + mesh.position.z;
      return {
        lane,
        back: z - length / 2,
        front: z + length / 2,
      };
    });
  }

  private createMeshes(): void {
    const material = this.createMaterial();

    if (this.loop) {
      this.createLoopMeshes(material);
    } else {
      this.createSegmentMeshes(material);
    }

    material.dispose();
  }

  private createLoopMeshes(material: THREE.MeshStandardMaterial): void {
    for (let rowIndex = 0; rowIndex < this.rowCount; rowIndex++) {
      for (let lane = 0; lane < this.lanePositions.length; lane++) {
        this.addSurfaceMesh(
          lane,
          this.getRowZ(rowIndex),
          this.rowLength,
          material,
        );
      }
    }
  }

  private createSegmentMeshes(material: THREE.MeshStandardMaterial): void {
    for (let lane = 0; lane < this.lanePositions.length; lane++) {
      let rowIndex = 0;

      while (rowIndex < this.rowCount) {
        if (this.isCovered(lane, rowIndex)) {
          rowIndex++;
          continue;
        }

        const rangeStart = rowIndex;
        while (
          rowIndex < this.rowCount &&
          !this.isCovered(lane, rowIndex)
        ) {
          rowIndex++;
        }

        const rangeEnd = rowIndex;
        const length = (rangeEnd - rangeStart) * this.rowLength;
        const centerZ =
          -((rangeStart + rangeEnd - 1) * this.rowLength) / 2;
        this.addSurfaceMesh(lane, centerZ, length, material);
      }
    }
  }

  private addSurfaceMesh(
    lane: number,
    z: number,
    length: number,
    material: THREE.MeshStandardMaterial,
  ): void {
    const geometry = new THREE.PlaneGeometry(this.laneWidth * 0.92, length);
    const mesh = new THREE.Mesh(geometry, material.clone());
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(this.getLaneX(lane), this.config.yPosition ?? 0, z);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    this.meshes.push(mesh);
    this.surfaceMeshes.push({ mesh, lane, length });
  }

  private isCovered(lane: number, rowIndex: number): boolean {
    return this.coverage.some(
      (section) =>
        section.lanes.includes(lane) &&
        rowIndex >= section.rowStart &&
        rowIndex < section.rowEnd,
    );
  }

  private createMaterial(): THREE.MeshStandardMaterial {
    const map = this.config.textureUrl
      ? loadTexture(this.config.textureUrl, {
          wrapS: THREE.RepeatWrapping,
          wrapT: THREE.RepeatWrapping,
          repeat: {
            x: Math.max(this.laneWidth / 2, 1),
            y: Math.max(this.rowLength / 2, 1),
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

  private getRowZ(rowIndex: number): number {
    if (this.loop) {
      return this.baseZ - rowIndex * this.rowLength;
    }

    return -rowIndex * this.rowLength;
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
