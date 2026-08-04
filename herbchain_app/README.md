# HerbChain AI Mobile Application

A production-ready Flutter application for the HerbChain AI ecosystem tailored for Farmers and Wild Collectors.

## Architecture

This application follows Clean Architecture principles:
- **Presentation Layer**: Riverpod state management, GoRouter navigation, and a modular feature-first UI approach.
- **Data/Repository Layer**: Dio for API communication, SQLite for robust offline-first data persistence, and Flutter Secure Storage for JWTs.
- **Offline Sync Engine**: Captures GPS coordinates, multiple photos, and collection data locally if the internet is unavailable. The app automatically syncs when the connection is restored.

## Getting Started

### Prerequisites
- Flutter SDK >= 3.12.0
- Dart SDK >= 3.2.0

### Installation Guide
1. Navigate to the project directory: `cd herbchain_app`
2. Run `flutter pub get` to install all dependencies.
   - **Note for Windows users**: Ensure **Developer Mode** is enabled in your system settings to allow symlinks for Flutter plugins.
3. An `.env` file has been automatically generated in the root directory. You can update the `API_BASE_URL` as needed.

### Running the App
- Start the application using `flutter run` on an emulator or a physical device.

## Important Native Configurations
While the Flutter codebase is complete, for a production build, please ensure you configure native permissions in your `android/app/src/main/AndroidManifest.xml` and `ios/Runner/Info.plist`:
- Location permissions (`ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`)
- Camera permissions (`CAMERA`)
- Storage permissions (if saving images to gallery)
