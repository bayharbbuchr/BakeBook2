# HeritageBakes Mac Setup Guide

This guide will help you set up and run the HeritageBakes app on a Mac, step by step.

---

## 1. Copy the Project Folder
- Plug your external drive into the Mac.
- Open Finder and locate your external drive (usually listed in the sidebar).
- Drag the `HeritageBakes` folder from your external drive to the Desktop (or another easy-to-find location).

---

## 2. Install Node.js
- Open Safari and go to [https://nodejs.org/](https://nodejs.org/)
- Click the **LTS** (Recommended) download button for macOS.
- Open the downloaded `.pkg` file and follow the prompts to install Node.js.

---

## 3. Open Terminal and Navigate to the Project Folder
- Open the **Terminal** app (find it in Applications > Utilities, or search for "Terminal" in Spotlight).
- Type `cd ` (with a space), then drag the `HeritageBakes` folder from Finder into the Terminal window. Press **Enter**.
- Example:
  ```sh
  cd ~/Desktop/HeritageBakes
  ```

---

## 4. Install Project Dependencies
- In Terminal (inside the project folder), type:
  ```sh
  npm install
  ```
- Wait for it to finish (it may take a few minutes).

---

## 5. Start the App
- In Terminal, type:
  ```sh
  npm run dev
  ```
- Wait for the message that says the server is running (e.g., `serving on http://localhost:5000`).

---

## 6. Open the App in a Browser
- Open Safari (or Chrome, etc.)
- Go to: [http://localhost:5000](http://localhost:5000)
- You should see the HeritageBakes app!

---

## 7. Stopping the App
- To stop the app, go back to Terminal and press `Control + C`.

---

## Troubleshooting
- If you see errors, make sure you are in the correct folder in Terminal.
- If `npm install` fails, check your internet connection.
- If you need help, ask your son or refer to this guide!

---

**Enjoy using HeritageBakes!** 