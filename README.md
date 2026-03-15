# Hubgee 🚀

**[📦 Install Hubgee Userscript](https://raw.githubusercontent.com/hanenashi/hubgee/main/hubgee.user.js)**

**TL;DR:** A Tampermonkey/Violentmonkey bridge that sends code blocks directly from the Gemini web UI to an active GitHub web editor tab. Built specifically to bypass Android clipboard limits and make rapid mobile development less painful.

---

## 🛑 The Problem
When coding on mobile (specifically Android), the system clipboard often truncates large chunks of text. Selecting all text in GitHub's web editor is also buggy because it uses a virtualized DOM that only renders ~200 lines at a time. Copying and pasting large scripts between AI chats and GitHub repos requires multiple tedious steps.

## 💡 The Solution
Hubgee runs on both `gemini.google.com` and `github.com`. It uses local shared storage (`GM_setValue` and `GM_getValue`) to pass code directly between the two browser tabs, completely bypassing the OS clipboard and GitHub's UI limitations. 

## 🛠️ How to Use It
1. Install this script in a mobile browser that supports extensions (like Kiwi Browser or Edge on Android) using Tampermonkey or Violentmonkey.
2. Open a tab with **Gemini** and generate some code.
3. Open a tab with the **GitHub Web Editor** (`github.com/*/edit/*`).
4. On the Gemini tab, tap the **📦 Push to Hubgee** button injected above the desired code block.
5. Switch to the GitHub tab and tap the big red **☢️ NUKE & PULL** button in the bottom right corner.
6. The editor will instantly clear its old contents and inject your new code. Commit and profit.

## 📝 Requirements
* A browser extension manager that supports `GM_setValue` and `GM_getValue` (Tampermonkey, Violentmonkey, etc.).
* Both the Gemini tab and the GitHub tab must be open in the same browser profile.
