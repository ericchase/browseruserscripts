// ==UserScript==
// @name        com.google.mail; hide and unshow all labels
// @match       https://mail.google.com/mail/u/*/#settings/labels
// @version     1.0.0
// @description 2025/09/22
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

import { Core_Utility_Debounce } from './lib/ericchase/Core_Utility_Debounce.js';
import { WebPlatform_DOM_Element_Added_Observer_Class } from './lib/ericchase/WebPlatform_DOM_Element_Added_Observer_Class.js';

const scanPage = Core_Utility_Debounce(() => {
  for (const span of document.querySelectorAll('span[role="link"]')) {
    if (span.textContent.trim() === 'hide') {
      (span as HTMLSpanElement).click();
      return;
    }
  }
  for (const cell of document.querySelectorAll('td')) {
    if (cell.textContent.trim() === 'Show in IMAP') {
      for (const checkbox of cell.querySelectorAll('input:checked')) {
        if (checkbox.getAttribute('disabled') === null) {
          (checkbox as HTMLInputElement).click();
          return;
        }
      }
    }
  }
}, 50);

const observer1 = WebPlatform_DOM_Element_Added_Observer_Class({
  selector: 'td',
});
observer1.subscribe(() => {
  scanPage();
});
