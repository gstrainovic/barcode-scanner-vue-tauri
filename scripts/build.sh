#!/bin/bash
source ./scripts/utils.sh

# Neue Version generieren
NEW_VERSION=$(generate_next_version)
echo "Neue Version: $NEW_VERSION"

if [ -f "./src-tauri/Cargo.toml" ]; then
    sed -i.bak -E "s/^version = \".*\"/version = \"$NEW_VERSION\"/" ./src-tauri/Cargo.toml
    echo "Version in src-tauri/Cargo.toml auf $NEW_VERSION geändert."
else
    echo "./src-tauri/Cargo.toml nicht gefunden!"
    exit 1
fi

if [ -f "./package.json" ]; then
    sed -i.bak -E "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" ./package.json
    echo "Version in package.json auf $NEW_VERSION geändert."
else
    echo "./package.json nicht gefunden!"
    exit 1
fi

if [ -f "./src-tauri/tauri.conf.json" ]; then
    sed -i.bak -E "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" ./src-tauri/tauri.conf.json
    echo "Version in src-tauri/tauri.conf.json auf $NEW_VERSION geändert."
else
    echo "./src-tauri/tauri.conf.json nicht gefunden!"
    exit 1
fi

#src-tauri\src\config\lib.rs
if [ -f "./src-tauri/src/config/lib.rs" ]; then
    # sed -i.bak -E "s/version = \".*\"/version = \"$NEW_VERSION\"/" ./src-tauri/src/config/lib.rs
    sed -i.bak -E "s/version: \".*\"\.to_string\(\)/version: \"$NEW_VERSION\".to_string()/" ./src-tauri/src/config/lib.rs
    echo "Version in src-tauri/src/config/lib.rs auf $NEW_VERSION geändert."
else
    echo "./src-tauri/src/config/lib.rs nicht gefunden!"
    exit 1
fi

# Backup-Dateien entfernen
find ./ -name "*.bak" -type f -delete

echo "Version erfolgreich auf $NEW_VERSION aktualisiert."

pnpm tauri build
# falls erfolgreich
if [ $? -eq 0 ]; then
    echo "Build erfolgreich."
    #  exe ist src-tauri\target\release\barcode-scanner-v2.exe
    #  mit powershell zippen als $NEW_VERSION-barcode_scanner-x86_64-pc-windows-msvc.zip

    #  und in den Ordner releases verschieben

    if [ -d "./src-tauri/target/release" ]; then
        if [ -f "./src-tauri/target/release/barcode-scanner-v2.exe" ]; then
            echo "Build erfolgreich erstellt."
            # Zippen des Builds mit powershell
            powershell -Command "Compress-Archive -Path ./src-tauri/target/release/barcode-scanner-v2.exe -DestinationPath ./src-tauri/target/release/$NEW_VERSION-barcode_scanner-x86_64-pc-windows-msvc.zip -Force"
            echo "Build in $NEW_VERSION-barcode_scanner-x86_64-pc-windows-msvc.zip gepackt."
        else
            echo "Build nicht gefunden!"
        fi
    else
        echo "Release-Ordner nicht gefunden!"
    fi

else
    echo "Build fehlgeschlagen."
    exit 1
fi