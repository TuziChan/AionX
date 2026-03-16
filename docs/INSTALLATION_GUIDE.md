# Tauri 2.x 开发环境安装指南（Windows）

## 前置条件检查

在开始之前，请确认你的系统满足以下要求：
- Windows 10 (1803+) 或 Windows 11
- 至少 5GB 可用磁盘空间
- 管理员权限（用于安装软件）

## 第一步：安装 Microsoft C++ Build Tools

这是编译 Rust 代码所必需的。

### 方法 1：通过 Visual Studio Installer（推荐）

1. 下载 Visual Studio Build Tools：
   - 访问：https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - 点击 "Download Build Tools"

2. 运行安装程序 `vs_BuildTools.exe`

3. 在安装界面中：
   - 选择 **"Desktop development with C++"** 工作负载
   - 确保右侧勾选了：
     - MSVC v143 - VS 2022 C++ x64/x86 build tools
     - Windows 11 SDK (或 Windows 10 SDK)
   - 点击 "Install"

4. 安装完成后重启计算机

### 方法 2：通过 winget（如果已安装）

```powershell
winget install Microsoft.VisualStudio.2022.BuildTools --override "--wait --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

## 第二步：安装 Rust

### 使用 rustup（官方推荐方式）

1. 下载 rustup-init.exe：
   - 访问：https://rustup.rs/
   - 点击下载 "rustup-init.exe (64-bit)"

2. 运行 `rustup-init.exe`

3. 在命令行窗口中：
   - 看到提示时，输入 `1` 然后按 Enter（选择默认安装）
   - 等待安装完成（可能需要几分钟）

4. 安装完成后，你会看到：
   ```
   Rust is installed now. Great!
   ```

5. **重要**：关闭当前终端，打开新的终端窗口

### 验证 Rust 安装

打开新的终端（PowerShell 或 CMD），运行：

```bash
rustc --version
cargo --version
```

应该看到类似输出：
```
rustc 1.80.0 (051478957 2024-07-21)
cargo 1.80.0 (376290515 2024-07-16)
```

## 第三步：安装 WebView2

Windows 11 通常已预装 WebView2。检查是否需要安装：

### 检查 WebView2 是否已安装

1. 打开 PowerShell，运行：
```powershell
Get-AppxPackage -Name Microsoft.WebView2
```

2. 如果有输出，说明已安装，可以跳过此步骤

### 如果未安装，手动安装

1. 下载 WebView2 Runtime：
   - 访问：https://developer.microsoft.com/microsoft-edge/webview2/
   - 点击 "Download Runtime" → "Evergreen Standalone Installer"

2. 运行下载的安装程序

3. 按照提示完成安装

## 第四步：配置 Rust 工具链（确保使用 MSVC）

打开终端，运行：

```bash
rustup default stable-msvc
```

验证工具链：
```bash
rustup show
```

应该看到类似：
```
Default host: x86_64-pc-windows-msvc
...
active toolchain: stable-x86_64-pc-windows-msvc
```

## 第五步：验证完整环境

运行以下命令确认所有工具都已正确安装：

```bash
# 检查 Node.js
node --version

# 检查 npm
npm --version

# 检查 Rust
rustc --version

# 检查 Cargo
cargo --version

# 检查 Rust 工具链
rustup show
```

## 完成！

所有前置条件已安装完成。现在可以继续创建 Tauri 项目了。

## 常见问题

### Q: rustc 命令找不到
A: 确保已重启终端。如果仍然不行，手动添加到 PATH：
   - 默认路径：`C:\Users\<你的用户名>\.cargo\bin`

### Q: 编译时出现 "link.exe not found"
A: 说明 C++ Build Tools 未正确安装，重新安装并确保选择了 "Desktop development with C++"

### Q: 安装 Rust 时提示需要 Visual Studio
A: 先安装 C++ Build Tools（第一步），然后再安装 Rust

## 下一步

安装完成后，请在终端运行以下命令通知我：

```bash
rustc --version && cargo --version
```

然后我将继续创建 Tauri 项目。
