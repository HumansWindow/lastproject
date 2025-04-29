#!/bin/bash

# Script to organize Markdown documentation files
# Created: April 27, 2025

PROJECT_ROOT="/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject"
DOCS_DIR="$PROJECT_ROOT/docs"

echo "Starting documentation organization..."
echo "====================================="

# Create the main documentation structure
mkdir -p "$DOCS_DIR/frontend"
mkdir -p "$DOCS_DIR/backend"
mkdir -p "$DOCS_DIR/blockchain"
mkdir -p "$DOCS_DIR/infrastructure"
mkdir -p "$DOCS_DIR/standards"
mkdir -p "$DOCS_DIR/general"
mkdir -p "$DOCS_DIR/api"
mkdir -p "$DOCS_DIR/troubleshooting"

# Keep track of processed files to avoid duplicates
declare -A processed_files

# Function to determine the type of a markdown file
determine_doc_type() {
    local filename="$1"
    local content=$(cat "$filename")
    
    # Make lowercase for easier matching
    local filename_lower=$(basename "$filename" | tr '[:upper:]' '[:lower:]')
    local content_lower=$(echo "$content" | tr '[:upper:]' '[:lower:]')
    
    # Determine type based on filename and content
    if [[ $filename_lower == *"readme"* ]]; then
        echo "general"
    elif [[ $filename_lower == *"api"* || $content_lower == *"api documentation"* || $content_lower == *"endpoint"* ]]; then
        echo "api"
    elif [[ $filename_lower == *"frontend"* || $content_lower == *"react"* || $content_lower == *"vue"* || $content_lower == *"angular"* ]]; then
        echo "frontend"
    elif [[ $filename_lower == *"backend"* || $content_lower == *"server"* || $content_lower == *"database"* ]]; then
        echo "backend"
    elif [[ $filename_lower == *"blockchain"* || $filename_lower == *"wallet"* || $content_lower == *"smart contract"* ]]; then
        echo "blockchain"
    elif [[ $filename_lower == *"docker"* || $content_lower == *"deployment"* || $content_lower == *"ci/cd"* ]]; then
        echo "infrastructure"
    elif [[ $filename_lower == *"standard"* || $filename_lower == *"convention"* || $content_lower == *"guideline"* ]]; then
        echo "standards"
    elif [[ $filename_lower == *"error"* || $filename_lower == *"fix"* || $filename_lower == *"issue"* || $filename_lower == *"debug"* ]]; then
        echo "troubleshooting"
    else
        echo "general"
    fi
}

# Check if a markdown file is from a node_module or is auto-generated
is_user_created_markdown() {
    local file="$1"
    
    # Skip files in node_modules
    if [[ $file == *"/node_modules/"* ]]; then
        return 1
    fi
    
    # Skip files that are likely auto-generated docs
    if [[ $file == *"docs-gen"* || $file == *"generated-docs"* || $file == *"api-docs"* ]]; then
        return 1
    fi
    
    # Skip test output files
    if [[ $file == *".test.ts.md" || $file == *".test.js.md" ]]; then
        return 1
    fi
    
    # Skip GitHub auto-generated files
    if [[ $file == *".github/"* && ($file == *"ISSUE_TEMPLATE"* || $file == *"PULL_REQUEST_TEMPLATE"*) ]]; then
        return 1
    fi
    
    # Likely a user-created documentation file
    return 0
}

