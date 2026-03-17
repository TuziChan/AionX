import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const wdioBinary =
  process.platform === 'win32'
    ? path.join(projectRoot, 'node_modules', '.bin', 'wdio.cmd')
    : path.join(projectRoot, 'node_modules', '.bin', 'wdio');

const profile = process.argv[2] ?? 'debug';
const env = {
  ...process.env,
  TAURI_E2E_PROFILE: profile,
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
