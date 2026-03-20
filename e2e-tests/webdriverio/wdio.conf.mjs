import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const profile = process.env.TAURI_E2E_PROFILE === 'release' ? 'release' : 'debug';
const suite = process.env.TAURI_E2E_SUITE;
const appName = process.platform === 'win32' ? 'aionx.exe' : 'aionx';
const applicationPath = path.join(repoRoot, 'target', profile, appName);
const edgeDriverPath = path.join(repoRoot, 'msedgedriver.exe');
const tauriCliPath = path.join(repoRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'tauri.cmd' : 'tauri');
const tauriDriverPath = process.platform === 'win32' ? 'tauri-driver.exe' : 'tauri-driver';
const tauriDriverCommand = path.join(os.homedir(), '.cargo', 'bin', tauriDriverPath);
const e2eEnv = {
  ...process.env,
  AIONX_E2E_SEED_EXTENSION: process.env.AIONX_E2E_SEED_EXTENSION ?? '1',
};

let tauriDriverProcess;

process.env.AIONX_E2E_SEED_EXTENSION = e2eEnv.AIONX_E2E_SEED_EXTENSION;

function runCommand(command, args, options = {}) {
  const result =
    process.platform === 'win32'
      ? spawnSync(`"${command}" ${args.map((arg) => (arg.includes(' ') ? `"${arg}"` : arg)).join(' ')}`, {
          cwd: repoRoot,
          env: e2eEnv,
          shell: true,
          stdio: 'inherit',
          ...options,
        })
      : spawnSync(command, args, {
          cwd: repoRoot,
          env: e2eEnv,
          stdio: 'inherit',
          ...options,
        });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status ?? 'unknown'}`);
  }
}

function getEdgeVersion() {
  if (process.platform !== 'win32') {
    return null;
  }

  const candidates = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];

  const executable = candidates.find((candidate) => fs.existsSync(candidate));
  if (!executable) {
    throw new Error('Microsoft Edge is required for tauri-driver on Windows, but msedge.exe was not found.');
  }

  const script = `(Get-Item '${executable.replace(/\\/g, '\\\\')}').VersionInfo.ProductVersion`;
  const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', script], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(`Failed to read Microsoft Edge version: ${result.stderr || result.stdout}`);
  }

  return result.stdout.trim();
}

function getWebView2RuntimeVersion() {
  if (process.platform !== 'win32') {
    return null;
  }

  const runtimeRoot = 'C:\\Program Files (x86)\\Microsoft\\EdgeWebView\\Application';
  if (!fs.existsSync(runtimeRoot)) {
    return null;
  }

  const versions = fs
    .readdirSync(runtimeRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d+\.\d+\.\d+\.\d+$/.test(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) =>
      right.localeCompare(left, undefined, {
        numeric: true,
        sensitivity: 'base',
      }),
    );

  return versions[0] ?? null;
}

function getEdgeDriverVersion() {
  if (!fs.existsSync(edgeDriverPath)) {
    return null;
  }

  const result = spawnSync(edgeDriverPath, ['--version'], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    return null;
  }

  const match = result.stdout.match(/Microsoft Edge WebDriver ([^ ]+)/);
  return match?.[1] ?? null;
}

function extractArchive(archivePath, destinationPath) {
  const result = spawnSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-Command',
      `Expand-Archive -Path '${archivePath}' -DestinationPath '${destinationPath}' -Force`,
    ],
    {
      stdio: 'inherit',
    },
  );

  return result.status === 0;
}

function downloadEdgeDriver(version, archivePath) {
  const downloadUrl = `https://msedgedriver.microsoft.com/${version}/edgedriver_win64.zip`;
  const result = spawnSync(
    'curl.exe',
    ['-L', '--fail', '--silent', '--show-error', downloadUrl, '-o', archivePath],
    {
      stdio: 'inherit',
    },
  );

  return result.status === 0;
}

