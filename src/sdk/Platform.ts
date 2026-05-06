import type { IGamePlatform } from "./IGamePlatform";
import { YandexPlatform } from "./platforms/Yandex";
import { LocalStoragePlatform } from "./platforms/Local";

export type { IGamePlatform };




// фабрика для создания нужной платформы
export class Platform {
    private static instance: IGamePlatform | null = null;

    static getInstance(): IGamePlatform {

        if (Platform.instance !== null) return Platform.instance;

        let instance: IGamePlatform | null = null;

        // Определяем платформу по наличию глобальных объектов
        if (typeof YaGames !== "undefined") {
            instance = new YandexPlatform();
        };

        // Здесь будут условия для VK, CrazyGames и других
        // if (typeof VK !== 'undefined') return new VKPlatform();

        ///throw new Error('Platform not supported');

        // Для Dev режима используем LocalStorage
        // if (import.meta.env.DEV) {
        //     instance = new LocalStoragePlatform();
        // };
        if (instance === null) {
            instance = new LocalStoragePlatform();
        }

        // console.log("Platform not supported!");

        Platform.instance = instance;
        return instance;
    };
};
