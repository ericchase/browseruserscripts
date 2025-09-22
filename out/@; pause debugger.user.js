// ==UserScript==
// @name        @; pause debugger
// @match       *://*/*
// @version     1.0.1
// @description 2025/06/12
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

// src/@; pause debugger.user.ts
setInterval(() => {
  debugger;
}, 50);
