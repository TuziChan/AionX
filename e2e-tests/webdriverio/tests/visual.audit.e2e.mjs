import fs from 'node:fs';
import path from 'node:path';
import {
  configureAgentAssistants,
  configureAboutSettings,
  configureDisplaySettings,
  configureSystemSettings,
  configureWebuiAndChannel,
  connectGeminiAccountAndBindProject,
  createAndTestToolServer,
  createProviderAndModel,
  expectAboutResponsivePage,
  expectAgentResponsivePage,
  expectDisplayResponsivePage,
  expectExtensionHostPage,
  expectGeminiProjectPersistence,
  expectGeminiSettingsDesktopShell,
  expectMissingExtensionPage,
  expectResponsiveSettingsShell,
  expectSystemPersistence,
  expectSystemResponsivePage,
  expectToolsResponsivePage,
  expectWebuiPersistence,
  expectWebuiResponsivePage,
  loginAndOpenGuide,
  openSettingsPage,
} from './helpers/settings-flow.mjs';

const repoRoot = path.resolve(process.cwd(), '..', '..');
const mode = process.env.AIONX_VISUAL_PROFILE === 'responsive' ? 'responsive' : 'desktop';
const outputDir = path.join(repoRoot, 'tmp', 'settings-parity', mode);

function ensureOutputDir() {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function capture(name) {
  await browser.pause(250);
  await browser.saveScreenshot(path.join(outputDir, `${name}.png`));
}

describe(`AionX settings visual audit (${mode})`, () => {
  it('captures real Tauri settings pages for parity review', async () => {
    ensureOutputDir();

    if (mode === 'responsive') {
      await loginAndOpenGuide({ width: 430, height: 900 });

      await openSettingsPage('#/settings/gemini', 'Gemini');
      await expectResponsiveSettingsShell();
      await capture('gemini-mobile');

      await openSettingsPage('#/settings/model', '模型');
      await expectResponsiveSettingsShell();
      await capture('model-mobile');

      await openSettingsPage('#/settings/tools', '工具');
      await expectResponsiveSettingsShell();
      await expectToolsResponsivePage();
      await capture('tools-mobile');

      await openSettingsPage('#/settings/agent', 'Agent');
      await expectResponsiveSettingsShell();
      await expectAgentResponsivePage();
      await capture('agent-mobile');

      await openSettingsPage('#/settings/display', '显示');
      await expectResponsiveSettingsShell();
      await expectDisplayResponsivePage();
      await capture('display-mobile');

      await openSettingsPage('#/settings/system', '系统');
      await expectResponsiveSettingsShell();
      await expectSystemResponsivePage();
      await capture('system-mobile');

      await openSettingsPage('#/settings/webui', 'WebUI');
      await expectResponsiveSettingsShell();
      await expectWebuiResponsivePage();
      await capture('webui-mobile');

      await openSettingsPage('#/settings/about', '关于');
      await expectResponsiveSettingsShell();
      await expectAboutResponsivePage();
      await capture('about-mobile');

      await openSettingsPage('#/settings/ext/host-smoke', 'E2E Host Extension');
      await expectResponsiveSettingsShell();
      await expectExtensionHostPage();
      await capture('extension-host-mobile');

      await openSettingsPage('#/settings/ext/missing-extension', 'Extension');
      await expectResponsiveSettingsShell();
      await expectMissingExtensionPage();
      await capture('extension-fallback-mobile');

      return;
    }

    await loginAndOpenGuide({ width: 1440, height: 960 });

    await openSettingsPage('#/settings/gemini', 'Gemini');
    await expectGeminiSettingsDesktopShell();
    await connectGeminiAccountAndBindProject();
    await capture('gemini-desktop');

    await openSettingsPage('#/settings/model', '模型');
    await createProviderAndModel();
    await capture('model-desktop');

    await openSettingsPage('#/settings/tools', '工具');
    await createAndTestToolServer();
    await capture('tools-desktop');

    await openSettingsPage('#/settings/agent', 'Agent');
    await configureAgentAssistants();
    await capture('agent-desktop');

    await openSettingsPage('#/settings/display', '显示');
    await configureDisplaySettings();
    await capture('display-desktop');

    await openSettingsPage('#/settings/system', '系统');
    const expectedCloseToTray = await configureSystemSettings();
    await capture('system-desktop');

    await openSettingsPage('#/settings/webui', 'WebUI');
    await configureWebuiAndChannel();
    await capture('webui-desktop');

    await openSettingsPage('#/settings/about', '关于');
    await configureAboutSettings();
    await capture('about-desktop');

    await openSettingsPage('#/settings/ext/host-smoke', 'E2E Host Extension');
    await expectExtensionHostPage();
    await capture('extension-host-desktop');

    await openSettingsPage('#/settings/ext/missing-extension', 'Extension');
    await expectMissingExtensionPage();
    await capture('extension-fallback-desktop');

    await openSettingsPage('#/settings/gemini', 'Gemini');
    await expectGeminiProjectPersistence();

    await openSettingsPage('#/settings/system', '系统');
    await expectSystemPersistence(expectedCloseToTray);

    await openSettingsPage('#/settings/webui', 'WebUI');
    await expectWebuiPersistence();
  });
});
