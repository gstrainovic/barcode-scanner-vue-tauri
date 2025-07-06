#!/bin/bash
source ./scripts/utils.sh

# Neue Version generieren
NEW_VERSION=$(generate_next_version)
echo "Neue Version: $NEW_VERSION"

git tag v$NEW_VERSION
git push origin v$NEW_VERSION
gh release create v$NEW_VERSION ./src-tauri/target/release/$NEW_VERSION-barcode_scanner-x86_64-pc-windows-msvc.zip --notes v$NEW_VERSION

# Zweites Release-Repo: gravurzeile/barcode-scanner-v2-releases
git push git@github.com:gravurzeile/barcode-scanner-v2-releases.git v$NEW_VERSION
gh release create v$NEW_VERSION ./src-tauri/target/release/$NEW_VERSION-barcode_scanner-x86_64-pc-windows-msvc.zip --notes v$NEW_VERSION --repo gravurzeile/barcode-scanner-v2-releases
