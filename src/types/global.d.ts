import type { IGamePlatform } from '@/sdk/PlatformFactory';

declare global {
  interface Window {
    platform: IGamePlatform;
  };
};

export {};