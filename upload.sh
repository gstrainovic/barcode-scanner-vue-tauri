#!/bin/bash

# Funktion, um die nächste Version zu generieren
generate_next_version() {
    # Abrufen der neuesten Version von GitHub-Releases
    LATEST_VERSION=$(gh release list --limit 1 | awk 'NR==1 {print $3}' | sed 's/^v//')
    
    if [ -z "$LATEST_VERSION" ]; then
        echo "Konnte die neueste Version nicht abrufen. Stellen Sie sicher, dass 'gh' korrekt konfiguriert ist."
        exit 1
    fi

    # Version inkrementieren (nur Patch-Level)
    IFS='.' read -r MAJOR MINOR PATCH <<< "$LATEST_VERSION"
    PATCH=$((PATCH + 1))
    echo "$MAJOR.$MINOR.$PATCH"
}

# Neue Version generieren
NEW_VERSION=$(generate_next_version)
echo "Neue Version: $NEW_VERSION"

git tag v$NEW_VERSION
git push origin v$NEW_VERSION
gh release create v$NEW_VERSION ./src-tauri/target/release/$NEW_VERSION-barcode_scanner-x86_64-pc-windows-msvc.zip --notes v$NEW_VERSION