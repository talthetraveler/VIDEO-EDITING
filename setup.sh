#!/bin/sh
# One button for Mac / Linux (Windows: double-click "SETUP EVERYTHING.cmd").
cd "$(dirname "$0")" && python3 system/setup/setup_everything.py "$@"
