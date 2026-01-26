// Re-export from fixtures
export * from './fixtures';

// Re-export mock content generators
export * from './mockContent';

// Re-export original mockData functions (move them here eventually)
export {
  generateMockRepository,
  repositoryToCityData,
  CATEGORY_COLORS,
} from '../mockData';
