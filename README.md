# FitRunApp

An Expo React Native app that displays today's step count from Apple HealthKit.

## Run

HealthKit requires native iOS code, so this app will not work in Expo Go. Use a development build:

```sh
npm install
npm run ios
```

Or build with EAS:

```sh
npx eas build --profile development --platform ios
```

The app requests read-only access to `HKQuantityTypeIdentifierStepCount` and displays the current day's total from HealthKit.

## Apple Watch workout

The native iOS project includes:

- `FitRunAppWatchApp`: the embedded watch app target.
- `FitRunAppWatchExtension`: a WatchKit extension that requests HealthKit access, starts a running workout, runs a live timer, and streams workout updates through `WatchConnectivity`.
- `FitRunWatchBridge`: an iOS React Native event bridge that receives watch payloads and exposes the latest workout update to the main app.

Open `ios/FitRunApp.xcworkspace` in Xcode, select the `FitRunApp` scheme, and build to a paired iPhone and Apple Watch. The watch extension sends elapsed time, active energy, distance, heart rate, event state, and timestamps back to the phone app.

Do not run `expo prebuild --clean` unless you are ready to recreate the native watch targets, because Expo will regenerate the `ios` directory.
