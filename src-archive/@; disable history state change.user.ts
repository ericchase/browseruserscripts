// ==UserScript==
// @name        @; disable history state change
// @match       *://*/*
// @version     1.0.0
// @description 7/10/2025, 8:34:27 PM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browser--userscripts
// ==/UserScript==

console.log('*: disable history state change');

history.pushState = function (state, title, url) {
  console.log('[Intercept] pushState called with:', { state, title, url });
  location.href = new URL(url, `${location.protocol}//${location.host}/`).href;
};

history.replaceState = function (state, title, url) {
  console.log('[Intercept] replaceState called with:', { state, title, url });
};

history.popstate = function (state, title, url) {
  console.log('[Intercept] replaceState called with:', { state, title, url });
};
