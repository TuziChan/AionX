import { useParams } from 'react-router-dom';
import { SettingsContent } from '../components/SettingsContent';

export function Component() {
  const { tabId = 'extension' } = useParams<{ tabId: string }>();
  return <SettingsContent tabId={tabId} />;
}

Component.displayName = 'ExtensionSettings';
