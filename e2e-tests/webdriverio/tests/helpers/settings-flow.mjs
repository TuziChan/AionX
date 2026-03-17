import assert from 'node:assert/strict';

async function replaceInputValue(selector, value) {
  const input = await $(selector);
  await input.waitForDisplayed({ timeout: 20000 });
  await browser.execute(
    (element, nextValue) => {
      const prototype =
        element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

      if (!setter) {
        throw new Error('Unable to locate native value setter for input replacement');
      }

      setter.call(element, nextValue);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    },
    input,
    value,
  );

  await browser.waitUntil(async () => (await input.getValue()) === value, {
    timeout: 20000,
    timeoutMsg: `expected ${selector} to update to ${value}`,
  });
}

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

  const accountCard = await $('[data-testid="gemini-account-card"]');
  await accountCard.waitForDisplayed({ timeout: 20000 });
}

export async function connectGeminiAccountAndBindProject() {
  const loginButton = await $('[data-testid="gemini-login-button"]');
  if (await loginButton.isExisting()) {
    await loginButton.waitForDisplayed({ timeout: 20000 });
    await loginButton.click();
  } else {
    const switchButton = await $('button=切换账号');
    await switchButton.waitForDisplayed({ timeout: 20000 });
    await switchButton.click();
  }

  const emailInput = await $('#gemini-login-email');
  await emailInput.waitForDisplayed({ timeout: 20000 });
  await emailInput.setValue('codex@gmail.example');

  const confirmButton = await $('.settings-gemini-page__auth-modal .arco-modal-footer .arco-btn-primary');
  await confirmButton.click();

  const accountEmailInput = await $('#gemini-account-email');
  await accountEmailInput.waitForDisplayed({ timeout: 20000 });
  await browser.waitUntil(async () => (await accountEmailInput.getValue()) === 'codex@gmail.example', {
    timeout: 20000,
    timeoutMsg: 'expected Gemini account email to be persisted after login',
  });

  const projectInput = await $('#gemini-project-id');
  await projectInput.waitForDisplayed({ timeout: 20000 });
  await projectInput.setValue('codex-gcp-project');
  await browser.pause(600);
}

