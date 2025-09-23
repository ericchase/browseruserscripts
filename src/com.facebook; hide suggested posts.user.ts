// ==UserScript==
// @name        com.facebook; hide suggested posts
// @match       https://www.facebook.com/*
// @version     1.0.1
// @description 2025/09/08 - hide Reels, Your group suggestions, posts with Follow or Join buttons
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

import { WebPlatform_DOM_Element_Added_Observer_Class } from './lib/ericchase/WebPlatform_DOM_Element_Added_Observer_Class.js';

SetupNewsFeedObserver();

async function SetupNewsFeedObserver() {
  const newsfeed = await new Promise<Element>((resolve) => {
    const observer = WebPlatform_DOM_Element_Added_Observer_Class({
      selector: 'h3',
    });
    observer.subscribe((element) => {
      if (element.textContent === 'News Feed posts') {
        const newsfeed = element.parentElement?.querySelector('&>div:has(>div)');
        if (newsfeed) {
          observer.disconnect();
          resolve(newsfeed);
        }
      }
    });
  });
  const i_observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          i_observer.unobserve(entry.target);
          SetupPostObserver(entry.target);
        }
      }
    },
    {
      root: null, // viewport
      rootMargin: '0px',
      threshold: 0.25,
    },
  );
  const m_observer = WebPlatform_DOM_Element_Added_Observer_Class({
    selector: 'div',
    options: {
      subtree: false,
    },
    source: newsfeed,
  });
  m_observer.subscribe((element) => {
    i_observer.observe(element);
  });
}

async function SetupPostObserver(post: Element) {
  const m_observer_1 = WebPlatform_DOM_Element_Added_Observer_Class({
    selector: 'div[role="button"]>span',
    source: post,
  });
  const m_observer_2 = WebPlatform_DOM_Element_Added_Observer_Class({
    selector: 'div.html-div div>span',
    source: post,
  });
  try {
    await new Promise<void>((resolve) => {
      m_observer_1.subscribe((element) => {
        const text = element.textContent.trim();
        // console.log('Observer 1:', `>${text}<`, element);
        if (text === 'Follow' || text === 'Join') {
          resolve();
        }
      });
      m_observer_2.subscribe((element) => {
        const text = element.textContent.trim();
        // console.log('Observer 2:', `>${text}<`, element);
        if (text === 'Reels' || text === 'Your group suggestions') {
          resolve();
        }
      });
    });
    m_observer_1.disconnect();
    m_observer_2.disconnect();
    ClosePost(post);
  } catch (error) {
    console.error(error);
  }
}

function ClosePost(post: Element) {
  // const m_observer = WebPlatform_DOM_Element_Added_Observer_Class({
  //   selector: 'a[aria-label="hide post"]',
  //   source: post,
  // });
  // m_observer.subscribe((element) => {
  //   if (element instanceof HTMLAnchorElement) {
  //     m_observer.disconnect();
  // console.log('Hiding:', post);
  // element.click();
  post.remove();
  //   }
  // });
}
