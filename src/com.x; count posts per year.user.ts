// ==UserScript==
// @name        com.x; count posts per year
// @match       https://x.com/*
// @version     1.0.1
// @description 2026/03/08
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

import { WebPlatform_DOM_Element_Added_Observer_Class } from './lib/ericchase/WebPlatform_DOM_Element_Added_Observer_Class.js';

let post_count = 0;
let join_month = '';
let join_year = 0;

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
      post_count *= 1000000;
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
  //// google ai code
  const months_array = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const now_date = new Date();
  const month_index = months_array.indexOf(join_month.toLowerCase());
  if (month_index !== -1) {
    const old_total_months = join_year * 12 + month_index;
    const now_total_months = now_date.getFullYear() * 12 + now_date.getMonth();
    const difference_in_years = (now_total_months - old_total_months) / 12;
    //// back to human code
    const posts_per_year = post_count / difference_in_years;
    const floating_div = new DOMParser().parseFromString(`<div style="position: fixed; top: 0; right: 0; background-color: white">${posts_per_year.toFixed(0)} posts per year</div>`, 'text/html').body.firstChild;
    if (floating_div) {
      document.body.appendChild(floating_div);
    }
  }
}
