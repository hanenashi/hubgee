
// ==UserScript== hdjdjd
// @name         Hubgee - The Tactical Nuke Bridge
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Lean bridge between Gemini and GitHub. Overwrites code with haptic and visual feedback.
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
        setTimeout(() => toast.style.opacity = '0', 2000);
        setTimeout(() => toast.remove(), 2300);
    }

    // ==========================================
    // MODULE 1: GEMINI - PUSH
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
                        
                        GM_setValue('hubgee_payload', rawCode);
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
    // MODULE 2: GITHUB - TACTICAL NUKE
    // ==========================================
    if (isGitHub) {
        
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

        function triggerNukeEffects() {
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 200, 50, 500]);
            }

            const flash = document.createElement('div');
            flash.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background-color: rgba(255, 0, 0, 0.4);
                z-index: 9999999; pointer-events: none;
                transition: opacity 0.4s ease-out; opacity: 1;
            `;
            document.body.appendChild(flash);
            
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    flash.style.opacity = '0';
                });
            });
            
            setTimeout(() => flash.remove(), 400);
        }

        setInterval(() => {
            if (window.location.href.includes('/edit/') && !document.getElementById('hubgee-github-container')) {
                const btnContainer = document.createElement('div');
                btnContainer.id = 'hubgee-github-container';
                btnContainer.style.cssText = `
                    position: fixed; bottom: 20px; right: 20px; z-index: 99999;
                `;

                const nukeBtn = document.createElement('button');
                nukeBtn.textContent = '☢️ NUKE & PULL';
                nukeBtn.style.cssText = `
                    padding: 16px 24px; background-color: #ef4444; color: white;
                    border: none; border-radius: 8px; font-weight: bold; font-size: 16px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.3); cursor: pointer;
                `;

                nukeBtn.onclick = (e) => {
                    e.preventDefault();
                    
                    let incomingCode = GM_getValue('hubgee_payload', '');
                    if (!incomingCode) {
                        showToast("Buffer empty!", "#ef4444");
                        return;
                    }

                    // SAFETY CHECK: If the payload is old JSON, unwrap it.
                    try {
                        const parsed = JSON.parse(incomingCode);
                        if (parsed && parsed.text) {
                            incomingCode = parsed.text;
                        }
                    } catch (err) {
                        // It's a raw string (v2.0+), which is exactly what we want. Do nothing.
                    }

                    triggerNukeEffects();
                    injectFullEditorText(incomingCode);
                    showToast(`✅ Pulled payload successfully!`, '#16a34a');
                };

                btnContainer.appendChild(nukeBtn);
                document.body.appendChild(btnContainer);
            }
        }, 1500); 
    }
})();
