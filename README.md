# Arrow Escape Puzzle

An offline Android puzzle game built with Expo and React Native. The workspace was empty when implementation began, so this project uses Expo's managed Android workflow. The text attachment did not include the referenced screenshot; the splash screen uses the colors and branding described in the brief.

## Run on Android

Install Node.js and Android Studio with an emulator, then from this folder run:

```sh
npm install
npm run android
```

For a connected device, enable USB debugging and run `npm run android`. Expo CLI may prompt to install its global launcher tools if needed. You can also run `npm start` and scan the QR code with Expo Go.

## Rules and progress

Arrows occupy grid cells and point in one of four cardinal directions. Tapping an arrow checks every cell from its nose to the board edge. Any remaining arrow in that ray blocks the move. Clear arrows leave the board; the board is complete when none remain. This first version uses straight paths, so there are no bend segments. The level data is deterministic and validated for solvability; if scaling a hand-authored pattern makes it unsolvable, a deterministic clear-ray layout is used instead.

Progress, unlocked/completed levels, current level, hints, sound preference, and vibration preference are stored locally with AsyncStorage. No account or network connection is needed after dependencies are installed.
