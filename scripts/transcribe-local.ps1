<#
.SYNOPSIS
  Founder-only LOCAL transcription utility for Virnix validation.

  Turns a local audio/video file (or an owned/permitted YouTube URL) into a
  plain transcript.txt you can paste into Virnix's "Paste transcript manually"
  box. Unblocks caption-less videos (common for Slovenian / small channels)
  WITHOUT building production ASR.

.DESCRIPTION
  This is NOT part of the Virnix app. It does not run on Vercel, is not a
  dependency in package.json, and never touches production generation, credits,
  billing, prompts, the Slovenian sanitizer, or Strongest Moments. It runs on
  your own machine, on your own (residential) connection, under your manual
  control.

  Pipeline:
    local file  -> whisper (ffmpeg extracts audio) -> transcript.txt (+ .srt)
    YouTube URL -> yt-dlp downloads audio -> whisper -> transcript.txt (+ .srt)

  Engine: openai-whisper (the `whisper` CLI). No API key. No per-video cost.

.PARAMETER Source
  Path to a local audio/video file, OR a URL. Alias: -Input.
  URLs: only use for content you own or have explicit permission to process.

.PARAMETER Out
  Output .txt path. Alias: -Output. Defaults to ./transcripts/<name>.txt.

.PARAMETER Model
  Whisper model: tiny | base | small | medium | large. Default: small.
  For Slovenian, "medium" is noticeably more accurate but slower.

.PARAMETER Language
  Optional ISO code (e.g. sl, en) to skip auto-detection and force a language.

.PARAMETER KeepTemp
  Keep the temp working directory (downloaded audio + raw whisper output).

.EXAMPLE
  ./scripts/transcribe-local.ps1 -Input "C:\clips\episode.mp4"

.EXAMPLE
  ./scripts/transcribe-local.ps1 -Input "https://www.youtube.com/watch?v=XXXX" -Out "./transcripts/guest-show.txt" -Model medium -Language sl

.NOTES
  Compliance: only process content you own or are permitted to use. Downloading
  third-party YouTube audio may violate YouTube's Terms of Service; that risk is
  yours and is the reason this is a manual, local, owned-content-first tool and
  NOT an automatic production feature.
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [Alias('Input')]
  [string]$Source,

  [Parameter(Position = 1)]
  [Alias('Output')]
  [string]$Out,

  [ValidateSet('tiny', 'base', 'small', 'medium', 'large')]
  [string]$Model = 'small',

  [string]$Language,

  [switch]$KeepTemp
)

$ErrorActionPreference = 'Stop'

