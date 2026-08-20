#!/bin/bash

OUTPUT_FILE="project_map.txt"
TEMP_LIST="file_list.tmp"

# Clear previous outputs
> "$OUTPUT_FILE"
> "$TEMP_LIST"

echo "=========================================" >> "$OUTPUT_FILE"
echo "1. PROJECT DIRECTORY STRUCTURE (TREE)" >> "$OUTPUT_FILE"
echo "=========================================" >> "$OUTPUT_FILE"

# Generate tree structure, ignoring hidden files (.*), node_modules, logs, and build folders
tree -I '.*|node_modules|logs|dist|build|.next|__pycache__|venv' --dirsfirst >> "$OUTPUT_FILE" 2>/dev/null

# Fallback if 'tree' is not installed on the system
if [ $? -ne 0 ]; then
    echo "[Note: 'tree' command not found. Using 'find' instead.]" >> "$OUTPUT_FILE"
    find . -type f -not -path '*/\.*' -not -path '*/node_modules/*' -not -path '*/logs/*' | sort >> "$OUTPUT_FILE"
fi

echo "" >> "$OUTPUT_FILE"
echo "=========================================" >> "$OUTPUT_FILE"
echo "2. COMPLETE FILE LIST (LOCATIONS)" >> "$OUTPUT_FILE"
echo "=========================================" >> "$OUTPUT_FILE"

# Find all files, strictly excluding hidden files and bulky/unwanted folders
find . -type f \
    -not -path '*/\.*' \
    -not -path '*/node_modules/*' \
    -not -path '*/logs/*' \
    -not -path '*/dist/*' \
    -not -path '*/build/*' \
    -not -path '*/.next/*' | sort > "$TEMP_LIST"

cat "$TEMP_LIST" >> "$OUTPUT_FILE"

echo "" >> "$OUTPUT_FILE"
echo "=========================================" >> "$OUTPUT_FILE"
echo "3. FILE CONTENTS" >> "$OUTPUT_FILE"
echo "=========================================" >> "$OUTPUT_FILE"

# Loop through the file list and print contents
while IFS= read -r filepath; do
    # Check if the file is a text/code file (skips images, binaries, etc.)
    file_type=$(file -b "$filepath")
    if echo "$file_type" | grep -qiE 'text|json|xml|javascript|typescript|empty|source|script|markdown'; then
        
        echo "" >> "$OUTPUT_FILE"
        echo "-------------------------------------------------------------------" >> "$OUTPUT_FILE"
        echo "FILE: $filepath" >> "$OUTPUT_FILE"
        echo "-------------------------------------------------------------------" >> "$OUTPUT_FILE"
        cat "$filepath" >> "$OUTPUT_FILE"
        
    else
        echo "" >> "$OUTPUT_FILE"
        echo "-------------------------------------------------------------------" >> "$OUTPUT_FILE"
        echo "FILE: $filepath (SKIPPED: Binary/Non-text file)" >> "$OUTPUT_FILE"
        echo "-------------------------------------------------------------------" >> "$OUTPUT_FILE"
    fi
done < "$TEMP_LIST"

# Clean up temporary file
rm "$TEMP_LIST"

echo "✅ Success! Project map saved to: $OUTPUT_FILE"
