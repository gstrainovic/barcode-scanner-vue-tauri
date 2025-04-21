#!/bin/bash

# Überprüfen, ob eine neue Version angegeben wurde
if [ -z "$1" ]; then
    echo "Bitte geben Sie die neue Version als Argument an."
    echo "Beispiel: ./upload.sh 0.2.0"
    exit 1
fi

NEW_VERSION=$1

git tag v$NEW_VERSION
git push origin v$NEW_VERSION
gh release create v$NEW_VERSION ./src-tauri/target/release/$NEW_VERSION-barcode_scanner-x86_64-pc-windows-msvc.zip --notes v$NEW_VERSION