import type { CubeConfig } from "@/game/car/types";

const SCALING = 0.3;

const X_POSITION_OFFSET = 0.66;
const Y_POSITION = 0.3;
const Z_POSITION = 0;

export const OBSTACLE_FORMS: CubeConfig[][] = [
  // Стена из трёх кубиков в ряд
  [
    // нижний ряд
    {
      pos: [-X_POSITION_OFFSET, Y_POSITION, Z_POSITION],
      scale: [SCALING, SCALING, SCALING],
      color: 0xffaa00,
    },
    {
      pos: [0, Y_POSITION, Z_POSITION],
      scale: [SCALING, SCALING, SCALING],
      color: 0xffbb00,
    },
    {
      pos: [X_POSITION_OFFSET, Y_POSITION, Z_POSITION],
      scale: [SCALING, SCALING, SCALING],
      color: 0xffcc00,
    },
  ],
];
