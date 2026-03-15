// ==UserScript==
// @name         Hubgee - Debug Ready Bridge
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Manual, logged bridge between Gemini and GitHub with Toast UI.
// @match        https://gemini.google.com/*
// @match        https://github.com/*/edit/*
// @grant        GM_setValue
// @grant        GM_getValue
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
            position: fixed;
            bottom: 90px;
            left: 50%;
            transform: translateX(-50%);
            background-color: ${bgColor};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-family: sans-serif;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 999999;
            transition: opacity 0.3s ease-in-out;
            pointer-events: none;
            text-align: center;
            white-space: nowrap;
        `;
        document.body.appendChild(toast);

        // Fade out and remove
        setTimeout(() => { toast.style.opacity = '0'; }, 2500);
        setTimeout(() => { toast.remove(); }, 2800);
    }

    // ==========================================
    // MODULE 1: GEMINI - MANUAL PUSH
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
                        background-color: #3b82f6; color: white; 
                        border: none; font-weight: bold; font-size: 16px;
                        margin-bottom: 8px; border-radius: 6px; cursor: pointer;
                    `;
                    
                    btn.onclick = (e) => {
                        e.preventDefault();
                        const rawCode = block.innerText;
                        
                        GM_setValue('hubgee_payload', rawCode);
                        showToast(`Stored ${rawCode.length} chars to Hubgee!`, '#16a34a'); // Green
                        
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
    // MODULE 2: GITHUB - MANUAL NUKE & PULL
    // ==========================================
    if (isGitHub) {
        setTimeout(() => {
            const btn = document.createElement('button');
            btn.textContent = '☢️ NUKE & PULL FROM HUBGEE';
            btn.style.cssText = `
                position: fixed; bottom: 20px; right: 20px; z-index: 99999;
                padding: 16px 24px; background-color: #ef4444; color: white;
                border: none; border-radius: 8px; font-weight: bold; font-size: 16px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.3); cursor: pointer;
            `;

            btn.onclick = (e) => {
                e.preventDefault();
                
                const incomingCode = GM_getValue('hubgee_payload', '');
                
                if (!incomingCode) {
                    showToast("Buffer empty! Push from Gemini first.", "#ef4444"); // Red
                    btn.textContent = '❌ BUFFER EMPTY';
                    setTimeout(() => btn.textContent = '☢️ NUKE & PULL FROM HUBGEE', 2000);
                    return;
                }
                
                const activeElement = document.activeElement;
                let injected = false;
                
                try {
                    document.execCommand('selectAll');
                    document.execCommand('insertText', false, incomingCode);
                    injected = true;
                } catch (err) {
                    console.error("[Hubgee] execCommand failed:", err);
                }
                
                const textarea = document.querySelector('.file-editor-textarea');
                if (textarea) {
                    textarea.value = incomingCode;
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    injected = true;
                }
                
                if (injected) {
                    showToast(`Pulled ${incomingCode.length} chars!`, '#16a34a');
                    btn.textContent = '✅ PULLED!';
                    btn.style.backgroundColor = '#16a34a';
                } else {
                    showToast("Failed to inject code!", "#ef4444");
                }

                setTimeout(() => { 
                    btn.textContent = '☢️ NUKE & PULL FROM HUBGEE';
                    btn.style.backgroundColor = '#ef4444';
                }, 2000);
            };

            document.body.appendChild(btn);
        }, 2500); 
    }
})();
