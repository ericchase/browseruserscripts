// ==UserScript==
// @name        com.x; count posts per year
// @match       https://x.com/*
// @version     1.0.1
// @description 2026/03/08
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

// src/com.x; count posts per year.user.ts
var post_count = 0;
var join_month = '';
var join_year = 0;
WebPlatform_DOM_Element_Added_Observer_Class({
  selector: 'h2[role="heading"] + div',
}).subscribe((element, unsubscribe) => {
  const [value, posts] = element.textContent.split(' ');
  if (posts === 'posts') {
    unsubscribe();
    post_count = Number.parseFloat(value.replaceAll(',', ''));
    if (value.endsWith('K')) {
      post_count *= 1000;
    } else if (value.endsWith('M')) {
      post_count *= 1e6;
    }
    if (join_year !== 0) {
      DisplayPostsPerYear();
    }
  }
});
WebPlatform_DOM_Element_Added_Observer_Class({
  selector: 'a[role="none"] > span',
}).subscribe((element, unsubscribe) => {
  const [joined, month, year] = element.textContent.split(' ');
  if (joined === 'Joined') {
    unsubscribe();
    join_month = month;
    join_year = Number.parseInt(year);
    if (post_count !== 0) {
      DisplayPostsPerYear();
    }
  }
});
function DisplayPostsPerYear() {
  const months_array = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const now_date = new Date();
  const month_index = months_array.indexOf(join_month.toLowerCase());
  if (month_index !== -1) {
    const old_total_months = join_year * 12 + month_index;
    const now_total_months = now_date.getFullYear() * 12 + now_date.getMonth();
    const difference_in_years = (now_total_months - old_total_months) / 12;
    const posts_per_year = post_count / difference_in_years;
    const floating_div = new DOMParser().parseFromString(`<div style="position: fixed; top: 0; right: 0; background-color: white">${posts_per_year.toFixed(0)} posts per year</div>`, 'text/html').body.firstChild;
    if (floating_div) {
      document.body.appendChild(floating_div);
    }
  }
}
