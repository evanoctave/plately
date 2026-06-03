#!/usr/bin/env bash
# Capture App Store screenshots from a booted iOS Simulator.
#
# Usage:
#   scripts/screenshots.sh boot "iPhone 17 Pro Max"   # boot a sim (App Store 6.9")
#   scripts/screenshots.sh shot home                  # capture booted screen -> home.png
#   scripts/screenshots.sh tap 0.5 0.92               # tap at 50% width, 92% height
#
# App Store required display sizes (one set each):
#   6.9" / 6.7"  -> iPhone 17 Pro Max / 15 Pro Max  (1320x2868 or 1290x2796)
#   6.5"         -> iPhone 11 Pro Max               (1242x2688)
#   5.5"         -> iPhone 8 Plus                   (1242x2208)  [if supporting older]
#
# `simctl io screenshot` captures the device at native resolution — exactly what
# App Store Connect wants. Tapping uses AppleScript against the Simulator window,
# so keep the Simulator app frontmost while running `tap`.

set -euo pipefail
OUT="$(cd "$(dirname "$0")/.." && pwd)/assets/store/screenshots"
mkdir -p "$OUT"

case "${1:-}" in
  boot)
    DEVICE="${2:?device name, e.g. \"iPhone 17 Pro Max\"}"
    xcrun simctl boot "$DEVICE" 2>/dev/null || true
    open -a Simulator
    echo "Booted $DEVICE. Install + launch the app, then use: $0 shot <name>"
    ;;
  shot)
    NAME="${2:?screenshot name}"
    xcrun simctl io booted screenshot "$OUT/$NAME.png"
    echo "Saved $OUT/$NAME.png"
    ;;
  tap)
    FX="${2:?x fraction 0-1}"; FY="${3:?y fraction 0-1}"
    osascript <<OSA
tell application "Simulator" to activate
delay 0.2
tell application "System Events"
  set win to first window of (first application process whose frontmost is true)
  set {wx, wy} to position of win
  set {ww, wh} to size of win
  set px to wx + (ww * $FX)
  set py to wy + (wh * $FY)
  click at {px, py}
end tell
OSA
    ;;
  *)
    echo "Usage: $0 {boot <device> | shot <name> | tap <fx> <fy>}" >&2
    exit 1
    ;;
esac
