# Hubgee 🚀

**[📦 Install Hubgee Userscript](https://raw.githubusercontent.com/hanenashi/hubgee/main/hubgee.user.js)**

**TL;DR:** A Tampermonkey/Violentmonkey bridge that sends code blocks directly from the Gemini web UI to an active GitHub web editor tab. Built specifically to bypass Android clipboard limits and make rapid mobile development less painful.

---

## 🛑 The Problem
When coding on mobile, the system clipboard often truncates large chunks of text. Selecting all text in GitHub's web editor is also buggy because it uses a virtualized DOM that only renders ~200 lines at a time. Copying and pasting large scripts between AI chats and GitHub repos requires multiple tedious steps.

## 💡 The Solution
Hubgee runs simultaneously on `gemini.google.com` and `github.com`. It uses local shared storage (`GM_setValue` and `GM_getValue`) to pass code directly between the two browser tabs, completely bypassing the OS clipboard and GitHub's UI limitations. 

## ✨ Features
* **Zero-Clipboard Transfer:** Sends payloads via native browser storage.
* **Auto-Verification Checks:** Compares the character count of the injected payload against the source to warn you if GitHub truncated the paste.
* **Persistent Undo:** Automatically steals and backs up your GitHub editor contents *before* nuking, allowing you to restore your code even after a full page reload or accidental tab closure.
* **Auto-Updates:** Tampermonkey will automatically pull updates directly from this repository.

## 🛠️ How to Use It
1. Install this script in a mobile browser that supports extensions (like Kiwi Browser or Edge on Android).
2. Open a tab with **Gemini** and generate some code.
3. Open a tab with the **GitHub Web Editor** (`github.com/*/edit/*`).
4. On the Gemini tab, tap the **📦 Push to Hubgee** button injected above the desired code block.
5. Switch to the GitHub tab and tap the big red **☢️ NUKE & PULL** button.
6. The editor will instantly clear its old contents, inject your new code, and verify the length. 
7. *(Optional)* If something breaks, tap **⏪ UNDO** to restore your previous code.

## 📝 Requirements
* A browser extension manager that supports `GM_setValue` and `GM_getValue` (Tampermonkey, Violentmonkey, etc.).
* Both the Gemini tab and the GitHub tab must be open in the same browser profile.
