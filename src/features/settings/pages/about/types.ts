export interface AboutMetadata {
  appName: string;
  version: string;
  repositoryUrl: string;
  releasesUrl: string;
  issuesUrl: string;
  docsUrl: string;
  contactUrl: string;
}

export interface AboutMetadataPayload {
  appName: string;
  version: string;
  repositoryUrl: string;
  releasesUrl: string;
  issuesUrl: string;
  docsUrl: string;
  contactUrl: string;
}

export interface UpdatePreferences {
  includePrerelease: boolean;
}

export interface UpdatePreferencesPayload {
  includePrerelease: boolean;
}

export interface UpdateCheckResult {
  status: string;
  currentVersion: string;
  latestVersion: string | null;
  updateAvailable: boolean;
  notes: string | null;
  publishedAt: string | null;
  detail: string;
}

export interface UpdateCheckResultPayload {
  status: string;
  currentVersion: string;
  latestVersion?: string | null;
  updateAvailable: boolean;
  notes?: string | null;
  publishedAt?: string | null;
  detail: string;
}
