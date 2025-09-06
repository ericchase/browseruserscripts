// ==UserScript==
// @name        com.instagram; auto-adjust volume
// @match       *://*.instagram.com/*
// @version     1.0.0
// @description 2025-09-05
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

// src/com.instagram; auto-adjust volume.user.ts
WebPlatform_DOM_Element_Added_Observer_Class({
  selector: 'video',
}).subscribe((element) => {
  element.addEventListener('play', adjustVolume);
  element.addEventListener('playing', adjustVolume);
  element.addEventListener('volumechange', adjustVolume);
});
function adjustVolume(event) {
  if (event.currentTarget instanceof HTMLVideoElement) {
    if (event.currentTarget.muted !== false) {
      event.currentTarget.muted = false;
    }
    if (event.currentTarget.volume !== 0.1) {
      event.currentTarget.volume = 0.1;
    }
  }
}
