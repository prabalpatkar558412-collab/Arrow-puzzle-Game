# Mobile gameplay rendering

The gameplay board measures its flexible container with `onLayout`. Its side
length is `min(containerWidth - 32, containerHeight - 16, 520)` logical pixels.
The root gameplay view uses `react-native-safe-area-context` insets, so status,
cutout and Android navigation areas are excluded before the board is measured.

`src/boardGeometry.ts` computes the bounds of the **full authored level**, a
single uniform scale, and centered offsets. The longest puzzle dimension uses
about 82% of the square board, including early levels. Removing arrows never
changes that transform. Collision and progress data remain in canonical grid
coordinates.

`src/PuzzleBoard.tsx` renders pixel-coordinate SVG paths and explicit triangular
arrowheads. The SVG viewBox matches its measured width/height. Stroke width is
2.6–3.2 logical pixels; heads are 7–10 pixels, aligned with the final segment.
Neither depends on a font glyph, SVG marker scaling or a view-level transform.
React Native handles physical display density; no second PixelRatio multiplier
is applied.

The renderer and hit tester share the same transform. One input surface chooses
the nearest complete arrow path within an 11px radius. Web viewport events and
Android local touch events both resolve to board pixels. Locked previews have
no touch surface or flight animation.

Escape animation follows every authored bend, then continues beyond the actual
visible board until the tail clears it. Its duration uses that visible route,
so escape audio is not delayed by unused canonical board margins.

Level 2 is an explicit five-arrow teaching layout, with four bends in total and
a three-wave solution. Its existing 35-coin reward is unchanged. The offline
authoring script reproduces it; other level definitions are unchanged.

## Rebuild the Android app

New native dependencies require a rebuilt APK. An already installed APK cannot
gain these native modules through a JavaScript refresh.

- Expo SDK 54 / React Native 0.81.5
- react-native-svg 15.12.1
- react-native-safe-area-context 5.6.2
- @expo/vector-icons 15.0.3 (restored missing direct dependency)
- JDK 17, Android SDK 36 and NDK 27.1.12297006

The generated native project is in `android/`. Use `npm run android` for a
development build, or `npm run android:apk` for a release assembly. The latter
uses a portable JDK under `.tools/jdk-17*`, or `JAVA_HOME`. You can also run:

```powershell
powershell -NoProfile -File tools/build-android.ps1 -JavaHome 'C:/path/to/jdk-17'
```

The generated release configuration uses the Expo template's development
signing key. It is a local test build, not a Play Store release signing setup.

## Verification

```text
npm run typecheck
node tests/mobile-board.cjs
node tests/board-input.cjs
node tests/arrow-events.cjs
node tests/level-preview.cjs
node tests/levels.cjs
node tests/lifeline.cjs
node tests/economy.cjs
node tests/sound.cjs
node tests/audio-drivers.cjs
```

The geometry/layout tests cover 360×800, 375×812, 390×844 and 412×915, with 24px
and 48px bottom insets. These are logical checks, not physical-phone screenshots.
`tests/mobile-render-preview.png` is a rendering of the same geometry for visual
inspection, not an APK capture.

## Local native build status

Web and Android JavaScript exports and all listed regression checks passed.
The first Gradle attempt found an incompatible Java 25 runtime. A portable JDK
17 was downloaded under `.tools/`, and the React Native/Expo Gradle plugins then
compiled successfully.

The APK build subsequently stopped with `[CXX1101]`: the local Android SDK's
`ndk/27.1.12297006/` directory contains only `.installer` and lacks
`source.properties`. No complete cached NDK archive was available. Repair that
NDK installation through Android Studio's SDK Manager and ensure Android SDK
Platform 36 is installed before retrying `npm run android:apk`.

No APK was produced, installed or physically tested in this run. Existing
installed application data was not touched.

## EAS Preview builds (CNG)

The project now consistently uses Expo Continuous Native Generation. `android/`
and `ios/` are generated local output and are excluded by both `.gitignore` and
`.easignore`. EAS regenerates native code from `app.json` and config plugins.
No manually maintained native module, AdMob setup, custom notification code,
custom intent filter or production signing configuration was found in the local
Android project. Its existing package name, permissions and app identity remain
in Expo configuration.

The local NDK issue above does not block an EAS cloud build, which uses its own
Android build environment. Preview explicitly produces an APK; production uses
an Android App Bundle. Run:

```powershell
npx eas-cli build --platform android --profile preview
```

Do not add generated native folders to the EAS archive or edit them as the source
of truth. Express future native changes in Expo configuration/config plugins.
