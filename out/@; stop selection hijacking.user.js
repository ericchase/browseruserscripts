// ==UserScript==
// @name        @; stop selection hijacking
// @match       *://*/*
// @version     1.0.0
// @description 7/26/2024, 10:55:35 AM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browser--userscripts
// ==/UserScript==

// src/@; stop selection hijacking.user.ts
document.addEventListener("mousedown", function(evt) {
  evt.stopImmediatePropagation();
});
