#!/bin/bash
# Double-click to make the Auto Video Editor watcher run automatically at login,
# restart if it crashes, and keep the Mac awake while it's running.
# (Run setup.command first, and test with --watch once, before using this.)

DIR="$(cd "$(dirname "$0")" && pwd)"
PY="$DIR/.venv/bin/python"
SCRIPT="$DIR/auto_video_editor.py"
LABEL="io.tmsmedia.autovideoeditor"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

echo "======================================"
echo "   Watcher installer"
echo "======================================"

if [ ! -x "$PY" ]; then
  echo "Couldn't find $PY"
  echo "Run setup.command first, then try again."
  read -p "Press Return to close."; exit 1
fi
if [ ! -f "$SCRIPT" ]; then
  echo "Couldn't find $SCRIPT next to this installer."
  read -p "Press Return to close."; exit 1
fi

mkdir -p "$HOME/Library/LaunchAgents"

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/caffeinate</string>
    <string>-i</string>
    <string>$PY</string>
    <string>$SCRIPT</string>
    <string>--watch</string>
  </array>
  <!-- launchd hands processes a minimal PATH that does NOT include Homebrew,
       so ffmpeg/ffprobe would not be found. Put it back. -->
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
  </dict>
  <!-- Both false on purpose: this NEVER starts by itself. It does not start at
       login, and it does not relaunch if you quit it. You start it yourself with
       start_watcher.command. -->
  <key>RunAtLoad</key><false/>
  <key>KeepAlive</key><false/>
  <key>StandardOutPath</key><string>$DIR/watcher.log</string>
  <key>StandardErrorPath</key><string>$DIR/watcher.log</string>
</dict>
</plist>
EOF

launchctl unload "$PLIST" 2>/dev/null
launchctl load "$PLIST"

echo ""
echo "Installed - but NOT running yet, and it will not start on its own."
echo "It never starts at login. You start it when you want it:"
echo ""
echo "  start_watcher.command   - start editing"
echo "  stop_watcher.command    - stop"
echo "  status_watcher.command  - is it running?"
echo ""
echo "Activity is logged to:"
echo "  $DIR/watcher.log"
echo ""
echo "To remove it completely later, run this in Terminal:"
echo "  launchctl unload \"$PLIST\" && rm \"$PLIST\""
echo ""
read -p "Press Return to close."
