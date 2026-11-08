export const ATLAS_SPRITES = {
    building: "building",
    roadTile: "road_tile",
    cube: {
        base: "cube_base",
        armor: "cube_armor",
        bullet: "cube_bullet",
        energon: "cube_energon",
        gold: "cube_gold",
        magnet: "cube_magnet",
        nitro: "cube_nitro",
        obstacle3x: "cube_obstacle_3x",
    },
} as const;

export type AtlasSpriteName =
    | typeof ATLAS_SPRITES.building
    | typeof ATLAS_SPRITES.roadTile
    | (typeof ATLAS_SPRITES.cube)[keyof typeof ATLAS_SPRITES.cube];

export const REQUIRED_ATLAS_SPRITES: AtlasSpriteName[] = [
    ATLAS_SPRITES.building,
    ATLAS_SPRITES.roadTile,
    ATLAS_SPRITES.cube.base,
    ATLAS_SPRITES.cube.armor,
    ATLAS_SPRITES.cube.bullet,
    ATLAS_SPRITES.cube.energon,
    ATLAS_SPRITES.cube.gold,
    ATLAS_SPRITES.cube.magnet,
    ATLAS_SPRITES.cube.nitro,
    ATLAS_SPRITES.cube.obstacle3x,
];

export const ITEM_ATLAS_SPRITES = {
    golden: ATLAS_SPRITES.cube.gold,
    energon: ATLAS_SPRITES.cube.energon,
    nitro: ATLAS_SPRITES.cube.nitro,
    shield: ATLAS_SPRITES.cube.armor,
    magnet: ATLAS_SPRITES.cube.magnet,
    bullet: ATLAS_SPRITES.cube.bullet,
} as const satisfies Record<string, AtlasSpriteName>;

export const OBSTACLE_ATLAS_SPRITES = {
    default: ATLAS_SPRITES.cube.obstacle3x,
    enemyCar: ATLAS_SPRITES.cube.base,
} as const satisfies Record<string, AtlasSpriteName>;
