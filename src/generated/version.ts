// Этот файл генерируется автоматически. Не редактировать вручную!

export const APP_VERSION = '0.0.20';
export const BUILD_TIME = '2026-05-26T20:05:29.522Z';
export const BUILD_TIMESTAMP = 1779825929522;

export const VERSION_INFO = {
  version: APP_VERSION,
  buildTime: BUILD_TIME,
  buildTimestamp: BUILD_TIMESTAMP,
///  mode: process.env.NODE_ENV || 'development'
} as const;

export const getVersionString = () => `v${APP_VERSION}`;
export const getFullVersionInfo = () => `${APP_VERSION} (build: ${BUILD_TIMESTAMP})`;

// Для обратной совместимости
export default VERSION_INFO;
