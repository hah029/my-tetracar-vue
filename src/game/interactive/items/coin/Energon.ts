// src/game/coin/Coin.ts
import type { MaterialConfig } from "@/game/cube/types";
import { CoinItem } from "./CoinItem";
import { CubeBuilder } from "@/game/cube/Cube";
import { ENERGON_GEOMETRY_CONFIG } from "../BaseConfig";
import { useCommonStore } from "@/store/commonStore";

const ENERGON_CONFIG = {
  useGLB: true,
  geomConfig: ENERGON_GEOMETRY_CONFIG,
  useTexture: false,
  materialConfig: null,
};

export class Energon extends CoinItem {
  constructor(
    laneIndex: number,
    zPos: number,
    yPos?: number,
    value: number = useCommonStore().BASE_COIN_VALUE,
  ) {
    super(laneIndex, zPos, yPos);
    this.value = value;
    this.itemType = "energon";
    this.userData.isCoin = true;
    this.userData.coinType = "energon";
  }

  async build(material: MaterialConfig | null = null): Promise<void> {
    const config = {
      ...ENERGON_CONFIG,
      useTexture: material != null,
      materialConfig: material != null ? material : undefined,
    };

    try {
      this.cube = await CubeBuilder.build(config);
      this.cube.position.copy(this.initialPosition);
      this.add(this.cube);
    } catch (error) {
      console.error("[Energon] build error:", error);
      throw error;
    }
  }
}
