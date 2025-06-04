$sourceDir = "."
$destZip = "E:/HeritageBakes_Surface.zip"

# Create a temporary directory for files to zip
$tempDir = "temp_for_zip"
New-Item -ItemType Directory -Force -Path $tempDir

# Copy required files and folders
Copy-Item "server" -Destination "$tempDir/server" -Recurse
Copy-Item "uploads" -Destination "$tempDir/uploads" -Recurse
Copy-Item "client" -Destination "$tempDir/client" -Recurse
Copy-Item "shared" -Destination "$tempDir/shared" -Recurse
Copy-Item "installers" -Destination "$tempDir/installers" -Recurse
Copy-Item "package.json" -Destination "$tempDir/"
Copy-Item "package-lock.json" -Destination "$tempDir/"
Copy-Item "components.json" -Destination "$tempDir/"
Copy-Item "postcss.config.js" -Destination "$tempDir/"
Copy-Item "tailwind.config.ts" -Destination "$tempDir/"
Copy-Item "tsconfig.json" -Destination "$tempDir/"
Copy-Item "vite.config.ts" -Destination "$tempDir/"
Copy-Item ".gitignore" -Destination "$tempDir/"
Copy-Item ".replit" -Destination "$tempDir/"
Copy-Item "generated-icon.png" -Destination "$tempDir/"
Copy-Item "HeritageBakes_Surface_Setup.md" -Destination "$tempDir/"

# Create the zip file
Compress-Archive -Path "$tempDir/*" -DestinationPath $destZip -Force

# Clean up temporary directory
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "Created $destZip with all necessary files for Surface setup." 