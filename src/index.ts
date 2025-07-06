/**
 * DataPilot - A lightweight CLI statistical computation engine
 */

export * from './core/types';
import { getDataPilotVersion } from './utils/version';

// Version dynamically loaded from package.json
export const VERSION = getDataPilotVersion();

export const DATAPILOT_ASCII_ART = `
╔╦╗╔═╗╔╦╗╔═╗╔═╗╦╦  ╔═╗╔╦╗
 ║║╠═╣ ║ ╠═╣╠═╝║║  ║ ║ ║ 
═╩╝╩ ╩ ╩ ╩ ╩╩  ╩╩═╝╚═╝ ╩ 
`;

export const WELCOME_MESSAGE = `
DataPilot v${VERSION}
A lightweight, powerful CLI statistical computation engine
DataPilot does the maths, so AI (or you) can derive the meaning.
`;
// NPM token test comment
