// ==UserScript==
// @name        @; stop selection hijacking
// @match       *://*/*
// @version     1.0.1
// @description 7/26/2024, 10:55:35 AM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

document.addEventListener('mousedown', function (evt) {
  evt.stopImmediatePropagation();
});
