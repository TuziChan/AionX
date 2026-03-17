import {
  expectToolsResponsivePage,
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
  });
});
