<#
================================================================================
  WADAAGE MOBILITY - CROSS-PLATFORM APK BUILDER FOR WINDOWS POWERSHELL
  Supports:
    1. Wadaage Rider (Passenger) APK   -> com.wadaage.rider
    2. Wadaage Driver Partner APK      -> com.wadaage.driver
================================================================================
#>

[CmdletBinding()]
param (
    [Parameter(Position = 0)]
    [ValidateSet("rider", "driver", "both", "clean", "menu")]
    [string]$Target = "menu",

    [Parameter()]
    [switch]$Release,

    [Parameter()]
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

# Set UTF-8 encoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "========================================================================" -ForegroundColor Cyan
    Write-Host "   $Title" -ForegroundColor Green
    Write-Host "========================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Step, [string]$Message)
    Write-Host "[$Step] " -ForegroundColor Yellow -NoNewline
    Write-Host $Message -ForegroundColor White
}

function Write-Success {
    param([string]$Message)
    Write-Host "SUCCESS: " -ForegroundColor Green -NoNewline
    Write-Host $Message -ForegroundColor White
}

function Write-WarningMsg {
    param([string]$Message)
    Write-Host "WARNING: " -ForegroundColor Yellow -NoNewline
    Write-Host $Message -ForegroundColor White
}

function Check-Prerequisites {
    Write-Header "Checking Build Prerequisites (Windows PowerShell)"

    # 1. Check Node.js
    try {
        $nodeVersion = node --version
        Write-Step "OK" "Node.js detected: $nodeVersion"
    } catch {
        Write-Host "ERROR: Node.js is not found in PATH." -ForegroundColor Red
        Write-Host "Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Yellow
        exit 1
    }

    # 2. Check NPM
    try {
        $npmVersion = npm --version
        Write-Step "OK" "NPM detected: $npmVersion"
    } catch {
        Write-Host "ERROR: NPM is not found in PATH." -ForegroundColor Red
        exit 1
    }

    # 3. Check Java JDK
    $javaFound = $false
    if (-not $env:JAVA_HOME) {
        $commonJbrPaths = @(
            "C:\Program Files\Android\Android Studio\jbr",
            "C:\Program Files\Android\Android Studio\jre",
            "$env:LOCALAPPDATA\Programs\Android Studio\jbr"
        )
        foreach ($jpath in $commonJbrPaths) {
            if (Test-Path "$jpath\bin\java.exe") {
                $env:JAVA_HOME = $jpath
                $javaFound = $true
                Write-Step "OK" "Java JDK auto-configured from Android Studio: $env:JAVA_HOME"
                break
            }
        }
    }

    if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
        $javaFound = $true
    }

    # Capacitor 7 and the bundled Android modules compile with
    # `sourceCompatibility = JavaVersion.VERSION_21`. If JAVA_HOME points at an
    # older JDK the Gradle build fails with "invalid source release: 21", so
    # upgrade JAVA_HOME to any JDK 21+ that is installed on this machine.
    function Get-JavaMajor([string]$javaExe) {
        if (-not (Test-Path $javaExe)) { return 0 }
        # Prefer the JDK "release" file: reading it avoids spawning java.exe, whose
        # version banner goes to stderr and would be turned into a terminating error
        # by $ErrorActionPreference = "Stop".
        $jdkHome = Split-Path (Split-Path $javaExe -Parent) -Parent
        $releaseFile = Join-Path $jdkHome 'release'
        if (Test-Path $releaseFile) {
            $releaseLine = Select-String -Path $releaseFile -Pattern 'JAVA_VERSION="(\d+)' -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($releaseLine) { return [int]$releaseLine.Matches[0].Groups[1].Value }
        }
        $previousPreference = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        try {
            $versionOutput = & $javaExe -version 2>&1 | Out-String
            if ($versionOutput -match '"(\d+)') { return [int]$Matches[1] }
        } catch {
            return 0
        } finally {
            $ErrorActionPreference = $previousPreference
        }
        return 0
    }

    $currentJavaMajor = 0
    if ($env:JAVA_HOME) { $currentJavaMajor = Get-JavaMajor "$env:JAVA_HOME\bin\java.exe" }

    if ($currentJavaMajor -lt 21) {
        $jdk21Patterns = @(
            "C:\Program Files\Eclipse Adoptium\jdk-21*",
            "C:\Program Files\Java\jdk-21*",
            "C:\Program Files\Microsoft\jdk-21*",
            "C:\Program Files\Zulu\zulu-21*",
            "C:\Program Files\Android\Android Studio\jbr",
            "$env:LOCALAPPDATA\Programs\Android Studio\jbr"
        )
        foreach ($pattern in $jdk21Patterns) {
            $match = Get-Item $pattern -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($match) {
                $candidateJava = Join-Path $match.FullName 'bin\java.exe'
                $candidateMajor = Get-JavaMajor $candidateJava
                if ($candidateMajor -ge 21) {
                    $env:JAVA_HOME = $match.FullName
                    $currentJavaMajor = $candidateMajor
                    Write-Step "OK" "JAVA_HOME upgraded to JDK $candidateMajor (required by Capacitor 7): $env:JAVA_HOME"
                    break
                }
            }
        }
    }

    if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
        $javaFound = $true
        Write-Step "OK" "Java JDK found at: $env:JAVA_HOME"
    } else {
        try {
            $javaVer = java -version 2>&1 | Select-Object -First 1
            $javaFound = $true
            Write-Step "OK" "Java detected in PATH: $javaVer"
        } catch {
            Write-WarningMsg "Java JDK (JDK 17 or 21) was not detected in PATH or JAVA_HOME."
            Write-Host "   If the Gradle build fails, please install Eclipse Temurin JDK 17/21 or Android Studio JDK." -ForegroundColor DarkGray
            Write-Host "   Example: `$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'" -ForegroundColor DarkGray
        }
    }

    # 4. Check Android SDK
    if ($env:ANDROID_HOME -and (Test-Path $env:ANDROID_HOME)) {
        Write-Step "OK" "Android SDK located at: $env:ANDROID_HOME"
    } elseif ($env:LOCALAPPDATA -and (Test-Path "$env:LOCALAPPDATA\Android\Sdk")) {
        $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
        Write-Step "OK" "Android SDK auto-detected: $env:ANDROID_HOME"
    } else {
        Write-WarningMsg "ANDROID_HOME is not set."
        Write-Host "   If Gradle fails to find the Android SDK, set ANDROID_HOME or open the project in Android Studio." -ForegroundColor DarkGray
    }

    Write-Host ""
}

