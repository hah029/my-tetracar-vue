// loadCubeModel

import { loadGLB } from "@/helpers/loaders/loadGLB";
import * as THREE from "three";

const modelCache = new Map<string, THREE.Group>();


export async function loadCubeModel(url: string): Promise<THREE.Group> {
    if (modelCache.has(url)) {
        return modelCache.get(url)!.clone();
    }
    const model = await loadGLB(url);
    modelCache.set(url, model);
    return model.clone();
}
