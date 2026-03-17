import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const wdioBinary =
  process.platform === 'win32'
    ? path.join(projectRoot, 'node_modules', '.bin', 'wdio.cmd')
    : path.join(projectRoot, 'node_modules', '.bin', 'wdio');

const profile = process.argv[2] ?? 'debug';
const suite = process.argv[3];

function runSuite(targetSuite) {
  const env = {
    ...process.env,
    TAURI_E2E_PROFILE: profile,
    AIONX_E2E_SEED_EXTENSION: '1',
    ...(targetSuite ? { TAURI_E2E_SUITE: targetSuite } : {}),
  };

  const result =
    process.platform === 'win32'
      ? spawnSync(`"${wdioBinary}" run wdio.conf.mjs`, [], {
          cwd: projectRoot,
          env,
          shell: true,
          stdio: 'inherit',
        })
      : spawnSync(wdioBinary, ['run', 'wdio.conf.mjs'], {
          cwd: projectRoot,
          env,
          stdio: 'inherit',
        });

  if (result.signal) {
    process.kill(process.pid, result.signal);
    return false;
  }

  return (result.status ?? 1) === 0;
}

if (!suite) {
  const desktopPassed = runSuite('desktop');
  if (!desktopPassed) {
    process.exit(1);
  }

  const responsivePassed = runSuite('responsive');
  process.exit(responsivePassed ? 0 : 1);
}

const env = {
  ...process.env,
  TAURI_E2E_PROFILE: profile,
  TAURI_E2E_SUITE: suite,
  AIONX_E2E_SEED_EXTENSION: '1',
};

const child =
  process.platform === 'win32'
    ? spawn(`"${wdioBinary}" run wdio.conf.mjs`, [], {
        cwd: projectRoot,
        env,
        shell: true,
        stdio: 'inherit',
      })
    : spawn(wdioBinary, ['run', 'wdio.conf.mjs'], {
        cwd: projectRoot,
        env,
        stdio: 'inherit',
      });

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
