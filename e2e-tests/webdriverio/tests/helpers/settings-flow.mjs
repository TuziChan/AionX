import assert from 'node:assert/strict';

async function clickElement(target) {
  const element = typeof target === 'string' ? await $(target) : target;
  await element.waitForDisplayed({ timeout: 20000 });

  try {
    await element.click();
    return;
  } catch (error) {
    await browser.execute((node) => {
      node.scrollIntoView({ block: 'center', inline: 'center' });
      node.click();
    }, element).catch(() => {
      throw error;
    });

    return;
  }
}

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

async function findAgentAssistantRowByText(label) {
  const rows = await $$('[data-testid^="agent-assistant-item-"]');
  for (const row of rows) {
    if ((await row.getText()).includes(label)) {
      return row;
    }
  }
  throw new Error(`Unable to locate assistant row containing "${label}"`);
}

async function hasAgentAssistantRowByText(label) {
  const rows = await $$('[data-testid^="agent-assistant-item-"]');
  for (const row of rows) {
    if ((await row.getText()).includes(label)) {
      return true;
    }
  }
  return false;
}

async function closeAgentDrawerIfOpen() {
  const editor = await $('[data-testid="agent-assistant-editor"]');
  const editorVisible = await editor.isExisting().then(async (exists) => (exists ? editor.isDisplayed().catch(() => false) : false));
  if (editorVisible) {
    const cancelButton = await $('[data-testid="agent-assistant-cancel"]');
    await clickElement(cancelButton);
    await browser.waitUntil(
      async () =>
        !(await $('[data-testid="agent-assistant-editor"]')
          .isDisplayed()
          .catch(() => false)),
      {
        timeout: 20000,
        timeoutMsg: 'expected agent drawer to close before continuing',
      },
    );
  }
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

  await browser.waitUntil(
    async () =>
      (await $('.settings-layout__title').isDisplayed().catch(() => false)) ||
      (await $('.settings-layout__topbar-subtitle').isDisplayed().catch(() => false)),
    {
      timeout: 20000,
      timeoutMsg: 'expected desktop title or mobile topbar title to appear after switching settings route',
    },
  );

  const settingsTitle =
    (await $('.settings-layout__title').isDisplayed().catch(() => false))
      ? await $('.settings-layout__title')
      : await $('.settings-layout__topbar-subtitle');

  await browser.waitUntil(async () => (await settingsTitle.getText()) === expectedTitle, {
    timeout: 20000,
    timeoutMsg: `expected settings title to switch to ${expectedTitle}`,
  });

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

  const confirmButton = await $('[data-testid="gemini-login-confirm"]');
  await clickElement(confirmButton);

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

export async function configureDisplaySettings() {
  const themeCard = await $('[data-testid="display-theme-card"]');
  await themeCard.waitForDisplayed({ timeout: 20000 });

  const cssCard = await $('[data-testid="display-custom-css-card"]');
  await cssCard.waitForDisplayed({ timeout: 20000 });

  const themeLightButton = await $('[data-testid="display-theme-light"]');
  await themeLightButton.waitForDisplayed({ timeout: 20000 });

  const zoomValue = await $('[data-testid="display-zoom-value"]');
  await zoomValue.waitForDisplayed({ timeout: 20000 });
  assert.match(await zoomValue.getText(), /^\d+%$/);

  const cssValue = ':root { --display-smoke-token: 1; }';
  await replaceInputValue('#display-custom-css', cssValue);

  const saveButton = await $('[data-testid="display-save-custom-css"]');
  await saveButton.click();

  await browser.waitUntil(
    async () =>
      (await browser.execute(() => document.getElementById('aionx-custom-css-theme')?.textContent ?? '')) ===
      cssValue,
    {
      timeout: 20000,
      timeoutMsg: 'expected custom CSS preview style tag to update after saving display settings',
    },
  );

  return cssValue;
}

export async function expectDisplayPersistence(expectedCssValue) {
  const themeCard = await $('[data-testid="display-theme-card"]');
  await themeCard.waitForDisplayed({ timeout: 20000 });

  const cssInput = await $('#display-custom-css');
  await cssInput.waitForDisplayed({ timeout: 20000 });

  await browser.waitUntil(async () => (await cssInput.getValue()) === expectedCssValue, {
    timeout: 20000,
    timeoutMsg: 'expected custom CSS textarea to persist after route switches',
  });

  const styleText = await browser.execute(() => document.getElementById('aionx-custom-css-theme')?.textContent ?? '');
  assert.equal(styleText, expectedCssValue);
}

export async function configureAboutSettings() {
  const hero = await $('[data-testid="about-hero"]');
  await hero.waitForDisplayed({ timeout: 20000 });

  const updateCard = await $('[data-testid="about-update-card"]');
  await updateCard.waitForDisplayed({ timeout: 20000 });

  const checkButton = await $('[data-testid="about-check-updates"]');
  await checkButton.click();

  const updateStatus = await $('[data-testid="about-update-status"]');
  await updateStatus.waitForDisplayed({ timeout: 20000 });
  assert.ok((await updateStatus.getText()).length > 0);

  const prereleaseSwitch = await $('[data-testid="about-update-card"] button[role="switch"]');
  await prereleaseSwitch.waitForDisplayed({ timeout: 20000 });

  const currentValue = (await prereleaseSwitch.getAttribute('aria-checked')) === 'true';
  const expectedValue = !currentValue;

  await prereleaseSwitch.click();

  await browser.waitUntil(async () => (await prereleaseSwitch.getAttribute('aria-checked')) === String(expectedValue), {
    timeout: 20000,
    timeoutMsg: `expected include-prerelease switch to change to ${expectedValue}`,
  });

  return expectedValue;
}

export async function expectAboutPersistence(expectedIncludePrerelease) {
  const updateCard = await $('[data-testid="about-update-card"]');
  await updateCard.waitForDisplayed({ timeout: 20000 });

  const prereleaseSwitch = await $('[data-testid="about-update-card"] button[role="switch"]');
  await prereleaseSwitch.waitForDisplayed({ timeout: 20000 });
  await browser.waitUntil(
    async () => (await prereleaseSwitch.getAttribute('aria-checked')) === String(expectedIncludePrerelease),
    {
      timeout: 20000,
      timeoutMsg: `expected include-prerelease switch to persist as ${expectedIncludePrerelease}`,
    },
  );

  const links = await $('[data-testid="about-links"]');
  await links.waitForDisplayed({ timeout: 20000 });
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
  await clickElement(addProviderButton);

  await replaceInputValue('#model-provider-name', 'OpenAI Test');
  await replaceInputValue('#model-provider-base-url', 'https://api.openai.example');
  await replaceInputValue('#model-provider-api-key', 'sk-test-123');

  const providerSubmitButton = await $('[data-testid="model-provider-save"]');
  await clickElement(providerSubmitButton);

  const providerCard = await $('button*=OpenAI Test');
  await providerCard.waitForDisplayed({ timeout: 20000 });

  const addModelButton = await $('[data-testid="model-add-model"]');
  await clickElement(addModelButton);

  await replaceInputValue('#model-name-input', 'gpt-5-codex');

  const modelSubmitButton = await $('[data-testid="model-save"]');
  await clickElement(modelSubmitButton);

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
  await clickElement(addServerButton);

  await replaceInputValue('#tools-server-name', 'Sleep MCP');
  await replaceInputValue('#tools-server-command', 'powershell.exe');
  await replaceInputValue('#tools-server-args', '["-NoProfile","-Command","Start-Sleep -Seconds 5"]');
  await replaceInputValue('#tools-server-env', '{}');

  const submitButton = await $('[data-testid="tools-server-save"]');
  await clickElement(submitButton);

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

  const builtinItem = await $('[data-testid="agent-assistant-item-builtin-star-office-helper"]');
  await builtinItem.waitForDisplayed({ timeout: 20000 });
  await builtinItem.click();

  const assistantDetail = await $('[data-testid="agent-assistant-detail"]');
  await assistantDetail.waitForDisplayed({ timeout: 20000 });

  const statusValue = await $('[data-testid="agent-status-value"]');
  await statusValue.waitForDisplayed({ timeout: 20000 });
  await browser.waitUntil(async () => /已启用|已停用/.test(await statusValue.getText()), {
    timeout: 20000,
    timeoutMsg: 'expected builtin assistant status to render inside the drawer',
  });

  const sourceValue = await $('[data-testid="agent-source-value"]');
  await sourceValue.waitForDisplayed({ timeout: 20000 });
  await browser.waitUntil(async () => (await sourceValue.getText()) === '内置', {
    timeout: 20000,
    timeoutMsg: 'expected builtin assistant source to render as 内置',
  });

  await closeAgentDrawerIfOpen();

  if (!(await hasAgentAssistantRowByText('Smoke Assistant'))) {
    const addAssistantButton = await $('[data-testid="agent-add-assistant"]');
    await addAssistantButton.waitForDisplayed({ timeout: 20000 });
    await clickElement(addAssistantButton);

    await replaceInputValue('#agent-assistant-name', 'Smoke Assistant');
    await replaceInputValue('#agent-assistant-description', 'WDIO smoke custom assistant');
    await replaceInputValue('#agent-assistant-avatar', '🧪');
    await replaceInputValue('#agent-assistant-prompt', 'Always summarize the next action.');

    const submitButton = await $('[data-testid="agent-assistant-save"]');
    await clickElement(submitButton);
  }

  const customItem = await findAgentAssistantRowByText('Smoke Assistant');
  await customItem.waitForDisplayed({ timeout: 20000 });
  await customItem.click();

  const customSourceValue = await $('[data-testid="agent-source-value"]');
  await customSourceValue.waitForDisplayed({ timeout: 20000 });
  await browser.waitUntil(async () => (await customSourceValue.getText()) === '自定义', {
    timeout: 20000,
    timeoutMsg: 'expected custom assistant source to render as 自定义',
  });

  const promptContent = await $('pre*=Always summarize the next action.');
  await promptContent.waitForDisplayed({ timeout: 20000 });
}

export async function expectAgentPersistence() {
  const builtinItem = await $('[data-testid="agent-assistant-item-builtin-star-office-helper"]');
  await builtinItem.waitForDisplayed({ timeout: 20000 });
  await builtinItem.click();

  const assistantDetail = await $('[data-testid="agent-assistant-detail"]');
  await assistantDetail.waitForDisplayed({ timeout: 20000 });

  const statusValue = await $('[data-testid="agent-status-value"]');
  await statusValue.waitForDisplayed({ timeout: 20000 });
  await browser.waitUntil(async () => /已启用|已停用/.test(await statusValue.getText()), {
    timeout: 20000,
    timeoutMsg: 'expected builtin assistant status to persist in the drawer',
  });

  await closeAgentDrawerIfOpen();

  const customItem = await findAgentAssistantRowByText('Smoke Assistant');
  await customItem.waitForDisplayed({ timeout: 20000 });
  await customItem.click();

  const sourceValue = await $('[data-testid="agent-source-value"]');
  await sourceValue.waitForDisplayed({ timeout: 20000 });
  await browser.waitUntil(async () => (await sourceValue.getText()) === '自定义', {
    timeout: 20000,
    timeoutMsg: 'expected custom assistant source to persist in the drawer',
  });

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
  const serviceTabButton = await $('[data-testid="webui-tab-webui"]');
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

  const telegramCard = await $('[data-testid="webui-channel-card-telegram"]');
  await telegramCard.waitForDisplayed({ timeout: 20000 });

  const telegramModelInput = await $('#webui-channel-default-model-telegram');
  const modelInputExists = await telegramModelInput.isExisting();
  const modelInputVisible = modelInputExists ? await telegramModelInput.isDisplayed().catch(() => false) : false;
  if (!modelInputExists || !modelInputVisible) {
    await telegramCard.click();
  }

  await replaceInputValue('#webui-channel-name-telegram', 'Telegram Smoke');
  await replaceInputValue('#webui-channel-default-model-telegram', 'gemini-2.5-pro');
  await replaceInputValue('#webui-channel-bot-token-telegram', 'bot-token-123');

  const saveButton = await $('[data-testid="webui-channel-save-telegram"]');
  await saveButton.click();

  await browser.waitUntil(async () => (await telegramCard.getText()).includes('Telegram Smoke'), {
    timeout: 20000,
    timeoutMsg: 'expected Telegram channel summary to update after saving',
  });
}

export async function expectWebuiPersistence() {
  const serviceTabButton = await $('[data-testid="webui-tab-webui"]');
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

  const telegramCard = await $('[data-testid="webui-channel-card-telegram"]');
  await telegramCard.waitForDisplayed({ timeout: 20000 });
  await browser.waitUntil(async () => (await telegramCard.getText()).includes('Telegram Smoke'), {
    timeout: 20000,
    timeoutMsg: 'expected Telegram channel summary to persist after route switches',
  });
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
  const serviceTabButton = await $('[data-testid="webui-tab-webui"]');
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

export async function expectDisplayResponsivePage() {
  const themeCard = await $('[data-testid="display-theme-card"]');
  await themeCard.waitForDisplayed({ timeout: 20000 });

  const cssCard = await $('[data-testid="display-custom-css-card"]');
  await cssCard.waitForDisplayed({ timeout: 20000 });

  const cssInput = await $('#display-custom-css');
  await cssInput.waitForDisplayed({ timeout: 20000 });
}

export async function expectAboutResponsivePage() {
  const hero = await $('[data-testid="about-hero"]');
  await hero.waitForDisplayed({ timeout: 20000 });

  const updateCard = await $('[data-testid="about-update-card"]');
  await updateCard.waitForDisplayed({ timeout: 20000 });

  const links = await $('[data-testid="about-links"]');
  await links.waitForDisplayed({ timeout: 20000 });
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
  const mobileTabs = await $('[data-testid="settings-mobile-tabs"]');
  await mobileTabs.waitForDisplayed({ timeout: 20000 });

  const mobileBackLink = await $('[data-testid="settings-back-link"]');
  await mobileBackLink.waitForDisplayed({ timeout: 20000 });

  const settingsSidebar = await $('.settings-layout__sidebar');
  assert.equal(await settingsSidebar.isDisplayed(), false);
  assert.equal(await mobileBackLink.getText(), '返回应用');
}
