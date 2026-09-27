#!/bin/bash
# Double-click: is the watcher actually running?
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=================================="
echo "   Auto Video Editor - status"
echo "=================================="

# The truth is the python process, not whether the job is registered.
PIDS=$(pgrep -f "auto_video_editor.py --watch")

if [ -n "$PIDS" ]; then
  echo "RUNNING   (pid $(echo $PIDS | tr '\n' ' '))"
  echo "Videos dropped in 1_Incoming WILL be edited."
  if ! pgrep -f "caffeinate -i.*auto_video_editor" >/dev/null; then
    echo ""
    echo "Note: the keep-awake (caffeinate) part is gone, so your Mac can sleep"
    echo "      and pause editing. Restart with start_watcher.command."
  fi
else
  echo "STOPPED   (files dropped in 1_Incoming will just sit and wait)"
fi

echo ""
echo "It never starts on its own - not at login, not after a reboot."
echo "It runs only when you run start_watcher.command."
echo ""
echo "--- last 12 lines of watcher.log ---"
tail -12 "$DIR/watcher.log" 2>/dev/null || echo "(no log yet)"
echo ""
read -p "Press Return to close."