function Build-Rider-Apk {
    Write-Header "Building Wadaage Rider (Passenger) Android APK"

    $outputDir = "$PSScriptRoot\build_output"
    if (-not (Test-Path $outputDir)) { New-Item -ItemType Directory -Path $outputDir -Force | Out-Null }

    # 1. Prepare Capacitor Config
    Write-Step "1/6" "Applying Rider configuration (com.wadaage.rider)..."
    Copy-Item "$PSScriptRoot\capacitor-rider.config.json" "$PSScriptRoot\capacitor.config.json" -Force

    # 2. Install dependencies if needed
    if (-not $SkipInstall -and (-not (Test-Path "$PSScriptRoot\node_modules"))) {
        Write-Step "2/6" "Installing npm dependencies..."
        npm install
    } else {
        Write-Step "2/6" "Dependencies already verified."
    }

    # 3. Compile Web Assets in Rider Mode
    Write-Step "3/6" "Compiling Rider Production Web Bundle (VITE_APP_MODE=rider)..."
    $env:VITE_APP_MODE = "rider"
    npm run build:rider

    # 4. Ensure Android Project Ready
    Write-Step "4/6" "Synchronizing Android assets for Rider..."
    $androidDir = if (Test-Path "$PSScriptRoot\android-rider") { "$PSScriptRoot\android-rider" } else { "$PSScriptRoot\android" }

    # Auto-generate local.properties if missing
    $localProp = "$androidDir\local.properties"
    if (-not (Test-Path $localProp) -and $env:ANDROID_HOME) {
        $sdkDirClean = $env:ANDROID_HOME -replace '\\', '\\'
        Set-Content -Path $localProp -Value "sdk.dir=$sdkDirClean" -Force
        Write-Step "OK" "Configured $localProp"
    }

    # Sync web assets to capacitor directory
    Copy-Item "$PSScriptRoot\android-rider\*" "$PSScriptRoot\android" -Recurse -Force -ErrorAction SilentlyContinue
    npx cap sync android

    # Copy updated assets to android-rider
    $riderAssetsPublic = "$androidDir\app\src\main\assets\public"
    if (-not (Test-Path $riderAssetsPublic)) { New-Item -ItemType Directory -Path $riderAssetsPublic -Force | Out-Null }
    Copy-Item "$PSScriptRoot\dist\*" $riderAssetsPublic -Recurse -Force
    Copy-Item "$PSScriptRoot\capacitor-rider.config.json" "$androidDir\app\src\main\assets\capacitor.config.json" -Force -ErrorAction SilentlyContinue

    # `npx cap sync android` generates its Cordova bridge and plugin variables inside
    # the folder it synced ($PSScriptRoot\android), but Gradle below builds the
    # per-app project. Mirror the generated files across or Gradle fails with
    # "Could not read script 'cordova.variables.gradle' as it does not exist".
    if (Test-Path "$PSScriptRoot\android\capacitor-cordova-android-plugins") {
        Copy-Item "$PSScriptRoot\android\capacitor-cordova-android-plugins" "$androidDir\" -Recurse -Force
    }
    foreach ($capAsset in @('cordova.js', 'cordova_plugins.js', 'native-bridge.js')) {
        $capAssetSrc = "$PSScriptRoot\android\app\src\main\assets\public\$capAsset"
        if (Test-Path $capAssetSrc) { Copy-Item $capAssetSrc $riderAssetsPublic -Force -ErrorAction SilentlyContinue }
    }

    # 5. Build with Gradle
    Write-Step "5/6" "Building Rider APK with Gradle..."
    $buildMode = if ($Release) { "assembleRelease" } else { "assembleDebug" }

    Push-Location $androidDir
    try {
        if (Test-Path ".\gradlew.bat") {
            .\gradlew.bat $buildMode --no-daemon
        } else {
            Write-WarningMsg "gradlew.bat not found in $androidDir. Opening Android Studio..."
            npx cap open android
            return
        }
    } finally {
        Pop-Location
    }

    # 6. Export APK to build_output
    Write-Step "6/6" "Finalizing Rider APK export..."
    $apkSourceType = if ($Release) { "release" } else { "debug" }
    $apkSource = Get-ChildItem -Path "$androidDir\app\build\outputs\apk\$apkSourceType\*.apk" -ErrorAction SilentlyContinue | Select-Object -First 1

    if ($apkSource -and (Test-Path $apkSource.FullName)) {
        $finalApkName = if ($Release) { "Wadaage_Rider_Release.apk" } else { "Wadaage_Rider_Debug.apk" }
        $finalApkPath = "$outputDir\$finalApkName"
        Copy-Item $apkSource.FullName $finalApkPath -Force

        $apkSizeMB = [math]::Round($apkSource.Length / 1MB, 2)
        Write-Host ""
        Write-Host "========================================================================" -ForegroundColor Green
        Write-Host "  RIDER APK BUILT SUCCESSFULLY!" -ForegroundColor Green
        Write-Host "  File: $finalApkPath" -ForegroundColor White
        Write-Host "  Size: $apkSizeMB MB" -ForegroundColor Yellow
        Write-Host "  App ID: com.wadaage.rider (Wadaage Taxi)" -ForegroundColor Cyan
        Write-Host "========================================================================" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "Build completed. If APK was not copied automatically, check $androidDir\app\build\outputs\apk" -ForegroundColor Yellow
    }
}

