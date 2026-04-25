#!/usr/bin/env node
/**
 * 文件名: publish.js
 * 作者: wuhao
 * 日期: 2026-04-25 04:30:00
 * 描述: TRAI 客户端一键发布脚本 - 打包后自动上传到 S3
 */

const { execSync, spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const https = require('https')
const http = require('http')

// 配置
const CONFIG = {
  apiUrl: process.env.TRAI_API_URL || 'http://127.0.0.1:5666',
  adminToken: process.env.TRAI_ADMIN_TOKEN || '',
  releaseNotes: process.env.TRAI_RELEASE_NOTES || '',
  version: process.env.TRAI_VERSION || ''
}

// 日志颜色
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}[TRAI]${colors.reset} ${message}`)
}

function logStep(step, total, message) {
  console.log(`\n${colors.cyan}${'='.repeat(50)}${colors.reset}`)
  console.log(`${colors.cyan}Step ${step}/${total}: ${message}${colors.reset}`)
  console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}\n`)
}

// 执行命令
function exec(command, options = {}) {
  const { cwd = process.cwd(), env = {}, timeout = 600000 } = options
  try {
    log(`执行: ${command}`)
    const result = execSync(command, {
      cwd,
      env: { ...process.env, ...env },
      stdio: 'inherit',
      timeout
    })
    return { success: true, result }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// 查找构建产物
function findArtifacts(releaseDir) {
  log('查找构建产物...')

  // 查找 exe
  let exeFiles = []
  try {
    exeFiles = fs.readdirSync(releaseDir)
      .filter(f => f.endsWith('.exe') && f.includes('Setup'))
  } catch (e) {
    // ignore
  }

  // 查找 yml
  let ymlFiles = []
  try {
    ymlFiles = fs.readdirSync(releaseDir)
      .filter(f => f.endsWith('.yml') || f.includes('-yml'))
  } catch (e) {
    // ignore
  }

  const exePath = exeFiles.length > 0 ? path.join(releaseDir, exeFiles[0]) : null
  const ymlPath = ymlFiles.length > 0 ? path.join(releaseDir, ymlFiles[0]) : null

  if (exePath) log(`找到安装包: ${exePath}`, 'green')
  if (ymlPath) log(`找到 latest.yml: ${ymlPath}`, 'green')

  return { exePath, ymlPath }
}

// 读取版本号
function getVersion(ymlPath, exePath) {
  if (CONFIG.version) return CONFIG.version

  // 从 exe 文件名提取
  if (exePath) {
    const match = exePath.match(/Setup\s+([\d.]+)/)
    if (match) return match[1]
  }

  // 从 yml 读取
  if (ymlPath && fs.existsSync(ymlPath)) {
    try {
      const content = fs.readFileSync(ymlPath, 'utf-8')
      const match = content.match(/version:\s*['"]?([\d.]+)['"]?/)
      if (match) return match[1]
    } catch (e) {
      // ignore
    }
  }

  return null
}

// 读取更新日志
function getReleaseNotes() {
  if (CONFIG.releaseNotes) return CONFIG.releaseNotes

  const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md')
  if (fs.existsSync(changelogPath)) {
    try {
      const content = fs.readFileSync(changelogPath, 'utf-8')
      const lines = content.split('\n').slice(0, 30)
      const notes = []
      for (const line of lines) {
        if (line.match(/^#{1,2}\s+\d/)) break
        if (line.trim()) notes.push(line.trim())
      }
      return notes.slice(0, 10).join('\n')
    } catch (e) {
      // ignore
    }
  }
  return ''
}

// HTTP 上传文件
function uploadFile(url, filePath, fieldName, additionalFields = {}) {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(filePath)
    const fileContent = fs.readFileSync(filePath)

    const boundary = '----FormBoundary' + Math.random().toString(36).substring(2)

    // 构建 multipart form data
    let body = ''

    // 添加字段
    for (const [key, value] of Object.entries(additionalFields)) {
      body += `--${boundary}\r\n`
      body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`
      body += `${value}\r\n`
    }

    // 添加文件
    body += `--${boundary}\r\n`
    body += `Content-Disposition: form-data; name="${fieldName}"; filename="${fileName}"\r\n`
    body += `Content-Type: application/octet-stream\r\n\r\n`

    const bodyBuffer = Buffer.from(body, 'utf-8')
    const fileBuffer = fileContent
    const endBoundary = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8')
    const fullBody = Buffer.concat([bodyBuffer, fileBuffer, endBoundary])

    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullBody.length,
        'Authorization': `Bearer ${CONFIG.adminToken}`
      }
    }

    const protocol = urlObj.protocol === 'https:' ? https : http
    const req = protocol.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 302) {
          try {
            const json = JSON.parse(data)
            resolve(json)
          } catch (e) {
            resolve({ success: true, message: data })
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        }
      })
    })

    req.on('error', reject)
    req.write(fullBody)
    req.end()
  })
}

// 主流程
async function main() {
  console.log(`
${colors.cyan}╔══════════════════════════════════════════════════╗
║         TRAI 客户端一键发布工具                  ║
╚══════════════════════════════════════════════════╝${colors.reset}
`)

  // 检查 token
  if (!CONFIG.adminToken) {
    log('错误: 请设置 TRAI_ADMIN_TOKEN 环境变量', 'red')
    log('或运行: TRAI_ADMIN_TOKEN=your_token node publish.js', 'yellow')
    process.exit(1)
  }

  const clientDir = __dirname
  const releaseDir = path.join(clientDir, 'release')

  // Step 1: 构建
  logStep(1, 4, '构建 Electron 客户端')
  const buildResult = exec('npm run build', { cwd: clientDir })
  if (!buildResult.success) {
    log('构建失败!', 'red')
    process.exit(1)
  }
  log('构建成功!', 'green')

  // Step 2: 查找产物
  logStep(2, 4, '查找构建产物')
  const { exePath, ymlPath } = findArtifacts(releaseDir)

  if (!exePath) {
    log('未找到安装包 (.exe) 文件', 'red')
    process.exit(1)
  }

  // Step 3: 上传
  logStep(3, 4, '上传到 S3')

  const version = getVersion(ymlPath, exePath)
  if (!version) {
    log('无法确定版本号', 'red')
    process.exit(1)
  }
  log(`发布版本: ${version}`, 'cyan')

  const releaseNotes = getReleaseNotes()
  const apiUrl = `${CONFIG.apiUrl}/api_trai/v1/admin/client/release`

  try {
    log(`上传到: ${apiUrl}`)

    // 上传
    const fields = {
      version,
      release_notes: releaseNotes
    }

    let ymlFile = ymlPath
    // 如果没有 yml，生成一个
    if (!ymlFile) {
      log('生成 latest.yml...', 'yellow')
      const yamlContent = `version: ${version}
releaseDate: ${new Date().toISOString()}
files:
  - url: ${path.basename(exePath)}
    sha512: placeholder
    size: ${fs.statSync(exePath).size}
`
      ymlFile = path.join(releaseDir, `TRAI-${version}-x64.yml`)
      fs.writeFileSync(ymlFile, yamlContent)
      log(`已生成: ${ymlFile}`, 'green')
    }

    const result = await uploadFile(apiUrl, ymlFile, 'latest_yml', fields)
    const exeResult = await uploadFile(apiUrl, exePath, 'installer_exe', fields)

    log('上传成功!', 'green')
    log(`消息: ${result.message || exeResult.message}`, 'green')

  } catch (error) {
    log(`上传失败: ${error.message}`, 'red')
    process.exit(1)
  }

  // Step 4: 完成
  logStep(4, 4, '发布完成')

  console.log(`
${colors.green}╔══════════════════════════════════════════════════╗
║                   发布成功!                        ║
╚══════════════════════════════════════════════════╝${colors.reset}

  版本: ${version}
  安装包: ${exePath}

  客户端用户可通过以下方式更新:
  1. 打开应用 -> 设置 -> 系统更新 -> 检查更新
  2. 或访问: ${CONFIG.apiUrl}/api_trai/v1/client/update/latest.yml
`)
}

// 运行
main().catch(error => {
  log(`错误: ${error.message}`, 'red')
  process.exit(1)
})
