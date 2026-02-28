// Главный файл, экспортирующий всё необходимое
import { CarManager } from "./CarManager";

export * from "./types";
export * from "./config";
export * from "./Car";
export * from "./CarManager";
export * from "./CarCollider";
export * from "./CarCubesBuilder";
export * from "./CarPhysics";

// Создаем и экспортируем синглтон
export const carManager = CarManager.getInstance();

// Для обратной совместимости
export const createCar = (config?: CarConfig) => carManager.createCar(config);
export const getCar = () => carManager.getCar();
export const updateCar = () => carManager.update();
export const moveLeft = () => carManager.moveLeft();
export const moveRight = () => carManager.moveRight();
export const jump = () => carManager.jump();
export const resetCar = () => carManager.resetCar();