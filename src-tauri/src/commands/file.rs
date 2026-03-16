use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Type)]
pub struct FileContent {
    pub path: String,
    pub content: String,
    #[specta(type = f64)]
    pub size: u64,
    pub mime_type: String,
}

#[derive(Debug, Serialize, Deserialize, Type)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    #[specta(type = f64)]
    pub size: u64,
    pub modified: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Type)]
pub struct FileTypeInfo {
    pub path: String,
    pub mime_type: String,
    pub is_text: bool,
    pub is_image: bool,
}

// --- File Commands ---

#[tauri::command]
#[specta::specta]
pub async fn read_file(path: String) -> Result<FileContent, String> {
    let p = PathBuf::from(&path);
    if !p.exists() {
        return Err(format!("File not found: {}", path));
    }

    let content = tokio::fs::read_to_string(&p)
        .await
        .map_err(|e| format!("Failed to read file: {}", e))?;

    let metadata = tokio::fs::metadata(&p)
        .await
        .map_err(|e| format!("Failed to read metadata: {}", e))?;

    let mime_type = mime_guess_from_path(&path);

    Ok(FileContent {
        path,
        content,
        size: metadata.len(),
        mime_type,
    })
}

#[tauri::command]
#[specta::specta]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    let p = PathBuf::from(&path);
    if let Some(parent) = p.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    tokio::fs::write(&p, content)
        .await
        .map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
#[specta::specta]
pub async fn list_directory(
    path: String,
    recursive: Option<bool>,
) -> Result<Vec<FileEntry>, String> {
    let p = PathBuf::from(&path);
    if !p.is_dir() {
        return Err(format!("Not a directory: {}", path));
    }

    let mut entries = Vec::new();
    collect_entries(&p, &p, recursive.unwrap_or(false), &mut entries).await?;
    Ok(entries)
}

async fn collect_entries(
    base: &PathBuf,
    dir: &PathBuf,
    recursive: bool,
    entries: &mut Vec<FileEntry>,
) -> Result<(), String> {
    let mut read_dir = tokio::fs::read_dir(dir)
        .await
        .map_err(|e| format!("Failed to read directory: {}", e))?;

    while let Some(entry) = read_dir
        .next_entry()
        .await
        .map_err(|e| format!("Failed to read entry: {}", e))?
    {
        let metadata = entry.metadata().await.ok();
        let file_path = entry.path();
        let relative = file_path
            .strip_prefix(base)
            .unwrap_or(&file_path)
            .to_string_lossy()
            .to_string();

        let is_dir = metadata.as_ref().map(|m| m.is_dir()).unwrap_or(false);
        let size = metadata.as_ref().map(|m| m.len()).unwrap_or(0);
        let modified = metadata
            .as_ref()
            .and_then(|m| m.modified().ok())
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs_f64());

        entries.push(FileEntry {
            name: entry.file_name().to_string_lossy().to_string(),
            path: relative,
            is_dir,
            size,
            modified,
        });

        if is_dir && recursive {
            Box::pin(collect_entries(base, &file_path, true, entries)).await?;
        }
    }

    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn create_zip(paths: Vec<String>, output: String) -> Result<String, String> {
    use std::io::Write;

    let output_path = PathBuf::from(&output);
    let file = std::fs::File::create(&output_path)
        .map_err(|e| format!("Failed to create zip: {}", e))?;
    let mut zip = zip::ZipWriter::new(file);

    let options = zip::write::SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    for path_str in &paths {
        let path = PathBuf::from(path_str);
        if path.is_file() {
            let name = path.file_name().unwrap_or_default().to_string_lossy();
            zip.start_file(name.as_ref(), options)
                .map_err(|e| format!("Zip error: {}", e))?;
            let content = std::fs::read(&path)
                .map_err(|e| format!("Read error: {}", e))?;
            zip.write_all(&content)
                .map_err(|e| format!("Write error: {}", e))?;
        }
    }

    zip.finish().map_err(|e| format!("Zip finish error: {}", e))?;
    Ok(output)
}

#[tauri::command]
#[specta::specta]
pub async fn extract_zip(path: String, output: String) -> Result<(), String> {
    let file = std::fs::File::open(&path)
        .map_err(|e| format!("Failed to open zip: {}", e))?;
    let mut archive = zip::ZipArchive::new(file)
        .map_err(|e| format!("Invalid zip: {}", e))?;

    let output_path = PathBuf::from(&output);
    std::fs::create_dir_all(&output_path)
        .map_err(|e| format!("Failed to create output dir: {}", e))?;

    archive.extract(&output_path)
        .map_err(|e| format!("Extract error: {}", e))?;

    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn download_file(url: String, save_path: String) -> Result<String, String> {
    let response = reqwest::get(&url)
        .await
        .map_err(|e| format!("Download failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("HTTP error: {}", response.status()));
    }

    let bytes = response.bytes()
        .await
        .map_err(|e| format!("Read error: {}", e))?;

    let p = PathBuf::from(&save_path);
    if let Some(parent) = p.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("Failed to create dir: {}", e))?;
    }

    tokio::fs::write(&p, &bytes)
        .await
        .map_err(|e| format!("Write error: {}", e))?;

    Ok(save_path)
}

#[tauri::command]
#[specta::specta]
pub async fn get_file_type(path: String) -> Result<FileTypeInfo, String> {
    let mime = mime_guess_from_path(&path);
    let is_text = mime.starts_with("text/") || matches!(
        mime.as_str(),
        "application/json" | "application/javascript" | "application/xml"
        | "application/toml" | "application/yaml"
    );
    let is_image = mime.starts_with("image/");

    Ok(FileTypeInfo {
        path,
        mime_type: mime,
        is_text,
        is_image,
    })
}

fn mime_guess_from_path(path: &str) -> String {
    let ext = PathBuf::from(path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    match ext.as_str() {
        "rs" => "text/x-rust",
        "ts" | "tsx" => "text/typescript",
        "js" | "jsx" => "application/javascript",
        "json" => "application/json",
        "toml" => "application/toml",
        "yaml" | "yml" => "application/yaml",
        "md" => "text/markdown",
        "html" | "htm" => "text/html",
        "css" => "text/css",
        "py" => "text/x-python",
        "go" => "text/x-go",
        "java" => "text/x-java",
        "c" | "h" => "text/x-c",
        "cpp" | "cc" | "hpp" => "text/x-c++",
        "sh" | "bash" => "text/x-shellscript",
        "sql" => "text/x-sql",
        "xml" => "application/xml",
        "svg" => "image/svg+xml",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "ico" => "image/x-icon",
        "pdf" => "application/pdf",
        "zip" => "application/zip",
        "tar" | "gz" | "tgz" => "application/gzip",
        "txt" | "log" => "text/plain",
        _ => "application/octet-stream",
    }.to_string()
}
