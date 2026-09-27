#!/bin/bash
# Double-click: STOP the watcher. It stays stopped until you start it again.
LABEL="io.tmsmedia.autovideoeditor"

launchctl stop "$LABEL" 2>/dev/null
sleep 3
pkill -f "auto_video_editor.py --watch" 2>/dev/null   # belt and braces
sleep 1

if pgrep -f "auto_video_editor.py --watch" >/dev/null; then
  echo "Hmm - still running. Check status_watcher.command."
else
  echo "STOPPED. Videos dropped in 1_Incoming will just sit there until you"
  echo "run start_watcher.command again."
  echo ""
  echo "It will NOT come back on its own - not after a reboot, not at login."
fi
echo ""
read -p "Press Return to close."
