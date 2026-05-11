// src/game/coin/Coin.ts
import { CoinItem } from "./CoinItem";
import { useCommonStore } from "@/store/commonStore";

export class Energon extends CoinItem {
  constructor(
    zPos: number,
    laneIndex?: number,
    xPos?: number,
    yPos?: number,
    value: number = useCommonStore().BASE_COIN_VALUE,
  ) {
    super(zPos, laneIndex, xPos, yPos);
    this.value = value;
  }

  // async build(material: MaterialConfig | null = null): Promise<void> {
  //   const config = {
  //     ...ENERGON_CONFIG,
  //     useTexture: material != null,
  //     materialConfig: material != null ? material : undefined,
  //   };

  //   try {
  //     this.cube = await CubeBuilder.build(config);
  //     this.cube.position.copy(this.initialPosition);
  //     this.add(this.cube);
  //   } catch (error) {
  //     console.error("[Energon] build error:", error);
  //     throw error;
  //   }
  // }
}
