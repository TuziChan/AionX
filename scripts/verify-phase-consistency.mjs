import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function checkPhase4Consistency() {
  const status = read('docs/PROJECT_STATUS.md');
  const mcp = read('src-tauri/src/commands/mcp.rs');
  const telegram = read('src-tauri/src/channels/telegram.rs');
  const openclaw = read('src-tauri/src/agents/openclaw.rs');

  const claimsMcpDone = status.includes('MCP 连接测试已实现真实检测');
  if (claimsMcpDone) {
    assert(
      mcp.includes('pub async fn test_mcp_connection'),
      'PROJECT_STATUS claims MCP probing complete, but command test_mcp_connection not found.',
    );
    assert(
      !mcp.includes('placeholder'),
      'PROJECT_STATUS claims MCP probing complete, but placeholder implementation still present.',
    );
  }

  const claimsTelegramDone = status.includes('Telegram 通道已接入事件总线转发链路');
  if (claimsTelegramDone) {
    assert(
      telegram.includes('"channel:message"'),
      'PROJECT_STATUS claims Telegram forwarding complete, but channel:message emit not found.',
    );
    assert(
      !telegram.includes('模拟响应'),
      'PROJECT_STATUS claims Telegram forwarding complete, but simulated reply marker still present.',
    );
  }

  const claimsOpenclawDone = status.includes('OpenClaw 权限响应链路已实现');
  if (claimsOpenclawDone) {
    assert(
      openclaw.includes('"exec.approval.response"'),
      'PROJECT_STATUS claims OpenClaw permission flow complete, but exec.approval.response not found.',
    );
    assert(
      !openclaw.includes('permission handling not yet implemented'),
      'PROJECT_STATUS claims OpenClaw permission flow complete, but not-implemented warning still exists.',
    );
  }
}

try {
  checkPhase4Consistency();
  console.log('Phase consistency verification passed.');
} catch (error) {
  console.error(`Phase consistency verification failed: ${error.message}`);
  process.exit(1);
}
