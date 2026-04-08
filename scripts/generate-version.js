#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Читаем package.json
const packagePath = path.resolve(__dirname, '../package.json');
const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Генерируем файл с версией
const versionContent = `// Этот файл генерируется автоматически. Не редактировать вручную!

export const APP_VERSION = '${packageData.version}';
export const BUILD_TIME = '${new Date().toISOString()}';
export const BUILD_TIMESTAMP = ${Date.now()};

export const VERSION_INFO = {
  version: APP_VERSION,
  buildTime: BUILD_TIME,
  buildTimestamp: BUILD_TIMESTAMP,
///  mode: process.env.NODE_ENV || 'development'
} as const;

export const getVersionString = () => \`v\${APP_VERSION}\`;
export const getFullVersionInfo = () => \`\${APP_VERSION} (build: \${BUILD_TIMESTAMP})\`;

// Для обратной совместимости
export default VERSION_INFO;
`;

// Записываем файл
const outputPath = path.resolve(__dirname, '../src/generated/version.ts');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, versionContent);

console.log(`✅ Файл версии сгенерирован: ${packageData.version}`);