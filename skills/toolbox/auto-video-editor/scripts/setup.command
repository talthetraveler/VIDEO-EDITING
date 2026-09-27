#!/bin/bash
# Double-click this file in Finder to install everything Auto Video Editor needs.
cd "$(dirname "$0")"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

echo "======================================"
echo "   Auto Video Editor — setup"
echo "======================================"
echo ""

# 1) Homebrew (package manager)
if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew isn't installed yet. It's a one-time thing."
  echo "Copy-paste this line into Terminal, let it finish, then double-click setup again:"
  echo ""
  echo '  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  echo ""
  read -p "Press Return to close." ; exit 1
fi

# 2) ffmpeg (the video engine)
if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "Installing ffmpeg (this can take a few minutes)..."
  brew install ffmpeg
else
  echo "ffmpeg already installed."
fi

# 3) Python environment + faster-whisper (the transcriber)
echo "Creating a private Python environment (.venv)..."
python3 -m venv .venv
./.venv/bin/pip install --upgrade pip >/dev/null
echo "Installing faster-whisper..."
./.venv/bin/pip install faster-whisper

echo ""
echo "======================================"
echo "   Setup complete!"
echo "======================================"
echo ""
echo "Test on one video:"
echo "  ./.venv/bin/python auto_video_editor.py --file \"/full/path/to/clip.mov\""
echo ""
echo "Start the Dropbox watcher (leave this window open):"
echo "  ./.venv/bin/python auto_video_editor.py --watch"
echo ""
read -p "Press Return to close."
