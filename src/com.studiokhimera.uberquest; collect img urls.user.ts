// ==UserScript==
// @name        com.studiokhimera.uberquest; collect img urls
// @match       *://uberquest.studiokhimera.*/comic/page/*
// @version     1.0.1
// @description 2024/10/13
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

import { WebPlatform_DOM_Element_Added_Observer_Class } from './lib/ericchase/WebPlatform_DOM_Element_Added_Observer_Class.js';

const url_set = new Set<string>();
console.log(url_set);
WebPlatform_DOM_Element_Added_Observer_Class({
  selector: 'a > img[src*="/next-hover.png"]',
}).subscribe((next, unsubscribe) => {
  if (next instanceof HTMLImageElement) {
    unsubscribe();
    WebPlatform_DOM_Element_Added_Observer_Class({
      selector: 'img',
    }).subscribe((element, unsubscribe) => {
      if (element instanceof HTMLImageElement) {
        if (element.src.endsWith('.webp') && url_set.has(element.src) === false) {
          url_set.add(element.src);
          // SaveUrl(element.src, `${SanitizeFileName(window.location.href)}.webp`);
        }
      }
    });
    setInterval(() => {
      next.click();
    }, 1000);
  }
});