function Build-Driver-Apk {
    Write-Header "Building Wadaage Driver Partner Android APK"

    $outputDir = "$PSScriptRoot\build_output"
    if (-not (Test-Path $outputDir)) { New-Item -ItemType Directory -Path $outputDir -Force | Out-Null }

    # 1. Prepare Capacitor Config
    Write-Step "1/6" "Applying Driver configuration (com.wadaage.driver)..."
    Copy-Item "$PSScriptRoot\capacitor-driver.config.json" "$PSScriptRoot\capacitor.config.json" -Force

    # 2. Install dependencies if needed
    if (-not $SkipInstall -and (-not (Test-Path "$PSScriptRoot\node_modules"))) {
        Write-Step "2/6" "Installing npm dependencies..."
        npm install
    } else {
        Write-Step "2/6" "Dependencies already verified."
    }

    # 3. Compile Web Assets in Driver Mode
    Write-Step "3/6" "Compiling Driver Production Web Bundle (VITE_APP_MODE=driver)..."
    $env:VITE_APP_MODE = "driver"
    npm run build:driver

    # 4. Ensure Android Project Ready
    Write-Step "4/6" "Synchronizing Android assets for Driver..."
    $androidDir = if (Test-Path "$PSScriptRoot\android-driver") { "$PSScriptRoot\android-driver" } else { "$PSScriptRoot\android" }

    # Auto-generate local.properties if missing
    $localProp = "$androidDir\local.properties"
    if (-not (Test-Path $localProp) -and $env:ANDROID_HOME) {
        $sdkDirClean = $env:ANDROID_HOME -replace '\\', '\\'
        Set-Content -Path $localProp -Value "sdk.dir=$sdkDirClean" -Force
        Write-Step "OK" "Configured $localProp"
    }

    # Sync web assets to capacitor directory
    Copy-Item "$PSScriptRoot\android-driver\*" "$PSScriptRoot\android" -Recurse -Force -ErrorAction SilentlyContinue
    npx cap sync android

    # Copy updated assets to android-driver
    $driverAssetsPublic = "$androidDir\app\src\main\assets\public"
    if (-not (Test-Path $driverAssetsPublic)) { New-Item -ItemType Directory -Path $driverAssetsPublic -Force | Out-Null }
    Copy-Item "$PSScriptRoot\dist\*" $driverAssetsPublic -Recurse -Force
    Copy-Item "$PSScriptRoot\capacitor-driver.config.json" "$androidDir\app\src\main\assets\capacitor.config.json" -Force -ErrorAction SilentlyContinue

    # See the Rider build for why the cap-generated plugin folder must be mirrored.
    if (Test-Path "$PSScriptRoot\android\capacitor-cordova-android-plugins") {
        Copy-Item "$PSScriptRoot\android\capacitor-cordova-android-plugins" "$androidDir\" -Recurse -Force
    }
    foreach ($capAsset in @('cordova.js', 'cordova_plugins.js', 'native-bridge.js')) {
        $capAssetSrc = "$PSScriptRoot\android\app\src\main\assets\public\$capAsset"
        if (Test-Path $capAssetSrc) { Copy-Item $capAssetSrc $driverAssetsPublic -Force -ErrorAction SilentlyContinue }
    }

    # 5. Build with Gradle
    Write-Step "5/6" "Building Driver APK with Gradle..."
    $buildMode = if ($Release) { "assembleRelease" } else { "assembleDebug" }

    Push-Location $androidDir
    try {
        if (Test-Path ".\gradlew.bat") {
            .\gradlew.bat $buildMode --no-daemon
        } else {
            Write-WarningMsg "gradlew.bat not found in $androidDir. Opening Android Studio..."
            npx cap open android
            return
        }
    } finally {
        Pop-Location
    }

    # 6. Export APK to build_output
    Write-Step "6/6" "Finalizing Driver APK export..."
    $apkSourceType = if ($Release) { "release" } else { "debug" }
    $apkSource = Get-ChildItem -Path "$androidDir\app\build\outputs\apk\$apkSourceType\*.apk" -ErrorAction SilentlyContinue | Select-Object -First 1

    if ($apkSource -and (Test-Path $apkSource.FullName)) {
        $finalApkName = if ($Release) { "Wadaage_Driver_Release.apk" } else { "Wadaage_Driver_Debug.apk" }
        $finalApkPath = "$outputDir\$finalApkName"
        Copy-Item $apkSource.FullName $finalApkPath -Force

        $apkSizeMB = [math]::Round($apkSource.Length / 1MB, 2)
        Write-Host ""
        Write-Host "========================================================================" -ForegroundColor Green
        Write-Host "  DRIVER APK BUILT SUCCESSFULLY!" -ForegroundColor Green
        Write-Host "  File: $finalApkPath" -ForegroundColor White
        Write-Host "  Size: $apkSizeMB MB" -ForegroundColor Yellow
        Write-Host "  App ID: com.wadaage.driver (Wadaage Driver)" -ForegroundColor Cyan
        Write-Host "========================================================================" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "Build completed. If APK was not copied automatically, check $androidDir\app\build\outputs\apk" -ForegroundColor Yellow
    }
}

