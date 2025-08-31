// ==UserScript==
// @name        com.youtube; youtube video blocker
// @match       *://*.youtube.*/*
// @version     1.0.0
// @description 2025/06/30, 3:14:06 PM (https://addons.mozilla.org/en-US/firefox/addon/youtube-video-blocker/)
// @run-at      document-idle
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

// hides videos within youtube.com that match the values below

class Data {
  minViews = 10000;

  /** duration in days */
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

  /**
    <option value="-1">Default</option>
    <option value="1">1</option>
    <option value="2">2</option>
    <option value="3">3</option>
    <option value="4">4</option>
    <option value="5">5</option>
    <option value="6">6</option>
    <option value="7">7</option>
    <option value="8">8</option>
    <option value="9">9</option>
    <option value="10">10</option>
   */
  itemsPerRow = -1;

  /**
    <option value="-1">Default</option>
    <option value="0">None</option>
    <option value="1">1</option>
    <option value="2">2</option>
    <option value="3">3</option>
    <option value="4">4</option>
    <option value="5">5</option>
    <option value="6">6</option>
    <option value="7">7</option>
    <option value="8">8</option>
    <option value="9">9</option>
    <option value="10">10</option>
   */
  shortsPerRow = -1;

  subscriptions = [];
}

class YouTubeVideoBlocker {
  subscriptionsUpdated = false;

  pageObserver = new MutationObserver((mList) => {
    for (let m of mList) {
      for (let node of m.addedNodes) {
        switch (node.nodeName) {
          case 'YTD-RICH-GRID-RENDERER':
            const browse = node.closest('ytd-browse');
            if (browse && browse.hasAttribute('page-subtype') && (browse.getAttribute('page-subtype') == 'home' || browse.getAttribute('page-subtype') == 'subscriptions')) {
              this.setStyle(node.querySelector('#contents'));
            }
            break;
          case 'YTD-RICH-ITEM-RENDERER':
            if (node.closest('ytd-browse') && node.closest('ytd-browse').getAttribute('page-subtype') == 'home') {
              // Home page
              this.blockVideo(node);
            }
            break;
          case 'DIV':
            // Video tags home page
            if (node.classList.contains('badge-style-type-members-only') || node.classList.contains('badge-style-type-live-now-alternate')) {
              let video = node.closest('ytd-rich-item-renderer');
              if (video) {
                this.blockVideo(video);
              }
            }
            break;
          case 'YTD-COMPACT-VIDEO-RENDERER':
          case 'YT-LOCKUP-VIEW-MODEL':
          case 'YTD-COMPACT-RADIO-RENDERER':
            if (node.closest('#secondary') && this.data.includeVideoRecommendations) {
              // Video player
              this.blockVideo(node);
            }
            break;
          case 'YTD-RICH-SECTION-RENDERER':
            this.blockSection(node);
            this.setStyle(node.querySelector('ytd-rich-shelf-renderer #dismissible'));
            break;
          case 'YTD-COMPACT-PLAYLIST-RENDERER':
            if (this.data.blockPlaylists) {
              node.style.display = 'none';
              console.log(`Blocked playlist ${this.getVideoTitle(node)}`);
            }
            break;
          case 'YTD-GUIDE-ENTRY-RENDERER':
            const subscriptions = document.querySelector('ytd-guide-renderer #sections').children[1];
            if (subscriptions.contains(node)) {
              const title = node.querySelector('a').textContent.trim().toLowerCase();

              // All loaded
              if (node.parentElement.id == 'expandable-items' && !this.subscriptionsUpdated) {
                this.data.subscriptions.clear();
                for (let subscription of subscriptions.querySelectorAll('ytd-guide-entry-renderer a')) {
                  const title = subscription.textContent.trim().toLowerCase();
                  this.data.subscriptions.add(title);
                }

                this.subscriptionsUpdated = true;
              } else if (!this.data.subscriptions.has(title)) {
                // Not all loaded
                this.data.subscriptions.add(title);
              }
            }
            break;
          case 'A':
            // Video recommendations
            if (node.classList.contains('ytp-videowall-still') && this.data.includeVideoWall) {
              this.blockVideo(node);
            }
            break;
        }
      }
    }
  });

