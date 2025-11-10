// ==UserScript==
// @name        com.youtube; 'improve youtube' click 'fit to window' button
// @match       https://www.youtube.com/watch*
// @version     1.0.0
// @description 2025/11/10
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

import { WebPlatform_DOM_Element_Added_Observer_Class } from './lib/ericchase/WebPlatform_DOM_Element_Added_Observer_Class.js';

const observer = WebPlatform_DOM_Element_Added_Observer_Class({
  selector: '#it-fit-to-win-player-button',
});
observer.subscribe((element) => {
  if (element instanceof HTMLButtonElement) {
    element.click();
  }
});
