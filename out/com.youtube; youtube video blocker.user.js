// ==UserScript==
// @name        com.youtube: youtube video blocker
// @match       *://*.youtube.*/*
// @version     1.0.0
// @description 6/30/2025, 3:14:06 PM (https://addons.mozilla.org/en-US/firefox/addon/youtube-video-blocker/)
// @run-at      document-idle
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

// src/com.youtube; youtube video blocker.user.js
class Data {
  minViews = 1e4;
  maxDuration = 14;
  excludedChannels = [];
  blockedShelfs = [];
  includeVideoRecommendations = true;
  includeVideoWall = true;
  excludeStreams = false;
  excludeSubscriptions = false;
  blockMixes = false;
  blockPlaylists = false;
  blockNonSubscriptions = false;
  itemsPerRow = -1;
  shortsPerRow = -1;
  subscriptions = [];
}

class YouTubeVideoBlocker {
  subscriptionsUpdated = false;
  pageObserver = new MutationObserver((mList) => {
    for (let m of mList) {
      for (let node2 of m.addedNodes) {
        switch (node2.nodeName) {
          case "YTD-RICH-GRID-RENDERER":
            const browse = node2.closest("ytd-browse");
            if (browse && browse.hasAttribute("page-subtype") && (browse.getAttribute("page-subtype") == "home" || browse.getAttribute("page-subtype") == "subscriptions")) {
              this.setStyle(node2.querySelector("#contents"));
            }
            break;
          case "YTD-RICH-ITEM-RENDERER":
            if (node2.closest("ytd-browse") && node2.closest("ytd-browse").getAttribute("page-subtype") == "home") {
              this.blockVideo(node2);
            }
            break;
          case "DIV":
            if (node2.classList.contains("badge-style-type-members-only") || node2.classList.contains("badge-style-type-live-now-alternate")) {
              let video = node2.closest("ytd-rich-item-renderer");
              if (video) {
                this.blockVideo(video);
              }
            }
            break;
          case "YTD-COMPACT-VIDEO-RENDERER":
          case "YT-LOCKUP-VIEW-MODEL":
          case "YTD-COMPACT-RADIO-RENDERER":
            if (node2.closest("#secondary") && this.data.includeVideoRecommendations) {
              this.blockVideo(node2);
            }
            break;
          case "YTD-RICH-SECTION-RENDERER":
            this.blockSection(node2);
            this.setStyle(node2.querySelector("ytd-rich-shelf-renderer #dismissible"));
            break;
          case "YTD-COMPACT-PLAYLIST-RENDERER":
            if (this.data.blockPlaylists) {
              node2.style.display = "none";
              console.log(`Blocked playlist ${this.getVideoTitle(node2)}`);
            }
            break;
          case "YTD-GUIDE-ENTRY-RENDERER":
            const subscriptions = document.querySelector("ytd-guide-renderer #sections").children[1];
            if (subscriptions.contains(node2)) {
              const title = node2.querySelector("a").textContent.trim().toLowerCase();
              if (node2.parentElement.id == "expandable-items" && !this.subscriptionsUpdated) {
                this.data.subscriptions.clear();
                for (let subscription of subscriptions.querySelectorAll("ytd-guide-entry-renderer a")) {
                  const title2 = subscription.textContent.trim().toLowerCase();
                  this.data.subscriptions.add(title2);
                }
                this.subscriptionsUpdated = true;
              } else if (!this.data.subscriptions.has(title)) {
                this.data.subscriptions.add(title);
              }
            }
            break;
          case "A":
            if (node2.classList.contains("ytp-videowall-still") && this.data.includeVideoWall) {
              this.blockVideo(node2);
            }
            break;
        }
      }
    }
  });
  videoObserver = new MutationObserver((mList) => {
    for (let m of mList) {
      const node2 = m.target;
      const video = node2.closest("ytd-rich-item-renderer") || node2.closest("ytd-compact-video-renderer");
      this.blockVideo(video);
    }
  });
  constructor() {
    console.log("Loaded YouTube video blocker");
    this.data = new Data;
    this.data.excludedChannels = new Set(this.data.excludedChannels.map((channel) => {
      return channel.toLowerCase().trim();
    }));
    this.data.blockedShelfs = new Set(this.data.blockedShelfs.map((shelf) => {
      return shelf.toLowerCase().trim();
    }));
    this.data.subscriptions = new Set(this.data.subscriptions.map((subscription) => {
      return subscription.toLowerCase().trim();
    }));
    for (let video of document.querySelectorAll('ytd-browse[page-subtype="home"] ytd-rich-item-renderer')) {
      this.blockVideo(video);
    }
    for (let section of document.querySelectorAll('ytd-browse[page-subtype="home"] ytd-rich-section-renderer')) {
      this.blockSection(section);
    }
    for (let grid of document.querySelectorAll("ytd-rich-grid-renderer")) {
      let browse = grid.closest("ytd-browse");
      if (browse && browse.hasAttribute("page-subtype") && (browse.getAttribute("page-subtype") == "home" || browse.getAttribute("page-subtype") == "subscriptions")) {
        this.setStyle(node.querySelector("#contents"));
      }
    }
    this.pageObserver.observe(document.body, { childList: true, attributes: false, subtree: true });
  }
  isDisplayNone(element) {
    return !(element.offsetWidth || element.offsetHeight);
  }
  blockSection(section) {
    if (section.querySelector("#title-container")) {
      const name = section.querySelector("#title-container").textContent.toLowerCase().trim().split(`
`)[0].trim();
      if (this.data.blockedShelfs.has(name) || this.data.shortsPerRow == 0) {
        console.log(`Blocked section ${name}`);
        section.style.display = "none";
      }
    }
  }
  blockVideo(video) {
    if (!video) {
      return false;
    }
    this.videoObserver.observe(video, { attributes: true, subtree: true, attributeFilter: ["title"] });
    if (video.firstElementChild) {
      this.videoObserver.observe(video.firstElementChild, { childList: true, subtree: false, attributes: false });
    }
    const info = new VideoInfo(video);
    video.style.display = "";
    if (info.type != "ad") {
      const excludeSubscribed = this.data.excludeSubscriptions && info.isSubscription(this.data.subscriptions);
      const excludeLive = (info.type == "live" || info.type == "waiting") && this.data.excludeStreams;
      const excludeChannel = this.data.excludedChannels.has(info.channel);
      const blockNonSubscriptions = this.data.blockNonSubscriptions && (info.type == "video" || info.type == "waiting" || info.type == "live") && !info.isSubscription(this.data.subscriptions);
      const blockPlaylists = info.type == "playlist" && this.data.blockPlaylists;
      const blockMixes = info.type == "mix" && this.data.blockMixes;
      if (!excludeSubscribed && !excludeLive && !excludeChannel && info.views && info.views < this.data.minViews || this.data.maxDuration > 0 && (info.duration ?? 0) > this.data.maxDuration || blockNonSubscriptions || blockPlaylists || blockMixes) {
        console.log("blocked:", info);
        video.style.display = "none";
      } else {
        console.log("skipped:", info);
      }
    }
    if (info.type == "ad" && this.isDisplayNone(video.querySelector("ytd-ad-slot-renderer"))) {
      video.style.display = "none";
    }
    return video.style.display == "none";
  }
  setStyle(node2) {
    if (node2) {
      if (this.data.itemsPerRow > 0) {
        node2.style.setProperty("--ytd-rich-grid-items-per-row", this.data.itemsPerRow);
        node2.style.setProperty("--ytd-rich-grid-posts-per-row", this.data.itemsPerRow);
      }
      if (this.data.shortsPerRow > 0) {
        node2.style.setProperty("--ytd-rich-grid-slim-items-per-row", this.data.shortsPerRow);
        node2.style.setProperty("--ytd-rich-grid-game-cards-per-row", this.data.shortsPerRow);
        node2.style.setProperty("--ytd-rich-grid-mini-game-cards-per-row", this.data.shortsPerRow);
      }
    }
  }
}

