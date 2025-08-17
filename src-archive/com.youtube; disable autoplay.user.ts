// ==UserScript==
// @name        com.youtube; disable autoplay
// @match       *://www.youtube.com/watch
// @version     1.0.0
// @description 2023/12/23, 9:34:58 AM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

// idk if this works

const id = setInterval(() => {
  const buttonOn = document.querySelector('[title="Autoplay is on"]');
  const buttonOff = document.querySelector('[title="Autoplay is off"]');
  if (buttonOn !== null) {
    clearInterval(id);
    buttonOn.click();
  } else if (buttonOff !== null) {
    clearInterval(id);
  }
}, 2500);
