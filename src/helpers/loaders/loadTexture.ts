import * as THREE from "three";

const loader = new THREE.TextureLoader();
const textureCache = new Map<string, THREE.Texture>();

export function loadTexture(url: string, onLoad?: () => void): THREE.Texture {
    if (textureCache.has(url)) {
        const cached = textureCache.get(url)!;

        // проверяем, что изображение загружено
        const img = cached.image as HTMLImageElement;
        if (img && img.complete) {
            if (onLoad) onLoad();
            return cached.clone();
        };
    };
    
    const texture = loader.load(
        url,
        () => {
            texture.needsUpdate = true;
            if (onLoad) onLoad();
        },
        undefined,
        (err) => console.error("❌ Ошибка загрузки текстуры:", url, err)
    );
    
    textureCache.set(url, texture);
    return texture;
};