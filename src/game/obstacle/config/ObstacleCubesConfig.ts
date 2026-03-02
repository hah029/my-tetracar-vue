import type { CubeConfig } from "@/game/car/types";

export const OBSTACLE_FORMS: CubeConfig[][] = [
  // Стена из трёх кубиков в ряд
  [
    // нижний ряд
    { pos: [-0.7, 0.3, 0], scale: [0.7, 1, 0.7], color: 0xffaa00 },
    { pos: [0, 0.3, 0], scale: [0.7, 1, 0.7], color: 0xffbb00 },
    { pos: [0.7, 0.3, 0], scale: [0.7, 1, 0.7], color: 0xffcc00 },
    // // верхний ряд
    // { pos: [-0.7, 0.75, 0], scale: [0.7, 1, 0.7], color: 0xffaa00 },
    // { pos: [0, 0.75, 0], scale: [0.7, 1, 0.7], color: 0xffbb00 },
    // { pos: [0.7, 0.75, 0], scale: [0.7, 1, 0.7], color: 0xffcc00 },
  ],
  // Пирамидка
  // [
  //   { pos: [0, 0.25, 0], scale: [1.2, 0.5, 1.2], color: 0x44ff88 },
  //   { pos: [0, 0.75, 0], scale: [0.8, 0.5, 0.8], color: 0x44ff88 },
  //   { pos: [0, 1.25, 0], scale: [0.4, 0.5, 0.4], color: 0x44ff88 },
  // ],
  // // Куб 2x2
  // [
  //   { pos: [-0.5, 0.25, -0.5], scale: [0.9, 0.5, 0.9], color: 0xff3366 },
  //   { pos: [0.5, 0.25, -0.5], scale: [0.9, 0.5, 0.9], color: 0xff3366 },
  //   { pos: [-0.5, 0.25, 0.5], scale: [0.9, 0.5, 0.9], color: 0xff3366 },
  //   { pos: [0.5, 0.25, 0.5], scale: [0.9, 0.5, 0.9], color: 0xff3366 },
  //   { pos: [0, 0.75, 0], scale: [0.9, 0.5, 0.9], color: 0xff3366 },
  // ],
];
