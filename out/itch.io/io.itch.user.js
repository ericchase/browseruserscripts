// ==UserScript==
// @name        itch.io: Test
// @author      ericchase, nazCodeland
// @namespace   ericchase
// @match       *://itch.io/*
// @version     1.0.0
// @description 5/5/2024, 7:21:16 PM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

// src/lib/ericchase/Platform/Web/DOM/MutationObserver/ElementAdded.ts
class ElementAddedObserver {
  constructor({
    source = document.documentElement,
    options = { subtree: true },
    selector,
    includeExistingElements = true
  }) {
    this.mutationObserver = new MutationObserver((mutationRecords) => {
      for (const record of mutationRecords) {
        if (record.target instanceof Element && record.target.matches(selector)) {
          this.send(record.target);
        }
        const treeWalker = document.createTreeWalker(record.target, NodeFilter.SHOW_ELEMENT);
        while (treeWalker.nextNode()) {
          if (treeWalker.currentNode.matches(selector)) {
            this.send(treeWalker.currentNode);
          }
        }
      }
    });
    this.mutationObserver.observe(source, {
      childList: true,
      subtree: options.subtree ?? true
    });
    if (includeExistingElements === true) {
      const treeWalker = document.createTreeWalker(document, NodeFilter.SHOW_ELEMENT);
      while (treeWalker.nextNode()) {
        if (treeWalker.currentNode.matches(selector)) {
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
      if (abort)
        return () => {};
    }
    return () => {
      this.subscriptionSet.delete(callback);
    };
  }
  mutationObserver;
  matchSet = new Set;
  subscriptionSet = new Set;
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

// src/lib/ericchase/Platform/Web/InjectCSS.ts
function InjectCSS(styles) {
  const stylesheet = new CSSStyleSheet;
  stylesheet.replaceSync(styles);
  document.adoptedStyleSheets.push(stylesheet);
  return stylesheet;
}

// src/lib/ericchase/Utility/Defer.ts
function Defer() {
  let resolve = (value) => {};
  let reject = (reason) => {};
  return {
    promise: new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    }),
    resolve,
    reject
  };
}

// src/lib/ericchase/Utility/Debounce.ts
function Debounce(fn, delay_ms) {
  let deferred = Defer();
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      try {
        await fn(...args);
        deferred.resolve();
      } catch (error) {
        deferred.reject(error);
      }
      deferred = Defer();
    }, delay_ms);
    return deferred.promise;
  };
}

// src/lib/ericchase/WebAPI/Node_Utility.ts
class CNodeRef {
  node;
  constructor(node) {
    if (node === null) {
      throw new ReferenceError("Reference is null.");
    }
    if (node === undefined) {
      throw new ReferenceError("Reference is undefined.");
    }
    this.node = node;
  }
  as(constructor_ref) {
    if (this.node instanceof constructor_ref)
      return this.node;
    throw new TypeError(`Reference node is not ${constructor_ref}`);
  }
  is(constructor_ref) {
    return this.node instanceof constructor_ref;
  }
  passAs(constructor_ref, fn) {
    if (this.node instanceof constructor_ref) {
      fn(this.node);
    }
  }
  tryAs(constructor_ref) {
    if (this.node instanceof constructor_ref) {
      return this.node;
    }
  }
  get classList() {
    return this.as(HTMLElement).classList;
  }
  get className() {
    return this.as(HTMLElement).className;
  }
  get style() {
    return this.as(HTMLElement).style;
  }
  getAttribute(qualifiedName) {
    return this.as(HTMLElement).getAttribute(qualifiedName);
  }
  setAttribute(qualifiedName, value) {
    this.as(HTMLElement).setAttribute(qualifiedName, value);
  }
  getStyleProperty(property) {
    return this.as(HTMLElement).style.getPropertyValue(property);
  }
  setStyleProperty(property, value, priority) {
    this.as(HTMLElement).style.setProperty(property, value, priority);
  }
}
function NodeRef(node) {
  return new CNodeRef(node);
}

// src/itch.io/assets/heart.css
var heart_default = `.heart-icon {
  cursor: pointer;
  user-select: none;
  width: calc(16em / 14);
  height: calc(16em / 14);
  margin-inline-end: 0.125em;
  vertical-align: bottom;
  stroke: none;
  fill: lightgray;
  &:hover {
    fill: gray;
  }
  &.toggled {
    fill: red;
  }
}
`;

// src/itch.io/assets/heart.svg
var heart_default2 = `<!--\r
Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part \r
of Feather (MIT). All other copyright (c) for Lucide are held by Lucide \r
Contributors 2022.\r
-->\r
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart">\r
  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />\r
</svg>\r
`;

// src/itch.io/provider/storage/local-storage-provider.ts
class LocalStorageProvider {
  set(key, value) {
    window.localStorage.setItem(key.toString(), JSON.stringify(value));
  }
  get(key) {
    const value = window.localStorage.getItem(key.toString()) ?? undefined;
    if (value !== undefined) {
      return JSON.parse(value);
    }
    return;
  }
}

// src/itch.io/io.itch.user.ts
InjectCSS(heart_default);
var storage = new LocalStorageProvider;
var favorites_set = new Set(storage.get("favorites") ?? undefined);
var parser = new DOMParser;
var processed_set = new Set;
var storeFavoritesSet = Debounce(() => {
  storage.set("favorites", [...favorites_set]);
}, 50);
new ElementAddedObserver({
  selector: "div.game_cell"
}).subscribe(async (element) => {
  if (element instanceof HTMLDivElement) {
    if (processed_set.has(element) === false) {
      processed_set.add(element);
      await processGameCell(element);
    }
  }
});
async function processGameCell(element) {
  const game_id = element.getAttribute("data-game_id") ?? undefined;
  if (game_id !== undefined) {
    const icon = createHeartIcon();
    icon.classList.add("heart-icon");
    if (favorites_set.has(game_id) === true) {
      icon.classList.add("toggled");
    }
    icon.addEventListener("click", () => {
      if (favorites_set.has(game_id) === true) {
        favorites_set.delete(game_id);
        icon.classList.remove("toggled");
      } else {
        favorites_set.add(game_id);
        icon.classList.add("toggled");
      }
      storeFavoritesSet();
    });
    NodeRef(element.querySelector("a.title")).tryAs(HTMLAnchorElement)?.before(icon);
  }
}
function createHeartIcon() {
  const svg = NodeRef(parser.parseFromString(heart_default2, "text/html").querySelector("svg")).as(SVGElement);
  svg.classList.add("heart-icon");
  return svg;
}
