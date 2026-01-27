/**
 * GitHub Module Exports
 */

export {
  GitHubClient,
  GitHubAPIError,
  githubClient,
  type GitHubFile,
  type GitHubTreeItem,
  type GitHubRepo,
  type GitHubCommit,
  type GitHubRateLimit,
  type GitHubClientConfig,
} from './client';

export {
  getCommitHistory,
  getCommitDetails,
  getFileHistory,
  buildFileCommitMap,
  getContributors,
  type CommitInfo,
  type CommitFileChange,
  type GitHistoryOptions,
} from './history';
