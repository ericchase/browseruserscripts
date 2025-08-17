// ==UserScript==
// @name        @; pause debugger
// @match       *://*/*
// @version     1.0.1
// @description 2025/06/12, 4:13:00 AM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

setInterval(() => {
  debugger;
}, 50);
