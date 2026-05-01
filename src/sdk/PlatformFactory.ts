import type { IGamePlatform } from "./IGamePlatform";
import { YandexPlatform } from "./platforms/Yandex";
import { LocalStoragePlatform } from "./platforms/Local";

// 3. Фабрика для создания нужной платформы
export class PlatformFactory {
  static getPlatform(): IGamePlatform | null {
    // Определяем платформу по наличию глобальных объектов
    if (typeof YaGames !== "undefined") {
      return new YandexPlatform();
    }

    // Здесь будут условия для VK, CrazyGames и других
    // if (typeof VK !== 'undefined') return new VKPlatform();

    ///throw new Error('Platform not supported');

    // Для Dev режима используем LocalStorage
    if (import.meta.env.DEV) {
      return new LocalStoragePlatform();
    }
    console.log("Platform not supported!");

    return null;
  }
}
