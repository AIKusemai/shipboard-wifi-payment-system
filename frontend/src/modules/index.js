import { wifiModule } from './wifi';

const enabledModules = [wifiModule];

export const moduleRoutes = enabledModules.flatMap((module) => module.routes || []);
export const moduleNavLinks = enabledModules.flatMap((module) => module.navLinks || []);
