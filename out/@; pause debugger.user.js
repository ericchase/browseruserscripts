// ==UserScript==
// @name        @; pause debugger
// @match       *://*/*
// @version     1.0.1
// @description 6/12/2025, 4:13:00 AM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

// src/@; pause debugger.user.ts
setInterval(() => {
  debugger;
}, 50);
