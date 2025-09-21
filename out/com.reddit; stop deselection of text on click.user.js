// ==UserScript==
// @name        com.reddit; stop deselection of text on click
// @match       *://*.reddit.*/*
// @version     1.0.1
// @description 2023/11/15, 7:13:46 PM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

// src/com.reddit; stop deselection of text on click.user.ts
document.addEventListener('mousedown', (event) => {
  event.stopImmediatePropagation();
});
