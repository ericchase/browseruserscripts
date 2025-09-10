// ==UserScript==
// @name        com.youtube; youtube video blocker
// @match       *://*.youtube.*/*
// @version     2.1.0
// @description 2025/08/30 (https://addons.mozilla.org/en-US/firefox/addon/youtube-video-blocker/)
// @run-at      document-idle
// @grant       GM_getValue
// @grant       GM_listValues
// @grant       GM_setValue
// @homepageURL https://github.com/ericchase/browseruserscripts
//
// CHANGELOG
//
// I am updating this script because I realized that it was completely broken
// from the original modifications I made. The subscriptions based code seemed
// a bit iffy (in fact, most of this code is iffy), so I removed everything
// related to subscriptions. The names of settings were a bit confusing, so I
// traced all the code and think I have figured out what each setting actually
// does. I renamed many of them to what I think makes more sense. Please keep
// in mind that this script heavily relies on query selectors which may easily
// break in the near future. I don't care enough about YouTube to fix
// everything whenever it breaks. If I notice that something I rely on is
// broken, then I'll try to fix it if I can.
//
// SETTINGS
//
// After installing the UserScript, open a fresh YouTube page to allow the code
// to set up default values for the settings. Afterwards, you can view and
// modify these values using your UserScript manager's dedicated page/screen
// for settings. Here are some notes:
//
// `channel_allowlist` and `channel_blocklist`
// - Each of these expect an array of strings `string[]`.
// - You must type the visible channel name that appears on video items, not
//   the @ account name that you would see in the url in address bar when
//   visiting the channel's page.
// - i.e.: ["Some Channel", "AnotherChannel"]
//
// `max_age`
// - Expects a positive number in days.
// - A value greater than 0 hides any videos that have been published for
//   longer than that many days.
// - Use 0 to disable this feature.
//
// `shorts_per_row` and `videos_per_row`
// - Expects a number from -1 to 10.
// - A value greater than 0 will grow or shrink the shorts items in order to
//   fit as many or as little items as you want on the shorts item grid.
// - Use 0 to (possibly) remove all shorts from the homepage or something.
// - Use -1 to disable this feature (I think).
//
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

// src/com.youtube; youtube video blocker.user.ts
setDefaultGMValue('channel_allowlist', []);
setDefaultGMValue('channel_blocklist', []);
setDefaultGMValue('hide_live_streams', false);
setDefaultGMValue('hide_mixes', false);
setDefaultGMValue('hide_movies', false);
setDefaultGMValue('hide_playlists', false);
setDefaultGMValue('hide_shorts', false);
setDefaultGMValue('max_age', 0);
setDefaultGMValue('min_views', 0);
setDefaultGMValue('scan_video_recommendations', true);
setDefaultGMValue('scan_video_wall', true);
setDefaultGMValue('shorts_per_row', -1);
setDefaultGMValue('videos_per_row', -1);

