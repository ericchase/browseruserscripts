// ==UserScript==
// @name        com.vgmtreasurechest; download song
// @match       *://vgmtreasurechest.com/soundtracks/*
// @version     1.0.1
// @description 2024/08/09, 5:46:10 PM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browseruserscripts
// ==/UserScript==

import { WebPlatform_Utility_Download } from './lib/ericchase/WebPlatform_Utility_Download.js';
WebPlatform_Utility_Download({ url: location.href }, new URL(location.href).pathname.split('/').at(-1) ?? '');
