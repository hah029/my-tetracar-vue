// Главный файл, экспортирующий всё необходимое
import { RoadManager } from "./RoadManager";

export * from "./types";
export * from "./config";
export * from "./Road";
export * from "./RoadLine";
export * from "./SpeedLine";
export * from "./edges";
export * from "./SideObject";


export { RoadManager };

// Для обратной совместимости
export const createRoad = (useNeon: boolean = false) => {
  const manager = RoadManager.getInstance();
  return manager.createRoad(useNeon);
};

export const createNeonRoad = () => {
  const manager = RoadManager.getInstance();
  return manager.createRoad(true);
};

export const updateRoadLines = (speed: number) => {
  const manager = RoadManager.getInstance();
  return manager.update(speed);
};
