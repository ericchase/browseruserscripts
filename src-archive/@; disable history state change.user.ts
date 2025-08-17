// ==UserScript==
// @name        @; disable history state change
// @match       *://*/*
// @version     1.0.1
// @description 2025/07/10, 8:34:27 PM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
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
