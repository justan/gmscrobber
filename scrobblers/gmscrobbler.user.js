// ==UserScript==
// @name           google music scrobbler
// @namespace      http://gmscrobber.whosemind.net
// @description    记录 google music beta 到 last.fm
// @include        http://play.google.com/music/listen*
// @include        https://play.google.com/music/listen*
// @require        https://raw.githubusercontent.com/justan/lrc/master/lrc.js
// @require        http://justan.github.io/gmscrobber/simple_scrobbler_user.js
// @version        0.2.1
// @grant          GM_getValue
// @grant          GM_setValue 
// @grant          GM_deleteValue 
// @grant          GM_xmlhttpRequest 
// @grant          GM_registerMenuCommand 
// @grant          unsafeWindow
// ==/UserScript==

var meta = uso.metaParse(GM_info.scriptMetaStr);

var sc = new Scrobbler({
  name: "Google Play Music"
, ready: function() {
    this.on('nowplaying', function() {
      this.getInfo(this.song, function(info) {
        document.getElementById('player').title = '在 last.fm 中记录: ' + info.len + ' 次';
      });
    });
    
    this.setSongInfoFN(getSongInfo);
  }
});

var getSongInfo = function() {
  return {
    title: q('#playerSongTitle>.tooltip')
  , artist: q('#player-artist')
  , album: q('.player-album')
  , playTime: uso.timeParse(q('#currentTime'))
  , duration: uso.timeParse(q('#duration'))
  }
};

var q = function() {
  return document.querySelector.apply(document, arguments).innerHTML;
};


//TODO 红心同步
(function() {
  var plug = function() {/*
    (function(){
      var XHR = XMLHttpRequest.prototype
        , _open = XHR.open
        , _send = XHR.send
        ;
      XHR.open = function(){
        this.__type__ = arguments[0];
        this.__url__ = arguments[1];
        return _open.apply(this, arguments);
      };
      XHR.send = function(){
        this.__data__ = arguments[0];
        send(this);
        return _send.apply(this, arguments);
      };
      
      var list = {}, send = function(xhr){
        var path = xhr.__url__.replace(/\?.+/, '');
        if(list[path]){
          list[path].forEach(function(fn){
            fn.apply(null, [xhr.__url__, xhr.__data__]);
          });
        }
      };
      window['whosemind'] = {
        list: list
      };
    })();
  */}.toString().replace(/(?:^function \(\) {\/\*|\*\/\}$)/g, '');
  
  var script = document.createElement('script');
  
  script.innerHTML = plug;
  document.head.appendChild(script);
  
  var onSend = function(fn, path){
    var list = unsafeWindow.whosemind.list;
    list[path] = list[path] || [];
    list[path].push(fn);
  };
  
  0 && onSend(function(url, data){
      var d = decodeURIComponent(data.replace(/json=/, '')),
        info = JSON.parse(d), entries = info.entries, rate, song = {}, _ele;
      if(entries.length == 1 && !entries[0].creationDate){//rate
        log(d);
        rate = entries[0].rating;
        id = entries[0].id;
        _ele = document.querySelector('[data-id="' + id + '"]');
        song.title = _ele.children[0].textContent;
        song.artist = _ele.children[2].textContent;
        setTimeout(function(){
          switch(rate){
          case 0:
          case 1:
            sc.unlove(song);
            break;
          case 5:
            sc.love(song);
            break;
          }
        }, 0);
      }
    }, 'services/modifyentries');
  
})();
