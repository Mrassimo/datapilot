/**
 * DataPilot - A lightweight CLI statistical computation engine
 */

export * from './core/types';

// Version will be updated from package.json during build
export const VERSION = '0.1.0';

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
