// ==UserScript==
// @name        com.facebook; hide suggested posts
// @match       https://www.facebook.com/*
// @version     1.0.0
// @description 2025-09-08
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

// src/lib/ericchase/WebPlatform_DOM_Element_Added_Observer_Class.ts
class Class_WebPlatform_DOM_Element_Added_Observer_Class {
  config;
  $match_set = new Set();
  $mutation_observer;
  $subscription_set = new Set();
  constructor(config) {
    this.config = {
      include_existing_elements: config.include_existing_elements ?? true,
      options: {
        subtree: config.options?.subtree ?? true,
      },
      selector: config.selector,
      source: config.source ?? document.documentElement,
    };
    this.$mutation_observer = new MutationObserver((mutationRecords) => {
      const sent_set = new Set();
      for (const record of mutationRecords) {
        for (const node of record.addedNodes) {
          const tree_walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT);
          const processCurrentNode = () => {
            if (sent_set.has(tree_walker.currentNode) === false) {
              if (tree_walker.currentNode instanceof Element && tree_walker.currentNode.matches(this.config.selector) === true) {
                this.$send(tree_walker.currentNode);
                sent_set.add(tree_walker.currentNode);
              }
            }
          };
          processCurrentNode();
          if (this.config.options.subtree === true) {
            while (tree_walker.nextNode()) {
              processCurrentNode();
            }
          }
        }
      }
    });
    this.$mutation_observer.observe(this.config.source, {
      childList: true,
      subtree: this.config.options.subtree,
    });
    if (this.config.include_existing_elements === true) {
      const sent_set = new Set();
      const tree_walker = document.createTreeWalker(this.config.source, NodeFilter.SHOW_ELEMENT);
      const processCurrentNode = () => {
        if (sent_set.has(tree_walker.currentNode) === false) {
          if (tree_walker.currentNode instanceof Element && tree_walker.currentNode.matches(this.config.selector) === true) {
            this.$send(tree_walker.currentNode);
            sent_set.add(tree_walker.currentNode);
          }
        }
      };
      processCurrentNode();
      if (this.config.options.subtree === true) {
        while (tree_walker.nextNode()) {
          processCurrentNode();
        }
      }
    }
  }
  disconnect() {
    this.$mutation_observer.disconnect();
    for (const callback of this.$subscription_set) {
      this.$subscription_set.delete(callback);
    }
  }
  subscribe(callback) {
    this.$subscription_set.add(callback);
    let abort = false;
    for (const element of this.$match_set) {
      callback(element, () => {
        this.$subscription_set.delete(callback);
        abort = true;
      });
      if (abort) {
        return () => {};
      }
    }
    return () => {
      this.$subscription_set.delete(callback);
    };
  }
  $send(element) {
    this.$match_set.add(element);
    for (const callback of this.$subscription_set) {
      callback(element, () => {
        this.$subscription_set.delete(callback);
      });
    }
  }
}
function WebPlatform_DOM_Element_Added_Observer_Class(config) {
  return new Class_WebPlatform_DOM_Element_Added_Observer_Class(config);
}

// src/com.facebook; hide suggested posts.user.ts
(async () => {
  const el_newsfeed = await WaitForNewsFeedSection();
  SetupNewsFeedObserver(el_newsfeed);
})();
async function WaitForNewsFeedSection() {
  return new Promise((resolve) => {
    const mutation_observer = WebPlatform_DOM_Element_Added_Observer_Class({
      selector: 'h3',
    });
    mutation_observer.subscribe((element) => {
      if (element.textContent === 'News Feed posts') {
        if (element.parentElement) {
          const el_newsfeed = element.parentElement.querySelector('&>div:has(>div)');
          if (el_newsfeed) {
            mutation_observer.disconnect();
            resolve(el_newsfeed);
          }
        }
      }
    });
  });
}
function SetupNewsFeedObserver(el_newsfeed) {
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
    intersection_observer.observe(element);
  });
}
function SetupPostObserver(el_post) {
  const mutation_observer = WebPlatform_DOM_Element_Added_Observer_Class({
    selector: 'h4 div[role="button"]>span',
    source: el_post,
  });
  mutation_observer.subscribe((element) => {
    if (element.textContent === 'Follow' || element.textContent === 'Join') {
      mutation_observer.disconnect();
      ClosePost(el_post);
    }
  });
}
function ClosePost(el_post) {
  const mutation_observer = WebPlatform_DOM_Element_Added_Observer_Class({
    selector: 'a[aria-label="hide post"]',
    source: el_post,
  });
  mutation_observer.subscribe((element) => {
    if (element instanceof HTMLAnchorElement) {
      mutation_observer.disconnect();
      element.click();
    }
  });
}
