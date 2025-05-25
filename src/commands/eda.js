import { edaComprehensive } from './eda/index.js';

export async function eda(filePath, options = {}) {
  // Use the new comprehensive EDA analysis
  return edaComprehensive(filePath, options);
}