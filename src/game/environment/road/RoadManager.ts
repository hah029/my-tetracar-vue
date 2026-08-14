// /game/road/RoadManager.ts

import * as THREE from "three";
import type { RoadConfig, RoadElevatedSectionConfig, RoadStats } from "./types";
import { Road } from "./Road";
import { RoadLine } from "./RoadLine";
import { RoadLane } from "./RoadLane";
import { SpeedLine } from "./SpeedLine";
import { RoadEdge } from "./edges";
import { SideObjectsInstanced } from "./SideObjectsInstanced";
import { RoadElevatedSection } from "./RoadElevatedSection";
import {
    RoadSegmentSurface,
    type RoadSegmentSurfaceCoverage,
    type RoadSegmentSurfaceCurve,
    type RoadSegmentSurfaceInterval,
    type RoadCurveMotion,
    type RoadRouteAttachment,
} from "./RoadSegmentSurface";
import { useCommonStore } from "@/store/commonStore";
import { useEnvironmentStore } from "@/store/environmentStore";
import { CarManager } from "@/game/car";

const IDLE_SURFACE_DISABLE_PADDING = 6;

export class RoadManager {
    private static instance: RoadManager | null = null;
    private road: Road | null = null;
    private roadLines: RoadLine[] = [];
    private roadLanes: RoadLane[] = [];
    private speedLines: SpeedLine[] = [];
    private edges: THREE.Mesh[] = [];
    private elevatedSections: RoadElevatedSection[] = [];
    private segmentSurfaces: RoadSegmentSurface[] = [];
    private activeRoute:
        | { motion: RoadCurveMotion; tailDistance: number }
        | null = null;
    private idleSegmentSurface: RoadSegmentSurface | null = null;
    private leftSideObjects: SideObjectsInstanced | null = null;
    private rightSideObjects: SideObjectsInstanced | null = null;
    private carManager = CarManager.getInstance();
    private config!: RoadConfig;
    private scene: THREE.Scene | null = null;

    public initialize(config: RoadConfig, scene: THREE.Scene) {
        this.config = { ...useEnvironmentStore().neonRoadConfig, ...config };
        this.scene = scene;
    };

    public static isInitialized(): boolean {
        return RoadManager.instance !== null;
    };

    public static getInstance(): RoadManager {
        if (!RoadManager.instance) {
        RoadManager.instance = new RoadManager();
        }
        return RoadManager.instance;
    };

    public hasActiveRouteTransform(): boolean {
        return this.activeRoute !== null && !this.activeRoute.motion.completed;
    };

    private isSegmentedMode(): boolean {
        return this.config.roadMode === "segmented";
    }

    public createRoad(): void {
        if (!this.scene) return;

        this.clear();
        this.createStandardRoad();
    };

    private createStandardRoad(): void {
        this.road = new Road(this.config);
        if (!this.scene) return;

        this.addEdges();
        if (this.isSegmentedMode()) {
        this.addIdleSegmentSurface();
        } else {
        this.addStaticRoadSurface();
        this.addRoadLines();
        this.addRoadLanes();
        }
        this.addElevatedSections();
        this.addSideObjects();
    };

    private addIdleSegmentSurface(): void {
        if (!this.road || !this.scene) return;

        const lanes = this.road.getLanePositions();
        const laneWidth = this.road.width / lanes.length;
        const rowLength = Math.max(
            2,
            useCommonStore().config.segmentRowMinLength / 4,
        );
        const rowCount = Math.min(40, Math.ceil(this.config.length / rowLength));

        this.idleSegmentSurface = new RoadSegmentSurface(
            this.scene,
            this.config,
            lanes,
            laneWidth,
            0,
            rowLength,
            rowCount,
            [],
            { loop: true },
        );
        this.idleSegmentSurface.setLoopOcclusionProvider(() =>
            this.getGameplayRoadIntervals(),
        );
    };

    private addStaticRoadSurface(): void {
        if (!this.road || !this.scene) return;

        const roadMesh = this.road;
        const length = this.config.length;
        const geometry = new THREE.PlaneGeometry(roadMesh.width, length);
        let material: THREE.Material;
        if (Array.isArray(roadMesh.material)) {
            material = roadMesh.material[0].clone();
        } else {
            material = roadMesh.material.clone();
        }
        
        const bigRoad = new THREE.Mesh(geometry, material);
        bigRoad.rotation.x = -Math.PI / 2;
        bigRoad.position.set(0, 0.01, -length / 8);
        bigRoad.receiveShadow = true;
        bigRoad.name = "BigRoad";
        
        this.scene.add(bigRoad);
    };

