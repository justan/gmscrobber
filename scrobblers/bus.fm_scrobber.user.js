// ==UserScript==
// @name        bus.fm scrobber
// @namespace   http://gmscrobber.whosemind.net
// @description 记录 bus.fm 到 last.fm
// @include     http://bus.fm/
// @include     http://bus.fm/#*
// @include     http://bus.fm/?*
// @require     https://raw.githubusercontent.com/justan/lrc/master/lrc.js
// @require     http://justan.github.io/gmscrobber/simple_scrobbler_user.js
// @version     0.1.1
// ==/UserScript==

var meta = uso.metaParse(GM_info.scriptMetaStr);

var scrobber = new Scrobbler({
  name: 'Bus.fm',
  ready: function () {
    log('初始化');
    scrobber.on('nowplaying', function(){
      scrobber.getInfo(scrobber.song, function(info){
        document.getElementById('s-title').title = '在 last.fm 中记录: ' + info.len + ' 次';
      });
    });
    scrobber.setSongInfoFN(getSongInfo);
  }
});

var getSongInfo = function() {
  return {
    title: getInfo('s-title')
  , artist: getInfo('s-artist')
  , album: getInfo('s-album')
  , playTime: uso.timeParse(getInfo('pt'))
  , duration: Math.round(uso.timeParse(getInfo('tt')) * 100 / parseInt(document.getElementsByClassName('j-seek-bar')[0].style.width, 10))
  };
};

var getInfo = function(id){
  return document.getElementById(id).innerHTML;
};