export async function expectGeminiProjectPersistence() {
  const accountEmailInput = await $('#gemini-account-email');
  await accountEmailInput.waitForDisplayed({ timeout: 20000 });
  assert.equal(await accountEmailInput.getValue(), 'codex@gmail.example');

  const projectInput = await $('#gemini-project-id');
  await projectInput.waitForDisplayed({ timeout: 20000 });

  await browser.waitUntil(async () => (await projectInput.getValue()) === 'codex-gcp-project', {
    timeout: 20000,
    timeoutMsg: 'expected Gemini project binding to persist after route switches',
  });
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

export async function configureAgentAssistants() {
  const assistantList = await $('[data-testid="agent-assistant-list"]');
  await assistantList.waitForDisplayed({ timeout: 20000 });

  const assistantDetail = await $('[data-testid="agent-assistant-detail"]');
  await assistantDetail.waitForDisplayed({ timeout: 20000 });

  const builtinItem = await $('[data-testid="agent-assistant-item-builtin-star-office-helper"]');
  await builtinItem.waitForDisplayed({ timeout: 20000 });
  await builtinItem.click();

  const statusValue = await $('[data-testid="agent-status-value"]');
  await statusValue.waitForDisplayed({ timeout: 20000 });
  assert.match(await statusValue.getText(), /已启用|已停用/);

  const sourceValue = await $('[data-testid="agent-source-value"]');
  await sourceValue.waitForDisplayed({ timeout: 20000 });
  assert.equal(await sourceValue.getText(), '内置');

  const existingCustomItem = await $('button*=Smoke Assistant');
  if (!(await existingCustomItem.isExisting())) {
    const addAssistantButton = await $('[data-testid="agent-add-assistant"]');
    await addAssistantButton.click();

    await replaceInputValue('#agent-assistant-name', 'Smoke Assistant');
    await replaceInputValue('#agent-assistant-description', 'WDIO smoke custom assistant');
    await replaceInputValue('#agent-assistant-avatar', '🧪');
    await replaceInputValue('#agent-assistant-prompt', 'Always summarize the next action.');

    const submitButton = await $('.settings-agent-page__editor-modal .arco-modal-footer .arco-btn-primary');
    await submitButton.click();
  }

  const customItem = await $('button*=Smoke Assistant');
  await customItem.waitForDisplayed({ timeout: 20000 });
  await customItem.click();

  const customSourceValue = await $('[data-testid="agent-source-value"]');
  await customSourceValue.waitForDisplayed({ timeout: 20000 });
  assert.equal(await customSourceValue.getText(), '自定义');

  const promptContent = await $('pre*=Always summarize the next action.');
  await promptContent.waitForDisplayed({ timeout: 20000 });
}

export async function expectAgentPersistence() {
  const builtinItem = await $('[data-testid="agent-assistant-item-builtin-star-office-helper"]');
  await builtinItem.waitForDisplayed({ timeout: 20000 });
  await builtinItem.click();

  const statusValue = await $('[data-testid="agent-status-value"]');
  await statusValue.waitForDisplayed({ timeout: 20000 });
  assert.match(await statusValue.getText(), /已启用|已停用/);

  const customItem = await $('button*=Smoke Assistant');
  await customItem.waitForDisplayed({ timeout: 20000 });
  await customItem.click();

  const sourceValue = await $('[data-testid="agent-source-value"]');
  await sourceValue.waitForDisplayed({ timeout: 20000 });
  assert.equal(await sourceValue.getText(), '自定义');

  const promptContent = await $('pre*=Always summarize the next action.');
  await promptContent.waitForDisplayed({ timeout: 20000 });
}

export async function configureSystemSettings() {
  const behaviorCard = await $('[data-testid="system-behavior-card"]');
  await behaviorCard.waitForDisplayed({ timeout: 20000 });

  const runtimeCard = await $('[data-testid="system-runtime-card"]');
  await runtimeCard.waitForDisplayed({ timeout: 20000 });

  const systemInfoInput = await $('#system-info-label');
  await systemInfoInput.waitForDisplayed({ timeout: 20000 });
  await browser.waitUntil(async () => ((await systemInfoInput.getValue()) || '').includes('/'), {
    timeout: 20000,
    timeoutMsg: 'expected system info label to load current runtime information',
  });

  const cacheDirInput = await $('#system-cache-dir');
  await cacheDirInput.waitForDisplayed({ timeout: 20000 });
  await browser.waitUntil(async () => ((await cacheDirInput.getValue()) || '').length > 0, {
    timeout: 20000,
    timeoutMsg: 'expected cache directory to be populated from system settings snapshot',
  });

  const workDirInput = await $('#system-work-dir');
  await workDirInput.waitForDisplayed({ timeout: 20000 });

  const logDirInput = await $('#system-log-dir');
  await logDirInput.waitForDisplayed({ timeout: 20000 });

  const traySwitch = await $('[data-testid="system-close-to-tray"] button[role="switch"]');
  await traySwitch.waitForDisplayed({ timeout: 20000 });

  const currentValue = (await traySwitch.getAttribute('aria-checked')) === 'true';
  const expectedValue = !currentValue;

  await traySwitch.click();

  await browser.waitUntil(async () => (await traySwitch.getAttribute('aria-checked')) === String(expectedValue), {
    timeout: 20000,
    timeoutMsg: `expected close-to-tray switch to change to ${expectedValue}`,
  });

  return expectedValue;
}

export async function expectSystemPersistence(expectedCloseToTray) {
  const behaviorCard = await $('[data-testid="system-behavior-card"]');
  await behaviorCard.waitForDisplayed({ timeout: 20000 });

  const traySwitch = await $('[data-testid="system-close-to-tray"] button[role="switch"]');
  await traySwitch.waitForDisplayed({ timeout: 20000 });
  await browser.waitUntil(async () => (await traySwitch.getAttribute('aria-checked')) === String(expectedCloseToTray), {
    timeout: 20000,
    timeoutMsg: `expected close-to-tray switch to persist as ${expectedCloseToTray}`,
  });

  const cacheDirInput = await $('#system-cache-dir');
  await cacheDirInput.waitForDisplayed({ timeout: 20000 });
  assert.ok(((await cacheDirInput.getValue()) || '').length > 0);
}

export async function configureWebuiAndChannel() {
  const serviceTabButton = await $('[data-testid="webui-tab-service"]');
  await serviceTabButton.waitForDisplayed({ timeout: 20000 });

  const serviceTab = await $('[data-testid="webui-service-tab"]');
  await serviceTab.waitForDisplayed({ timeout: 20000 });

  await replaceInputValue('#webui-port', '9531');

  const saveSettingsButton = await $('[data-testid="webui-save-settings"]');
  await saveSettingsButton.click();

  const addressInput = await $('#webui-address');
  await browser.waitUntil(async () => (await addressInput.getValue()).includes(':9531'), {
    timeout: 20000,
    timeoutMsg: 'expected WebUI access address to update after saving the port',
  });

  const channelsTabButton = await $('[data-testid="webui-tab-channels"]');
  await channelsTabButton.click();

  const channelsTab = await $('[data-testid="webui-channels-tab"]');
  await channelsTab.waitForDisplayed({ timeout: 20000 });

  const telegramButton = await $('[data-testid="webui-channel-edit-telegram"]');
  await telegramButton.waitForDisplayed({ timeout: 20000 });
  await telegramButton.click();

  await replaceInputValue('#webui-channel-name', 'Telegram Smoke');
  await replaceInputValue('#webui-channel-default-model', 'gemini-2.5-pro');
  await replaceInputValue('#webui-channel-bot-token', 'bot-token-123');

  const submitButton = await $('.settings-webui-page__channel-modal .arco-modal-footer .arco-btn-primary');
  await submitButton.click();

  const pluginName = await $('div=Telegram Smoke');
  await pluginName.waitForDisplayed({ timeout: 20000 });
}

export async function expectWebuiPersistence() {
  const serviceTabButton = await $('[data-testid="webui-tab-service"]');
  await serviceTabButton.waitForDisplayed({ timeout: 20000 });
  await serviceTabButton.click();

  const portInput = await $('#webui-port');
  await portInput.waitForDisplayed({ timeout: 20000 });
  await browser.waitUntil(async () => (await portInput.getValue()) === '9531', {
    timeout: 20000,
    timeoutMsg: 'expected WebUI port to persist after route switches',
  });

  const channelsTabButton = await $('[data-testid="webui-tab-channels"]');
  await channelsTabButton.click();

  const pluginName = await $('div=Telegram Smoke');
  await pluginName.waitForDisplayed({ timeout: 20000 });
}

export async function expectToolsResponsivePage() {
  const serverList = await $('[data-testid="tools-server-list"]');
  await serverList.waitForDisplayed({ timeout: 20000 });

  const imageCard = await $('[data-testid="tools-image-card"]');
  await imageCard.waitForDisplayed({ timeout: 20000 });

  const accountCard = await $('[data-testid="gemini-account-card"]');
  assert.equal(await accountCard.isExisting(), false);
}

export async function expectWebuiResponsivePage() {
  const serviceTabButton = await $('[data-testid="webui-tab-service"]');
  await serviceTabButton.waitForDisplayed({ timeout: 20000 });

  const serviceTab = await $('[data-testid="webui-service-tab"]');
  await serviceTab.waitForDisplayed({ timeout: 20000 });

  const channelsTabButton = await $('[data-testid="webui-tab-channels"]');
  await channelsTabButton.click();

  const channelsTab = await $('[data-testid="webui-channels-tab"]');
  await channelsTab.waitForDisplayed({ timeout: 20000 });
}

export async function expectAgentResponsivePage() {
  const assistantList = await $('[data-testid="agent-assistant-list"]');
  await assistantList.waitForDisplayed({ timeout: 20000 });

  const assistantDetail = await $('[data-testid="agent-assistant-detail"]');
  await assistantDetail.waitForDisplayed({ timeout: 20000 });

  const addAssistantButton = await $('[data-testid="agent-add-assistant"]');
  await addAssistantButton.waitForDisplayed({ timeout: 20000 });
}

export async function expectSystemResponsivePage() {
  const behaviorCard = await $('[data-testid="system-behavior-card"]');
  await behaviorCard.waitForDisplayed({ timeout: 20000 });

  const runtimeCard = await $('[data-testid="system-runtime-card"]');
  await runtimeCard.waitForDisplayed({ timeout: 20000 });

  const traySwitch = await $('[data-testid="system-close-to-tray"] button[role="switch"]');
  await traySwitch.waitForDisplayed({ timeout: 20000 });

  const systemInfoInput = await $('#system-info-label');
  await systemInfoInput.waitForDisplayed({ timeout: 20000 });
}

export async function expectMissingExtensionPage() {
  const missingState = await $('[data-testid="extension-missing-state"]');
  await missingState.waitForDisplayed({ timeout: 20000 });
  assert.match(await missingState.getText(), /未找到对应的扩展设置页|正在加载扩展设置/);
}

export async function expectExtensionHostPage() {
  const hostCard = await $('[data-testid="extension-host-card"]');
  await hostCard.waitForDisplayed({ timeout: 20000 });

  const hostFrame = await $('[data-testid="extension-host-frame"]');
  await hostFrame.waitForDisplayed({ timeout: 20000 });

  await browser.waitUntil(
    async () =>
      (await browser.execute(() => {
        const frame = document.querySelector('[data-testid="extension-host-frame"]');
        const iframeDocument = frame instanceof HTMLIFrameElement ? frame.contentDocument : null;
        return iframeDocument?.querySelector('[data-testid="extension-host-ready"]')?.textContent ?? '';
      })) === 'AionX Extension Host Ready',
    {
      timeout: 20000,
      timeoutMsg: 'expected seeded extension host iframe to render the smoke page',
    },
  );

  const hostMeta = await browser.execute(() => {
    const frame = document.querySelector('[data-testid="extension-host-frame"]');
    const iframeDocument = frame instanceof HTMLIFrameElement ? frame.contentDocument : null;
    return {
      locale: iframeDocument?.querySelector('[data-testid="extension-host-locale"]')?.textContent ?? '',
      theme: iframeDocument?.querySelector('[data-testid="extension-host-theme"]')?.textContent ?? '',
    };
  });

  assert.match(hostMeta.locale, /zh|en|CN|US/i);
  assert.match(hostMeta.theme, /light|dark/i);
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
