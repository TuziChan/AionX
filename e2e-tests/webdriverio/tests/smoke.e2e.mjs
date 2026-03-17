import assert from 'node:assert/strict';

describe('AionX desktop smoke flow', () => {
  it('logs in and opens the Gemini settings page', async () => {
    await browser.setWindowSize(1440, 960);

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

    await browser.execute(() => {
      window.location.hash = '#/settings/gemini';
    });

    const settingsTitle = await $('.settings-layout__title');
    await settingsTitle.waitForDisplayed({ timeout: 20000 });
    assert.match(await settingsTitle.getText(), /Gemini/);

    const settingsSidebar = await $('.settings-layout__sidebar');
    await settingsSidebar.waitForDisplayed({ timeout: 20000 });

    const newConversationButton = await $('button=New Conversation');
    assert.equal(await newConversationButton.isExisting(), false);

    const googleLoginButton = await $('button=Google 登录');
    await googleLoginButton.waitForDisplayed({ timeout: 20000 });
    assert.equal(await googleLoginButton.getText(), 'Google 登录');

    await browser.setWindowSize(430, 900);
    await browser.pause(400);

    const mobileTabs = await $('.settings-mobile-tabs');
    await mobileTabs.waitForDisplayed({ timeout: 20000 });

    const mobileBackLink = await $('.settings-back-link');
    await mobileBackLink.waitForDisplayed({ timeout: 20000 });

    assert.equal(await settingsSidebar.isDisplayed(), false);
    assert.equal(await mobileBackLink.getText(), '返回应用');
  });
});