class VideoInfo {
  title = "";
  views = 0;
  channel = "";
  type = "";
  duration = null;
  static floatRegex = /\d+\.?\d*/;
  static intRegex = /\d+/;
  static germanNumberRegex = /(,\d|\.\d{3})/;
  static mixedPunctuationRegex = /\d[\d,\.]*/;
  static numberExtRegex = /\d+.*$/;
  static yearRegex = /(year|yr|jahr|an|год|jaar|yıl|rok|年|년|سنة|سنو|साल|år|χρό|év|vuos|ani)/i;
  static monthRegex = /(month|mo|monat|moi|mes|mese|mês|меся|maand|ay|mies|月|달|شهر|مهي|måne|μήν|hóna|kuuk|lun)/i;
  static weekRegex = /(week)/i;
  static dayRegex = /(day)/i;
  static billionRegex = /\d\s*(b|mrd|md|mld)/i;
  static millionRegex = /\d\s*m(?!il)/i;
  static thousandRegex = /\d\s*(k|mil|tys|천)/i;
  static manRegex = /(万|만)/;
  static okuRegex = /(億|억)/;
  constructor(video, debug = false) {
    this.title = this._title(video);
    this.views = this._views(video);
    this.channel = this._channelName(video);
    this.type = this._type(video);
    this.duration = this._duration(video);
    if (debug) {
      this.debug(video);
    }
  }
  debug(video) {
    let color;
    switch (this.type) {
      case "live":
        color = "red";
        break;
      case "waiting":
        color = "lightgray";
        break;
      case "member_only":
        color = "green";
        break;
      case "video":
        color = "blue";
        break;
      case "shorts":
        color = "orange";
        break;
      case "playlist":
        color = "yellow";
        break;
      case "mix":
        color = "gray";
        break;
    }
    video.style.border = `1px solid ${color}`;
  }
  _title(video) {
    const title = video.querySelector("#video-title") || video.querySelector("span.ytp-videowall-still-info-title") || video.querySelector("h3");
    if (!title) {
      return "";
    }
    return title.textContent.toLowerCase().trim();
  }
  _channelName(video) {
    let channelName = video.querySelector("yt-content-metadata-view-model > div") || video.querySelector("ytd-video-meta-block #metadata #byline-container #text") || video.querySelector("ytd-channel-name");
    if (channelName) {
      channelName = channelName.textContent;
    } else {
      channelName = video.querySelector("span.ytp-videowall-still-info-author");
      if (!channelName) {
        return null;
      }
      channelName = channelName.textContent.split(" • ")[0];
    }
    return channelName.toLowerCase().trim();
  }
  _views(video) {
    let views = video.querySelector("ytd-video-meta-block #metadata #metadata-line span, ytm-shorts-lockup-view-model > div > div");
    if (views) {
      views = views.textContent.split(" ")[0];
    } else {
      views = video.querySelector("yt-content-metadata-view-model > div ~ div");
      if (views) {
        if (!VideoInfo.floatRegex.test(views.textContent) && !views.textContent.includes(" • ")) {
          return null;
        }
        views = views.textContent.split(" • ")[0];
      } else {
        views = video.querySelector("span.ytp-videowall-still-info-author");
        if (!views || views.textContent.split(" • ").length < 2) {
          return null;
        }
        views = views.textContent.split(" • ")[1];
      }
    }
    if (!VideoInfo.floatRegex.test(views)) {
      return 0;
    }
    let number = parseFloat(views.match(VideoInfo.floatRegex)[0]);
    if (VideoInfo.germanNumberRegex.test(views)) {
      number = parseFloat(views.match(VideoInfo.mixedPunctuationRegex)[0].replace(".", "").replace(",", "."));
    }
    if (VideoInfo.billionRegex.test(views)) {
      number *= 1e9;
    } else if (VideoInfo.millionRegex.test(views)) {
      number *= 1e6;
    } else if (VideoInfo.thousandRegex.test(views)) {
      number *= 1000;
    } else if (VideoInfo.manRegex.test(views)) {
      number *= 1e4;
    } else if (VideoInfo.okuRegex.test(views)) {
      number *= 1e8;
    }
    return number;
  }
  _duration(video) {
    if (!(this.type == "video" || this.type == "member_only")) {
      return null;
    }
    let duration = video.querySelector("ytd-video-meta-block #metadata #metadata-line span ~ span");
    if (!duration) {
      duration = video.querySelector("ytd-video-meta-block #metadata #metadata-line span");
      if (!duration) {
        duration = video.querySelector("yt-content-metadata-view-model > div ~ div");
        if (!duration) {
          return null;
        }
        duration = duration.textContent;
        if (duration.includes(" • ")) {
          duration = duration.split(" • ")[1];
        }
      } else {
        duration = duration.textContent;
      }
    } else {
      duration = duration.textContent;
    }
    if (!VideoInfo.intRegex.test(duration)) {
      return null;
    }
    duration = duration.match(VideoInfo.numberExtRegex)[0];
    let n = parseInt(duration.match(VideoInfo.intRegex)[0]);
    if (VideoInfo.yearRegex.test(duration)) {
      return n * 365;
    } else if (VideoInfo.monthRegex.test(duration)) {
      return n * 30;
    } else if (VideoInfo.weekRegex.test(duration)) {
      return n * 7;
    } else if (VideoInfo.dayRegex.test(duration)) {
      return n;
    } else {
      return 0;
    }
  }
  _isLive(video) {
    return video.querySelector("div.badge-style-type-live-now-alternate, ytd-thumbnail[is-live-video], badge-shape.badge-shape-wiz--thumbnail-live") !== null;
  }
  _isWaiting(video) {
    return video.querySelector("#meta #buttons ytd-toggle-button-renderer") !== null;
  }
  _isPlaylist(video) {
    return video.querySelector("yt-lockup-view-model yt-content-metadata-view-model > div ~ div a") != null;
  }
  _isMembersOnly(video) {
    return video.querySelector("div.badge-style-type-members-only, badge-shape.badge-shape-wiz--commerce") !== null;
  }
  _isShorts(video) {
    return video.querySelector("ytm-shorts-lockup-view-model") !== null;
  }
  _isAd(video) {
    return video.querySelector("ytd-ad-slot-renderer") !== null;
  }
  _type(video) {
    if (this._isLive(video)) {
      return "live";
    } else if (this._isWaiting(video)) {
      return "waiting";
    } else if (this._isMembersOnly(video)) {
      return "member_only";
    } else if (this._isPlaylist(video)) {
      return "playlist";
    } else if (this._isAd(video)) {
      return "ad";
    } else if (this.views !== null && this.channel !== null && this.channel.length > 0) {
      return "video";
    } else if (this.views !== null && this._isShorts(video)) {
      return "shorts";
    } else {
      return "mix";
    }
  }
  isSubscription(subscriptions) {
    if (!this.channel) {
      return false;
    }
    const name = this.channel.trim().toLowerCase();
    return subscriptions.has(name);
  }
}
new YouTubeVideoBlocker;
