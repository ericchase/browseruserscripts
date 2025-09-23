// ==UserScript==
// @name        com.khinsider; generate album downloader
// @match       https://downloads.khinsider.com/game-soundtracks/album/*
// @version     1.0.1
// @description 2023/12/20
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

import { Core_Console_Error } from './lib/ericchase/Core_Console_Error.js';
import { Core_Console_Log } from './lib/ericchase/Core_Console_Log.js';
import { Core_String_Trim_BlockText } from './lib/ericchase/Core_String_Trim_BlockText.js';
import { Async_Core_Utility_Sleep } from './lib/ericchase/Core_Utility_Sleep.js';
import { WebPlatform_DOM_Element_Added_Observer_Class } from './lib/ericchase/WebPlatform_DOM_Element_Added_Observer_Class.js';
import { WebPlatform_NodeList_Reference_Class } from './lib/ericchase/WebPlatform_NodeList_Reference_Class.js';
import { WebPlatform_Utility_Download } from './lib/ericchase/WebPlatform_Utility_Download.js';
import { WebPlatform_Utility_Open_Window } from './lib/ericchase/WebPlatform_Utility_Open_Window.js';

type TrackDetails = { albumName: string; trackName: string; uris: string[] };

async function main() {
  const trackList: TrackDetails[] = [];
  const jobQueue = new JobQueue<TrackDetails>(1000);
  jobQueue.subscribe((trackDetails, error) => {
    if (error) {
      Core_Console_Error(error);
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

function getSongUris(anchorSong: HTMLAnchorElement) {
  return new Promise<TrackDetails>((resolve, reject) => {
    WebPlatform_Utility_Open_Window(anchorSong.href, async (proxy) => {
      try {
        let albumName = '';
        let trackName = '';
        const uris: string[] = [];

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
          // @ts-ignore
          if (element?.parentElement?.href) {
            // @ts-ignore
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

function generateDownloaderScript(trackList: TrackDetails[]) {
  const albumMap = new Map<string, TrackDetails[]>();
  for (const details of trackList) {
    if (!albumMap.has(details.albumName)) {
      albumMap.set(details.albumName, []);
    }
    const albumGroup = albumMap.get(details.albumName) ?? [];
    albumGroup.push(details);
  }
  for (const [albumName, trackList] of albumMap) {
    const text = `
      import { mkdir } from 'node:fs/promises';
      import { resolve } from 'node:path';

      export function Sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(() => resolve(), ms));
      }

      type TrackDetails = { albumName: string; trackName: string; uris: string[] };

      const trackList: TrackDetails[] = JSON.parse(\`${JSON.stringify(trackList)}\`);
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

// this needs to be rewritten
type JobQueue_SubscriptionCallback<Result, Tag> = (result?: Result, error?: Error, tag?: Tag) => { abort: boolean } | void;

class JobQueue<Result = void, Tag = void> {
  /**
   * 0: No delay. -1: Consecutive.
   */
  constructor(public delay_ms: number) {}
  /**
   * ! Watch out for circular calls !
   *
   * Sets the `aborted` state and resolves when currently running jobs finish.
   */
  public async abort() {
    this.aborted = true;
    await this.done;
  }
  public add(fn: () => Promise<Result>, tag?: Tag) {
    if (this.aborted === false) {
      this.queue.push({ fn, tag });
      if (this.running === false) {
        this.running = true;
        this.run();
      }
    }
  }
  /**
   * Returns a promise that resolves when jobs finish.
   */
  public get done() {
    return new Promise<void>((resolve) => {
      this.runningCount.subscribe((count) => {
        if (count === 0) resolve();
      });
    });
  }
  /**
   * Resets the JobQueue to an initial state, keeping subscriptions alive.
   *
   * @throws If called when jobs are currently running.
   */
  public async reset() {
    if (this.running === true || (await this.runningCount.get()) > 0) {
      throw 'Warning: Wait for running jobs to finish before calling reset. `await JobQueue.done;`';
    }
    this.aborted = false;
    this.completionCount = 0;
    this.queue.length = 0;
    this.queueIndex = 0;
    this.results.length = 0;
  }
  public subscribe(callback: JobQueue_SubscriptionCallback<Result, Tag>): () => void {
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
  protected aborted = false;
  protected completionCount = 0;
  protected queue: { fn: () => Promise<Result>; tag?: Tag }[] = [];
  protected queueIndex = 0;
  protected results: { value?: Result; error?: Error }[] = [];
  protected running = false;
  protected runningCount = new Store(0);
  protected subscriptionSet = new Set<JobQueue_SubscriptionCallback<Result, Tag>>();
  protected run() {
    if (this.aborted === false && this.queueIndex < this.queue.length) {
      const { fn, tag } = this.queue[this.queueIndex++];
      /* eslint-disable @typescript-eslint/no-floating-promises */
      (async () => {
        /* eslint-enable @typescript-eslint/no-floating-promises */
        this.runningCount.update((count) => {
          return count + 1;
        });
        try {
          const value = await fn();
          this.send({ value, tag });
        } catch (error: any) {
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
  protected send(result: { value?: Result; error?: Error; tag?: Tag }) {
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

class Store<Value> {
  protected currentValue: Value;
  protected subscriptionSet = new Set<Store_SubscriptionCallback<Value>>();
  constructor(
    protected initialValue: Value,
    protected notifyOnChangeOnly = false,
  ) {
    this.currentValue = initialValue;
  }
  subscribe(callback: Store_SubscriptionCallback<Value>): () => void {
    this.subscriptionSet.add(callback);
    const unsubscribe = () => {
      this.subscriptionSet.delete(callback);
    };
    callback(this.currentValue, unsubscribe);
    return unsubscribe;
  }
  get(): Promise<Value> {
    return new Promise<Value>((resolve) => {
      this.subscribe((value, unsubscribe) => {
        unsubscribe();
        resolve(value);
      });
    });
  }
  set(value: Value): void {
    if (this.notifyOnChangeOnly && this.currentValue === value) return;
    this.currentValue = value;
    for (const callback of this.subscriptionSet) {
      callback(value, () => {
        this.subscriptionSet.delete(callback);
      });
    }
  }
  update(callback: Store_UpdateCallback<Value>): void {
    this.set(callback(this.currentValue));
  }
}

type Store_SubscriptionCallback<Value> = (value: Value, unsubscribe: () => void) => void;
type Store_UpdateCallback<Value> = (value: Value) => Value;
