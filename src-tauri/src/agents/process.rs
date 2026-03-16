use crate::error::{AppError, Result};
use std::collections::HashMap;
use std::process::Stdio;
use tokio::process::{Child, Command};
use tokio::sync::RwLock;

/// 被管理的子进程
pub struct ManagedProcess {
    pub child: Child,
    pub pid: u32,
    pub started_at: i64,
}

/// 子进程管理器
pub struct ProcessManager {
    processes: RwLock<HashMap<String, ManagedProcess>>,
}

impl ProcessManager {
    pub fn new() -> Self {
        Self {
            processes: RwLock::new(HashMap::new()),
        }
    }

    /// 启动子进程，返回 (stdin, stdout)
    pub async fn spawn(
        &self,
        id: &str,
        command: &str,
        args: &[String],
        env: Option<&HashMap<String, String>>,
        working_dir: Option<&str>,
    ) -> Result<(tokio::process::ChildStdin, tokio::process::ChildStdout)> {
        // 如果已有同 id 进程，先杀掉
        self.kill(id).await.ok();

        let mut cmd = Command::new(command);
        cmd.args(args)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        if let Some(env_map) = env {
            for (k, v) in env_map {
                cmd.env(k, v);
            }
        }

        if let Some(dir) = working_dir {
            cmd.current_dir(dir);
        }

        // Windows: 不创建新窗口
        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            cmd.as_std_mut().creation_flags(0x08000000); // CREATE_NO_WINDOW
        }

        let mut child = cmd.spawn().map_err(|e| {
            AppError::Agent(format!("Failed to spawn process '{}': {}", command, e))
        })?;

        let pid = child.id().unwrap_or(0);
        let stdin = child.stdin.take().ok_or_else(|| {
            AppError::Agent("Failed to capture stdin".into())
        })?;
        let stdout = child.stdout.take().ok_or_else(|| {
            AppError::Agent("Failed to capture stdout".into())
        })?;

        let managed = ManagedProcess {
            child,
            pid,
            started_at: chrono::Utc::now().timestamp(),
        };

        self.processes.write().await.insert(id.to_string(), managed);
        tracing::info!(id = id, pid = pid, command = command, "Process spawned");

        Ok((stdin, stdout))
    }

    /// 优雅终止子进程
    pub async fn terminate(&self, id: &str) -> Result<()> {
        let mut processes = self.processes.write().await;
        if let Some(mut proc) = processes.remove(id) {
            // 先发送 kill 信号
            let _ = proc.child.kill().await;
            tracing::info!(id = id, pid = proc.pid, "Process terminated");
        }
        Ok(())
    }

    /// 强制杀死子进程
    pub async fn kill(&self, id: &str) -> Result<()> {
        self.terminate(id).await
    }

    /// 检查进程是否还在运行
    pub async fn is_running(&self, id: &str) -> bool {
        let processes = self.processes.read().await;
        processes.contains_key(id)
    }

    /// 应用退出时清理所有子进程
    pub async fn cleanup_all(&self) {
        let mut processes = self.processes.write().await;
        for (id, mut proc) in processes.drain() {
            let _ = proc.child.kill().await;
            tracing::info!(id = id, pid = proc.pid, "Process cleaned up on shutdown");
        }
    }
}

impl Default for ProcessManager {
    fn default() -> Self {
        Self::new()
    }
}
