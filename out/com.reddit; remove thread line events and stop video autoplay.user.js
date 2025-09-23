// ==UserScript==
// @name        com.reddit; remove thread line events and stop video autoplay
// @match       https://www.reddit.com/*
// @version     1.0.1
// @description 2024/11/23
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

// src/lib/ericchase/Core_Utility_Sleep.ts
function Async_Core_Utility_Sleep(duration_ms) {
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve();
    }, duration_ms),
  );
}

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

// src/lib/ericchase/WebPlatform_Utility_Shadow_QuerySelector_Chain.ts
function WebPlatform_Utility_Shadow_QuerySelector_Chain(source, ...selectors) {
  if (selectors.length > 0) {
    for (const selector of selectors) {
      if (source instanceof Document || source instanceof DocumentFragment || source instanceof ShadowRoot) {
        const match = source.querySelector(selector);
        if (match !== null) {
          source = match;
          continue;
        }
      } else if (source instanceof Element) {
        if (source.shadowRoot !== null) {
          const match2 = source.shadowRoot.querySelector(selector);
          if (match2 !== null) {
            source = match2;
            continue;
          }
        }
        const match = source.querySelector(selector);
        if (match !== null) {
          source = match;
          continue;
        }
      }
      return;
    }
    if (source instanceof Document || source instanceof DocumentFragment || source instanceof Element) {
      return source;
    }
  }
  return;
}

// src/com.reddit; remove thread line events and stop video autoplay.user.ts
var originalAttachShadow = Element.prototype.attachShadow;
Element.prototype.attachShadow = function (options) {
  const shadowRoot = originalAttachShadow.call(this, options);
  if (this.matches('shreddit-comment')) {
    processComment(this);
  } else if (this.matches('shreddit-player-2')) {
    processVideo(this);
  }
  return shadowRoot;
};
async function processComment(element) {
  if (element.shadowRoot) {
    const shadowRoot = element.shadowRoot;
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
async function processVideo(element) {
  if (element.shadowRoot) {
    const shadowRoot = element.shadowRoot;
    WebPlatform_DOM_Element_Added_Observer_Class({
      selector: 'video',
      source: shadowRoot,
    }).subscribe((video) => {
      video.addEventListener('play', playHandler);
    });
  }
}
function playHandler(event) {
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
}
