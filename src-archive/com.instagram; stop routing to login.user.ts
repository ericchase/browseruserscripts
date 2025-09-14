// ==UserScript==
// @name        com.instagram; stop routing to login
// @match       *://*.instagram.com/*
// @version     1.0.0
// @description 2025/08/18
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

// !! Only Logs

for (const fn of ['replaceState']) {
  const orig_fn = history[fn];
  history[fn] = function (...args) {
    console.log('history.' + fn, this, args);
    // switch (fn) {
    //   default:
    //   return orig_fn.apply(this, args);
    // }
  };
}

for (const fn of ['insertBefore', 'replaceChild', 'removeChild', 'remove']) {
  const orig_fn = Node.prototype[fn];
  Node.prototype[fn] = function (...args) {
    console.log('Node.' + fn, this, args);
    // switch (fn) {
    //   default:
    //     return orig_fn.apply(this, args);
    // }
  };
}
