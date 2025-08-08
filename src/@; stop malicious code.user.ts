// ==UserScript==
// @name        @; stop malicious code
// @match       *://*/*
// @version     1.0.1
// @description 8/8/2024, 12:25:48 AM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;

Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  configurable: false, // Cannot be redefined or deleted
  writable: false, // Cannot be reassigned
  enumerable: true,
  value: originalToDataURL,
});

// freeze native objects you don't want changed
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
