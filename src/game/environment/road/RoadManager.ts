// /game/road/RoadManager.ts

import * as THREE from "three";
import type { RoadConfig, RoadStats } from "./types";
import { Road } from "./Road";
import { RoadLine } from "./RoadLine";
import { RoadLane } from "./RoadLane";
import { SpeedLine } from "./SpeedLine";
import { RoadEdge } from "./edges";
import { SideObjectsInstanced } from "./SideObjectsInstanced";
import { useCommonStore } from "@/store/commonStore";
import { useEnvironmentStore } from "@/store/environmentStore";
import { CarManager } from "@/game/car";

export class RoadManager {
  private static instance: RoadManager | null = null;
  private road: Road | null = null;
  private roadLines: RoadLine[] = [];
  private roadLanes: RoadLane[] = [];
  private speedLines: SpeedLine[] = [];
  private edges: THREE.Mesh[] = [];
  private leftSideObjects: SideObjectsInstanced | null = null;
  private rightSideObjects: SideObjectsInstanced | null = null;
  private carManager = CarManager.getInstance();

  private config!: RoadConfig;
  private scene: THREE.Scene | null = null;

  public initialize(config: RoadConfig, scene: THREE.Scene) {
    this.config = { ...useEnvironmentStore().neonRoadConfig, ...config };
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
    if (!this.scene) return;

    this.clear();
    this.createStandardRoad();
  }

  private createStandardRoad(): void {
    this.road = new Road(this.config);
    if (!this.scene) return;

    this.scene.add(this.road);
    this.addEdges();
    this.addRoadLines();
    this.addRoadLanes();
    this.addSideObjects();
  }

  private addSideObjects(): void {
    if (!this.road) return;
    const sideObjects = this.config.sideObjects;

    if (!sideObjects?.enabled) return;

    const { left, right } = this.road.getEdgePositions();

    const offset = sideObjects.offset;

    const leftX = left - offset;
    const rightX = right + offset;

    const startZ = useCommonStore().config.itemsRemovingZpos;
    const endZ = this.config.length;

    this.leftSideObjects = new SideObjectsInstanced(
      this.scene,
      leftX,
      startZ,
      endZ,
      {
        ...sideObjects,
        spacing: sideObjects.spacing * useCommonStore().config.xzScaling,
      },
    );

    this.rightSideObjects = new SideObjectsInstanced(
      this.scene,
      rightX,
      startZ,
      endZ,
      {
        ...sideObjects,
        spacing: sideObjects.spacing * useCommonStore().config.xzScaling,
      },
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
    const environmentStore = useEnvironmentStore();
    const edgeConfig = environmentStore.currentRoad.edges;
    const color = environmentStore.colorToNumber(edgeConfig.color);

    const leftEdge = new RoadEdge(
      left,
      edgeConfig.height,
      this.config.length,
      color,
      edgeConfig.opacity,
    );
    this.scene?.add(leftEdge);
    this.edges.push(leftEdge);

    const rightEdge = new RoadEdge(
      right,
      edgeConfig.height,
      this.config.length,
      color,
      edgeConfig.opacity,
    );
    this.scene?.add(rightEdge);
    this.edges.push(rightEdge);
  }

  private addRoadLines(): void {
    if (!this.road) return;

    const { length } = this.config;
    if (!length) {
      throw new Error();
    }
    const lanes = this.road.getLanePositions();
    const lineColor = this.config.laneColor ?? this.config.emissive ?? 0x888888;

    for (let i = 0; i < lanes.length - 1; i++) {
      const prev_ = lanes[i];
      const next_ = lanes[i + 1];
      if (prev_ == undefined || next_ == undefined) continue;
      const x = (prev_ + next_) / 2;

      const line = new RoadLine({
        x,
        z: -length / 2,
        length,
        color: lineColor,
        emissive: lineColor,
      });
      this.roadLines.push(line);
      this.scene?.add(line);
    }
  }
  private addRoadLanes(): void {
    if (!this.road) return;

    const { length } = this.config;
    if (!length) {
      throw new Error();
    }
    const lanes = this.road.lanes;

    const width = this.road.width / lanes.length;
    const laneColor = this.config.laneColor ?? this.config.emissive ?? 0x66ccff;

    console.log("lanes", lanes);

    for (let i = 0; i < lanes.length; i++) {
      const laneX = lanes[i];

      if (laneX == undefined) continue;
      const lane = new RoadLane({
        x: laneX,
        z: -length / 2,
        length,
        width,
        color: laneColor,
      });
      this.roadLanes.push(lane);
      this.scene?.add(lane);
    }
  }

  public update(deltaTime: number, speed: number): void {
    this.leftSideObjects?.update(deltaTime, speed);
    this.rightSideObjects?.update(deltaTime, speed);

    this.updateCurrentLane(this.carManager.getCar().getCurrentLane());
  }

  private updateCurrentLane(currentLane: number) {
    for (let i = 0; i < this.roadLanes.length; i++) {
      if (i == currentLane) {
        this.roadLanes[i].visible = true;
      } else {
        this.roadLanes[i].visible = false;
      }
    }
  }

  public clear(): void {
    if (this.road) {
      this.scene?.remove(this.road);
      this.road = null;
    }
    this.roadLines.forEach((line) => this.scene?.remove(line));
    this.roadLines = [];
    this.roadLanes.forEach((line) => this.scene?.remove(line));
    this.roadLanes = [];
    this.edges.forEach((edge) => this.scene?.remove(edge));
    this.edges = [];

    this.clearSideObjects();
  }

  public dispose(): void {
    this.clear();
    this.scene = null;
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
