import { type CoinConfig } from "../types";
import base_texture from "@/assets/textures/cube_gold.svg";


const COIN_SIZE = 0.8;


export const DEFAULT_COIN_CONFIG: CoinConfig = {
    textureUrl: base_texture,
    x: COIN_SIZE,
    y: COIN_SIZE * 0.75,
    z: COIN_SIZE,
}