# ----------------- MAIN SCRIPT ROUTER -----------------

if ($Target -eq "menu") {
    Write-Header "WADAAGE MOBILITY - ANDROID APK BUILD CENTER"
    Write-Host "Choose an option to build:" -ForegroundColor White
    Write-Host ""
    Write-Host " [1] Build Wadaage Rider (Passenger) APK" -ForegroundColor Cyan
    Write-Host " [2] Build Wadaage Driver Partner APK" -ForegroundColor Green
    Write-Host " [3] Build Both Rider and Driver APKs" -ForegroundColor Yellow
    Write-Host " [4] Open Rider Project in Android Studio" -ForegroundColor White
    Write-Host " [5] Open Driver Project in Android Studio" -ForegroundColor White
    Write-Host " [6] Check Prerequisites and Environment" -ForegroundColor Magenta
    Write-Host " [0] Exit" -ForegroundColor Gray    Write-Host ""

    $choice = Read-Host "Select option [1-6, 0]"
    switch ($choice) {
        "1" {
            Check-Prerequisites
            Build-Rider-Apk
        }
        "2" {
            Check-Prerequisites
            Build-Driver-Apk
        }
        "3" {
            Check-Prerequisites
            Build-Rider-Apk
            Build-Driver-Apk
            Write-Host ""
            Write-Host "========================================================================" -ForegroundColor Green
            Write-Host " ALL APKS BUILT SUCCESSFULLY!" -ForegroundColor Green
            Write-Host " Check your build_output folder:" -ForegroundColor White
            Write-Host (" 1) " + $PSScriptRoot + "\build_output\Wadaage_Rider_Debug.apk") -ForegroundColor Cyan
            Write-Host (" 2) " + $PSScriptRoot + "\build_output\Wadaage_Driver_Debug.apk") -ForegroundColor Green
            Write-Host "========================================================================" -ForegroundColor Green
        }
        "4" {
            Copy-Item "$PSScriptRoot\android-rider\*" "$PSScriptRoot\android" -Recurse -Force -ErrorAction SilentlyContinue
            npx cap open android
        }
        "5" {
            Copy-Item "$PSScriptRoot\android-driver\*" "$PSScriptRoot\android" -Recurse -Force -ErrorAction SilentlyContinue
            npx cap open android
        }
        "6" {
            Check-Prerequisites
        }
        default {
            Write-Host "Exiting." -ForegroundColor Gray
            exit 0
        }
    }
} else {
    Check-Prerequisites
    switch ($Target.ToLower()) {
        "rider" { Build-Rider-Apk }
        "driver" { Build-Driver-Apk }
        "both" {
            Build-Rider-Apk
            Build-Driver-Apk
        }
        "clean" {
            Write-Host "Cleaning build output and Gradle caches..." -ForegroundColor Yellow
            Remove-Item -Recurse -Force "$PSScriptRoot\build_output" -ErrorAction SilentlyContinue
            Remove-Item -Recurse -Force "$PSScriptRoot\dist" -ErrorAction SilentlyContinue
            Write-Success "Clean completed."
        }
    }
}
