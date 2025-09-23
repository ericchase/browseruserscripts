// ==UserScript==
// @name        com.pinterest; close signup modal
// @match       https://www.pinterest.com/*
// @version     1.0.0
// @description 2025/09/20
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

import { WebPlatform_DOM_Element_Added_Observer_Class } from './lib/ericchase/WebPlatform_DOM_Element_Added_Observer_Class.js';

function watchForSignUpModal() {
  const observer1 = WebPlatform_DOM_Element_Added_Observer_Class({
    selector: 'div[name="trap-focus"]',
  });
  observer1.subscribe((element1) => {
    const observer2 = WebPlatform_DOM_Element_Added_Observer_Class({
      selector: 'button[aria-label="close"]',
      source: element1,
    });
    observer2.subscribe((element2) => {
      (element2 as HTMLButtonElement).click();
      observer2.disconnect();
    });
  });
}

function watchForBottomRightUpsell() {
  const observer1 = WebPlatform_DOM_Element_Added_Observer_Class({
    selector: 'div[data-test-id="bottom-right-upsell"]',
  });
  observer1.subscribe((element1) => {
    const observer2 = WebPlatform_DOM_Element_Added_Observer_Class({
      selector: 'button[aria-label="Close Bottom Right Upsell"]',
      source: element1,
    });
    observer2.subscribe((element2) => {
      (element2 as HTMLButtonElement).click();
      observer2.disconnect();
    });
  });
}

watchForSignUpModal();
watchForBottomRightUpsell();
