# HeritageBakes Surface Setup Guide

## 1. Required Software Installation
All installers are included in the `installers` folder:
1. Run `7z-Setup.exe` to install 7-Zip (needed for extracting ngrok)
2. Run `Cursor_Setup.exe` to install Cursor
3. Run `Node_Setup.msi` to install Node.js
4. Extract `ngrok.zip` to a folder using 7-Zip and add it to your PATH (or just run it from the folder)

## 2. Project Files Location
The zip contains:
- `server/` folder (contains all recipe data)
- `uploads/` folder (contains images)
- `client/` folder (contains frontend code)
- `shared/` folder
- All config files:
  * `package.json`
  * `package-lock.json`
  * `components.json`
  * `postcss.config.js`
  * `tailwind.config.ts`
  * `tsconfig.json`
  * `vite.config.ts`
  * `.gitignore`
  * `.replit`
- `generated-icon.png`
- `installers/` folder with all required software

## 3. Setup Steps
1. Open Cursor
2. Open the extracted HeritageBakes folder
3. Open terminal in Cursor
4. Run: `npm install`
5. Run: `npm run dev`
6. In a new terminal, run ngrok: `ngrok http 5000`

## 4. Testing
1. Server should be running at http://localhost:5000
2. Ngrok will provide a public URL
3. Both URLs should show the HeritageBakes homepage

## 5. Files for Cursor AI
To get Cursor AI up to speed, make sure these files are in the conversation:
- All TypeScript/JavaScript files
- Configuration files (package.json, etc.)
- The server folder contents

## Troubleshooting
- If `npm install` fails, delete `package-lock.json` and try again
- If server won't start, check if port 5000 is in use
- If images don't load, verify the `uploads` folder was copied correctly 