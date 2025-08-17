// ==UserScript==
// @name        com.chatgpt; insert preference on first message
// @match       *://chatgpt.com/*
// @version     1.0.0
// @description 2025/07/12, 9:28:02 PM
// @run-at      document-end
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

// this will be pasted into the prompt when a new prompt is detected
const preference_string = 'When writing lists, never use emojis or emoticons.';

const prompt_selector = '#prompt-textarea';
const placeholder_selector = 'p.placeholder';

// use the capture phase to ensure we catch events before they bubble up
document.addEventListener('focus', focusHandler, true);
// console.log('SCRIPT: Focus event hooked.');

function focusHandler() {
  if (new URL(location).pathname === '/') {
    // console.log('SCRIPT: New prompt detected.');
    const prompt = document.querySelector(prompt_selector);
    if (prompt) {
      // console.log('SCRIPT: Prompt element found.');
      if (document.activeElement === prompt) {
        const placeholder = prompt.querySelector(placeholder_selector);
        if (placeholder) {
          // console.log('SCRIPT: Placeholder element found.');
          {
            const p = document.createElement('p');
            p.textContent = preference_string;
            placeholder.replaceWith(p);
            // console.log('SCRIPT: Placeholder replaced with preference.');
          }
          {
            const p = document.createElement('p');
            p.innerHTML = '<br class="ProseMirror-trailingBreak">';
            prompt.appendChild(p);
            // console.log('SCRIPT: Empty line inserted.');
          }
          {
            const p = document.createElement('p');
            p.innerHTML = '<br class="ProseMirror-trailingBreak">';
            prompt.appendChild(p);
            // console.log('SCRIPT: Empty line inserted.');
          }
        } else {
          // console.log('SCRIPT: Placeholder element NOT found.');
        }
        moveCursorToEnd(prompt);
      }
    } else {
      // console.log('SCRIPT: Prompt element NOT found.');
    }
  } else {
    // console.log('SCRIPT: New prompt NOT detected.');
  }
}

function moveCursorToEnd(contentEditableElement) {
  contentEditableElement.focus();
  const range = document.createRange();
  range.selectNodeContents(contentEditableElement);
  range.collapse(false); // collapse to end
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}