    public spawnSegmentSurface(
        baseZ: number,
        rowLength: number,
        rowCount: number,
        coverage: RoadSegmentSurfaceCoverage[] = [],
        curve?: RoadSegmentSurfaceCurve,
    ): RoadRouteAttachment | undefined {
        const MAX_ROWS_PER_CURVED_SEGMENT = 30;
        if (curve && rowCount > MAX_ROWS_PER_CURVED_SEGMENT) {
            rowCount = MAX_ROWS_PER_CURVED_SEGMENT;
        }
        if (!this.road || !this.scene || !this.isSegmentedMode()) return;

        const lanes = this.road.getLanePositions();
        const laneWidth = this.road.width / lanes.length;

        let motion: RoadCurveMotion | undefined;
        let routeAttachment: RoadRouteAttachment | undefined;

        if (curve && this.config.enableCurvedSegments) {
            motion = {
                direction: curve.direction,
                pivotX: curve.pivotX,
                pivotZ: baseZ,
                turnStartZ: curve.rotateEndZ,
                radius: curve.radius,
                totalAngleRad: curve.totalAngleRad,
                angleRad: 0,
                phase: "approach",
                completed: false,
            };
            this.activeRoute = { motion, tailDistance: 0 };
            routeAttachment = { motion, startDistance: 0 };
        } else if (this.activeRoute && !this.activeRoute.motion.completed) {
            routeAttachment = {
                motion: this.activeRoute.motion,
                startDistance: this.activeRoute.tailDistance,
            };
            this.activeRoute.tailDistance += rowCount * rowLength;
        }

        this.segmentSurfaces.push(
        new RoadSegmentSurface(
            this.scene,
            this.config,
            lanes,
            laneWidth,
            baseZ,
            rowLength,
            rowCount,
            coverage,
            {
                curve: curve && this.config.enableCurvedSegments ? curve : undefined,
                motion,
                routeAttachment: curve ? undefined : routeAttachment,
            },
        ),
        );

        return routeAttachment;
    };

    private addElevatedSections(): void {
        if (!this.road || !this.scene) return;
        if (!this.isSegmentedMode() || !this.config.enableElevatedSegments) return;

        const sections = this.config.elevatedSections ?? [];
        if (sections.length === 0) return;

        const lanes = this.road.getLanePositions();
        const laneWidth = this.road.width / lanes.length;

        for (const sectionConfig of sections) {
        this.elevatedSections.push(
            new RoadElevatedSection(
            this.scene,
            sectionConfig,
            this.config,
            lanes,
            laneWidth,
            ),
        );
        }
    };

