// ==UserScript==
// @name        com.reddit; remove thread line events and stop video autoplay
// @match       *://*.reddit.*/*
// @version     1.0.1
// @description 2024/11/23, 12:47:12 AM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

import { Async_Core_Utility_Sleep } from './lib/ericchase/Core_Utility_Sleep.js';
import { WebPlatform_DOM_Element_Added_Observer_Class } from './lib/ericchase/WebPlatform_DOM_Element_Added_Observer_Class.js';
import { WebPlatform_Utility_Shadow_QuerySelector_Chain } from './lib/ericchase/WebPlatform_Utility_Shadow_QuerySelector_Chain.js';

const originalAttachShadow = Element.prototype.attachShadow;
Element.prototype.attachShadow = function (options) {
  const shadowRoot = originalAttachShadow.call(this, options);
  if (this.matches('shreddit-comment')) {
    processComment(this);
  } else if (this.matches('shreddit-player-2')) {
    processVideo(this);
  }
  return shadowRoot;
};

async function processComment(element: Element) {
  if (element.shadowRoot) {
    const shadowRoot = element.shadowRoot;

    // handle main thread line
    WebPlatform_DOM_Element_Added_Observer_Class({
      selector: 'div[data-testid="main-thread-line"]',
      source: shadowRoot,
    }).subscribe((thread, unsubscribe) => {
      unsubscribe();
      thread.parentElement?.addEventListener(
        'click',
        (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
          event.stopPropagation();
        },
        true,
      );
    });

    // handle curved thread line
    WebPlatform_DOM_Element_Added_Observer_Class({
      selector: 'div[data-testid="branch-line"]',
      source: shadowRoot,
    }).subscribe((thread, unsubscribe) => {
      unsubscribe();
      thread.addEventListener(
        'click',
        (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
          event.stopPropagation();
        },
        true,
      );
    });
  }
}

async function processVideo(element: Element) {
  if (element.shadowRoot) {
    const shadowRoot = element.shadowRoot;

    WebPlatform_DOM_Element_Added_Observer_Class({
      selector: 'video',
      source: shadowRoot,
    }).subscribe((video) => {
      console.log('found', video);
      video.addEventListener('play', playHandler);
    });
  }
}

function playHandler(event: Event) {
  if (event?.target instanceof HTMLVideoElement) {
    const video = event.target;
    video.removeEventListener('play', playHandler);
    const controls = WebPlatform_Utility_Shadow_QuerySelector_Chain(video.parentNode, 'shreddit-media-ui', '[aria-label="Toggle playback"]');
    setTimeout(async () => {
      for (let i = 0; i < 5; i++) {
        if (!video.paused) {
          if (controls instanceof HTMLButtonElement) {
            controls.click();
          } else {
            video.pause();
          }
        }
        Async_Core_Utility_Sleep(50);
      }
    }, 50);
  }

  // const controls = video.nextElementSibling?.shadowRoot?.querySelector('.controls');
  // if (controls instanceof HTMLElement) {
  //   controls.click();
  // }
}
