// ==UserScript==
// @name        com.google; remove shopping search
// @match       *://*.google.*/search*
// @version     1.0.1
// @description 2024/11/22
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

import { WebPlatform_DOM_Element_Added_Observer_Class } from './lib/ericchase/WebPlatform_DOM_Element_Added_Observer_Class.js';

async function main() {
  WebPlatform_DOM_Element_Added_Observer_Class({
    selector: 'div[role="listitem"]',
  }).subscribe(async (element) => {
    if (element instanceof HTMLDivElement) {
      if (
        element.textContent?.includes('Shopping') || //
        element.textContent?.includes('News') ||
        element.textContent?.includes('Forums') ||
        element.textContent?.includes('Web')
      ) {
        element.remove();
      }
    }
  });
}

main();
