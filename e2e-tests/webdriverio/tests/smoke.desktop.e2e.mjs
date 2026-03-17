import {
  connectGeminiAccountAndBindProject,
  createAndTestToolServer,
  createProviderAndModel,
  expectGeminiProjectPersistence,
  expectGeminiSettingsDesktopShell,
  loginAndOpenGuide,
  openSettingsPage,
} from './helpers/settings-flow.mjs';

describe('AionX desktop smoke flow', () => {
  it('logs in and completes the desktop Gemini and Model settings flow', async () => {
    await loginAndOpenGuide({ width: 1440, height: 960 });
    await openSettingsPage('#/settings/gemini', 'Gemini');
    await expectGeminiSettingsDesktopShell();
    await connectGeminiAccountAndBindProject();
    await openSettingsPage('#/settings/model', '模型');
    await createProviderAndModel();
    await openSettingsPage('#/settings/tools', '工具');
    await createAndTestToolServer();
    await openSettingsPage('#/settings/gemini', 'Gemini');
    await expectGeminiProjectPersistence();
  });
});
