// ==UserScript==
// @name         Hubgee - Undo & Verify Bridge
// @namespace    http://tampermonkey.net/
// @version      1.8
// @description  Bridge with persistent reload-proof undo, payload verification, and native CodeMirror 6 bypass.
// @match        https://gemini.google.com/*
// @match        https://github.com/*/edit/*
// @grant        GM_setValue
// @grant        GM_getValue
// @updateURL    https://raw.githubusercontent.com/hanenashi/hubgee/main/hubgee.user.js
// @downloadURL  https://raw.githubusercontent.com/hanenashi/hubgee/main/hubgee.user.js
// ==/UserScript==

(function() {
    'use strict';

    const isGemini = window.location.hostname === 'gemini.google.com';
    const isGitHub = window.location.hostname === 'github.com';

    function showToast(message, bgColor) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
            background-color: ${bgColor}; color: white; padding: 12px 24px;
            border-radius: 8px; font-family: sans-serif; font-size: 14px;
            font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 999999; transition: opacity 0.3s ease-in-out;
            pointer-events: none; text-align: center; white-space: nowrap;
        `;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; }, 2500);
        setTimeout(() => { toast.remove(); }, 2800);
    }

    // ==========================================
    // MODULE 1: GEMINI - PACKAGE & PUSH
    // ==========================================
    if (isGemini) {
        setInterval(() => {
            const codeBlocks = document.querySelectorAll('pre'); 
            codeBlocks.forEach((block, index) => {
                if (!block.classList.contains('hubgee-injected')) {
                    block.classList.add('hubgee-injected');
                    
                    const btn = document.createElement('button');
                    btn.textContent = `📦 Push Block #${index + 1} to Hubgee`;
                    btn.style.cssText = `
                        display: block; width: 100%; padding: 14px; 
                        background-color: #3b82f6; color: white; border: none; 
                        font-weight: bold; font-size: 16px; margin-bottom: 8px; 
                        border-radius: 6px; cursor: pointer;
                    `;
                    
                    btn.onclick = (e) => {
                        e.preventDefault();
                        const rawCode = block.innerText;
                        
                        const payload = {
                            text: rawCode,
                            length: rawCode.length,
                            timestamp: Date.now()
                        };
                        
                        GM_setValue('hubgee_payload', JSON.stringify(payload));
                        showToast(`Stored ${rawCode.length} chars!`, '#16a34a');
                        
                        const originalBg = block.style.backgroundColor;
                        block.style.backgroundColor = '#dcfce7'; 
                        btn.textContent = `✅ Stored (${rawCode.length} chars)`;
                        btn.style.backgroundColor = '#16a34a'; 
                        
                        setTimeout(() => { 
                            block.style.backgroundColor = originalBg;
                            btn.textContent = `📦 Push Block #${index + 1} to Hubgee`; 
                            btn.style.backgroundColor = '#3b82f6';
                        }, 2000);
                    };
                    block.parentNode.insertBefore(btn, block);
                }
            });
        }, 2000);
    }

    // ==========================================
    // MODULE 2: GITHUB - CODE MIRROR 6 HACK
    // ==========================================
    if (isGitHub) {
        
        // --- THE HOLY GRAIL: CodeMirror 6 API Extractor ---
        function getFullEditorText() {
            try {
                const cmContent = document.querySelector('.cm-content');
                if (cmContent && cmContent.cmView && cmContent.cmView.view) {
                    const text = cmContent.cmView.view.state.doc.toString();
                    console.log(`[Hubgee] CM6 backup successful: ${text.length} chars.`);
                    return text;
                }
            } catch (err) {
                console.error("[Hubgee] CM6 extraction failed:", err);
            }
            
            // Fallback to DOM if CM6 isn't loaded
            console.log("[Hubgee] Falling back to standard DOM extraction...");
            document.execCommand('selectAll');
            return document.activeElement?.value || document.querySelector('textarea.file-editor-textarea')?.value || window.getSelection().toString() || "";
        }

        // --- THE HOLY GRAIL: CodeMirror 6 API Injector ---
        function injectFullEditorText(newText) {
            let injected = false;
            try {
                const cmContent = document.querySelector('.cm-content');
                if (cmContent && cmContent.cmView && cmContent.cmView.view) {
                    const view = cmContent.cmView.view;
                    view.dispatch({
                        changes: { from: 0, to: view.state.doc.length, insert: newText }
                    });
                    console.log("[Hubgee] CM6 native injection successful.");
                    injected = true;
                }
            } catch (err) {
                console.error("[Hubgee] CM6 native injection failed:", err);
            }

            // Fallback for older GitHub UI
            if (!injected) {
                console.log("[Hubgee] Falling back to React DOM injection...");
                document.execCommand('selectAll');
                document.execCommand('insertText', false, newText);
                
                const textarea = document.querySelector('textarea.file-editor-textarea') || document.activeElement;
                if (textarea && textarea.tagName === 'TEXTAREA') {
                    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
                    if (nativeSetter) {
                        nativeSetter.call(textarea, newText);
                    } else {
                        textarea.value = newText;
                    }
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    textarea.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        }

        setTimeout(() => {
            const btnContainer = document.createElement('div');
            btnContainer.style.cssText = `
                position: fixed; bottom: 20px; right: 20px; z-index: 99999;
                display: flex; gap: 10px;
            `;

            const undoBtn = document.createElement('button');
            undoBtn.textContent = '⏪ UNDO';
            undoBtn.style.cssText = `
                padding: 16px 20px; background-color: #f59e0b; color: white;
                border: none; border-radius: 8px; font-weight: bold; font-size: 16px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.3); cursor: pointer;
            `;
            
            undoBtn.onclick = (e) => {
                e.preventDefault();
                const backupText = GM_getValue('hubgee_backup', '');
                if (!backupText) {
                    showToast("No backup found in memory!", "#ef4444");
                    return;
                }
                injectFullEditorText(backupText);
                showToast("Restored from persistent backup!", "#f59e0b");
            };

            const nukeBtn = document.createElement('button');
            nukeBtn.textContent = '☢️ NUKE & PULL';
            nukeBtn.style.cssText = `
                padding: 16px 24px; background-color: #ef4444; color: white;
                border: none; border-radius: 8px; font-weight: bold; font-size: 16px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.3); cursor: pointer;
            `;

            nukeBtn.onclick = (e) => {
                e.preventDefault();
                
                const rawPayload = GM_getValue('hubgee_payload', '{}');
                let incomingData;
                try { incomingData = JSON.parse(rawPayload); } catch(err) { incomingData = {}; }
                
                if (!incomingData.text) {
                    showToast("Buffer empty!", "#ef4444");
                    return;
                }

                // 1. BACKUP FULL CURRENT CODE VIA CM6 NATIVE STATE
                const currentCode = getFullEditorText();
                if (currentCode) {
                    GM_setValue('hubgee_backup', currentCode);
                    console.log(`[Hubgee] Backed up ${currentCode.length} chars to GM storage.`);
                }

                // 2. NUKE & INJECT
                injectFullEditorText(incomingData.text);

                // 3. VERIFY
                setTimeout(() => {
                    const checkText = getFullEditorText();
                    const injectedLength = checkText.length;
                    const lengthDiff = Math.abs(injectedLength - incomingData.length);
                    
                    if (lengthDiff < 50 || injectedLength === 0) { 
                        showToast(`✅ Verified: Pulled ${incomingData.length} chars!`, '#16a34a');
                    } else {
                        showToast(`❌ WARNING: Expected ${incomingData.length} but found ${injectedLength}!`, '#ef4444');
                        console.error("[Hubgee] Truncation detected. Hit Undo to restore.");
                    }
                }, 150);
            };

            btnContainer.appendChild(undoBtn);
            btnContainer.appendChild(nukeBtn);
            document.body.appendChild(btnContainer);
        }, 2500); 
    }
})();
