#Requires -Version 5.1
<#
.SYNOPSIS
  将全局 Cursor/Agent Skills 按分类整理到子目录。

.DESCRIPTION
  默认整理目录：
    - %USERPROFILE%\.agents\skills   （主目录，Cursor 全局发现）
    - %USERPROFILE%\.cursor\skills   （合并进 .agents 后按同样分类）

  分类文件夹仅用于组织；Skill 名称仍为直接包含 SKILL.md 的文件夹名。

.PARAMETER WhatIf
  仅预览，不移动文件。

.PARAMETER SetManualOnlyForDesignVariants
  为 design 类中「非常用」变体 Skill 的 SKILL.md 添加 disable-model-invocation: true
  （保留 design-taste-frontend、frontend-design 可自动匹配）。

.PARAMETER SkipCursorSkills
  不处理 ~/.cursor/skills 中的 Skill。

.EXAMPLE
  .\organize-cursor-skills.ps1 -WhatIf

.EXAMPLE
  .\organize-cursor-skills.ps1 -SetManualOnlyForDesignVariants
#>

[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [switch] $SetManualOnlyForDesignVariants,
    [switch] $SkipCursorSkills
)

$ErrorActionPreference = 'Stop'

# 分类 -> Skill 文件夹名（与 SKILL.md 中 name 一致）
$CategoryMap = [ordered]@{
    design   = @(
        'design-taste-frontend',
        'design-taste-frontend-v1',
        'minimalist-ui',
        'industrial-brutalist-ui',
        'frontend-design',
        'high-end-visual-design',
        'redesign-existing-projects',
        'stitch-design-taste',
        'design-system-patterns',
        'tailwind-design-system',
        'ui-ux-pro-max',
        'web-design-guidelines',
        'brandkit',
        'gpt-taste',
        'full-output-enforcement',
        'imagegen-frontend-mobile',
        'imagegen-frontend-web',
        'image-to-code',
        'design-md',
        'pencil-to-frontend'
    )
    document = @(
        'pdf',
        'docx',
        'xlsx',
        'pptx',
        'nano-pdf',
        'csv-data-summarizer'
    )
    dev      = @(
        'backend',
        'find-skills'
    )
    agent    = @(
        'brainstorming',
        'proactive-agent',
        'self-improving-agent',
        'using-superpowers',
        'ontology',
        'claude-md-improver'
    )
    tools    = @(
        'agent-browser',
        'tavily-search',
        'composio'
    )
    product  = @(
        'prd-writer'
    )
}

# 设为仅手动 /skill 调用（减少 Agent 自动匹配干扰）
$ManualOnlyDesignSkills = @(
    'design-taste-frontend-v1',
    'gpt-taste',
    'minimalist-ui',
    'industrial-brutalist-ui',
    'brandkit',
    'full-output-enforcement',
    'imagegen-frontend-mobile',
    'imagegen-frontend-web',
    'image-to-code',
    'redesign-existing-projects',
    'high-end-visual-design',
    'stitch-design-taste'
)

function Get-SkillRootPath {
    param([string] $Root)
    if (-not (Test-Path -LiteralPath $Root)) {
        Write-Warning "目录不存在，跳过: $Root"
        return $null
    }
    return (Resolve-Path -LiteralPath $Root).Path
}

function Test-SkillFolder {
    param([string] $Path)
    return (Test-Path -LiteralPath (Join-Path $Path 'SKILL.md'))
}

function Move-SkillToCategory {
    param(
        [string] $SkillsRoot,
        [string] $Category,
        [string] $SkillName
    )

    $categoryDir = Join-Path $SkillsRoot $Category
    $dest = Join-Path $categoryDir $SkillName

    # 已在正确位置
    if ((Test-Path -LiteralPath $dest) -and (Test-SkillFolder $dest)) {
        Write-Host "  [跳过] 已在分类下: $Category/$SkillName" -ForegroundColor DarkGray
        return 'skipped'
    }

    $srcRoot = Join-Path $SkillsRoot $SkillName
    $src = $null

    if (Test-Path -LiteralPath $srcRoot) {
        $src = $srcRoot
    }
    else {
        $found = @(
            Get-ChildItem -LiteralPath $SkillsRoot -Directory -Recurse -Depth 2 -ErrorAction SilentlyContinue |
                Where-Object { $_.Name -eq $SkillName -and (Test-SkillFolder $_.FullName) }
        )
        if ($found.Count -eq 1) {
            if ($found[0].Parent.Name -eq $Category) {
                Write-Host "  [跳过] 已在 $Category/$SkillName" -ForegroundColor DarkGray
                return 'skipped'
            }
            $src = $found[0].FullName
        }
        elseif ($found.Count -gt 1) {
            Write-Warning "  [冲突] 存在多个 $SkillName，请手动处理: $($found.FullName -join ', ')"
            return 'conflict'
        }
    }

    if (-not $src) {
        return 'missing'
    }

    if (-not (Test-SkillFolder $src)) {
        Write-Warning "  [无效] 非 Skill 目录（无 SKILL.md）: $src"
        return 'invalid'
    }

    if (-not (Test-Path -LiteralPath $categoryDir)) {
        if ($PSCmdlet.ShouldProcess($categoryDir, 'Create directory')) {
            New-Item -ItemType Directory -Path $categoryDir -Force | Out-Null
        }
    }

    if (Test-Path -LiteralPath $dest) {
        Write-Warning "  [冲突] 目标已存在: $dest"
        return 'conflict'
    }

    if ($PSCmdlet.ShouldProcess($src, "Move -> $Category/$SkillName")) {
        Move-Item -LiteralPath $src -Destination $dest
        Write-Host "  [完成] -> $Category/$SkillName" -ForegroundColor Green
    }
    else {
        Write-Host "  [预览] $src -> $Category/$SkillName" -ForegroundColor Cyan
    }
    return 'moved'
}

