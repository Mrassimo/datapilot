/**
 * Version utility - Reads version from package.json
 */

import { readFileSync } from 'fs';
import { join } from 'path';

let cachedVersion: string | null = null;

/**
 * Get the current DataPilot version from package.json
 */
export function getDataPilotVersion(): string {
  if (cachedVersion) {
    return cachedVersion;
  }

  try {
    // Try to read package.json from the project root
    // This works whether we're running from dist/ or src/
    const packageJsonPath = join(__dirname, '..', '..', 'package.json');
    const packageJsonContent = readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);
    
    cachedVersion = packageJson.version;
    return cachedVersion;
  } catch (error) {
    // Fallback in case package.json can't be read
    // This should only happen in unusual deployment scenarios
    return '1.7.0';
  }
}