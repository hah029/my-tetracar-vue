import type { IGamePlatform } from "./IGamePlatform";
import { YandexPlatform } from "./platforms/Yandex";
import { LocalStoragePlatform } from "./platforms/Local";

// фабрика для создания нужной платформы
export class Platform {
  private static instance: IGamePlatform | null = null;

  static getInstance(): IGamePlatform {
    // console.log(
    //   "🔵 Platform.getInstance() called, typeof YaGames =",
    //   typeof YaGames,
    // );
    if (Platform.instance !== null) {
    //   console.log(
    //     "🔵 Platform.getInstance() returning cached instance:",
    //     Platform.instance.constructor.name,
    //   );
      return Platform.instance;
    }

    let instance: IGamePlatform | null = null;

    // Определяем платформу по наличию глобальных объектов
    if (typeof YaGames !== "undefined") {
    //   console.log(
    //     "🔵 Platform.getInstance() YaGames FOUND, creating YandexPlatform",
    //   );
      instance = new YandexPlatform();
    } else {
    //   console.log(
    //     "🔵 Platform.getInstance() YaGames NOT FOUND, will use LocalStoragePlatform",
    //   );
    }

    // Здесь будут условия для VK, CrazyGames и других
    // if (typeof VK !== 'undefined') return new VKPlatform();

    ///throw new Error('Platform not supported');

    // Для Dev режима используем LocalStorage
    // if (import.meta.env.DEV) {
    //     instance = new LocalStoragePlatform();
    // };
    if (instance === null) {
    //   console.log("🔵 Platform.getInstance() creating LocalStoragePlatform");
      instance = new LocalStoragePlatform();
    }

    // console.log("Platform not supported!");

    Platform.instance = instance;
    // console.log(
    //   "🔵 Platform.getInstance() returning new instance:",
    //   instance.constructor.name,
    // );
    return instance;
  }
}
