// ==UserScript==
// @name        @; stop selection hijacking
// @match       *://*/*
// @version     1.0.1
// @description 2024/07/26, 10:55:35 AM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

// src/@; stop selection hijacking.user.ts
document.addEventListener('mousedown', function (evt) {
  evt.stopImmediatePropagation();
});
