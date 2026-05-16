import * as THREE from "three";
import { RoadManager } from "@/game/road/RoadManager";
import { RoadEdge } from "@/game/road/edges";
import { BaseItem } from "./items/BaseItem";
import { useCommonStore } from "@/store/commonStore";
import { CubePhysics } from "@/game/physics/CubePhysics";
import { type CubePhysicsConfig } from "@/game/physics/CubePhysics";
import { makeWeightedChoice } from "@/helpers/functions";
import type { GeometryConfig } from "../cube/types";

export type TransformationObject = {
  dropType: string;
  position: THREE.Vector3;
};

export type DestructionCell = {
  localPosition: THREE.Vector3;
  localQuaternion: THREE.Quaternion;
  geomConfig: GeometryConfig;
};

export class DestructionManager {
  private static instance: DestructionManager | null = null;
  private physicsConfig: CubePhysicsConfig = {
    gravity: useCommonStore().GRAVITY,
    friction: useCommonStore().FRICTION,
    bounceFactor: useCommonStore().BOUNCE_FACTOR,
    collisionFactor: useCommonStore().COLLISION_FACTOR,
    removalHeight: useCommonStore().REMOVAL_HEIGHT,
  };

  private weightsMapping = useCommonStore().DESTROYED_ROLLDROP_WEIGHTS;

  public static getInstance(): DestructionManager {
    if (!DestructionManager.instance) {
      DestructionManager.instance = new DestructionManager();
    }
    return DestructionManager.instance;
  }

  public getTransformations(
    cells: DestructionCell[],
    transformRequired: boolean = true,
  ): TransformationObject[] {
    let items: TransformationObject[] = [];

    cells.forEach((cell) => {
      const drop = transformRequired ? this.rollDrop() : null;
      if (drop) {
        items.push({ position: cell.localPosition, dropType: drop });
      }
    });

    return items;
  }

  public update(flyingItems: BaseItem[], deltaTime: number, speed?: number) {
    const edges = RoadManager.getInstance()
      .getEdges()
      .filter((e) => e instanceof RoadEdge) as RoadEdge[];

    CubePhysics.update(flyingItems, this.physicsConfig, edges, deltaTime);

    // Обновляем коллайдеры летящих айтемов после физики
    for (let item of flyingItems) {
      item.collider.center.copy(item.position);
      this.tryLand(item);
    }
  }

  private tryLand(item: BaseItem) {
    const ud = item.userData;
    const v: THREE.Vector3 = ud.velocity;

    if (ud.status !== "flying") {
      return;
    }
    if (!v) {
      return;
    }

    const slowEnough = v.lengthSq() < 0.2;
    const nearGround = item.position.y <= useCommonStore().BASE_ITEM_YPOS * 1.1;

    if (!slowEnough || !nearGround) return;
    ud.status = "landed";

    item.position.x = item.position.x;
    item.position.y = useCommonStore().BASE_ITEM_YPOS / 2;

    // останавливаем физику
    ud.velocity.set(0, 0, 0);
    ud.rotationSpeed?.set(0, 0, 0);
  }

  private rollDrop(): keyof typeof this.weightsMapping {
    return makeWeightedChoice(
      this.weightsMapping,
    ) as keyof typeof this.weightsMapping;
  }
}