class YouTubeVideoBlocker {
  config;
  constructor() {
    const channel_allowlist = GM_getValue('channel_allowlist', []);
    const channel_blocklist = GM_getValue('channel_blocklist', []);
    this.config = {
      max_age: GM_getValue('max_age', 0),
      min_views: GM_getValue('min_views', 0),
      shorts_per_row: GM_getValue('shorts_per_row', -1),
      shorts_per_row_text: GM_getValue('shorts_per_row', -1).toString(10),
      videos_per_row: GM_getValue('videos_per_row', -1),
      videos_per_row_text: GM_getValue('videos_per_row', -1).toString(10),
      channel_allowlist: new Set(toLowerCase_trim_strings(channel_allowlist)),
      channel_blocklist: new Set(toLowerCase_trim_strings(channel_blocklist)),
      hide_live_streams: GM_getValue('hide_live_streams', false),
      hide_mixes: GM_getValue('hide_mixes', false),
      hide_movies: GM_getValue('hide_movies', false),
      hide_playlists: GM_getValue('hide_playlists', false),
      hide_shorts: GM_getValue('hide_shorts', false),
      scan_video_recommendations: GM_getValue('scan_video_recommendations', true),
      scan_video_wall: GM_getValue('scan_video_wall', true),
    };
  }
  blockSection(section) {
    const title_container = section.querySelector('#title-container');
    if (title_container) {
      if (this.config.shorts_per_row === 0) {
        console.log('blocked section:', section);
        section.style.display = 'none';
        return true;
      }
    }
    return false;
  }
  blockVideo(video) {
    const info = new VideoInfo(video);
    if (this.shouldBlock(video, info) === true) {
      video.style.display = 'none';
      return true;
    }
    console.log('skipped:', info);
    video.style.removeProperty('display');
    return false;
  }
  shouldBlock(video, info) {
    if (this.config.hide_movies === true) {
      if (info.type === 'movie') {
        console.log('blocked: (hide_movies)', info);
        return true;
      }
    }
    if (info.type === 'ad') {
      const element = video.querySelector('ytd-ad-slot-renderer');
      if (element instanceof HTMLElement) {
        if (element.offsetWidth === 0 || element.offsetHeight === 0) {
          console.log('blocked: (invisible ad)', info);
          return true;
        }
      }
      return false;
    }
    if (info.isInSet(this.config.channel_allowlist)) {
      return false;
    }
    if (info.isInSet(this.config.channel_blocklist)) {
      console.log('blocked: (channels.blocklist)', info);
      return true;
    }
    if (this.config.hide_live_streams === true) {
      if (info.type === 'live_stream' || info.type === 'waiting_for_live_stream') {
        console.log('blocked: (hide_live_streams)', info);
        return true;
      }
    }
    if (this.config.hide_mixes === true) {
      if (info.type === 'mix') {
        console.log('blocked: (hide_mixes)', info);
        return true;
      }
    }
    if (this.config.hide_playlists === true) {
      if (info.type === 'playlist') {
        console.log('blocked: (hide_playlists)', info);
        return true;
      }
    }
    if (this.config.hide_shorts === true) {
      if (info.type === 'shorts') {
        console.log('blocked: (hide_shorts)', info);
        return true;
      }
    }
    if (this.config.max_age > 0) {
      if (info.age && info.age > this.config.max_age) {
        console.log(`blocked: (age ${info.age} > ${this.config.max_age})`, info);
        return true;
      }
    }
    if (this.config.min_views > 0) {
      if (info.views && info.views < this.config.min_views) {
        console.log(`blocked: (views ${info.views} < ${this.config.min_views})`, info);
        return true;
      }
    }
    return false;
  }
  setStyle(element) {
    if (this.config.shorts_per_row > 0) {
      element.style.setProperty('--ytd-rich-grid-slim-items-per-row', this.config.shorts_per_row_text);
      element.style.setProperty('--ytd-rich-grid-game-cards-per-row', this.config.shorts_per_row_text);
      element.style.setProperty('--ytd-rich-grid-mini-game-cards-per-row', this.config.shorts_per_row_text);
    }
    if (this.config.videos_per_row > 0) {
      element.style.setProperty('--ytd-rich-grid-items-per-row', this.config.videos_per_row_text);
      element.style.setProperty('--ytd-rich-grid-posts-per-row', this.config.videos_per_row_text);
    }
  }
}