  videoObserver = new MutationObserver((mList) => {
    for (let m of mList) {
      const node = m.target;
      const video = node.closest('ytd-rich-item-renderer') || node.closest('ytd-compact-video-renderer');
      this.blockVideo(video);
    }
  });

  constructor() {
    console.log('Loaded YouTube video blocker');

    this.data = new Data();

    this.data.excludedChannels = new Set(
      this.data.excludedChannels.map((channel) => {
        return channel.toLowerCase().trim();
      }),
    );
    this.data.blockedShelfs = new Set(
      this.data.blockedShelfs.map((shelf) => {
        return shelf.toLowerCase().trim();
      }),
    );
    this.data.subscriptions = new Set(
      this.data.subscriptions.map((subscription) => {
        return subscription.toLowerCase().trim();
      }),
    );

    // Block existing videos
    for (let video of document.querySelectorAll('ytd-browse[page-subtype="home"] ytd-rich-item-renderer')) {
      this.blockVideo(video);
    }

    // Block existing shelfs
    for (let section of document.querySelectorAll('ytd-browse[page-subtype="home"] ytd-rich-section-renderer')) {
      this.blockSection(section);
    }

    for (let grid of document.querySelectorAll('ytd-rich-grid-renderer')) {
      let browse = grid.closest('ytd-browse');
      if (browse && browse.hasAttribute('page-subtype') && (browse.getAttribute('page-subtype') == 'home' || browse.getAttribute('page-subtype') == 'subscriptions')) {
        this.setStyle(node.querySelector('#contents'));
      }
    }

    // Listener for not loaded videos and buttons
    this.pageObserver.observe(document.body, { childList: true, attributes: false, subtree: true });
  }

  /**
   * Element display is "none"
   * @param {HTMLElement} element HTMLElement
   * @returns Boolean if element display is "none"
   */
  isDisplayNone(element) {
    return !(element.offsetWidth || element.offsetHeight);
  }

  /**
   * Blocks YouTube shelf if it is set to be blocked
   * @param {HTMLElement} section YouTube shelf
   */
  blockSection(section) {
    if (section.querySelector('#title-container')) {
      const name = section.querySelector('#title-container').textContent.toLowerCase().trim().split('\n')[0].trim();
      if (this.data.blockedShelfs.has(name) || this.data.shortsPerRow == 0) {
        console.log(`Blocked section ${name}`);
        section.style.display = 'none';
      }
    }
  }

