test test test

    
// ==UserScript==
// @name         Hubgee - Undo & Verify Bridge
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  Bridge with persistent reload-proof undo, payload verification, and React UI bypass.
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

    // Helper to show a floating notification on screen
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
    // MODULE 2: GITHUB - BACKUP, NUKE, VERIFY
    // ==========================================
    if (isGitHub) {
        // Bypass React's event traps to force an update
        function injectTextIntoReact(text) {
            document.execCommand('selectAll');
            document.execCommand('insertText', false, text);
            
            const textarea = document.querySelector('textarea.file-editor-textarea') || document.activeElement;
            if (textarea && textarea.tagName === 'TEXTAREA') {
                const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
                if (nativeSetter) {
                    nativeSetter.call(textarea, text);
                } else {
                    textarea.value = text;
                }
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                textarea.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        // Steal the full text directly from React's memory to bypass DOM virtualization
        function getReactEditorText() {
            try {
                const editorEl = document.querySelector('.react-code-text-editor, .cm-editor, textarea.file-editor-textarea') || document.activeElement;
                if (!editorEl) return null;

                const reactKey = Object.keys(editorEl).find(k => k.startsWith('__reactFiber$'));
                if (!reactKey) return null;

                let fiber = editorEl[reactKey];
                let bestText = null;
                let maxLength = -1;

                // Walk up the tree to find the prop containing the massive code string
                for (let i = 0; i < 30 && fiber; i++) {
                    const props = fiber.memoizedProps || {};
                    const potentialText = props.value || props.text || props.content;
                    
                    if (typeof potentialText === 'string' && potentialText.length > maxLength) {
                        maxLength = potentialText.length;
                        bestText = potentialText;
                    }
                    fiber = fiber.return;
                }
                
                if (bestText !== null && bestText.length > 0) {
                    console.log(`[Hubgee] React Memory Hack extracted ${bestText.length} chars.`);
                    return bestText;
                }
            } catch (err) {
                console.error("[Hubgee] React Memory Hack failed:", err);
            }
            return null;
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
                injectTextIntoReact(backupText);
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

                // 1. BACKUP CURRENT CODE (Memory Hack first, DOM extraction as fallback)
                let currentCode = getReactEditorText();
                
                if (!currentCode) {
                    console.log("[Hubgee] Memory Hack failed. Falling back to DOM extraction...");
                    document.execCommand('selectAll');
                    const activeEl = document.activeElement;
                    currentCode = activeEl?.value || document.querySelector('.file-editor-textarea')?.value || window.getSelection().toString() || "";
                }
                
                if (currentCode) {
                    GM_setValue('hubgee_backup', currentCode);
                    console.log(`[Hubgee] Backed up ${currentCode.length} chars to GM storage.`);
                }

                // 2. NUKE & INJECT
                injectTextIntoReact(incomingData.text);

                // 3. VERIFY
                setTimeout(() => {
                    const checkText = getReactEditorText() || document.activeElement?.value || "";
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
