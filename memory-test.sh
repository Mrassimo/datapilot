#!/bin/bash

echo "🚀 Memory Stress Test for DataPilot"
echo "=================================="

# Function to monitor memory usage
monitor_memory() {
    local pid=$1
    local filename=$2
    echo "📊 Monitoring memory for PID: $pid"
    echo "📄 Processing: $filename"
    echo ""
    
    # Monitor every 0.5 seconds
    while kill -0 $pid 2>/dev/null; do
        memory_info=$(ps -o pid,vsz,rss,pcpu -p $pid 2>/dev/null | tail -1)
        if [ ! -z "$memory_info" ]; then
            echo "🔍 $(date '+%H:%M:%S') - Memory: $memory_info"
        fi
        sleep 0.5
    done
}

# Test with the extra large dataset
filename="test-datasets/large/transactions-xlarge.csv"

if [ -f "$filename" ]; then
    filesize=$(ls -lh "$filename" | awk '{print $5}')
    rows=$(wc -l < "$filename")
    echo "📄 File: $filename"
    echo "📊 Size: $filesize"
    echo "📈 Rows: $rows"
    echo ""
    
    echo "🔄 Starting DataPilot analysis..."
    
    # Start the analysis in background and get PID
    node dist/cli/index.js overview "$filename" &
    analysis_pid=$!
    
    # Monitor memory usage
    monitor_memory $analysis_pid "$filename" &
    monitor_pid=$!
    
    # Wait for analysis to complete
    wait $analysis_pid
    analysis_result=$?
    
    # Stop monitoring
    kill $monitor_pid 2>/dev/null
    
    echo ""
    if [ $analysis_result -eq 0 ]; then
        echo "✅ Analysis completed successfully!"
    else
        echo "❌ Analysis failed with exit code: $analysis_result"
    fi
else
    echo "❌ File not found: $filename"
    echo "💡 Run: python3 generate-large-csv.py xlarge"
fi

echo ""
echo "🏁 Test completed!"