function ensureMatchingEdgeDriver() {
  if (process.platform !== 'win32') {
    return;
  }

  const edgeVersion = getEdgeVersion();
  const webView2Version = getWebView2RuntimeVersion();
  const edgeDriverVersion = getEdgeDriverVersion();
  const candidateVersions = [...new Set([webView2Version, edgeVersion].filter(Boolean))];

  if (candidateVersions.some((version) => edgeDriverVersion === version)) {
    return;
  }

  const archivePath = path.join(repoRoot, 'msedgedriver.zip');
  for (const version of candidateVersions) {
    if (fs.existsSync(archivePath)) {
      fs.rmSync(archivePath, { force: true });
    }

    if (!downloadEdgeDriver(version, archivePath)) {
      continue;
    }

    if (!extractArchive(archivePath, repoRoot)) {
      continue;
    }

    if (fs.existsSync(archivePath)) {
      fs.rmSync(archivePath, { force: true });
    }

    const downloadedVersion = getEdgeDriverVersion();
    if (downloadedVersion === version) {
      return;
    }
  }

  throw new Error(
    `Failed to download a matching msedgedriver.exe. Tried versions: ${candidateVersions.join(', ') || 'none'}.`,
  );
}

function ensureTauriDriver() {
  if (fs.existsSync(tauriDriverCommand)) {
    return;
  }

  runCommand('cargo', ['install', 'tauri-driver', '--locked']);

  if (!fs.existsSync(tauriDriverCommand)) {
    throw new Error(`Expected tauri-driver at ${tauriDriverCommand} after installation.`);
  }
}

function clearAppData() {
  if (process.platform !== 'win32') {
    return;
  }

  const appDataDirs = [
    path.join(process.env.APPDATA ?? '', 'com.aionx.app'),
    path.join(process.env.LOCALAPPDATA ?? '', 'com.aionx.app'),
  ];

  for (const appDataDir of appDataDirs) {
    if (appDataDir && fs.existsSync(appDataDir)) {
      fs.rmSync(appDataDir, { recursive: true, force: true });
    }
  }
}

function killExistingApp() {
  if (process.platform !== 'win32') {
    return;
  }

  spawnSync('taskkill.exe', ['/IM', appName, '/F'], {
    stdio: 'ignore',
  });
}

function waitForPort(port, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const attempt = () => {
      const socket = net.createConnection({ host: '127.0.0.1', port });
      socket.once('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timed out waiting for port ${port}`));
          return;
        }
        setTimeout(attempt, 200);
      });
    };

    attempt();
  });
}

function buildTauriApp() {
  const args = ['build'];
  if (profile === 'debug') {
    args.push('--debug');
  }
  args.push('--no-bundle');

  runCommand(tauriCliPath, args);

  if (!fs.existsSync(applicationPath)) {
    throw new Error(`Expected Tauri binary was not created at ${applicationPath}`);
  }
}

export const config = {
  protocol: 'http',
  hostname: '127.0.0.1',
  port: 4444,
  specs: ['./tests/**/*.e2e.mjs'],
  ...(suite
    ? {
        specs: [`./tests/smoke.${suite}.e2e.mjs`],
      }
    : {}),
  suites: {
    desktop: ['./tests/smoke.desktop.e2e.mjs'],
    responsive: ['./tests/smoke.responsive.e2e.mjs'],
  },
  maxInstances: 1,
  logLevel: 'info',
  waitforTimeout: 20000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 2,
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 120000,
  },
  capabilities: [
    {
      maxInstances: 1,
      'tauri:options': {
        application: applicationPath,
      },
    },
  ],
  onPrepare: async () => {
    killExistingApp();
    clearAppData();
    ensureMatchingEdgeDriver();
    ensureTauriDriver();
    buildTauriApp();

    tauriDriverProcess = spawn(
      tauriDriverCommand,
      ['--native-driver', edgeDriverPath, '--port', '4444'],
      {
        cwd: repoRoot,
        env: e2eEnv,
        stdio: 'inherit',
      },
    );

    await waitForPort(4444);
  },
  onComplete: async () => {
    if (tauriDriverProcess) {
      tauriDriverProcess.kill();
    }
    killExistingApp();
  },
};
