// ==UserScript==
// @name        @; pause scrolling on scroll lock
// @match       *://*/*
// @version     1.0.1
// @description 2024/07/19, 5:16:31 PM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

// src/@; pause scrolling on scroll lock.user.ts
var pauseScrolling = false;
var scrollAmount = 0;
window.addEventListener('keydown', (evt) => {
  if (evt.key === 'ScrollLock') {
    pauseScrolling = !pauseScrolling;
    scrollAmount = document.documentElement.scrollTop;
  }
});
window.addEventListener('scroll', (evt) => {
  if (pauseScrolling === true) {
    evt.stopImmediatePropagation();
    evt.stopPropagation();
    evt.preventDefault();
    document.documentElement.scrollTop = scrollAmount;
  }
});
