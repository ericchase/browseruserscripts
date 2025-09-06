// ==UserScript==
// @name        com.instagram; auto-adjust volume
// @match       *://*.instagram.com/*
// @version     1.0.0
// @description 2025-09-05
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

import { WebPlatform_DOM_Element_Added_Observer_Class } from './lib/ericchase/WebPlatform_DOM_Element_Added_Observer_Class.js';

WebPlatform_DOM_Element_Added_Observer_Class({
  selector: 'video',
}).subscribe((element: Element) => {
  element.addEventListener('play', adjustVolume);
  element.addEventListener('playing', adjustVolume);
  element.addEventListener('volumechange', adjustVolume);
});

function adjustVolume(event: Event) {
  if (event.currentTarget instanceof HTMLVideoElement) {
    if (event.currentTarget.muted !== false) {
      event.currentTarget.muted = false;
    }
    if (event.currentTarget.volume !== 0.1) {
      event.currentTarget.volume = 0.1;
    }
  }
}
