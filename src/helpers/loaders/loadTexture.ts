import * as THREE from "three";

const loader = new THREE.TextureLoader();
const textureCache = new Map<string, THREE.Texture>();

export function loadTexture(url: string) {
  if (textureCache.has(url)) {
    return textureCache.get(url)!.clone();
  }
  const texture = loader.load(
    url,
    () => {},
    undefined,
    (err) => {
      console.error("❌ Ошибка загрузки текстуры:", err);
    },
  );
  textureCache.set(url, texture);
  return texture;
}
