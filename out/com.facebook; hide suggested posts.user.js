// ==UserScript==
// @name        com.facebook; hide suggested posts
// @match       https://www.facebook.com/*
// @version     1.0.0
// @description 2025/09/08 - hide Reels, Your group suggestions, posts with Follow or Join buttons
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
      if (this.config.options.subtree === true) {
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
        while (tree_walker.nextNode()) {
          processCurrentNode();
        }
      } else {
        for (const child of this.config.source.childNodes) {
          if (child instanceof Element && child.matches(this.config.selector) === true) {
            this.$send(child);
          }
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
SetupNewsFeedObserver();
async function SetupNewsFeedObserver() {
  const newsfeed = await new Promise((resolve) => {
    const observer = WebPlatform_DOM_Element_Added_Observer_Class({
      selector: 'h3',
    });
    observer.subscribe((element) => {
      if (element.textContent === 'News Feed posts') {
        const newsfeed2 = element.parentElement?.querySelector('&>div:has(>div)');
        if (newsfeed2) {
          observer.disconnect();
          resolve(newsfeed2);
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
      root: null,
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
async function SetupPostObserver(post) {
  const m_observer_1 = WebPlatform_DOM_Element_Added_Observer_Class({
    selector: 'div[role="button"]>span',
    source: post,
  });
  const m_observer_2 = WebPlatform_DOM_Element_Added_Observer_Class({
    selector: 'div.html-div div>span',
    source: post,
  });
  try {
    await new Promise((resolve) => {
      m_observer_1.subscribe((element) => {
        const text = element.textContent.trim();
        if (text === 'Follow' || text === 'Join') {
          resolve();
        }
      });
      m_observer_2.subscribe((element) => {
        const text = element.textContent.trim();
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
function ClosePost(post) {
  post.remove();
}
