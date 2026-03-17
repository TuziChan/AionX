use crate::dao::McpServerDao;
use crate::models::mcp_server::{CreateMcpServer, McpServer, McpServerUpdate};
use crate::state::AppState;
use serde_json::Value;
use std::collections::HashMap;
use std::process::ExitStatus;
use std::process::Stdio;
use tauri::State;
use tokio::process::Command;
use tokio::time::{timeout, Duration};

#[tauri::command]
#[specta::specta]
pub async fn list_mcp_servers(state: State<'_, AppState>) -> Result<Vec<McpServer>, String> {
    let dao = McpServerDao::new(state.db_pool.clone());
    dao.find_all().await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn create_mcp_server(
    state: State<'_, AppState>,
    input: CreateMcpServer,
) -> Result<McpServer, String> {
    let dao = McpServerDao::new(state.db_pool.clone());
    dao.insert(&input).await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn update_mcp_server(
    state: State<'_, AppState>,
    id: String,
    updates: McpServerUpdate,
) -> Result<McpServer, String> {
    let dao = McpServerDao::new(state.db_pool.clone());
    let updated = dao.update(&id, &updates).await.map_err(|e| e.to_string())?;
    if !updated {
        return Err(format!("MCP server not found: {id}"));
    }

    dao.find_by_id(&id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("MCP server not found: {id}"))
}

#[tauri::command]
#[specta::specta]
pub async fn delete_mcp_server(state: State<'_, AppState>, id: String) -> Result<bool, String> {
    let dao = McpServerDao::new(state.db_pool.clone());
    dao.delete(&id).await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn test_mcp_connection(state: State<'_, AppState>, id: String) -> Result<String, String> {
    let dao = McpServerDao::new(state.db_pool.clone());
    let server = dao
        .find_by_id(&id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("MCP server not found: {id}"))?;

    if server.server_type == "stdio" {
        let command = server
            .command
            .as_deref()
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .ok_or_else(|| "MCP stdio server missing command".to_string())?;

        let args = parse_args(server.args.as_deref())?;
        let envs = parse_env(server.env.as_deref())?;

        let mut child = Command::new(command)
            .args(args)
            .envs(envs)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to start MCP server process: {e}"))?;

        // 如果进程在极短时间内异常退出，视为连接失败；否则视为可达
        if let Some(status) = wait_for_quick_exit(&mut child).await {
            if !status.success() {
                return Err(format!(
                    "MCP stdio server process exited early with status: {status}"
                ));
            }
        }

        // 主动终止，避免探测残留进程
        let _ = child.start_kill();
        let _ = timeout(Duration::from_secs(2), child.wait()).await;

        return Ok(format!(
            "MCP stdio server '{}' is reachable via command '{}'",
            server.name, command
        ));
    }

    if server.server_type == "sse" || server.server_type == "http" {
        let url = server
            .url
            .as_deref()
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .ok_or_else(|| "MCP remote server missing url".to_string())?;

        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(8))
            .build()
            .map_err(|e| format!("Failed to build HTTP client: {e}"))?;

        let resp = client
            .get(url)
            .send()
            .await
            .map_err(|e| format!("MCP remote server request failed: {e}"))?;

        if !resp.status().is_success() {
            return Err(format!(
                "MCP remote server returned non-success status: {}",
                resp.status()
            ));
        }

        return Ok(format!(
            "MCP remote server '{}' is reachable at {}",
            server.name, url
        ));
    }

    Err(format!(
        "Unsupported MCP server type: {}",
        server.server_type
    ))
}

async fn wait_for_quick_exit(child: &mut tokio::process::Child) -> Option<ExitStatus> {
    match timeout(Duration::from_millis(350), child.wait()).await {
        Ok(Ok(status)) => Some(status),
        Ok(Err(_)) => None,
        Err(_) => None,
    }
}

fn parse_args(raw: Option<&str>) -> Result<Vec<String>, String> {
    let Some(raw) = raw.map(str::trim).filter(|s| !s.is_empty()) else {
        return Ok(vec![]);
    };

    let val: Value =
        serde_json::from_str(raw).map_err(|e| format!("Invalid MCP args JSON: {e}"))?;

    let arr = val
        .as_array()
        .ok_or_else(|| "MCP args must be a JSON array".to_string())?;

    arr.iter()
        .map(|v| {
            v.as_str()
                .map(ToOwned::to_owned)
                .ok_or_else(|| "MCP args must contain only string items".to_string())
        })
        .collect()
}

fn parse_env(raw: Option<&str>) -> Result<HashMap<String, String>, String> {
    let Some(raw) = raw.map(str::trim).filter(|s| !s.is_empty()) else {
        return Ok(HashMap::new());
    };

    let val: Value = serde_json::from_str(raw).map_err(|e| format!("Invalid MCP env JSON: {e}"))?;

    let obj = val
        .as_object()
        .ok_or_else(|| "MCP env must be a JSON object".to_string())?;

    obj.iter()
        .map(|(k, v)| {
            v.as_str()
                .map(|vv| (k.clone(), vv.to_string()))
                .ok_or_else(|| "MCP env values must be strings".to_string())
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::{parse_args, parse_env, wait_for_quick_exit};
    use std::process::Stdio;
    use tokio::process::Command;

    #[test]
    fn parse_args_accepts_string_array() {
        let args = parse_args(Some("[\"--mode\",\"stdio\"]")).unwrap();
        assert_eq!(args, vec!["--mode", "stdio"]);
    }

    #[test]
    fn parse_env_accepts_object() {
        let env = parse_env(Some("{\"A\":\"1\",\"B\":\"x\"}")).unwrap();
        assert_eq!(env.get("A"), Some(&"1".to_string()));
        assert_eq!(env.get("B"), Some(&"x".to_string()));
    }

    #[test]
    fn parse_env_rejects_non_string_value() {
        let err = parse_env(Some("{\"A\":1}")).unwrap_err();
        assert!(err.contains("values must be strings"));
    }

    #[tokio::test]
    async fn wait_for_quick_exit_captures_fast_failure() {
        let mut child = Command::new("sh")
            .arg("-c")
            .arg("exit 3")
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .unwrap();

        let status = wait_for_quick_exit(&mut child).await;
        assert!(status.is_some());
        assert!(!status.unwrap().success());
    }
}
