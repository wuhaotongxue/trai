/**
 * 文件名: build_with_version.js
 * 作者: wuhao
 * 日期: 2026-04-25
 * 描述: 动态生成版本号并打包
 * 1. package.json 版本自动递增 (0.1.0 -> 0.1.1 -> ...)
 * 2. latest.yml 使用完整版本: 0.1.1.202604251200
 * 3. 文件名: TRAI Setup 0.1.1.202604251200.exe
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const pkgPath = path.join(__dirname, 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

// 自动递增版本号 (0.1.0 -> 0.1.1 -> 0.1.2 -> ...)
function incrementVersion(v) {
  const parts = v.split('.')
  const patch = parseInt(parts[2] || '0') + 1
  return `${parts[0]}.${parts[1]}.${patch}`
}

const currentVersion = pkg.version  // 从 package.json 读取
const nextVersion = incrementVersion(currentVersion)

// 生成时间戳 (格式: 202604251200)
const now = new Date()
const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`

// 完整版本号 (用于 latest.yml 和文件名)
const fullVersion = `${nextVersion}.${timestamp}`

console.log(`当前版本: ${currentVersion}`)
console.log(`构建版本: ${nextVersion}`)
console.log(`完整版本: ${fullVersion}`)

// 更新 package.json (只更新标准版本号)
pkg.version = nextVersion
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

// 读取原始 build 配置
const originalBuild = pkg.build || {}

// 构建临时配置文件 (electron-builder 只识别根级别的配置)
const buildConfig = {
  buildVersion: nextVersion,
  ...originalBuild,
  // 覆盖 nsis 配置
  nsis: {
    ...originalBuild.nsis,
    shortcutName: 'TRAI',
    artifactName: `TRAI Setup ${fullVersion}.exe`
  }
}

console.log('buildConfig:', JSON.stringify(buildConfig, null, 2))

// 写入临时配置
const buildConfigPath = path.join(__dirname, 'build.temp.json')
fs.writeFileSync(buildConfigPath, JSON.stringify(buildConfig, null, 2))

try {
  // 执行构建 (使用 node_modules/.bin 下的本地二进制，避免 PATH 问题)
  // stderr 输出版本信息供 Python 解析
  const viteBin = path.join(__dirname, 'node_modules', '.bin', 'vite')
  const electronBuilderBin = path.join(__dirname, 'node_modules', '.bin', 'electron-builder')
  console.log('开始构建...')
  execSync(`"${viteBin}" build && "${electronBuilderBin}" --config build.temp.json`, {
    stdio: 'pipe',
    cwd: __dirname
  })
  // 写入版本信息到临时文件供 Python 读取
  const versionInfo = {
    currentVersion,
    buildVersion: nextVersion,
    fullVersion
  }
  const versionFile = path.join(__dirname, '.build_version.json')
  fs.writeFileSync(versionFile, JSON.stringify(versionInfo))
  console.error(`完整版本:${fullVersion}`)
  console.log(`构建完成: TRAI Setup ${fullVersion}.exe`)
} finally {
  // 恢复原始 package.json
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  if (fs.existsSync(buildConfigPath)) {
    fs.unlinkSync(buildConfigPath)
  }
}
