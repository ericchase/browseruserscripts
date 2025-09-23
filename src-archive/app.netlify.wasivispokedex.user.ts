// ==UserScript==
// @name        app.netlify.wasivispokedex; favorite all pokemon
// @match       https://wasivispokedex.netlify.app/*
// @version     1.0.0
// @description 2024/08/31
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

import { Async_Core_Utility_Sleep } from '../src/lib/ericchase/Core_Utility_Sleep.js';
import { WebPlatform_DOM_Element_Added_Observer_Class } from '../src/lib/ericchase/WebPlatform_DOM_Element_Added_Observer_Class.js';
import { WebPlatform_Node_QuerySelector, WebPlatform_Node_Reference_Class } from '../src/lib/ericchase/WebPlatform_Node_Reference_Class.js';

let favoriteSelector = '.favorite-heart';
let nextPageSelector = '.pagination-btn:last-child';

function ClickFavoritesOnPage() {
  return new Promise<void>((resolve) => {
    let count = 0;
    WebPlatform_DOM_Element_Added_Observer_Class({
      selector: favoriteSelector,
    }).subscribe((element, unsubscribe) => {
      if (element instanceof HTMLDivElement) {
        if (WebPlatform_Node_Reference_Class(element.querySelector('img')).tryAs(HTMLImageElement)?.getAttribute('src')?.startsWith('/static/media/heart-empty') === true) {
          element.click();
        }
        count++;
        if (count >= 24) {
          unsubscribe();
          resolve();
        }
      }
    });
  });
}

WebPlatform_DOM_Element_Added_Observer_Class({
  selector: nextPageSelector,
}).subscribe(async (element, unsubscribe) => {
  if (element instanceof HTMLButtonElement) {
    unsubscribe();
    const page_counter = WebPlatform_Node_QuerySelector('.page-counter').tryAs(HTMLDivElement);
    while (true) {
      await ClickFavoritesOnPage();
      await Async_Core_Utility_Sleep(100);
      // if we are on the last page, exit loop
      if (page_counter?.textContent === '38 of 38') {
        break;
      }
      element.click();
      await Async_Core_Utility_Sleep(100);
    }
  }
});