# List all markdown files that will be processed
list_markdown_files() {
    echo "=== Markdown files that will be processed ==="
    local count=0
    find "$PROJECT_ROOT" -type f -name "*.md" | sort | while read file; do
        if is_user_created_markdown "$file" && [[ $file != $DOCS_DIR/* ]]; then
            echo "  - $(basename "$file") ($file)"
            count=$((count + 1))
        fi
    done
    echo "=== Total: $count files ==="
    echo ""
    
    # Ask for confirmation before proceeding
    read -p "Do you want to proceed with moving these files? (y/n): " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        echo "Operation cancelled by user."
        exit 0
    fi
}

# Extract the creation date from a file or file metadata
get_doc_date() {
    local filename="$1"
    local content=$(cat "$filename")
    
    # Try to extract date from content first (common formats)
    local date_from_content=$(grep -E 'Date:|Created:|Updated:|Last Modified:' "$filename" | head -n 1 | grep -oE '[0-9]{4}[-/][0-9]{1,2}[-/][0-9]{1,2}')
    
    if [ -n "$date_from_content" ]; then
        echo "$date_from_content"
    else
        # If no date in content, use file modification time
        date -r "$filename" "+%Y-%m-%d"
    fi
}

# Process a markdown file
process_markdown_file() {
    local file="$1"
    
    # Skip if not a user-created markdown file
    if ! is_user_created_markdown "$file"; then
        echo "Skipping auto-generated/module file: $file"
        return
    fi
    
    # Generate a file fingerprint
    local filename=$(basename "$file")
    local file_fingerprint=$(md5sum "$file" | cut -d' ' -f1)
    
    # Skip if this file has already been processed
    if [[ -n "${processed_files[$file_fingerprint]}" ]]; then
        echo "Skipping duplicate file: $file"
        return
    fi
    
    # Check if file is already in the docs directory
    if [[ $file == $DOCS_DIR/* ]]; then
        # Mark the file as processed but don't move it again
        processed_files[$file_fingerprint]="1"
        echo "Skipping already organized file: $file"
        return
    fi
    
    local doc_type=$(determine_doc_type "$file")
    local doc_date=$(get_doc_date "$file")
    
    # Create target directory if it doesn't exist
    local target_dir="$DOCS_DIR/$doc_type"
    mkdir -p "$target_dir"
    
    # Add date prefix to target filename
    local date_prefix=$(echo "$doc_date" | sed 's/[-\/]//g')
    local target_file="$target_dir/${date_prefix}_$filename"
    
    # Move the file (instead of copying)
    mv "$file" "$target_file"
    
    # Mark as processed to avoid duplicates
    processed_files[$file_fingerprint]="1"
    
    echo "Moved: $filename -> $target_file"
}

# Find and process all markdown files in the project
echo "Finding markdown files..."
# List files and get confirmation before proceeding
list_markdown_files

# Process the files after confirmation
find "$PROJECT_ROOT" -type f -name "*.md" | sort | while read file; do
    process_markdown_file "$file"
done

# Create index files for each section
echo "Creating section index files..."
for section in frontend backend blockchain infrastructure standards general api troubleshooting; do
    section_dir="$DOCS_DIR/$section"
    index_file="$section_dir/index.md"
    
    echo "# $section Documentation Index" > "$index_file"
    echo "" >> "$index_file"
    echo "Last updated: $(date '+%Y-%m-%d')" >> "$index_file"
    echo "" >> "$index_file"
    
    # Add links to all documents in this section
    echo "## Documents in this Section" >> "$index_file"
    echo "" >> "$index_file"
    
    find "$section_dir" -name "*.md" -not -name "index.md" | sort | while read doc; do
        doc_name=$(basename "$doc")
        # Extract title from markdown file
        title=$(head -n 5 "$doc" | grep -E '^#+ ' | head -n 1 | sed 's/^#\+\s*//')
        if [ -z "$title" ]; then
            title="${doc_name%.md}"
        fi
        echo "- [${title}](${doc_name})" >> "$index_file"
    done
done

# Create main index file
echo "Creating main documentation index..."
main_index="$DOCS_DIR/README.md"

cat > "$main_index" << EOF
# Project Documentation

This documentation is organized into the following sections:

## Sections

- [Frontend Documentation](frontend/index.md) - UI/UX, component libraries, state management
- [Backend Documentation](backend/index.md) - Server architecture, APIs, database models
- [Blockchain Documentation](blockchain/index.md) - Smart contracts, wallet integration
- [API Documentation](api/index.md) - API reference, endpoints, request/response formats
- [Infrastructure](infrastructure/index.md) - Deployment, CI/CD, docker configurations
- [Standards & Conventions](standards/index.md) - Coding standards, naming conventions
- [Troubleshooting](troubleshooting/index.md) - Common issues and fixes
- [General Documentation](general/index.md) - Other project information

## Recent Updates

Last organized: $(date '+%Y-%m-%d')
EOF

echo "======================================"
echo "Documentation organization complete!"
echo "Main documentation index: $main_index"
echo "======================================"