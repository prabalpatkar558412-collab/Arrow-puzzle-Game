# App-wide Android responsiveness audit

## Evidence and scope

The supplied attachment contained the written request only; no APK screenshots
were included. The findings below come from source inspection, actual component
tree renders and Yoga layout checks. `tests/responsive-audit.png` is generated
from those trees, **not an Android APK screenshot**. Text measurement uses an
Arial approximation rather than Android's device fonts.

No APK, Gradle compilation, EAS cloud build, install or saved-data reset was
performed during this task.

## Shared root causes

- Actual safe-area insets previously applied to Gameplay only. Splash and other
  screens still used the deprecated core React Native safe-area wrapper.
- Content widths and height calculations differed between screens. Full-window
  dimensions were used where the safe content dimensions were required.
- The level grid mixed 20% slots with independently calculated circles and a
  larger current-level circle.
- Pause/failure/tutorial overlays lacked a common bounded scrolling viewport.
- Home used viewport-filling distribution independently from logo/content sizing.
- Settings had no scrolling fallback and fixed-height rows; larger fonts could
  outgrow their containers.

There was no cached `Dimensions.get()` or `window.innerWidth/innerHeight` sizing
to remove. Main-page structure is flex layout. Retained absolute positioning is
for overlays, badges, loader/confetti decoration and the puzzle input surface.
Press/star animations scale individual controls only, never the application.

## Shared responsive system

`src/responsiveLayout.ts` derives safe width/height, 16–20dp horizontal padding,
a centered page capped at 520dp, content width, logo bounds, five-column grid
metrics, modal bounds, statistics-card widths and completion/preview widths.
`src/useAppLayout.ts` supplies live `useWindowDimensions()` and safe-area insets.

`ScreenFrame` applies measured top, bottom and side insets on **every** screen.
`ResponsiveModal` positions its overlay within those insets, caps its card to
`min(contentWidth, 360)` and height to `safeHeight - 32`, with scrollable content
and a 44dp close control. Native Android Alert dialogs remain system-managed.

## Screen-by-screen changes

| Screen | Responsive correction |
|---|---|
| Splash | Shared safe frame; bounded proportional logo; natural centered scrolling content; removed viewport-based translateY. |
| Home | Anchored coin/stats/settings row; bounded logo and one-line branding; width-capped scrolling body with even vertical spacing. |
| Select Level | Five-column FlatList; `cell = min(64, floor((contentWidth - 4*gap)/5))`; equal cells, gaps and circular dimensions. Existing states and preview handlers retained. |
| Locked Preview | Shared safe frame, centered content cap and responsive preview width; remains read-only. |
| Gameplay | Same safe frame/content metrics; measured flexible puzzle area; shared horizontal padding. No puzzle data or movement changes. |
| Bottom controls | Four equal flex sections; existing readable navy labels and vector hearts; actual safe bottom inset outside the bar. |
| Pause | Common bounded modal, retained actions and 44dp close. |
| Tutorial | Common bounded modal, retained instructions and action. |
| No Clear Path | Common bounded modal, retained hint/retry/back actions and feedback. |
| Settings | Scrollable content, flexible-height setting rows and labels, 44dp Back button. |
| Progress/Stats | Centered page, calculated two-column cards, adaptive weekday circles, readable wrapping labels, safe pinned footer. |
| Level Complete | Safe-height-based compact mode; common content width, bounded headings and intrinsic result-row heights; scroll fallback retained. |

Gameplay's board remains `min(measuredWidth - 2*horizontalPadding,
measuredHeight - 16, 520)`. Full authored bounds still normalize uniformly to
approximately 82% of the board. Existing pixel-coordinate SVG paths, explicit
7–10dp arrowheads, rounded 2.6–3.2dp strokes, route-following animation and shared
full-path hit transform remain intact. No PixelRatio multiplier is applied.

## Logic preservation

Hashes verified that existing level data, generation, progression, access checks,
coins, storage, sound, hint and Lifeline modules were unchanged. Among existing
`src/` files, only the board-size helper gained an optional horizontal-padding
argument. Existing gameplay-event, reward, preview, sound and Lifeline regression
tests passed. UI fixture rendering asserts that no state write or audio event
occurs during render.

## Validation

- `npx tsc --noEmit`: passed.
- `npx expo-doctor`: **18/18 checks passed. No issues detected!**
- Web and Android JavaScript exports: passed, including all image/font/audio assets.
- 504 actual-component-tree Yoga cases: 14 states × 6 sizes × 2 bottom insets ×
  3 font scales (1, 1.3, 1.6).
- Sizes: 320×568, 360×800, 375×812, 390×844, 412×915, 480×640.
- Simulated status inset: 24dp; bottom modes: 24dp gesture and 48dp three-button.
- Renders inspected for Splash, Home, Select Level, Preview, Gameplay 1/2/5/10,
  Pause, Settings, Failure, Completion, Progress and Tutorial. Scrolling viewports clip
  long content intentionally; horizontal controls must remain inside the screen.
- All 100 level geometries, nearest-path hit tests, native/Web event-coordinate
  mappings, duplicate-event protection, rewards and sound control regressions pass.

These checks do **not** prove physical-device font metrics, OEM system UI or final
APK appearance. Install/review the next APK after approving these changes.

## Exact task files

- Changed: `App.tsx`, `src/boardGeometry.ts`, `tests/mobile-board.cjs`.
- Added: `src/responsiveLayout.ts`, `src/useAppLayout.ts`, `src/Responsive.tsx`.
- Added validation: `tests/app-layout-tree.cjs`, `tests/responsive-audit.cjs`,
  `tests/responsive-audit.png`, this report.
- Regenerated ignored `.expo-responsive-check/` bundle output.
- Isolated validation-only Yoga/resvg packages live under ignored `.tools/`;
  application dependencies and Expo/EAS configuration were not changed.
