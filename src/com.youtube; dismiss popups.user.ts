// ==UserScript==
// @name        com.youtube; dismiss popups
// @match       *://*.youtube.*/*
// @version     1.0.0
// @description 2025/09/14
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

import { WebPlatform_DOM_Element_Added_Observer_Class } from './lib/ericchase/WebPlatform_DOM_Element_Added_Observer_Class.js';

const observer = WebPlatform_DOM_Element_Added_Observer_Class({
  selector: 'div#main.style-scope.yt-mealbar-promo-renderer',
});
observer.subscribe((element) => {
  for (const h2 of element.querySelectorAll('h2')) {
    if (h2.textContent.includes('We reimagined cable.')) {
      for (const button of element.querySelectorAll('button')) {
        if (button.textContent.includes('Dismiss')) {
          console.log('popup dismissed');
          button.click();
        }
      }
    }
  }
});
