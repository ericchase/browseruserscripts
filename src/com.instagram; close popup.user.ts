// ==UserScript==
// @name        com.instagram; close popup
// @match       *://*.instagram.com/*
// @version     1.0.1
// @description 2025/09/05
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

import { WebPlatform_DOM_Element_Added_Observer_Class } from './lib/ericchase/WebPlatform_DOM_Element_Added_Observer_Class.js';

WebPlatform_DOM_Element_Added_Observer_Class({
  selector: 'div[role="button"]:has(svg>title)',
}).subscribe((element: Element) => {
  if (element instanceof HTMLDivElement && element.querySelector('svg>title')?.textContent === 'Close') {
    element.click();
  }
});
