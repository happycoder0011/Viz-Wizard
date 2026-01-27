/**
 * Analysis Module Exports
 *
 * Combines velocity, ownership, and hotspot analysis.
 */

export {
  calculateVelocity,
  getHighVelocityFiles,
  getStaleFiles,
  getVelocityLevel,
  type FileVelocity,
  type VelocityOptions,
} from './velocity';

export {
  calculateOwnership,
  getHighRiskOwnershipFiles,
  getFilesByOwner,
  getUniqueContributors,
  getOwnershipRiskColor,
  type FileOwnership,
  type Contributor,
} from './ownership';

export {
  detectHotspots,
  getHotspotColor,
  getHotspotsByCategory,
  calculateCodebaseHealth,
  type Hotspot,
  type HotspotFactors,
  type HotspotWeights,
} from './hotspots';