function Set-ManualOnlyInvocation {
    param([string] $SkillDir)

    $skillMd = Join-Path $SkillDir 'SKILL.md'
    if (-not (Test-Path -LiteralPath $skillMd)) { return }

    $content = Get-Content -LiteralPath $skillMd -Raw -Encoding UTF8
    if ($content -match '(?m)^disable-model-invocation:\s*true') {
        return
    }

    if ($content -notmatch '(?s)^---\r?\n') {
        Write-Warning "  无 frontmatter，跳过: $skillMd"
        return
    }

    $newContent = $content -replace '(?s)^(---\r?\n)', "`$1disable-model-invocation: true`n"

    if ($PSCmdlet.ShouldProcess($skillMd, 'Add disable-model-invocation: true')) {
        [System.IO.File]::WriteAllText($skillMd, $newContent, [System.Text.UTF8Encoding]::new($false))
        Write-Host "  [手动模式] $(Split-Path $SkillDir -Leaf)" -ForegroundColor Yellow
    }
}

function Invoke-OrganizeSkillsRoot {
    param([string] $SkillsRoot)

    if (-not $SkillsRoot) { return @{} }

    Write-Host "`n=== 整理: $SkillsRoot ===" -ForegroundColor White

    $stats = @{ moved = 0; skipped = 0; missing = 0; conflict = 0; invalid = 0 }

    foreach ($category in $CategoryMap.Keys) {
        Write-Host "`n[$category]" -ForegroundColor Magenta
        foreach ($skillName in $CategoryMap[$category]) {
            $result = Move-SkillToCategory -SkillsRoot $SkillsRoot -Category $category -SkillName $skillName
            if ($stats.ContainsKey($result)) { $stats[$result]++ }
        }
    }

    # 报告未映射的顶层 skill（仍在根目录）
    $categoryNames = @($CategoryMap.Keys)
    $leftover = Get-ChildItem -LiteralPath $SkillsRoot -Directory |
        Where-Object {
            $_.Name -notin $categoryNames -and (Test-SkillFolder $_.FullName)
        }
    if ($leftover) {
        Write-Host "`n[未分类] 仍位于根目录的 Skill:" -ForegroundColor Yellow
        $leftover | ForEach-Object { Write-Host "  - $($_.Name)" }
    }

    return $stats
}

# --- 主流程 ---
Write-Host 'Cursor Skills 分类整理' -ForegroundColor White
if ($WhatIfPreference) { Write-Host '(预览模式 -WhatIf)' -ForegroundColor Cyan }

$agentsRoot = Get-SkillRootPath (Join-Path $env:USERPROFILE '.agents\skills')
$cursorRoot = if (-not $SkipCursorSkills) {
    Get-SkillRootPath (Join-Path $env:USERPROFILE '.cursor\skills')
} else { $null }

if (-not $agentsRoot -and -not $cursorRoot) {
    Write-Error '未找到可整理的 skills 目录。'
}

# 先把 .cursor/skills 合并到 .agents/skills（避免两处重复）
if ($cursorRoot -and $agentsRoot) {
    Write-Host "`n=== 合并 ~/.cursor/skills -> ~/.agents/skills ===" -ForegroundColor White
    Get-ChildItem -LiteralPath $cursorRoot -Directory | ForEach-Object {
        $name = $_.Name
        if (-not (Test-SkillFolder $_.FullName)) { return }
        $target = Join-Path $agentsRoot $name
        if (Test-Path -LiteralPath $target) {
            Write-Host "  [跳过] .agents 已存在: $name" -ForegroundColor DarkGray
            return
        }
        if ($PSCmdlet.ShouldProcess($_.FullName, "Move to agents/skills/$name")) {
            Move-Item -LiteralPath $_.FullName -Destination $target
            Write-Host "  [合并] $name" -ForegroundColor Green
        }
        else {
            Write-Host "  [预览] cursor/skills/$name -> agents/skills/$name" -ForegroundColor Cyan
        }
    }
}

if ($agentsRoot) {
    $null = Invoke-OrganizeSkillsRoot -SkillsRoot $agentsRoot
}

if ($SetManualOnlyForDesignVariants -and $agentsRoot) {
    Write-Host "`n=== 设置 design 变体为仅手动调用 ===" -ForegroundColor White
    $designDir = Join-Path $agentsRoot 'design'
    foreach ($skillName in $ManualOnlyDesignSkills) {
        $dir = Join-Path $designDir $skillName
        if (Test-Path -LiteralPath $dir) {
            Set-ManualOnlyInvocation -SkillDir $dir
        }
    }
}

Write-Host "`n完成。请重启 Cursor 使 Skills 列表刷新。" -ForegroundColor Green
Write-Host "说明: ~/.claude/skills 若仍有重复副本，可手动删除或仅保留 .agents/skills。" -ForegroundColor DarkGray
