// ==UserScript==
// @name        tv.twitch; automatically click reload player button
// @match       https://www.twitch.tv/*
// @version     1.0.0
// @description 2025/09/22
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

import { WebPlatform_DOM_Element_Added_Observer_Class } from './lib/ericchase/WebPlatform_DOM_Element_Added_Observer_Class.js';

const observer1 = WebPlatform_DOM_Element_Added_Observer_Class({
  selector: 'button',
});
observer1.subscribe((element1) => {
  if (element1.textContent === 'Click Here to Reload Player') {
    console.log('Player crashed. Reloading.');
    window.location.reload();
  }
});
