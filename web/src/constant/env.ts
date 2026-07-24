import { version as packageVersion } from "../../package.json";

export const APP_VERSION = packageVersion || __APP_VERSION__ || "0.1.2";
