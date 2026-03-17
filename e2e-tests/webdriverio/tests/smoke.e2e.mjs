import assert from 'node:assert/strict';

describe('AionX desktop smoke flow', () => {
  it('logs in and opens the Gemini settings page', async () => {
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

    const googleLoginButton = await $('button=Google 登录');
    await googleLoginButton.waitForDisplayed({ timeout: 20000 });
    assert.equal(await googleLoginButton.getText(), 'Google 登录');
  });
});
