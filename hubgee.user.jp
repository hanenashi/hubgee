// ==UserScript==
// @name         Hubgee - Debug Ready Bridge
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Manual, logged bridge between Gemini and GitHub.
// @match        https://gemini.google.com/*
// @match        https://github.com/*/edit/*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    const isGemini = window.location.hostname === 'gemini.google.com';
    const isGitHub = window.location.hostname === 'github.com';

    // ==========================================
    // MODULE 1: GEMINI - MANUAL PUSH
    // ==========================================
    if (isGemini) {
        console.log("[Hubgee] Loaded on Gemini. Searching for code blocks...");
        
        setInterval(() => {
            const codeBlocks = document.querySelectorAll('pre'); 
            
            codeBlocks.forEach((block, index) => {
                if (!block.classList.contains('hubgee-injected')) {
                    block.classList.add('hubgee-injected');
                    
                    const btn = document.createElement('button');
                    // Give each button a unique ID based on its position
                    btn.innerHTML = `📦 Push Block #${index + 1} to Hubgee`;
                    btn.style.cssText = `
                        display: block; width: 100%; padding: 14px; 
                        background-color: #3b82f6; color: white; 
                        border: none; font-weight: bold; font-size: 16px;
                        margin-bottom: 8px; border-radius: 6px; cursor: pointer;
                    `;
                    
                    btn.onclick = (e) => {
                        e.preventDefault();
                        const rawCode = block.innerText;
                        const preview = rawCode.substring(0, 50).replace(/\n/g, '\\n') + '...';
                        
                        console.log(`[Hubgee] Grabbed Block #${index + 1}`);
                        console.log(`[Hubgee] Length: ${rawCode.length} chars`);
                        console.log(`[Hubgee] Preview: ${preview}`);
                        
                        // Store it
                        GM_setValue('hubgee_payload', rawCode);
                        
                        // Visual feedback on the Pixel 8 screen
                        const originalBg = block.style.backgroundColor;
                        block.style.backgroundColor = '#dcfce7'; // light green
                        btn.innerHTML = `✅ Stored (${rawCode.length} chars)`;
                        btn.style.backgroundColor = '#16a34a'; // darker green
                        
                        setTimeout(() => { 
                            block.style.backgroundColor = originalBg;
                            btn.innerHTML = `📦 Push Block #${index + 1} to Hubgee`; 
                            btn.style.backgroundColor = '#3b82f6';
                        }, 2000);
                    };
                    
                    block.parentNode.insertBefore(btn, block);
                }
            });
        }, 2000);
    }

    // ==========================================
    // MODULE 2: GITHUB - MANUAL NUKE & PULL
    // ==========================================
    if (isGitHub) {
        console.log("[Hubgee] Loaded on GitHub Editor. Injecting manual pull button...");
        
        // Wait for GitHub's UI to settle
        setTimeout(() => {
            const btn = document.createElement('button');
            btn.innerHTML = '☢️ NUKE & PULL FROM HUBGEE';
            btn.style.cssText = `
                position: fixed; bottom: 20px; right: 20px; z-index: 99999;
                padding: 16px 24px; background-color: #ef4444; color: white;
                border: none; border-radius: 8px; font-weight: bold; font-size: 16px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.3); cursor: pointer;
            `;

            btn.onclick = (e) => {
                e.preventDefault();
                console.log("[Hubgee] Nuke & Pull initiated.");
                
                const incomingCode = GM_getValue('hubgee_payload', '');
                
                if (!incomingCode) {
                    console.error("[Hubgee] Buffer is empty! Did you push from Gemini?");
                    btn.innerHTML = '❌ BUFFER EMPTY';
                    setTimeout(() => btn.innerHTML = '☢️ NUKE & PULL FROM HUBGEE', 2000);
                    return;
                }
                
                console.log(`[Hubgee] Retrieved ${incomingCode.length} chars from buffer.`);
                
                // Focus the editor to prepare for native commands
                const activeElement = document.activeElement;
                console.log("[Hubgee] Active element before nuke:", activeElement);
                
                try {
                    // Attempt 1: Native execCommand (bypasses virtual DOM limits)
                    console.log("[Hubgee] Attempting document.execCommand...");
                    document.execCommand('selectAll');
                    document.execCommand('insertText', false, incomingCode);
                    console.log("[Hubgee] execCommand executed.");
                    
                } catch (err) {
                    console.error("[Hubgee] execCommand failed:", err);
                }
                
                // Attempt 2: Direct textarea fallback (for older UI states)
                const textarea = document.querySelector('.file-editor-textarea');
                if (textarea) {
                    console.log("[Hubgee] Found .file-editor-textarea. Injecting fallback...");
                    textarea.value = incomingCode;
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log("[Hubgee] Fallback injected.");
                } else {
                    console.log("[Hubgee] No .file-editor-textarea found. Hoping execCommand worked.");
                }
                
                // Visual confirmation
                btn.innerHTML = '✅ PULLED!';
                btn.style.backgroundColor = '#16a34a';
                setTimeout(() => { 
                    btn.innerHTML = '☢️ NUKE & PULL FROM HUBGEE';
                    btn.style.backgroundColor = '#ef4444';
                }, 2000);
            };

            document.body.appendChild(btn);
        }, 2500); 
    }
})();
