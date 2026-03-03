import * as THREE from "three";


const loader = new THREE.TextureLoader();


export function loadTexture(url: string) {
    return loader.load(
        url,
        () => {
            console.log("✅ Текстура успешно загружена");
            // можно принудительно обновить материал, если нужно
        },
        undefined,
        (err) => {
            console.error("❌ Ошибка загрузки текстуры:", err);
        },
    );
}