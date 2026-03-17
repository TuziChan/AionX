import {
  configureAgentAssistants,
  configureSystemSettings,
  connectGeminiAccountAndBindProject,
  configureWebuiAndChannel,
  createAndTestToolServer,
  createProviderAndModel,
  expectAgentPersistence,
  expectGeminiProjectPersistence,
  expectGeminiSettingsDesktopShell,
  expectExtensionHostPage,
  expectMissingExtensionPage,
  expectSystemPersistence,
  expectWebuiPersistence,
  loginAndOpenGuide,
  openSettingsPage,
} from './helpers/settings-flow.mjs';

describe('AionX desktop smoke flow', () => {
  it('logs in and completes the desktop Gemini, Model, Agent, Tools, and WebUI settings flow', async () => {
    await loginAndOpenGuide({ width: 1440, height: 960 });
    await openSettingsPage('#/settings/gemini', 'Gemini');
    await expectGeminiSettingsDesktopShell();
    await connectGeminiAccountAndBindProject();
    await openSettingsPage('#/settings/model', '模型');
    await createProviderAndModel();
    await openSettingsPage('#/settings/tools', '工具');
    await createAndTestToolServer();
    await openSettingsPage('#/settings/agent', 'Agent');
    await configureAgentAssistants();
    await openSettingsPage('#/settings/system', '系统');
    const expectedCloseToTray = await configureSystemSettings();
    await openSettingsPage('#/settings/webui', 'WebUI');
    await configureWebuiAndChannel();
    await openSettingsPage('#/settings/gemini', 'Gemini');
    await expectGeminiProjectPersistence();
    await openSettingsPage('#/settings/agent', 'Agent');
    await expectAgentPersistence();
    await openSettingsPage('#/settings/system', '系统');
    await expectSystemPersistence(expectedCloseToTray);
    await openSettingsPage('#/settings/webui', 'WebUI');
    await expectWebuiPersistence();
    await openSettingsPage('#/settings/ext/host-smoke', 'E2E Host Extension');
    await expectExtensionHostPage();
    await openSettingsPage('#/settings/ext/missing-extension', 'Extension');
    await expectMissingExtensionPage();
  });
});
