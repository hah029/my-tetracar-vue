import * as THREE from "three";

export type AudioMap = {
  [key: string]: THREE.Audio;
};

export type AudioConfig = {
  [key: string]: string;
};
