import {
  expectAgentResponsivePage,
  expectAboutResponsivePage,
  expectDisplayResponsivePage,
  expectExtensionHostPage,
  expectMissingExtensionPage,
  expectSystemResponsivePage,
  expectToolsResponsivePage,
  expectWebuiResponsivePage,
  expectResponsiveSettingsShell,
  loginAndOpenGuide,
  openSettingsPage,
} from './helpers/settings-flow.mjs';

describe('AionX responsive settings smoke flow', () => {
  it('renders the dedicated mobile settings shell without mixing desktop layout checks', async () => {
    await loginAndOpenGuide({ width: 430, height: 900 });
    await openSettingsPage('#/settings/gemini', 'Gemini');
    await expectResponsiveSettingsShell();
    await openSettingsPage('#/settings/model', '模型');
    await expectResponsiveSettingsShell();
    await openSettingsPage('#/settings/tools', '工具');
    await expectResponsiveSettingsShell();
    await expectToolsResponsivePage();
    await openSettingsPage('#/settings/agent', 'Agent');
    await expectResponsiveSettingsShell();
    await expectAgentResponsivePage();
    await openSettingsPage('#/settings/display', '显示');
    await expectResponsiveSettingsShell();
    await expectDisplayResponsivePage();
    await openSettingsPage('#/settings/system', '系统');
    await expectResponsiveSettingsShell();
    await expectSystemResponsivePage();
    await openSettingsPage('#/settings/webui', 'WebUI');
    await expectResponsiveSettingsShell();
    await expectWebuiResponsivePage();
    await openSettingsPage('#/settings/about', '关于');
    await expectResponsiveSettingsShell();
    await expectAboutResponsivePage();
    await openSettingsPage('#/settings/ext/host-smoke', 'E2E Host Extension');
    await expectResponsiveSettingsShell();
    await expectExtensionHostPage();
    await openSettingsPage('#/settings/ext/missing-extension', 'Extension');
    await expectResponsiveSettingsShell();
    await expectMissingExtensionPage();
  });
});
