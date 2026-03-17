import assert from 'node:assert/strict';

export async function loginAndOpenGuide({ width, height }) {
  await browser.setWindowSize(width, height);

  const usernameInput = await $('#username');
  await usernameInput.waitForDisplayed({ timeout: 20000 });
  await usernameInput.setValue('codex');

  const passwordInput = await $('#password');
  await passwordInput.setValue('debug-pass');

  const submitButton = await $('button[type="submit"]');
  await submitButton.click();

  const guideTitle = await $('.guid-page__title');
  await guideTitle.waitForDisplayed({ timeout: 20000 });
  assert.match(await guideTitle.getText(), /统一视觉入口/);
}

export async function openSettingsPage(hash, expectedTitle) {
  await browser.execute((targetHash) => {
    window.location.hash = targetHash;
  }, hash);

  const settingsTitle = await $('.settings-layout__title');
  await settingsTitle.waitForDisplayed({ timeout: 20000 });

  await browser.waitUntil(async () => (await settingsTitle.getText()) === expectedTitle, {
    timeout: 20000,
    timeoutMsg: `expected settings title to switch to ${expectedTitle}`,
  });

  return settingsTitle;
}

export async function expectGeminiSettingsDesktopShell() {
  const settingsSidebar = await $('.settings-layout__sidebar');
  await settingsSidebar.waitForDisplayed({ timeout: 20000 });

  const newConversationButton = await $('button=New Conversation');
  assert.equal(await newConversationButton.isExisting(), false);

  const googleLoginButton = await $('button=Google 登录');
  await googleLoginButton.waitForDisplayed({ timeout: 20000 });
  assert.equal(await googleLoginButton.getText(), 'Google 登录');
}

export async function createProviderAndModel() {
  const providerList = await $('[data-testid="model-provider-list"]');
  await providerList.waitForDisplayed({ timeout: 20000 });

  const providerDetail = await $('[data-testid="model-provider-detail"]');
  await providerDetail.waitForDisplayed({ timeout: 20000 });

  const modelEmptyTitle = await $('div=选择或新建一个模型平台');
  await modelEmptyTitle.waitForDisplayed({ timeout: 20000 });
  assert.equal(await modelEmptyTitle.getText(), '选择或新建一个模型平台');

  const addProviderButton = await $('[data-testid="model-add-provider"]');
  await addProviderButton.click();

  const providerNameInput = await $('#model-provider-name');
  await providerNameInput.waitForDisplayed({ timeout: 20000 });
  await providerNameInput.setValue('OpenAI Test');

  const providerBaseUrlInput = await $('#model-provider-base-url');
  await providerBaseUrlInput.setValue('https://api.openai.example');

  const providerApiKeyInput = await $('#model-provider-api-key');
  await providerApiKeyInput.setValue('sk-test-123');

  const providerSubmitButton = await $('.settings-model-page__provider-modal .arco-modal-footer .arco-btn-primary');
  await providerSubmitButton.click();

  const providerCard = await $('button*=OpenAI Test');
  await providerCard.waitForDisplayed({ timeout: 20000 });

  const addModelButton = await $('[data-testid="model-add-model"]');
  await addModelButton.waitForDisplayed({ timeout: 20000 });
  await addModelButton.click();

  const modelNameInput = await $('#model-name-input');
  await modelNameInput.waitForDisplayed({ timeout: 20000 });
  await modelNameInput.setValue('gpt-5-codex');

  const modelSubmitButton = await $('.settings-model-page__model-modal .arco-modal-footer .arco-btn-primary');
  await modelSubmitButton.click();

  const modelRow = await $('div=gpt-5-codex');
  await modelRow.waitForDisplayed({ timeout: 20000 });

  const healthCheckButton = await $('[data-testid="model-health-check-gpt-5-codex"]');
  await healthCheckButton.waitForDisplayed({ timeout: 20000 });
  await healthCheckButton.click();

  const healthText = await $('div*=最近一次');
  await healthText.waitForDisplayed({ timeout: 20000 });
  assert.match(await healthText.getText(), /最近一次/);
}

export async function createAndTestToolServer() {
  const serverList = await $('[data-testid="tools-server-list"]');
  await serverList.waitForDisplayed({ timeout: 20000 });

  const serverDetail = await $('[data-testid="tools-server-detail"]');
  await serverDetail.waitForDisplayed({ timeout: 20000 });

  const imageCard = await $('[data-testid="tools-image-card"]');
  await imageCard.waitForDisplayed({ timeout: 20000 });

  const addServerButton = await $('[data-testid="tools-add-server"]');
  await addServerButton.click();

  const serverNameInput = await $('#tools-server-name');
  await serverNameInput.waitForDisplayed({ timeout: 20000 });
  await serverNameInput.setValue('Sleep MCP');

  const serverCommandInput = await $('#tools-server-command');
  await serverCommandInput.setValue('powershell.exe');

  const serverArgsInput = await $('#tools-server-args');
  await serverArgsInput.setValue('["-NoProfile","-Command","Start-Sleep -Seconds 5"]');

  const serverEnvInput = await $('#tools-server-env');
  await serverEnvInput.setValue('{}');

  const submitButton = await $('.settings-tools-page__editor-modal .arco-modal-footer .arco-btn-primary');
  await submitButton.click();

  const serverItem = await $('button*=Sleep MCP');
  await serverItem.waitForDisplayed({ timeout: 20000 });
  await serverItem.click();

  const testButton = await $('[data-testid="tools-test-server"]');
  await testButton.waitForDisplayed({ timeout: 20000 });
  await testButton.click();

  const lastTestStatus = await $('[data-testid="tools-last-test-status"]');
  await lastTestStatus.waitForDisplayed({ timeout: 20000 });

  await browser.waitUntil(
    async () => (await lastTestStatus.getText()).includes('reachable'),
    {
      timeout: 20000,
      timeoutMsg: 'expected MCP test result to show a reachable message',
    },
  );
}

export async function expectToolsResponsivePage() {
  const serverList = await $('[data-testid="tools-server-list"]');
  await serverList.waitForDisplayed({ timeout: 20000 });

  const imageCard = await $('[data-testid="tools-image-card"]');
  await imageCard.waitForDisplayed({ timeout: 20000 });
}

export async function expectResponsiveSettingsShell() {
  const mobileTabs = await $('.settings-mobile-tabs');
  await mobileTabs.waitForDisplayed({ timeout: 20000 });

  const mobileBackLink = await $('.settings-back-link');
  await mobileBackLink.waitForDisplayed({ timeout: 20000 });

  const settingsSidebar = await $('.settings-layout__sidebar');
  assert.equal(await settingsSidebar.isDisplayed(), false);
  assert.equal(await mobileBackLink.getText(), '返回应用');
}
