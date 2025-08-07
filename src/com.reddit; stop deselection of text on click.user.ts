// ==UserScript==
// @name        com.reddit; stop deselection of text on click
// @match       https://www.reddit.com/*
// @version     1.0.0
// @description 11/15/2023, 7:13:46 PM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

// pretty straightforward, just works
document.addEventListener('mousedown', (event: MouseEvent) => {
  event.stopImmediatePropagation();
});
