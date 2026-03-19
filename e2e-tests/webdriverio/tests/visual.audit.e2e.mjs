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

async function capture(name, focusSelector) {
  await browser.execute(() => {
    window.scrollTo(0, 0);

    const scrollContainers = Array.from(document.querySelectorAll('.settings-layout__body, .settings-layout__main'));
    for (const element of scrollContainers) {
      if (element instanceof HTMLElement) {
        element.scrollTop = 0;
        element.scrollLeft = 0;
      }
    }
  });

  if (focusSelector) {
    const target = await $(focusSelector);
    await target.waitForDisplayed({ timeout: 20000 });
    await target.scrollIntoView({ block: 'start', inline: 'nearest' });
  }

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
      await capture('gemini-mobile', '[data-testid="gemini-account-card"]');

      await openSettingsPage('#/settings/model', '模型');
      await expectResponsiveSettingsShell();
      await capture('model-mobile', '[data-testid="model-provider-list"]');

      await openSettingsPage('#/settings/tools', '工具');
      await expectResponsiveSettingsShell();
      await expectToolsResponsivePage();
      await capture('tools-mobile', '[data-testid="tools-server-list"]');

      await openSettingsPage('#/settings/agent', 'Agent');
      await expectResponsiveSettingsShell();
      await expectAgentResponsivePage();
      await capture('agent-mobile', '[data-testid="agent-assistant-list"]');

      await openSettingsPage('#/settings/display', '显示');
      await expectResponsiveSettingsShell();
      await expectDisplayResponsivePage();
      await capture('display-mobile', '[data-testid="display-theme-card"]');

      await openSettingsPage('#/settings/system', '系统');
      await expectResponsiveSettingsShell();
      await expectSystemResponsivePage();
      await capture('system-mobile', '[data-testid="system-behavior-card"]');

      await openSettingsPage('#/settings/webui', 'WebUI');
      await expectResponsiveSettingsShell();
      await expectWebuiResponsivePage();
      await capture('webui-mobile', '[data-testid="webui-channels-tab"]');

      await openSettingsPage('#/settings/about', '关于');
      await expectResponsiveSettingsShell();
      await expectAboutResponsivePage();
      await capture('about-mobile', '[data-testid="about-hero"]');

      await openSettingsPage('#/settings/ext/host-smoke', 'E2E Host Extension');
      await expectResponsiveSettingsShell();
      await expectExtensionHostPage();
      await capture('extension-host-mobile', '[data-testid="extension-host-card"]');

      await openSettingsPage('#/settings/ext/missing-extension', 'Extension');
      await expectResponsiveSettingsShell();
      await expectMissingExtensionPage();
      await capture('extension-fallback-mobile', '[data-testid="extension-missing-state"]');

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
