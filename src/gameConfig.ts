import pkg from '../package.json'

export const APP_VERSION = pkg.version;
export const APP_NAME = pkg.appName;
export const TEAM_NAME = pkg.teamName;
export const CURRENT_YEAR = new Date().getFullYear();

