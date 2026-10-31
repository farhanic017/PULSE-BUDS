# PULSE Audio — Android Package

## Supported Android Versions
- **Minimum**: Android 9 (API 28)
- **Target**: Android 16 (API 36)
- **Compile**: SDK 36

## Permissions Included
- `INTERNET`
- `BLUETOOTH` / `BLUETOOTH_ADMIN`
- `BLUETOOTH_SCAN` / `BLUETOOTH_CONNECT`
- `BLUETOOTH_LE` feature (optional)

## Build APK
```bat
android\build-apk.bat
```
Output: `android/app/build/outputs/apk/release/app-release.apk`

## Install
1. Enable Developer Options + USB Debugging
2. Run `adb install android/app/build/outputs/apk/release/app-release.apk`
3. Launch PULSE Audio — WebView loads `http://127.0.0.1:8010/`
4. For real Bluetooth: press **Scan** in app; browser/OS will prompt for device pairing