  /**
   * Blocks YouTube video
   * @param {HTMLElement} video YouTube video
   * @returns True if video was blocked
   */
  blockVideo(video) {
    if (!video) {
      return false;
    }

    // ytd-rich-item-renderer
    this.videoObserver.observe(video, { attributes: true, subtree: true, attributeFilter: ['title'] });

    // New version
    if (video.firstElementChild) {
      this.videoObserver.observe(video.firstElementChild, { childList: true, subtree: false, attributes: false });
    }

    const info = new VideoInfo(video);
    video.style.display = '';

    if (info.type != 'ad') {
      const excludeSubscribed = this.data.excludeSubscriptions && info.isSubscription(this.data.subscriptions);
      const excludeLive = (info.type == 'live' || info.type == 'waiting') && this.data.excludeStreams;
      const excludeChannel = this.data.excludedChannels.has(info.channel);
      const blockNonSubscriptions = this.data.blockNonSubscriptions && (info.type == 'video' || info.type == 'waiting' || info.type == 'live') && !info.isSubscription(this.data.subscriptions);
      const blockPlaylists = info.type == 'playlist' && this.data.blockPlaylists;
      const blockMixes = info.type == 'mix' && this.data.blockMixes;

      if (
        (!excludeSubscribed && !excludeLive && !excludeChannel && info.views && info.views < this.data.minViews) || //
        (this.data.maxDuration > 0 && (info.duration ?? 0) > this.data.maxDuration) ||
        blockNonSubscriptions ||
        blockPlaylists ||
        blockMixes
      ) {
        console.log('blocked:', info);
        // console.log({ '!excludeSubscribed': !excludeSubscribed, '!excludeLive': !excludeLive, '!excludeChannel': !excludeChannel, 'info.views': info.views, 'info.views < this.data.minViews': info.views < this.data.minViews, 'this.data.maxDuration': this.data.maxDuration, 'this.data.maxDuration > 0': this.data.maxDuration > 0, 'info.duration': info.duration, 'info.duration > this.data.maxDuration': info.duration > this.data.maxDuration, blockNonSubscriptions: blockNonSubscriptions, blockPlaylists: blockPlaylists, blockMixes: blockMixes });
        video.style.display = 'none';
      } else {
        console.log('skipped:', info);
      }
    }

    // Sets all invisible ad elements to be display: "none"
    if (info.type == 'ad' && this.isDisplayNone(video.querySelector('ytd-ad-slot-renderer'))) {
      video.style.display = 'none';
    }

    return video.style.display == 'none';
  }

  /**
   * Sets style of node for number of videos and shelfs
   * @param {HTMLElement} node element
   */
  setStyle(node) {
    if (node) {
      if (this.data.itemsPerRow > 0) {
        node.style.setProperty('--ytd-rich-grid-items-per-row', this.data.itemsPerRow);
        node.style.setProperty('--ytd-rich-grid-posts-per-row', this.data.itemsPerRow);
      }

      if (this.data.shortsPerRow > 0) {
        node.style.setProperty('--ytd-rich-grid-slim-items-per-row', this.data.shortsPerRow);
        node.style.setProperty('--ytd-rich-grid-game-cards-per-row', this.data.shortsPerRow);
        node.style.setProperty('--ytd-rich-grid-mini-game-cards-per-row', this.data.shortsPerRow);
      }
    }
  }
}

class VideoInfo {
  /**
   * @type {String}
   * Video title
   */
  title = '';
  /**
   * @type {Number|null}
   * Number of views of video, null of has no views
   */
  views = 0;
  /**
   * @type {String|null}
   * Channel name of video, null if has no channel name
   */
  channel = '';
  /**
   * Type of video
   * @type {String}
   */
  type = '';

  /**
   * Day duration since publication of video, null if no puplication date
   * @type {Number|null}
   */
  duration = null;

  /**
   * Regeular expression for testing for float
   * @type {RegExp}
   */
  static floatRegex = /\d+\.?\d*/;
  /**
   * Regular expression for testing for integer
   * @type {RegExp}
   */
  static intRegex = /\d+/;

  /**
   * Regular expression for testing if number mixes '.' and ','
   * @type {RegExp}
   */
  static germanNumberRegex = /(,\d|\.\d{3})/;
  /**
   * Regular expression for extracting number, but '.' and ',' may be mixed
   * @type {RegExp}
   */
  static mixedPunctuationRegex = /\d[\d,\.]*/;

  /**
   * Regular expression for extracting number and its extension
   * @type {RegExp}
   */
  static numberExtRegex = /\d+.*$/;

  /**
   * Regular expression for testing if string is year
   * @type {RegExp}
   */
  static yearRegex = /(year|yr|jahr|an|год|jaar|yıl|rok|年|년|سنة|سنو|साल|år|χρό|év|vuos|ani)/i;
  /**
   * Regular expression for testing if string is month
   * @type {RegExp}
   */
  static monthRegex = /(month|mo|monat|moi|mes|mese|mês|меся|maand|ay|mies|月|달|شهر|مهي|måne|μήν|hóna|kuuk|lun)/i;

  // non-english speakers: fix this yourself
  static weekRegex = /(week)/i;
  static dayRegex = /(day)/i;

