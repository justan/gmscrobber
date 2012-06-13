// ==UserScript==
// @name        QQ音乐 online scrobbler
// @namespace   http://gmscrobber.whosemind.net
// @description 记录qq在线音乐到 last.fm
// @match       http://y.qq.com/*
// @exclude     http://y.qq.com/y/static/index.html
// @require     https://raw.github.com/justan/gmscrobber/master/simple_scrobbler_user.js
// @version     0.0.1
// ==/UserScript==

var init = function(){
  log('init');
  qmusicWatch();
};

var scrobber = new Scrobbler({
  name: 'QQ 音乐',
  ready: init
});

var qmusicWatch = function(){
  var fn = function(){
    setInterval(function(){
      var song = getSongInfo()
      log(JSON.stringify(song));
    }, 2000);
  };
  var getSongInfo = function(){
    var song = {};
    var songinfo = document.getElementById('divsonginfo');
    song.title = songinfo.getElementsByClassName('music_name')[0].title;
    song.artist = songinfo.getElementsByClassName('singer_name')[0].title;
    song.duration = document.getElementById('ptime').innerHTML;
    song.album = songinfo.getElementsByClassName('album_pic')[0].title;
    return song;
  };
  return fn;
}();