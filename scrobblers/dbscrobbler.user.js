// ==UserScript==
// @name           豆瓣电台dbscrobbler
// @namespace      http://gmscrobber.whosemind.net
// @description    记录 douban.fm 到last.fm
// @include        http://douban.fm/*
// @include        https://douban.fm/*
// @require        https://raw.githubusercontent.com/justan/lrc/master/lrc.js
// @require        https://raw.githubusercontent.com/justan/gmscrobber/gh-pages/simple_scrobbler_user.js
// @version        0.3.0
// @uso:script     98833
// @initiative     false
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          unsafeWindow
// @grant          GM_log
// @grant          GM_xmlhttpRequest
// @grant          GM_registerMenuCommand
// ==/UserScript==

var hasStarSync = false

var scrobber = new Scrobbler({name: "豆瓣电台", ready: function() {
   this.on('nowplaying', function() {
      this.getInfo(this.song, function(info) {
        q('.app').title = '在 last.fm 中记录: ' + info.len + ' 次';
        var localInfo = getSongInfo()
        if(info.islove === '1' && !localInfo.isLove || info.islove === '0' && localInfo.isLove) {
            FindReact(q('.buttons>label')).props.onClick()
        }
      });

      hasStarSync || starSync()
    })

    this.setSongInfoFN(getSongInfo);
}})

var starSync = function() {
  q('.buttons>label').addEventListener('click', function() {
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
  var currentSong = FindReact(q('.player-wrapper').firstElementChild).props.currentSong.attributes
  var song = {
    title: currentSong.title
  , artist: currentSong.artist
  , album: currentSong.albumtitle
  , playTime: currentSong.length - uso.timeParse(q('.time').innerHTML.slice(1))
  , duration: currentSong.length
  , isLove: !!currentSong.like
  }
  return song
}

var FindReact = function(dom) {
    for (var key in dom) {
        if (key.startsWith("__reactInternalInstance$")) {
            var compInternals = dom[key]._currentElement;
            var compWrapper = compInternals._owner;
            var comp = compWrapper._instance;
            return comp;
        }
    }
    return null;
};

var q = function() {
  return document.querySelector.apply(document, arguments);
};