  /**
   * Regular expression for testing if string is billion
   * @type {RegExp}
   */
  static billionRegex = /\d\s*(b|mrd|md|mld)/i;
  /**
   * Regular expression for testing if string is million, must be called after billionRegex
   * @type {RegExp}
   */
  static millionRegex = /\d\s*m(?!il)/i;
  /**
   * Regular expression for testing if string is thousand, must be called after millionRegex
   * @type {RegExp}
   */
  static thousandRegex = /\d\s*(k|mil|tys|천)/i;
  /**
   * Regular expression for testing if string is ten thousand
   */
  static manRegex = /(万|만)/;
  /**
   * Regular expression for testing if string is hundred million
   */
  static okuRegex = /(億|억)/;

  /**
   * @param {HTMLElement} video YouTube video or link
   */
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

  /**
   * Debugs video type
   * @param {HTMLElement} video YouTube video thumbnail
   */
  debug(video) {
    let color;
    switch (this.type) {
      case 'live':
        color = 'red';
        break;
      case 'waiting':
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

  /**
   * Title of YouTube video
   * @param {HTMLElement} video YouTube video thumbnail
   * @returns {String} Title of YouTube video
   */
  _title(video) {
    const title = video.querySelector('#video-title') || video.querySelector('span.ytp-videowall-still-info-title') || video.querySelector('h3');

    if (!title) {
      return '';
    }

    return title.textContent.toLowerCase().trim();
  }

  /**
   * Name of video channel
   * @param {HTMLElement} video YouTube video thumbnail
   * @returns {String} Channel name of YouTube video
   */
  _channelName(video) {
    let channelName = video.querySelector('yt-content-metadata-view-model > div') || video.querySelector('ytd-video-meta-block #metadata #byline-container #text') || video.querySelector('ytd-channel-name');

    if (channelName) {
      channelName = channelName.textContent;
    } else {
      channelName = video.querySelector('span.ytp-videowall-still-info-author');

      if (!channelName) {
        return null;
      }

      channelName = channelName.textContent.split(' • ')[0];
    }

    return channelName.toLowerCase().trim();
  }

  /**
   * Number of views or watching of a YouTube video
   * @param {HTMLElement} video YouTube video thumbnail
   * @returns {Number} Views or watching, or undefined if video is Mix of YouTube
   */
  _views(video) {
    let views = video.querySelector('ytd-video-meta-block #metadata #metadata-line span, ytm-shorts-lockup-view-model > div > div');

    if (views) {
      // Video home page
      views = views.textContent.split(' ')[0];
    } else {
      views = video.querySelector('yt-content-metadata-view-model > div ~ div');

      if (views) {
        // Video
        if (!VideoInfo.floatRegex.test(views.textContent) && !views.textContent.includes(' • ')) {
          return null;
        }
        views = views.textContent.split(' • ')[0];
      } else {
        views = video.querySelector('span.ytp-videowall-still-info-author');

        if (!views || views.textContent.split(' • ').length < 2) {
          return null;
        }

        views = views.textContent.split(' • ')[1];
      }
    }

    if (!VideoInfo.floatRegex.test(views)) {
      return 0;
    }

    let number = parseFloat(views.match(VideoInfo.floatRegex)[0]);
    if (VideoInfo.germanNumberRegex.test(views)) {
      number = parseFloat(views.match(VideoInfo.mixedPunctuationRegex)[0].replace('.', '').replace(',', '.'));
    }

    if (VideoInfo.billionRegex.test(views)) {
      number *= 1000000000;
    } else if (VideoInfo.millionRegex.test(views)) {
      number *= 1000000;
    } else if (VideoInfo.thousandRegex.test(views)) {
      number *= 1000;
    } else if (VideoInfo.manRegex.test(views)) {
      number *= 10000;
    } else if (VideoInfo.okuRegex.test(views)) {
      number *= 100000000;
    }

    return number;
  }

  /**
   * Number of months since publication of video
   * @param {HTMLElement} video YouTube video thumbnail
   * @returns {Number|null} Number of months since publication of video, null else
   */
  _duration(video) {
    if (!(this.type == 'video' || this.type == 'member_only')) {
      return null;
    }

    // YouTube home page
    let duration = video.querySelector('ytd-video-meta-block #metadata #metadata-line span ~ span');
    if (!duration) {
      // YouTube home page
      duration = video.querySelector('ytd-video-meta-block #metadata #metadata-line span');
      if (!duration) {
        // Video
        duration = video.querySelector('yt-content-metadata-view-model > div ~ div');
        if (!duration) {
          return null;
        }

        duration = duration.textContent;
        if (duration.includes(' • ')) {
          duration = duration.split(' • ')[1];
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

    // rough estimates
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

  /**
   * Live stream
   * @param {HTMLElement} video YouTube video thumbnail
   * @returns {Boolean} Video is live stream
   */
  _isLive(video) {
    return video.querySelector('div.badge-style-type-live-now-alternate, ytd-thumbnail[is-live-video], badge-shape.badge-shape-wiz--thumbnail-live') !== null;
  }

  /**
   * Notify live stream
   * @param {HTMLElement} video YouTube video thumbnail
   * @returns {Boolean} Waiting for live stream
   */
  _isWaiting(video) {
    return video.querySelector('#meta #buttons ytd-toggle-button-renderer') !== null;
  }

  /**
   * YouTube Playlist when new layout
   * @param {HTMLElement} video
   * @returns {Boolean} YouTube playlist
   */
  _isPlaylist(video) {
    return video.querySelector('yt-lockup-view-model yt-content-metadata-view-model > div ~ div a') != null;
  }

  /**
   * Members only
   * @param {HTMLELement} video YouTube video thumbnail
   * @returns {Boolean} Membery only video
   */
  _isMembersOnly(video) {
    return video.querySelector('div.badge-style-type-members-only, badge-shape.badge-shape-wiz--commerce') !== null;
  }

  /**
   * Shorts video
   * @param {HTMLElement} video YouTube video thumbnail
   * @returns {Boolean} Shorts video
   */
  _isShorts(video) {
    return video.querySelector('ytm-shorts-lockup-view-model') !== null;
  }

  /**
   * YouTube ad
   * @param {HTMLElement} video YouTube video thumbnail
   * @returns {Boolean} YouTube ad
   */
  _isAd(video) {
    return video.querySelector('ytd-ad-slot-renderer') !== null;
  }

  /**
   * Video thumbnail type
   * "live" if is live stream
   * "waiting" if waiting for live stream
   * "members_only" if members only YouTube video
   * "ad" if is YouTube ad
   * "mix" if is YouTube mix
   * "video" if is YouTube video
   * @param {HTMLElement} video YouTube video thumbnail
   * @returns {String} Video type of "live", "waiting", "members_only", "ad", "playlist", "mix" or "video"
   */
  _type(video) {
    if (this._isLive(video)) {
      return 'live';
    } else if (this._isWaiting(video)) {
      return 'waiting';
    } else if (this._isMembersOnly(video)) {
      return 'member_only';
    } else if (this._isPlaylist(video)) {
      return 'playlist';
    } else if (this._isAd(video)) {
      return 'ad';
    } else if (this.views !== null && this.channel !== null && this.channel.length > 0) {
      return 'video';
    } else if (this.views !== null && this._isShorts(video)) {
      return 'shorts';
    } else {
      return 'mix';
    }
  }

  /**
   * Video channel subscribed
   * @param {Array<String>} subscriptions List of subscribed channels
   * @returns {Boolean} Video channel subscribed or has no channel name
   */
  isSubscription(subscriptions) {
    if (!this.channel) {
      return false;
    }

    const name = this.channel.trim().toLowerCase();
    return subscriptions.has(name);
  }
}

new YouTubeVideoBlocker();
