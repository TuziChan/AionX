import { invoke } from '@tauri-apps/api/core';
import type {
  AboutMetadata,
  AboutMetadataPayload,
  UpdateCheckResult,
  UpdateCheckResultPayload,
  UpdatePreferences,
  UpdatePreferencesPayload,
} from '../pages/about/types';

export async function getAppMetadata(): Promise<AboutMetadata> {
  const result = await invoke<AboutMetadataPayload>('get_app_metadata');
  return normalizeMetadata(result);
}

export async function getUpdatePreferences(): Promise<UpdatePreferences> {
  const result = await invoke<UpdatePreferencesPayload>('get_update_preferences');
  return normalizePreferences(result);
}

export async function saveUpdatePreferences(preferences: UpdatePreferences): Promise<UpdatePreferences> {
  const result = await invoke<UpdatePreferencesPayload>('save_update_preferences', {
    preferences: normalizePreferences(preferences),
  });

  return normalizePreferences(result);
}

export async function checkForUpdates(): Promise<UpdateCheckResult> {
  const result = await invoke<UpdateCheckResultPayload>('check_for_updates');
  return normalizeUpdateCheckResult(result);
}

function normalizeMetadata(metadata: AboutMetadataPayload): AboutMetadata {
  return {
    appName: metadata.appName?.trim() || 'AionX',
    version: metadata.version?.trim() || '0.0.0',
    repositoryUrl: metadata.repositoryUrl?.trim() || '',
    releasesUrl: metadata.releasesUrl?.trim() || '',
    issuesUrl: metadata.issuesUrl?.trim() || '',
    docsUrl: metadata.docsUrl?.trim() || '',
    contactUrl: metadata.contactUrl?.trim() || '',
  };
}

function normalizePreferences(preferences: UpdatePreferencesPayload | UpdatePreferences): UpdatePreferences {
  return {
    includePrerelease: Boolean(preferences.includePrerelease),
  };
}

function normalizeUpdateCheckResult(result: UpdateCheckResultPayload): UpdateCheckResult {
  return {
    status: result.status || 'error',
    currentVersion: result.currentVersion?.trim() || '0.0.0',
    latestVersion: result.latestVersion?.trim() || null,
    updateAvailable: Boolean(result.updateAvailable),
    notes: result.notes?.trim() || null,
    publishedAt: result.publishedAt?.trim() || null,
    detail: result.detail?.trim() || '更新检查失败。',
  };
}
