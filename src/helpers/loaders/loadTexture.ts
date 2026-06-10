import * as THREE from "three";

const loader = new THREE.TextureLoader();
const textureCache = new Map<string, THREE.Texture>();
const customizedTextureCache = new Map<string, THREE.Texture>();

export interface TextureOptions {
    wrapS?: THREE.Wrapping;
    wrapT?: THREE.Wrapping;
    repeat?: { x: number; y: number };
    offset?: { x: number; y: number };
    flipY?: boolean;
};

/**
 * Загружает текстуру с возможностью применения уникальных настроек
 * @param url - путь к текстуре
 * @param options - опциональные настройки (wrap, repeat, offset)
 * @param onLoad - колбэк при загрузке
 */

export function loadTexture(
    url: string,
    options?: TextureOptions,
    onLoad?: () => void
): THREE.Texture {
    // генерируем ключ для кэша на основе URL + настроек
    const optionsKey = options ? JSON.stringify(options) : 'default';
    const cacheKey = `${url}|${optionsKey}`;
    
    // если есть текстура с такими же настройками — возвращаем
    if (customizedTextureCache.has(cacheKey)) {
        const cached = customizedTextureCache.get(cacheKey)!;
        if (onLoad) onLoad();
        return cached;
    };
    
    // получаем базовую текстуру (оригинал из основного кэша)
    const baseTexture = getBaseTexture(url);
    
    // если нет особых настроек — возвращаем оригинал
    if (!options || (Object.keys(options).length === 0)) return baseTexture;
    
    // есть особые настройки — создаём клон и применяем их
    const customizedTexture = baseTexture.clone();
    
    if (options.wrapS !== undefined) customizedTexture.wrapS = options.wrapS;
    if (options.wrapT !== undefined) customizedTexture.wrapT = options.wrapT;
    if (options.repeat) customizedTexture.repeat.set(options.repeat.x, options.repeat.y);
    if (options.offset) customizedTexture.offset.set(options.offset.x, options.offset.y);
    if (options.flipY !== undefined) customizedTexture.flipY = options.flipY;
    
    customizedTexture.needsUpdate = true;
    customizedTextureCache.set(cacheKey, customizedTexture);
    
    if (onLoad) onLoad();
    return customizedTexture;
};

function getBaseTexture(url: string): THREE.Texture {
    if (textureCache.has(url)) return textureCache.get(url)!;
    const texture = loader.load(url);
    textureCache.set(url, texture);
    return texture;
};

// обновлённый экспорт для обратной совместимости
export { getBaseTexture as loadBaseTexture };

export function getTextureCacheInfo(): { baseSize: number; customizedSize: number; totalSize: number } {
    return {
        baseSize: textureCache.size,
        customizedSize: customizedTextureCache.size,
        totalSize: textureCache.size + customizedTextureCache.size
    };
};

export function clearTextureCache(): void {
    textureCache.forEach(t => t.dispose());
    customizedTextureCache.forEach(t => t.dispose());
    textureCache.clear();
    customizedTextureCache.clear();
};