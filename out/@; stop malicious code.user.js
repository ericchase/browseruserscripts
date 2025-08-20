// ==UserScript==
// @name        @; stop malicious code
// @match       *://*/*
// @version     1.0.1
// @description 2024/08/08, 12:25:48 AM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

// src/@; stop malicious code.user.ts
var originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  configurable: false,
  writable: false,
  enumerable: true,
  value: originalToDataURL,
});
console = Object.freeze(console);
document = Object.freeze(document);
window.addEventListener('beforeunload', (e) => {
  e.preventDefault();
  return true;
});
window.onbeforeunload = (e) => {
  e.preventDefault();
  return true;
};
document.documentElement.addEventListener(
  'scroll',
  (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  },
  { passive: false },
);
