// ==UserScript==
// @name        QQ音乐 online scrobbler
// @namespace   http://gmscrobber.whosemind.net
// @description 记录qq在线音乐到 last.fm
// @match       http://y.qq.com/*
// @require     https://raw.github.com/justan/gmscrobber/master/simple_scrobbler_user.js
// @version     0.0.1
// ==/UserScript==

var init = function(){
  log('init');
};

var scrobber = new Scrobbler({
  name: 'QQ 音乐',
  ready: init
});