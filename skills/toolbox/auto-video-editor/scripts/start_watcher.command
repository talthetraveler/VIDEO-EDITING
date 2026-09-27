#!/bin/bash
# Double-click: START the watcher. It only ever runs because you ran this.
DIR="$(cd "$(dirname "$0")" && pwd)"
LABEL="io.tmsmedia.autovideoeditor"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

if [ ! -f "$PLIST" ]; then
  echo "Not installed yet - run install_service.command first."
  read -p "Press Return to close."; exit 1
fi

if pgrep -f "auto_video_editor.py --watch" >/dev/null; then
  echo "Already running (pid $(pgrep -f 'auto_video_editor.py --watch' | tr '\n' ' '))."
  read -p "Press Return to close."; exit 0
fi

# Register the job if it isn't registered, then start it. RunAtLoad is false,
# so loading alone does NOT start it -- the explicit start is what runs it.
launchctl list | grep -q "$LABEL" || launchctl load "$PLIST"
launchctl start "$LABEL"
sleep 5

PIDS=$(pgrep -f "auto_video_editor.py --watch")
if [ -n "$PIDS" ]; then
  echo "RUNNING (pid $(echo $PIDS | tr '\n' ' ')). Drop videos into 1_Incoming."
  echo ""
  tail -4 "$DIR/watcher.log" 2>/dev/null
else
  echo "Failed to start - check watcher.log"
fi
echo ""
read -p "Press Return to close."