function Test-Tool([string]$name) {
  return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

function Fail([string]$message) {
  Write-Host ""
  Write-Host "ERROR: $message" -ForegroundColor Red
  exit 1
}

# ── Resolve input type ────────────────────────────────────────────────────────
$isUrl = $Source -match '^(https?://)'
$isLocalFile = $false
if (-not $isUrl) {
  if (Test-Path -LiteralPath $Source) {
    $isLocalFile = $true
  }
  else {
    Fail "Input is neither an existing local file nor an http(s) URL: '$Source'"
  }
}

# ── Dependency checks (clear install instructions if missing) ─────────────────
$missing = @()
if (-not (Test-Tool 'whisper')) {
  $missing += "whisper  -> install Python 3, then:  pip install -U openai-whisper"
}
if (-not (Test-Tool 'ffmpeg')) {
  $missing += "ffmpeg   -> winget install Gyan.FFmpeg   (or: choco install ffmpeg)"
}
if ($isUrl -and -not (Test-Tool 'yt-dlp')) {
  $missing += "yt-dlp   -> winget install yt-dlp.yt-dlp  (or: pip install -U yt-dlp)"
}
if ($missing.Count -gt 0) {
  Write-Host ""
  Write-Host "Missing required tools:" -ForegroundColor Yellow
  foreach ($m in $missing) { Write-Host "  - $m" }
  Write-Host ""
  Write-Host "Install the tool(s) above, open a new PowerShell window, and re-run."
  exit 1
}

# ── Temp working directory ────────────────────────────────────────────────────
$tmp = Join-Path $env:TEMP ("virnix-transcribe-" + ([guid]::NewGuid().ToString('N')))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null

try {
  # ── Acquire audio ───────────────────────────────────────────────────────────
  if ($isUrl) {
    Write-Host "Compliance reminder: only process content you own or are permitted to use." -ForegroundColor DarkYellow
    Write-Host "Downloading audio with yt-dlp..." -ForegroundColor Cyan
    $audioTemplate = Join-Path $tmp '%(id)s.%(ext)s'
    & yt-dlp -x --audio-format mp3 --no-playlist -o $audioTemplate $Source
    if ($LASTEXITCODE -ne 0) { Fail "yt-dlp failed to download audio (exit $LASTEXITCODE)." }
    $audioFile = Get-ChildItem -LiteralPath $tmp -File | Select-Object -First 1
    if ($null -eq $audioFile) { Fail "yt-dlp produced no audio file." }
    $audioPath = $audioFile.FullName
    $baseName = [IO.Path]::GetFileNameWithoutExtension($audioFile.Name)
  }
  else {
    $audioPath = (Resolve-Path -LiteralPath $Source).Path
    $baseName = [IO.Path]::GetFileNameWithoutExtension($audioPath)
  }

  # ── Transcribe with whisper (txt + srt) ─────────────────────────────────────
  Write-Host "Transcribing with whisper (model=$Model)... this can take a while." -ForegroundColor Cyan
  $whisperArgs = @(
    $audioPath,
    '--model', $Model,
    '--task', 'transcribe',
    '--output_format', 'all',
    '--output_dir', $tmp
  )
  if ($Language) { $whisperArgs += @('--language', $Language) }
  & whisper @whisperArgs
  if ($LASTEXITCODE -ne 0) { Fail "whisper failed to transcribe (exit $LASTEXITCODE)." }

  $producedTxt = Get-ChildItem -LiteralPath $tmp -Filter '*.txt' | Select-Object -First 1
  if ($null -eq $producedTxt) { Fail "whisper produced no .txt transcript." }
  $producedSrt = Get-ChildItem -LiteralPath $tmp -Filter '*.srt' | Select-Object -First 1

  # ── Resolve output path ─────────────────────────────────────────────────────
  if (-not $Out) {
    $Out = Join-Path (Join-Path '.' 'transcripts') ($baseName + '.txt')
  }
  $outDir = Split-Path -Parent $Out
  if ($outDir -and -not (Test-Path -LiteralPath $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
  }
  Copy-Item -LiteralPath $producedTxt.FullName -Destination $Out -Force

  $outSrt = $null
  if ($null -ne $producedSrt) {
    $outSrt = [IO.Path]::ChangeExtension($Out, '.srt')
    Copy-Item -LiteralPath $producedSrt.FullName -Destination $outSrt -Force
  }

  # ── Report ──────────────────────────────────────────────────────────────────
  $resolvedOut = (Resolve-Path -LiteralPath $Out).Path
  Write-Host ""
  Write-Host "Done." -ForegroundColor Green
  Write-Host "  Transcript: $resolvedOut"
  if ($outSrt -and (Test-Path -LiteralPath $outSrt)) {
    Write-Host "  Subtitles:  $((Resolve-Path -LiteralPath $outSrt).Path)"
  }
  Write-Host ""
  Write-Host "Next: open $resolvedOut, copy all of it, and paste it into Virnix's" -ForegroundColor Cyan
  Write-Host "'Video fails? Paste transcript manually' box, then click Generate." -ForegroundColor Cyan
}
finally {
  if ($KeepTemp) {
    Write-Host "Temp kept at: $tmp" -ForegroundColor DarkGray
  }
  else {
    Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
  }
}
