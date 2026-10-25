param([string]$JavaHome='', [string]$Variant='Release')
$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $PSScriptRoot
if(-not $JavaHome){
 $portable=Get-ChildItem -LiteralPath (Join-Path $projectRoot '.tools') -Directory -Filter 'jdk-17*' -ErrorAction SilentlyContinue | Select-Object -First 1
 if($portable){$JavaHome=$portable.FullName}else{$JavaHome=$env:JAVA_HOME}
}
if(-not $JavaHome -or -not (Test-Path -LiteralPath (Join-Path $JavaHome 'bin/java.exe'))){throw 'Provide a JDK 17 path using -JavaHome, or install the portable JDK under .tools.'}
if($Variant -notin @('Debug','Release')){throw 'Variant must be Debug or Release.'}
$env:JAVA_HOME=$JavaHome
if(-not $env:ANDROID_HOME){$env:ANDROID_HOME=Join-Path $env:LOCALAPPDATA 'Android/Sdk'}
Push-Location (Join-Path $projectRoot 'android')
try{
 & ./gradlew.bat "assemble$Variant" --no-daemon --console=plain --max-workers=2
 if($LASTEXITCODE -ne 0){throw "Android build failed with exit code $LASTEXITCODE"}
}finally{Pop-Location}
