// ==UserScript==
// @name        com.facebook; hide suggested posts
// @match       https://www.facebook.com/*
// @version     1.0.0
// @description 2025-09-08
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

import { WebPlatform_DOM_Element_Added_Observer_Class } from './lib/ericchase/WebPlatform_DOM_Element_Added_Observer_Class.js';

(async () => {
  const el_newsfeed = await WaitForNewsFeedSection();
  SetupNewsFeedObserver(el_newsfeed);
})();

async function WaitForNewsFeedSection(): Promise<Element> {
  return new Promise<Element>((resolve) => {
    const mutation_observer = WebPlatform_DOM_Element_Added_Observer_Class({
      selector: 'h3',
    });
    mutation_observer.subscribe((element) => {
      // console.log('<h3>', element.textContent, element);
      if (element.textContent === 'News Feed posts') {
        if (element.parentElement) {
          const el_newsfeed = element.parentElement.querySelector('&>div:has(>div)');
          if (el_newsfeed) {
            // console.log('<div>', 'News Feed', el_newsfeed);
            mutation_observer.disconnect();
            resolve(el_newsfeed);
          }
        }
      }
    });
  });
}

function SetupNewsFeedObserver(el_newsfeed: Element) {
  const intersection_observer = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          SetupPostObserver(entry.target);
        }
      }
    },
    {
      root: el_newsfeed,
      rootMargin: '0px',
      threshold: 0.25,
    },
  );

  const mutation_observer = WebPlatform_DOM_Element_Added_Observer_Class({
    selector: 'div',
    options: {
      subtree: false,
    },
    source: el_newsfeed,
  });
  mutation_observer.subscribe((element) => {
    // console.log('<div>', 'Post', element);
    intersection_observer.observe(element);
  });
}

function SetupPostObserver(el_post: Element) {
  const mutation_observer = WebPlatform_DOM_Element_Added_Observer_Class({
    selector: 'h4 div[role="button"]>span',
    source: el_post,
  });
  mutation_observer.subscribe((element) => {
    // console.log('<span>', element.textContent, element);
    if (element.textContent === 'Follow' || element.textContent === 'Join') {
      mutation_observer.disconnect();
      ClosePost(el_post);
    }
  });
}

function ClosePost(el_post: Element) {
  const mutation_observer = WebPlatform_DOM_Element_Added_Observer_Class({
    selector: 'a[aria-label="hide post"]',
    source: el_post,
  });
  mutation_observer.subscribe((element) => {
    if (element instanceof HTMLAnchorElement) {
      mutation_observer.disconnect();
      // console.log('<a>', '[aria-label="hide post"]', element);
      element.click();
      // console.log('CLOSE POST', el_post);
    }
  });
}