class VideoInfo {
  title;
  type;
  age;
  channel_name;
  views;
  static floatRegex = /\d+\.?\d*/;
  static intRegex = /\d+/;
  static germanNumberRegex = /(,\d|\.\d{3})/;
  static mixedPunctuationRegex = /\d[\d,\.]*/;
  static numberExtRegex = /\d+.*$/;
  static yearRegex = /(year|yr|jahr|an|год|jaar|yıl|rok|年|년|سنة|سنو|साल|år|χρό|év|vuos|ani)/i;
  static monthRegex = /(month|mo|monat|moi|mes|mese|mês|меся|maand|ay|mies|月|달|شهر|مهي|måne|μήν|hóna|kuuk|lun)/i;
  static billionRegex = /\d\s*(b|mrd|md|mld)/i;
  static millionRegex = /\d\s*m(?!il)/i;
  static thousandRegex = /\d\s*(k|mil|tys|천)/i;
  static manRegex = /(万|만)/;
  static okuRegex = /(億|억)/;
  static weekRegex = /(week)/i;
  static dayRegex = /(day)/i;
  constructor(video_or_url, debug = false) {
    const title = getVideoTitle(video_or_url);
    const channel_name = getVideoChannelName(video_or_url);
    const views = getVideoViewCount(video_or_url);
    const type = getVideoType(video_or_url, channel_name, views);
    const age = getVideoAge(video_or_url, type);
    this.title = title;
    this.channel_name = channel_name;
    this.views = views;
    this.type = type;
    this.age = age;
    if (debug) {
      this.debug(video_or_url);
    }
  }
  debug(video) {
    let color;
    switch (this.type) {
      case 'live_stream':
        color = 'red';
        break;
      case 'waiting_for_live_stream':
        color = 'lightgray';
        break;
      case 'member_only':
        color = 'green';
        break;
      case 'video':
        color = 'blue';
        break;
      case 'shorts':
        color = 'orange';
        break;
      case 'playlist':
        color = 'yellow';
        break;
      case 'mix':
        color = 'gray';
        break;
    }
    video.style.border = `1px solid ${color}`;
  }
  isInSet(set) {
    if (this.channel_name) {
      return set.has(this.channel_name.trim().toLowerCase());
    }
    return false;
  }
}
function getVideoAge(video, type) {
  if (type === 'video' || type === 'member_only') {
    let getAgeText = function () {
        {
          const element = video.querySelector('ytd-video-meta-block #metadata #metadata-line span ~ span');
          if (element) {
            return element.textContent;
          }
        }
        {
          const element = video.querySelector('ytd-video-meta-block #metadata #metadata-line span');
          if (element) {
            return element.textContent;
          }
        }
        {
          const element = video.querySelector('yt-content-metadata-view-model > div ~ div');
          if (element) {
            const parts = element.textContent.split(' • ');
            if (parts.length > 1) {
              return parts[1];
            }
          }
        }
        return '';
      },
      parseAgeText = function (text2) {
        if (VideoInfo.intRegex.test(text2)) {
          const matches_1 = text2.match(VideoInfo.numberExtRegex);
          if (matches_1 && matches_1.length > 0) {
            const matches_2 = matches_1[0].match(VideoInfo.intRegex);
            if (matches_2 && matches_2.length > 0) {
              return Number.parseInt(matches_2[0]);
            }
          }
        }
        return 0;
      };
    const text = getAgeText();
    const value = parseAgeText(text);
    if (VideoInfo.yearRegex.test(text)) {
      return value * 365;
    }
    if (VideoInfo.monthRegex.test(text)) {
      return value * 30;
    }
    if (VideoInfo.weekRegex.test(text)) {
      return value * 7;
    }
    if (VideoInfo.dayRegex.test(text)) {
      return value;
    }
    return 0;
  }
  return;
}
function getVideoChannelName(video) {
  {
    const element = video.querySelector('yt-content-metadata-view-model > div');
    if (element) {
      return element.textContent.toLowerCase().trim();
    }
  }
  {
    const element = video.querySelector('ytd-video-meta-block #metadata #byline-container #text');
    if (element) {
      return element.textContent.toLowerCase().trim();
    }
  }
  {
    const element = video.querySelector('ytd-channel-name');
    if (element) {
      return element.textContent.toLowerCase().trim();
    }
  }
  {
    const element = video.querySelector('span.ytp-videowall-still-info-author');
    if (element) {
      return element.textContent.split(' • ')[0].toLowerCase().trim();
    }
  }
  return;
}
function getVideoTitle(video) {
  const element = video.querySelector('#video-title') ?? video.querySelector('span.ytp-videowall-still-info-title') ?? video.querySelector('h3');
  return element?.textContent.toLowerCase().trim() ?? '';
}
function getVideoType(video, channel_name, view_count) {
  if (video.matches('ytd-compact-movie-renderer')) {
    return 'movie';
  }
  if (video.querySelector('div.badge-style-type-live-now-alternate, ytd-thumbnail[is-live-video], badge-shape.badge-shape-wiz--thumbnail-live')) {
    return 'live_stream';
  }
  if (video.querySelector('#meta #buttons ytd-toggle-button-renderer')) {
    return 'waiting_for_live_stream';
  }
  if (video.querySelector('div.badge-style-type-members-only, badge-shape.badge-shape-wiz--commerce')) {
    return 'member_only';
  }
  if (video.querySelector('yt-lockup-view-model yt-content-metadata-view-model > div ~ div a')) {
    return 'playlist';
  }
  if (video.querySelector('ytd-ad-slot-renderer')) {
    return 'ad';
  }
  if (view_count && channel_name && channel_name.length > 0) {
    return 'video';
  }
  if (view_count && video.querySelector('ytm-shorts-lockup-view-model')) {
    return 'shorts';
  }
  return 'mix';
}
function getVideoViewCount(video) {
  function getViewsText() {
    {
      const element = video.querySelector('ytd-video-meta-block #metadata #metadata-line span, ytm-shorts-lockup-view-model > div > div');
      if (element) {
        return element.textContent.split(' ')[0];
      }
    }
    {
      const element = video.querySelector('yt-content-metadata-view-model > div ~ div');
      if (element) {
        if (VideoInfo.floatRegex.test(element.textContent) === true && element.textContent.includes(' • ') === true) {
          return element.textContent.split(' • ')[0];
        }
      }
    }
    {
      const element = video.querySelector('span.ytp-videowall-still-info-author');
      if (element) {
        const parts = element.textContent.split(' • ');
        if (parts.length < 2) {
          return parts[1];
        }
      }
    }
    return '';
  }
  function parseViewsText(text2) {
    if (VideoInfo.floatRegex.test(text2)) {
      {
        const matches = text2.match(VideoInfo.floatRegex);
        if (matches && matches.length > 0) {
          return Number.parseFloat(matches[0]);
        }
      }
      if (VideoInfo.germanNumberRegex.test(text2) === true) {
        const matches = text2.match(VideoInfo.mixedPunctuationRegex);
        if (matches && matches.length > 0) {
          return Number.parseFloat(matches[0].replace('.', '').replace(',', '.'));
        }
      }
    }
    return 0;
  }
  const text = getViewsText();
  const value = parseViewsText(text);
  if (VideoInfo.billionRegex.test(text)) {
    return value * 1e9;
  }
  if (VideoInfo.millionRegex.test(text)) {
    return value * 1e6;
  }
  if (VideoInfo.thousandRegex.test(text)) {
    return value * 1000;
  }
  if (VideoInfo.manRegex.test(text)) {
    return value * 1e4;
  }
  if (VideoInfo.okuRegex.test(text)) {
    return value * 1e8;
  }
  return value;
}
function toLowerCase_trim_strings(arr) {
  const out = [];
  for (const item of arr) {
    if (typeof item === 'string') {
      out.push(item.toLowerCase().trim());
    }
  }
  return out;
}
function setDefaultGMValue(key, value) {
  if (GM_getValue(key, undefined) === undefined) {
    GM_setValue(key, value);
  }
}
var blocker = new YouTubeVideoBlocker();
WebPlatform_DOM_Element_Added_Observer_Class({
  selector: 'ytd-rich-grid-renderer',
  options: { subtree: true },
}).subscribe((element) => {
  const browse = element.closest('ytd-browse');
  if (browse) {
    const subtype = browse.getAttribute('page-subtype');
    if (subtype === 'home' || subtype === 'subscriptions') {
      const contents = element.querySelector('#contents');
      if (contents instanceof HTMLElement) {
        blocker.setStyle(contents);
      }
    }
  }
});
WebPlatform_DOM_Element_Added_Observer_Class({
  selector: 'ytd-rich-item-renderer',
  options: { subtree: true },
}).subscribe((element) => {
  if (element instanceof HTMLElement) {
    const browse = element.closest('ytd-browse');
    if (browse) {
      const subtype = browse.getAttribute('page-subtype');
      if (subtype === 'home') {
        blocker.blockVideo(element);
      }
    }
  }
});
WebPlatform_DOM_Element_Added_Observer_Class({
  selector: 'ytd-rich-section-renderer',
  options: { subtree: true },
}).subscribe((element) => {
  if (element instanceof HTMLElement) {
    blocker.blockSection(element);
    const match = element.querySelector('ytd-rich-shelf-renderer #dismissible');
    if (match instanceof HTMLElement) {
      blocker.setStyle(match);
    }
  }
});
WebPlatform_DOM_Element_Added_Observer_Class({
  selector: 'div.badge-style-type-members-only,div.badge-style-type-live-now-alternate',
  options: { subtree: true },
}).subscribe((element) => {
  if (element instanceof HTMLElement) {
    const video = element.closest('ytd-rich-item-renderer');
    if (video instanceof HTMLElement) {
      blocker.blockVideo(video);
    }
  }
});
if (blocker.config.hide_playlists === true) {
  WebPlatform_DOM_Element_Added_Observer_Class({
    selector: 'ytd-compact-playlist-renderer',
    options: { subtree: true },
  }).subscribe((element) => {
    if (element instanceof HTMLElement) {
      console.log('blocked: (hide_playlists)', element);
      element.style.display = 'none';
    }
  });
}
if (blocker.config.scan_video_recommendations === true) {
  WebPlatform_DOM_Element_Added_Observer_Class({
    selector: 'ytd-compact-video-renderer,yt-lockup-view-model,ytd-compact-radio-renderer,ytd-compact-movie-renderer',
    options: { subtree: true },
  }).subscribe((element) => {
    if (element instanceof HTMLElement) {
      if (element.closest('#secondary')) {
        blocker.blockVideo(element);
      }
    }
  });
}
if (blocker.config.scan_video_wall === true) {
  WebPlatform_DOM_Element_Added_Observer_Class({
    selector: 'a.ytp-videowall-still',
    options: { subtree: true },
  }).subscribe((element) => {
    if (element instanceof HTMLElement) {
      blocker.blockVideo(element);
    }
  });
}
