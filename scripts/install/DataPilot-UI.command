#!/usr/bin/env bash

# DataPilot Interactive UI Launcher (macOS/Linux)
# Double-click this file to launch DataPilot's interactive UI!

# Get the directory where this script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Clear terminal and show welcome
clear
echo "🚀 Starting DataPilot Interactive UI..."
echo ""

# Change to the DataPilot directory
cd "$DIR"

# Launch the interactive UI
if [ -f "$DIR/dist/datapilot.js" ]; then
    node "$DIR/dist/datapilot.js" ui
elif [ -f "$DIR/bin/datapilot.js" ]; then
    node "$DIR/bin/datapilot.js" ui
else
    echo "❌ Error: DataPilot not found."
    echo "Please run 'npm run build' first."
    echo ""
    echo "Press any key to close..."
    read -n 1
fi

# Keep terminal open when done
echo ""
echo "👋 Thanks for using DataPilot!"
echo "Press any key to close..."
read -n 1