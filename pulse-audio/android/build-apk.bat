@echo off
REM PULSE Audio Android APK build script
REM Requirements: Android SDK, Gradle, JDK 17+
REM Supports Android 9 (API 28) through Android 16 (API 36)

echo Building PULSE Audio APK...
cd android
if not exist gradlew (
    echo Downloading Gradle wrapper...
    curl -L https://services.gradle.org/distributions/gradle-8.7-bin.zip -o gradle.zip
    powershell -Command "Expand-Archive -Path gradle.zip -DestinationPath . -Force"
    del gradle.zip
)

echo Running Gradle assembleRelease...
gradlew.bat :app:assembleRelease

echo APK output: android/app/build/outputs/apk/release/app-release.apk
