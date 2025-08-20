// ==UserScript==
// @name        com.studiokhimera.uberquest; collect img urls
// @match       https://uberquest.studiokhimera.com/comic/page/*
// @version     1.0.0
// @description 2024/10/13, 5:44:12 PM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

// src/lib/ericchase/WebPlatform_DOM_Element_Added_Observer_Class.ts
class Class_WebPlatform_DOM_Element_Added_Observer_Class {
  constructor(config) {
    config.options ??= {};
    this.mutationObserver = new MutationObserver((mutationRecords) => {
      for (const record of mutationRecords) {
        if (record.target instanceof Element && record.target.matches(config.selector)) {
          this.send(record.target);
        }
        const treeWalker = document.createTreeWalker(record.target, NodeFilter.SHOW_ELEMENT);
        while (treeWalker.nextNode()) {
          if (treeWalker.currentNode.matches(config.selector)) {
            this.send(treeWalker.currentNode);
          }
        }
      }
    });
    this.mutationObserver.observe(config.source ?? document.documentElement, {
      childList: true,
      subtree: config.options.subtree ?? true,
    });
    if ((config.include_existing_elements ?? true) === true) {
      const treeWalker = document.createTreeWalker(document, NodeFilter.SHOW_ELEMENT);
      while (treeWalker.nextNode()) {
        if (treeWalker.currentNode.matches(config.selector)) {
          this.send(treeWalker.currentNode);
        }
      }
    }
  }
  disconnect() {
    this.mutationObserver.disconnect();
    for (const callback of this.subscriptionSet) {
      this.subscriptionSet.delete(callback);
    }
  }
  subscribe(callback) {
    this.subscriptionSet.add(callback);
    let abort = false;
    for (const element of this.matchSet) {
      callback(element, () => {
        this.subscriptionSet.delete(callback);
        abort = true;
      });
      if (abort) return () => {};
    }
    return () => {
      this.subscriptionSet.delete(callback);
    };
  }
  mutationObserver;
  matchSet = new Set();
  subscriptionSet = new Set();
  send(element) {
    if (!this.matchSet.has(element)) {
      this.matchSet.add(element);
      for (const callback of this.subscriptionSet) {
        callback(element, () => {
          this.subscriptionSet.delete(callback);
        });
      }
    }
  }
}
function WebPlatform_DOM_Element_Added_Observer_Class(config) {
  return new Class_WebPlatform_DOM_Element_Added_Observer_Class(config);
}

// src/com.studiokhimera.uberquest; collect img urls.user.ts
var url_set = new Set();
console.log(url_set);
WebPlatform_DOM_Element_Added_Observer_Class({ selector: 'a > img[src*="/next-hover.png"]' }).subscribe((next, unsubscribe) => {
  if (next instanceof HTMLImageElement) {
    unsubscribe();
    WebPlatform_DOM_Element_Added_Observer_Class({ selector: 'img' }).subscribe((element, unsubscribe2) => {
      if (element instanceof HTMLImageElement) {
        if (element.src.endsWith('.webp') && url_set.has(element.src) === false) {
          url_set.add(element.src);
        }
      }
    });
    setInterval(() => {
      next.click();
    }, 1000);
  }
});
