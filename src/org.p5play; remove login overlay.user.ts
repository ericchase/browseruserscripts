// ==UserScript==
// @name        org.p5play: remove login overlay
// @match       https://p5play.org/learn/*
// @version     1.0.0
// @description 2024/08/11, 1:40:56 PM
// @run-at      document-end
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

import { WebPlatform_DOM_Element_Added_Observer_Class } from './lib/ericchase/WebPlatform_DOM_Element_Added_Observer_Class.js';

WebPlatform_DOM_Element_Added_Observer_Class({
  selector: '.unauth',
}).subscribe((element) => {
  element.remove();
});

document.body.style.setProperty('overflow', 'unset');
