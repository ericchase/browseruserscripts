// ==UserScript==
// @name        com.chatgpt; insert preference on first message
// @match       *://chatgpt.com/*
// @version     1.0.0
// @description 2025/07/12, 9:28:02 PM
// @run-at      document-end
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

// src/com.chatgpt; insert preference on first message.user.js
var preference_string = "When writing lists, never use emojis or emoticons.";
var prompt_selector = "#prompt-textarea";
var placeholder_selector = "p.placeholder";
document.addEventListener("focus", focusHandler, true);
function focusHandler() {
  if (new URL(location).pathname === "/") {
    const prompt = document.querySelector(prompt_selector);
    if (prompt) {
      if (document.activeElement === prompt) {
        const placeholder = prompt.querySelector(placeholder_selector);
        if (placeholder) {
          {
            const p = document.createElement("p");
            p.textContent = preference_string;
            placeholder.replaceWith(p);
          }
          {
            const p = document.createElement("p");
            p.innerHTML = '<br class="ProseMirror-trailingBreak">';
            prompt.appendChild(p);
          }
          {
            const p = document.createElement("p");
            p.innerHTML = '<br class="ProseMirror-trailingBreak">';
            prompt.appendChild(p);
          }
        } else {}
        moveCursorToEnd(prompt);
      }
    } else {}
  } else {}
}
function moveCursorToEnd(contentEditableElement) {
  contentEditableElement.focus();
  const range = document.createRange();
  range.selectNodeContents(contentEditableElement);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}
