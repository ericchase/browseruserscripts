// ==UserScript==
// @name        @; stop redirects
// @match       *://*/*
// @version     1.0.1
// @description 7/22/2024, 11:01:15 AM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

document.addEventListener('beforeunload', function (e) {
  e.preventDefault();
  e.stopImmediatePropagation();
  e.stopPropagation();
  return '...';
});
