// ==UserScript==
// @name        com.vgmtreasurechest: Download Song
// @author      ericchase
// @namespace   ericchase
// @match       *://vgmtreasurechest.com/soundtracks/*
// @version     1.0.0
// @description 2024/08/09, 5:46:10 PM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

// src/lib/ericchase/Platform/Web/AnchorDownloader.ts
function anchor_downloader(data, filename) {
  const a = document.createElement("a");
  a.setAttribute("href", data);
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
function SaveUrl(url, filename) {
  anchor_downloader(url, filename);
}

// src/com.vgmtreasurechest.Download Song.user.ts
SaveUrl(location.href, new URL(location.href).pathname.split("/").at(-1) ?? "");
