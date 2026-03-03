// loadGLB.ts
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

const loader = new GLTFLoader();

export async function loadGLB(url: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
        loader.load(
            url,
            (gltf) => resolve(gltf.scene.clone()),
            undefined,
            reject
        );
    });
}