    public spawnElevatedSection(sectionConfig: RoadElevatedSectionConfig): void {
        if (!this.road || !this.scene) return;
        if (!this.isSegmentedMode() || !this.config.enableElevatedSegments) return;

        const lanes = this.road.getLanePositions();
        const laneWidth = this.road.width / lanes.length;
        this.elevatedSections.push(
        new RoadElevatedSection(
            this.scene,
            { ...sectionConfig, loop: false },
            this.config,
            lanes,
            laneWidth,
        ),
        );
    };

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
        this.scene!,
        leftX,
        startZ,
        endZ,
        {
            ...sideObjects,
            spacing: sideObjects.spacing * useCommonStore().config.xzScaling,
        },
        );
        this.leftSideObjects.setOcclusionProvider(() =>
        this.getCurvedRoadIntervals(),
        );

        this.rightSideObjects = new SideObjectsInstanced(
        this.scene!,
        rightX,
        startZ,
        endZ,
        {
            ...sideObjects,
            spacing: sideObjects.spacing * useCommonStore().config.xzScaling,
        },
        );
        this.rightSideObjects.setOcclusionProvider(() =>
        this.getCurvedRoadIntervals(),
        );
    };

    private clearSideObjects(): void {
        this.leftSideObjects?.dispose();
        this.rightSideObjects?.dispose();

        this.leftSideObjects = null;
        this.rightSideObjects = null;
    };

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
    };

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
    };

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
    };

    public update(deltaTime: number, speed: number): void {
        if (this.isSegmentedMode() && this.activeRoute && !this.activeRoute.motion.completed) {
          const motion = this.activeRoute.motion;
          let remainingTravel = deltaTime * speed;
          if (motion.phase === "approach") {
            const approachDistance = Math.max(0, motion.turnStartZ - motion.pivotZ);
            const approachTravel = Math.min(remainingTravel, approachDistance);
            motion.pivotZ += approachTravel;
            remainingTravel -= approachTravel;
            if (motion.pivotZ >= motion.turnStartZ) {
              motion.pivotZ = motion.turnStartZ;
              motion.phase = "turning";
            }
          }

          if (motion.phase === "turning" && remainingTravel > 0) {
            motion.angleRad -= remainingTravel / motion.radius;
            if (motion.angleRad <= -motion.totalAngleRad) {
              motion.angleRad = -motion.totalAngleRad;
              motion.phase = "completed";
              motion.completed = true;
              this.activeRoute = null;
            }
          }
        }

        this.leftSideObjects?.update(deltaTime, speed);
        this.rightSideObjects?.update(deltaTime, speed);

        if (this.isSegmentedMode()) {
          for (let i = this.segmentSurfaces.length - 1; i >= 0; i--) {
            const surface = this.segmentSurfaces[i];
            if (!surface) continue;
            if (surface.update(deltaTime, speed)) {
              surface.dispose();
              this.segmentSurfaces.splice(i, 1);
            }
          }
        }

        for (let i = this.elevatedSections.length - 1; i >= 0; i--) {
        const section = this.elevatedSections[i];
        if (!section) continue;
        if (section.update(deltaTime, speed)) {
            section.dispose();
            this.elevatedSections.splice(i, 1);
        }
        }
        if (this.isSegmentedMode()) {
          if (this.shouldDisableIdleSegmentSurface()) {
            this.clearIdleSegmentSurface();
          } else {
            this.idleSegmentSurface?.update(deltaTime, speed);
          }
        }

        this.updateCurrentLane(this.carManager.getCar().getCurrentLane());
    };

    private updateCurrentLane(currentLane: number) {
        for (let i = 0; i < this.roadLanes.length; i++) {
        if (i == currentLane) {
            this.roadLanes[i].visible = true;
        } else {
            this.roadLanes[i].visible = false;
        }
        }
    };

    public clear(): void {
        // Удаляем большую дорогу, если она есть
        if (this.scene) {
            const bigRoad = this.scene.getObjectByName("BigRoad");
            if (bigRoad) {
                this.scene.remove(bigRoad);
                if (bigRoad instanceof THREE.Mesh) {
                    bigRoad.geometry.dispose();
                    if (Array.isArray(bigRoad.material)) {
                        bigRoad.material.forEach(m => m.dispose());
                    } else {
                        bigRoad.material.dispose();
                    }
                }
            }
        }

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
        this.elevatedSections.forEach((section) => section.dispose());
        this.elevatedSections = [];
        this.segmentSurfaces.forEach((surface) => surface.dispose());
        this.segmentSurfaces = [];
        this.activeRoute = null;
        this.clearIdleSegmentSurface();

        this.clearSideObjects();
    };

    private clearIdleSegmentSurface(): void {
        this.idleSegmentSurface?.dispose();
        this.idleSegmentSurface = null;
    };

    private shouldDisableIdleSegmentSurface(): boolean {
        if (!this.idleSegmentSurface || this.segmentSurfaces.length === 0) {
        return false;
        }

        const visibleFrontZ =
        useCommonStore().config.itemsRemovingZpos + IDLE_SURFACE_DISABLE_PADDING;

        if (this.segmentSurfaces.some((surface) => surface.isCurved())) {
        return true;
        }

        return this.segmentSurfaces.some(
        (surface) => surface.getFrontEdgeZ() >= visibleFrontZ,
        );
    };

    private getGameplayRoadIntervals(): RoadSegmentSurfaceInterval[] {
        return [
        ...this.segmentSurfaces.flatMap((surface) =>
            surface.getSurfaceIntervals(),
        ),
        ...this.elevatedSections.flatMap((section) =>
            section.getSurfaceIntervals(),
        ),
        ];
    };

    private getCurvedRoadIntervals(): { back: number; front: number }[] {
        return this.segmentSurfaces
        .map((surface) => surface.getSideObjectOcclusionInterval())
        .filter((interval): interval is { back: number; front: number } =>
            interval !== null,
        );
    };

    public dispose(): void {
        this.clear();
        this.scene = null;
    };

    public setRoadColor(color: number, emissive?: number): void {
        if (this.road) {
        const material = this.road.material as THREE.MeshStandardMaterial;
        material.color.setHex(color);
        if (emissive) {
            material.emissive.setHex(emissive);
        }
        }
    };

    public setOpacity(opacity: number): void {
        if (this.road) {
        (this.road.material as THREE.MeshStandardMaterial).opacity = opacity;
        }
    };

    public getConfig(): Readonly<RoadConfig> {
        return { ...this.config };
    };

    public getLanes(): number[] {
        return this.road ? this.road.getLanePositions() : this.config.lanes;
    };

    public getLanesCount(): number {
        return this.road ? this.road.getLanesCount() : this.config.lanes.length;
    };

    public getLanePosition(index: number): number {
        if (this.road) {
        return this.road.getLanePosition(index);
        }
        const lane = this.config.lanes[index];
        return lane ? lane : 0;
    };

    public getSurfaceHeightAt(lane: number, z: number = 0): number {
        let height = 0;

        for (const section of this.elevatedSections) {
        const candidate = section.getHeightAt(lane, z);
        if (candidate === 0) continue;
        if (height === 0 || Math.abs(candidate) > Math.abs(height)) {
            height = candidate;
        }
        }

        return height;
    };

    public updateConfig(config: Partial<RoadConfig>): void {
        this.config = { ...this.config, ...config };
        this.createRoad();
    };

    public getRoad(): Road | null {
        return this.road;
    };

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
    };

    public getEdges(): THREE.Mesh[] {
        return this.edges;
    };

    public reset(): void {
        this.clear();
        this.createRoad();
    };

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
    };
}
