// ==UserScript==
// @name        @; pause scrolling on scroll lock
// @match       *://*/*
// @version     1.0.0
// @description 7/19/2024, 5:16:31 PM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browser--userscripts
// ==/UserScript==

let pauseScrolling = false;
let scrollAmount = 0;

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
