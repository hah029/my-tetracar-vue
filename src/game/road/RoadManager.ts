// /game/road/RoadManager.ts

import * as THREE from "three";
import { Road } from "./Road";
import { RoadLine } from "./RoadLine";
import { SpeedLine } from "./SpeedLine";
import { RoadEdge } from "./edges";
import { DEFAULT_ROAD_CONFIG } from "./config";
import { SideObjectsInstanced } from "./SideObjectsInstanced";
import type { RoadConfig, RoadStats } from "./types";

export class RoadManager {
  private static instance: RoadManager | null = null;
  private road: Road | null = null;
  private roadLines: RoadLine[] = [];
  private speedLines: SpeedLine[] = [];
  private edges: THREE.Mesh[] = [];
  private sideObjectSpacing = 1.2;
  private leftSideObjects: SideObjectsInstanced | null = null;
  private rightSideObjects: SideObjectsInstanced | null = null;

  private config!: RoadConfig;
  private scene!: THREE.Scene;

  public initialize(config: RoadConfig, scene: THREE.Scene) {
    this.config = { ...DEFAULT_ROAD_CONFIG, ...config };
    this.scene = scene;
  }

  public static isInitialized(): boolean {
    return RoadManager.instance !== null;
  }

  public static getInstance(): RoadManager {
    if (!RoadManager.instance) {
      RoadManager.instance = new RoadManager();
    }
    return RoadManager.instance;
  }

  public createRoad(): void {
    this.clear();
    this.createStandardRoad();
  }

  private createStandardRoad(): void {
    this.road = new Road(this.config);
    this.scene.add(this.road);
    this.scene.add(this.road);
    this.addEdges();
    this.addRoadLines();
    this.addSideObjects();
  }

  private addSideObjects(): void {
    if (!this.road) return;

    const { left, right } = this.road.getEdgePositions();

    const offset = 0.2;

    const leftX = left - offset;
    const rightX = right + offset;

    const startZ = 10;
    const endZ = this.config.length / 2;

    this.leftSideObjects = new SideObjectsInstanced(
      this.scene,
      leftX,
      this.sideObjectSpacing,
      startZ,
      endZ,
    );

    this.rightSideObjects = new SideObjectsInstanced(
      this.scene,
      rightX,
      this.sideObjectSpacing,
      startZ,
      endZ,
    );
  }

  private clearSideObjects(): void {
    this.leftSideObjects?.dispose();
    this.rightSideObjects?.dispose();

    this.leftSideObjects = null;
    this.rightSideObjects = null;
  }

  private addEdges(): void {
    if (!this.road) return;

    const { left, right } = this.road.getEdgePositions();
    const height = 10;

    const leftEdge = new RoadEdge(left, height, this.config.length);
    this.scene.add(leftEdge);
    this.edges.push(leftEdge);

    const rightEdge = new RoadEdge(right, height, this.config.length);
    this.scene.add(rightEdge);
    this.edges.push(rightEdge);
  }

  private addRoadLines(): void {
    if (!this.road) return;

    const { length } = this.config;
    if (!length) {
      throw new Error();
    }
    const lanes = this.road.getLanePositions();

    for (let i = 0; i < lanes.length - 1; i++) {
      const prev_ = lanes[i];
      const next_ = lanes[i + 1];
      if (prev_ == undefined || next_ == undefined) continue;
      const x = (prev_ + next_) / 2;

      const line = new RoadLine({
        x,
        z: -length / 2,
        length,
      });
      this.roadLines.push(line);
      this.scene.add(line);
    }
  }

  public update(deltaTime: number, speed: number): void {
    this.leftSideObjects?.update(deltaTime, speed);
    this.rightSideObjects?.update(deltaTime, speed);
  }

  public clear(): void {
    if (this.road) {
      this.scene.remove(this.road);
      this.road = null;
    }
    this.roadLines.forEach((line) => this.scene.remove(line));
    this.roadLines = [];
    this.edges.forEach((edge) => this.scene.remove(edge));
    this.edges = [];

    this.clearSideObjects();
  }

  public setRoadColor(color: number, emissive?: number): void {
    if (this.road) {
      const material = this.road.material as THREE.MeshStandardMaterial;
      material.color.setHex(color);
      if (emissive) {
        material.emissive.setHex(emissive);
      }
    }
  }

  public setOpacity(opacity: number): void {
    if (this.road) {
      (this.road.material as THREE.MeshStandardMaterial).opacity = opacity;
    }
  }

  public getConfig(): Readonly<RoadConfig> {
    return { ...this.config };
  }

  public getLanes(): number[] {
    return this.road ? this.road.getLanePositions() : this.config.lanes;
  }

  public getLanesCount(): number {
    return this.road ? this.road.getLanesCount() : this.config.lanes.length;
  }

  public getLanePosition(index: number): number {
    if (this.road) {
      return this.road.getLanePosition(index);
    }
    const lane = this.config.lanes[index];
    return lane ? lane : 0;
  }

  public updateConfig(config: Partial<RoadConfig>): void {
    this.config = { ...this.config, ...config };
    this.createRoad();
  }

  public getRoad(): Road | null {
    return this.road;
  }

  public getStats(): RoadStats {
    const lanes = this.getLanes();
    return {
      hasRoad: this.road !== null,
      lanesCount: lanes.length,
      linesCount: this.roadLines.length,
      speedLinesCount: this.speedLines.length,
      edgesCount: this.edges.length,
      // sideObjectsCount:
      //   this.leftSideObjects.length + this.rightSideObjects.length,
      lanePositions: lanes,
    };
  }

  public getEdges(): THREE.Mesh[] {
    return this.edges;
  }

  public reset(): void {
    this.clear();
    this.createRoad();
  }

  public getClosestLaneIndex(xPos: number): number {
    const lanes = this.road!.lanes;

    let closest = 0;
    let minDist = Infinity;

    for (let i = 0; i < lanes.length; i++) {
      const dist = Math.abs(xPos - lanes[i]!);

      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }

    return closest;
  }
}
