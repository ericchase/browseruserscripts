// ==UserScript==
// @name        com.khinsider; generate album downloader
// @match       https://downloads.khinsider.com/game-soundtracks/album/*
// @version     1.0.1
// @description 2023/12/20
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

// src/lib/ericchase/Core_Console_Log.ts
function Core_Console_Log(...items) {
  console['log'](...items);
}

// src/lib/ericchase/Core_JSON_Parse_Raw_String.ts
function Core_JSON_Parse_Raw_String(str) {
  return JSON.parse(`"${str}"`);
}

// src/lib/ericchase/Core_String_Get_Left_Margin_Size.ts
function Core_String_Get_Left_Margin_Size(text) {
  let i = 0;
  for (; i < text.length; i++) {
    if (text[i] !== ' ') {
      break;
    }
  }
  return i;
}

// src/lib/ericchase/Core_String_Line_Is_Only_WhiteSpace.ts
function Core_String_Line_Is_Only_WhiteSpace(line) {
  return /^\s*$/.test(line);
}

// src/lib/ericchase/Core_String_Split.ts
function Core_String_Split(text, delimiter, remove_empty_items = false) {
  const items = text.split(delimiter);
  if (remove_empty_items === true) {
    return items.filter((item) => item.length > 0);
  }
  return items;
}

// src/lib/ericchase/Core_String_Split_Lines.ts
function Core_String_Split_Lines(text, remove_empty_items = false) {
  return Core_String_Split(text, /\r?\n/, remove_empty_items);
}

// src/lib/ericchase/Core_String_Remove_WhiteSpace_Only_Lines_From_Top_And_Bottom.ts
function Core_String_Remove_WhiteSpace_Only_Lines_From_Top_And_Bottom(text) {
  const lines = Core_String_Split_Lines(text);
  return lines.slice(
    lines.findIndex((line) => Core_String_Line_Is_Only_WhiteSpace(line) === false),
    1 + lines.findLastIndex((line) => Core_String_Line_Is_Only_WhiteSpace(line) === false),
  );
}

// src/lib/ericchase/Core_String_Trim_BlockText.ts
function Core_String_Trim_BlockText(text, options) {
  options ??= {};
  options.empty_lines_after_count ??= 0;
  options.empty_lines_before_count ??= 0;
  options.left_margin_size ??= 0;
  const nonwhitespace_lines = Core_String_Remove_WhiteSpace_Only_Lines_From_Top_And_Bottom(text);
  if (nonwhitespace_lines.length === 0) {
    return '';
  }
  const out = [];
  for (let i = 0; i < options.empty_lines_before_count; i++) {
    out.push('');
  }
  let left_trim_size = Core_String_Get_Left_Margin_Size(nonwhitespace_lines[0]);
  for (const line of nonwhitespace_lines.slice(1)) {
    if (Core_String_Line_Is_Only_WhiteSpace(line) === false) {
      left_trim_size = Math.min(left_trim_size, Core_String_Get_Left_Margin_Size(line));
    }
  }
  const left_margin_text = ' '.repeat(options.left_margin_size);
  for (const line of nonwhitespace_lines) {
    out.push(left_margin_text + line.slice(left_trim_size));
  }
  for (let i = 0; i < options.empty_lines_after_count; i++) {
    out.push('');
  }
  return out.join(Core_JSON_Parse_Raw_String(String.raw`\n`));
}

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

