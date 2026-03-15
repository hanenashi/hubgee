// ==UserScript== YEST
// @name         Hubgee - Undo & Verify Bridge
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  Bridge with persistent reload-proof undo, payload verification, and Deep React Memory scraping.
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
    // MODULE 2: GITHUB - DEEP MEMORY HACK
    // ==========================================
    if (isGitHub) {
        
        // --- EXTRACTION: Deep Memory Scraper ---
        function getFullEditorText() {
            let bestText = "";

            // Strategy 1: Brute Force CM6 Properties
            const scanCM6 = (el) => {
                if(!el) return;
                for (let key in el) {
                    try {
                        let val = el[key];
                        if (val && typeof val === 'object') {
                            if (val.state && val.state.doc && typeof val.state.doc.toString === 'function') {
                                let str = val.state.doc.toString();
                                if (str.length > bestText.length) bestText = str;
                            }
                            if (val.view && val.view.state && val.view.state.doc && typeof val.view.state.doc.toString === 'function') {
                                let str = val.view.state.doc.toString();
                                if (str.length > bestText.length) bestText = str;
                            }
                        }
                    } catch(e) {}
                }
            };
            scanCM6(document.querySelector('.cm-content'));
            scanCM6(document.querySelector('.cm-editor'));

            // Strategy 2: Deep React Fiber String Mining
            const elements = ['.cm-content', '.cm-editor', '.react-code-text-editor'];
            for (let selector of elements) {
                const el = document.querySelector(selector);
                if (!el) continue;

                const reactKey = Object.keys(el).find(k => k.startsWith('__reactFiber$'));
                if (!reactKey) continue;

                let node = el[reactKey];
                for (let i = 0; i < 50 && node; i++) {
                    const targets = [node.memoizedProps, node.memoizedState];
                    for (let obj of targets) {
                        if (!obj) continue;
                        for (let key in obj) {
                            try {
                                const val = obj[key];
                                if (typeof val === 'string' && val.length > bestText.length) {
                                    bestText = val;
                                } else if (val && typeof val === 'object') {
                                    if (typeof val.value === 'string' && val.value.length > bestText.length) bestText = val.value;
                                    if (typeof val.text === 'string' && val.text.length > bestText.length) bestText = val.text;
                                    if (typeof val.doc === 'string' && val.doc.length > bestText.length) bestText = val.doc;
                                    // Catch CM6 doc hidden in React state
                                    if (val.doc && typeof val.doc.toString === 'function') {
                                        const docStr = val.doc.toString();
                                        if (docStr.length > bestText.length) bestText = docStr;
                                    }
                                }
                            } catch(e) {}
                        }
                    }
                    node = node.return; // Walk up the React Tree
                }
            }
            
            if (bestText.length > 0) {
                console.log(`[Hubgee] Deep Memory Extraction successful: ${bestText.length} chars.`);
                return bestText;
            }

            // Fallback to DOM
            console.log("[Hubgee] Memory Hacks failed. Falling back to DOM...");
            document.execCommand('selectAll');
            return document.activeElement?.value || document.querySelector('textarea.file-editor-textarea')?.value || window.getSelection().toString() || "";
        }

        // --- INJECTION: React UI Bypass ---
        function injectFullEditorText(newText) {
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

        // Interval checks for soft navigations
        setInterval(() => {
            // Only inject if on an edit page and buttons don't exist
            if (window.location.href.includes('/edit/') && !document.getElementById('hubgee-github-container')) {
                const btnContainer = document.createElement('div');
                btnContainer.id = 'hubgee-github-container';
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

                    // 1. BACKUP VIA DEEP MEMORY SCRAPE
                    const currentCode = getFullEditorText();
                    if (currentCode) {
                        GM_setValue('hubgee_backup', currentCode);
                        console.log(`[Hubgee] Backed up ${currentCode.length} chars to GM storage.`);
                    }

                    // 2. NUKE & INJECT
                    injectFullEditorText(incomingData.text);

                    // 3. VERIFY VIA DEEP MEMORY SCRAPE
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
            }
        }, 1500); 
    }
})();
