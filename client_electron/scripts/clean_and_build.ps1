$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Stop-RunningProcesses {
  $names = @('TRAI', 'electron', 'electron-builder')
  foreach ($name in $names) {
    $procs = Get-Process -Name $name -ErrorAction SilentlyContinue
    foreach ($p in $procs) {
      try {
        Stop-Process -Id $p.Id -Force -ErrorAction Stop
      } catch {
      }
    }
  }
}

function Remove-Shortcuts {
  $targets = @(
    (Join-Path $env:USERPROFILE 'Desktop\TRAI.lnk'),
    (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\TRAI.lnk'),
    (Join-Path $env:PUBLIC 'Desktop\TRAI.lnk'),
    (Join-Path $env:ProgramData 'Microsoft\Windows\Start Menu\Programs\TRAI.lnk')
  )
  foreach ($t in $targets) {
    if (Test-Path $t) {
      Remove-Item -Force $t -ErrorAction SilentlyContinue
    }
  }
}

function Remove-InstalledApp {
  $installDir = Join-Path $env:LOCALAPPDATA 'Programs\TRAI'
  if (Test-Path $installDir) {
    Remove-Item -Recurse -Force $installDir -ErrorAction SilentlyContinue
  }

  $dataDirs = @(
    (Join-Path $env:APPDATA 'TRAI'),
    (Join-Path $env:LOCALAPPDATA 'TRAI'),
    (Join-Path $env:LOCALAPPDATA 'trai'),
    (Join-Path $env:LOCALAPPDATA 'com.wuhao.trai')
  )
  foreach ($d in $dataDirs) {
    if (Test-Path $d) {
      Remove-Item -Recurse -Force $d -ErrorAction SilentlyContinue
    }
  }
}

function Clear-IconCache {
  $explorerProcs = Get-Process -Name explorer -ErrorAction SilentlyContinue
  foreach ($p in $explorerProcs) {
    try {
      Stop-Process -Id $p.Id -Force -ErrorAction Stop
    } catch {
    }
  }

  Start-Sleep -Milliseconds 600

  $cacheDir = Join-Path $env:LOCALAPPDATA 'Microsoft\Windows\Explorer'
  if (Test-Path $cacheDir) {
    Get-ChildItem -Path $cacheDir -Filter 'iconcache*.db' -ErrorAction SilentlyContinue | ForEach-Object {
      try {
        Remove-Item -Force $_.FullName -ErrorAction Stop
      } catch {
      }
    }
    Get-ChildItem -Path $cacheDir -Filter 'thumbcache*.db' -ErrorAction SilentlyContinue | ForEach-Object {
      try {
        Remove-Item -Force $_.FullName -ErrorAction Stop
      } catch {
      }
    }
  }

  Start-Process explorer.exe | Out-Null
}

function Clean-BuildArtifacts {
  param(
    [Parameter(Mandatory = $true)]
    [string] $clientDir
  )

  $dirs = @('release', 'release2', 'release3', 'dist')
  foreach ($d in $dirs) {
    $p = Join-Path $clientDir $d
    if (Test-Path $p) {
      Remove-Item -Recurse -Force $p -ErrorAction SilentlyContinue
    }
  }
}

function Build-Client {
  param(
    [Parameter(Mandatory = $true)]
    [string] $clientDir
  )

  Push-Location $clientDir
  try {
    & pnpm install --frozen-lockfile
    if ($LASTEXITCODE -ne 0) { throw "pnpm install failed: $LASTEXITCODE" }

    & pnpm run type-check
    if ($LASTEXITCODE -ne 0) { throw "type-check failed: $LASTEXITCODE" }

    & pnpm run build
    if ($LASTEXITCODE -ne 0) { throw "build failed: $LASTEXITCODE" }
  } finally {
    Pop-Location
  }
}

$clientDir = Split-Path -Parent $PSScriptRoot

Write-Host 'Step 1: stop processes'
Stop-RunningProcesses

Write-Host 'Step 2: remove shortcuts'
Remove-Shortcuts

Write-Host 'Step 3: remove installed app and app data'
Remove-InstalledApp

Write-Host 'Step 4: clear icon cache'
Clear-IconCache

Write-Host 'Step 5: clean build artifacts'
Clean-BuildArtifacts -clientDir $clientDir

Write-Host 'Step 6: rebuild'
Build-Client -clientDir $clientDir

Write-Host 'Done'
Write-Host 'Output: client_electron\release'