// src/lib/ericchase/WebPlatform_Node_Reference_Class.ts
class Class_WebPlatform_Node_Reference_Class {
  node;
  constructor(node) {
    this.node = node;
  }
  as(constructor_ref) {
    if (this.node instanceof constructor_ref) {
      return this.node;
    }
    throw new TypeError(`Reference node ${this.node} is not ${constructor_ref}`);
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
function WebPlatform_Node_Reference_Class(node) {
  return new Class_WebPlatform_Node_Reference_Class(node);
}

// src/lib/ericchase/WebPlatform_NodeList_Reference_Class.ts
class Class_WebPlatform_NodeList_Reference_Class extends Array {
  constructor(nodes) {
    super();
    for (const node of Array.from(nodes ?? [])) {
      try {
        this.push(WebPlatform_Node_Reference_Class(node));
      } catch (_) {}
    }
  }
  as(constructor_ref) {
    return this.filter((ref) => ref.is(constructor_ref)).map((ref) => ref.as(constructor_ref));
  }
  passEachAs(constructor_ref, fn) {
    for (const ref of this) {
      ref.passAs(constructor_ref, fn);
    }
  }
}
function WebPlatform_NodeList_Reference_Class(nodes) {
  return new Class_WebPlatform_NodeList_Reference_Class(nodes);
}

// src/lib/ericchase/WebPlatform_Utility_Download.ts
function WebPlatform_Utility_Download(data, filename) {
  const dataurl = (() => {
    if (data.blob !== undefined) {
      return URL.createObjectURL(data.blob);
    }
    if (data.bytes !== undefined) {
      return URL.createObjectURL(new Blob([data.bytes.slice()], { type: 'application/octet-stream;charset=utf-8' }));
    }
    if (data.json !== undefined) {
      return URL.createObjectURL(new Blob([data.json], { type: 'application/json;charset=utf-8' }));
    }
    if (data.text !== undefined) {
      return URL.createObjectURL(new Blob([data.text], { type: 'text/plain;charset=utf-8' }));
    }
    if (data.url !== undefined) {
      return data.url;
    }
  })();
  if (dataurl !== undefined) {
    const anchor = document.createElement('a');
    anchor.setAttribute('download', filename);
    anchor.setAttribute('href', dataurl);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }
}

// src/lib/ericchase/WebPlatform_Utility_Open_Window.ts
function WebPlatform_Utility_Open_Window(url, cb_load, cb_unload) {
  const proxy = window.open(url, '_blank');
  if (proxy) {
    if (cb_load) {
      proxy.addEventListener('load', (event) => {
        cb_load(proxy, event);
      });
    }
    if (cb_unload) {
      proxy.addEventListener('unload', (event) => {
        cb_unload(proxy, event);
      });
    }
  }
}

// src/com.khinsider; generate album downloader.user.ts
async function main() {
  const trackList = [];
  const jobQueue = new JobQueue(1000);
  jobQueue.subscribe((trackDetails, error) => {
    if (error) {
      console.log(error);
    }
    if (trackDetails) {
      trackList.push(trackDetails);
    }
  });
  WebPlatform_DOM_Element_Added_Observer_Class({
    selector: 'table#songlist',
  }).subscribe(async (tableSonglist) => {
    if (tableSonglist instanceof HTMLTableElement) {
      for (const atag_song of WebPlatform_NodeList_Reference_Class(tableSonglist.querySelectorAll('.playlistDownloadSong > a')).as(HTMLAnchorElement)) {
        jobQueue.add(() => getSongUris(atag_song));
      }
      await jobQueue.done;
      generateDownloaderScript(trackList);
    }
  });
}
function getSongUris(anchorSong) {
  return new Promise((resolve, reject) => {
    WebPlatform_Utility_Open_Window(anchorSong.href, async (proxy) => {
      try {
        let albumName = '';
        let trackName = '';
        const uris = [];
        WebPlatform_DOM_Element_Added_Observer_Class({
          selector: '#pageContent > p',
          source: proxy.document.documentElement,
        }).subscribe((element) => {
          const treeWalker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
          while (treeWalker.nextNode()) {
            if (treeWalker.currentNode.nodeValue?.trim() === 'Album name:') {
              if (treeWalker.nextNode()) {
                albumName = treeWalker.currentNode.nodeValue?.trim() ?? '';
                break;
              }
            }
          }
          while (treeWalker.nextNode()) {
            if (treeWalker.currentNode.nodeValue?.trim() === 'Song name:') {
              if (treeWalker.nextNode()) {
                trackName = treeWalker.currentNode.nodeValue?.trim() ?? '';
                break;
              }
            }
          }
        });
        WebPlatform_DOM_Element_Added_Observer_Class({
          selector: '.songDownloadLink',
          source: proxy.document.documentElement,
        }).subscribe((element) => {
          if (element?.parentElement?.href) {
            uris.push(element.parentElement.href);
          }
        });
        await Async_Core_Utility_Sleep(2000);
        proxy.close();
        return resolve({ albumName, trackName, uris });
      } catch (_) {
        return reject();
      }
    });
  });
}
function generateDownloaderScript(trackList) {
  const albumMap = new Map();
  for (const details of trackList) {
    if (!albumMap.has(details.albumName)) {
      albumMap.set(details.albumName, []);
    }
    const albumGroup = albumMap.get(details.albumName) ?? [];
    albumGroup.push(details);
  }
  for (const [albumName, trackList2] of albumMap) {
    const text = `
      import { mkdir } from 'node:fs/promises';
      import { resolve } from 'node:path';

      export function Sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(() => resolve(), ms));
      }

      type TrackDetails = { albumName: string; trackName: string; uris: string[] };

      const trackList: TrackDetails[] = JSON.parse(\`${JSON.stringify(trackList2)}\`);
      const albumName = \`${albumName}\`;

      console.log('Album:', albumName);
      const url = new URL(trackList[0].uris[0]);
      const segments = url.pathname.slice(1 + url.pathname.indexOf('/')).split('/');
      const albumpath = Bun.fileURLToPath(Bun.pathToFileURL(resolve(import.meta.dir + '/' + segments[1])));
      console.log('Create Directory:', albumpath);
      await mkdir(albumpath, { recursive: true });

      for (const { trackName, uris } of trackList) {
        for (const uri of uris) {
          console.log('Track:', trackName);
          const url = new URL(uri);
          const segments = url.pathname.slice(1 + url.pathname.indexOf('/')).split('/');
          const filepath = Bun.fileURLToPath(Bun.pathToFileURL(resolve(albumpath + '/' + segments[segments.length - 1])));
          const response = await fetch(uri);
          console.log('Write File:', filepath);
          await Bun.write(filepath, await response.blob());
          await Sleep(1000);
        }
      }
    `;
    WebPlatform_Utility_Download({ text: Core_String_Trim_BlockText(text) }, `download_${albumName}.ts`);
  }
}
main();

class JobQueue {
  delay_ms;
  constructor(delay_ms) {
    this.delay_ms = delay_ms;
  }
  async abort() {
    this.aborted = true;
    await this.done;
  }
  add(fn, tag) {
    if (this.aborted === false) {
      this.queue.push({ fn, tag });
      if (this.running === false) {
        this.running = true;
        this.run();
      }
    }
  }
  get done() {
    return new Promise((resolve) => {
      this.runningCount.subscribe((count) => {
        if (count === 0) resolve();
      });
    });
  }
  async reset() {
    if (this.running === true || (await this.runningCount.get()) > 0) {
      throw 'Warning: Wait for running jobs to finish before calling reset. `await JobQueue.done;`';
    }
    this.aborted = false;
    this.completionCount = 0;
    this.queue.length = 0;
    this.queueIndex = 0;
    this.results.length = 0;
  }
  subscribe(callback) {
    this.subscriptionSet.add(callback);
    for (const result of this.results) {
      if (callback(result.value, result.error)?.abort === true) {
        this.subscriptionSet.delete(callback);
        return () => {};
      }
    }
    return () => {
      this.subscriptionSet.delete(callback);
    };
  }
  aborted = false;
  completionCount = 0;
  queue = [];
  queueIndex = 0;
  results = [];
  running = false;
  runningCount = new Store(0);
  subscriptionSet = new Set();
  run() {
    if (this.aborted === false && this.queueIndex < this.queue.length) {
      const { fn, tag } = this.queue[this.queueIndex++];
      (async () => {
        this.runningCount.update((count) => {
          return count + 1;
        });
        try {
          const value = await fn();
          this.send({ value, tag });
        } catch (error) {
          Core_Console_Log(error);
          this.send({ error, tag });
        }
        this.runningCount.update((count) => {
          return count - 1;
        });
        if (this.delay_ms < 0) {
          this.run();
        }
      })();
      if (this.delay_ms >= 0) {
        setTimeout(() => this.run(), this.delay_ms);
      }
    } else {
      this.running = false;
    }
  }
  send(result) {
    if (this.aborted === false) {
      this.completionCount++;
      this.results.push(result);
      for (const callback of this.subscriptionSet) {
        if (callback(result.value, result.error, result.tag)?.abort === true) {
          this.subscriptionSet.delete(callback);
        }
      }
    }
  }
}

class Store {
  initialValue;
  notifyOnChangeOnly;
  currentValue;
  subscriptionSet = new Set();
  constructor(initialValue, notifyOnChangeOnly = false) {
    this.initialValue = initialValue;
    this.notifyOnChangeOnly = notifyOnChangeOnly;
    this.currentValue = initialValue;
  }
  subscribe(callback) {
    this.subscriptionSet.add(callback);
    const unsubscribe = () => {
      this.subscriptionSet.delete(callback);
    };
    callback(this.currentValue, unsubscribe);
    return unsubscribe;
  }
  get() {
    return new Promise((resolve) => {
      this.subscribe((value, unsubscribe) => {
        unsubscribe();
        resolve(value);
      });
    });
  }
  set(value) {
    if (this.notifyOnChangeOnly && this.currentValue === value) return;
    this.currentValue = value;
    for (const callback of this.subscriptionSet) {
      callback(value, () => {
        this.subscriptionSet.delete(callback);
      });
    }
  }
  update(callback) {
    this.set(callback(this.currentValue));
  }
}
