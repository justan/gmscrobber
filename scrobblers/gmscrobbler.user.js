// ==UserScript==
// @name           google music scrobbler
// @namespace      http://gmscrobber.whosemind.net
// @description    记录 google music beta 到 last.fm
// @include        http://play.google.com/music/listen*
// @include        https://play.google.com/music/listen*
// @require        https://raw.githubusercontent.com/justan/lrc/master/lrc.js
// @require        https://justan.github.io/gmscrobber/simple_scrobbler_user.js
// @version        0.3.0
// @grant          GM_getValue
// @grant          GM_setValue 
// @grant          GM_deleteValue
// @grant          unsafeWindow
// @grant          GM_log
// @grant          GM_xmlhttpRequest 
// @grant          GM_registerMenuCommand 
// @grant          unsafeWindow
// ==/UserScript==

var scrobber = new Scrobbler({
  name: "Google Play Music"
, ready: function() {
    this.on('nowplaying', function() {
      this.getInfo(this.song, function(info) {
        document.getElementById('player').title = '在 last.fm 中记录: ' + info.len + ' 次';
        var localInfo = getSongInfo()
        if(info.islove === '1' && !localInfo.isLove || info.islove === '0' && localInfo.isLove) {
            document.querySelector('#player [icon="sj:thumb-up-outline"]').click()
        }
      });

      hasStarSync || starSync()
    });
    
    this.setSongInfoFN(getSongInfo);
  }
});

var hasStarSync = false

var starSync = function() {
    document.querySelector('#player [icon="sj:thumb-up-outline"]').addEventListener('click', function() {
      var info = getSongInfo();
      if(!info.isLove){
          scrobber.love();
      }else{
          scrobber.unlove();
      }
    }, false)
    hasStarSync = true
}

var getSongInfo = function() {
  return {
    title: q('#currently-playing-title')
  , artist: q('#player-artist')
  , album: q('.player-album')
  , playTime: uso.timeParse(q('#time_container_current'))
  , duration: uso.timeParse(q('#time_container_duration'))
  , isLove: document.querySelector('#player [icon="sj:thumb-up-outline"]').getAttribute('aria-label') !== "Thumb-up"
  }
};

var q = function() {
  return document.querySelector.apply(document, arguments).innerHTML;
};

