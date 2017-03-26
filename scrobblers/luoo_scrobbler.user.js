// ==UserScript==
// @name        落网 scrobbler
// @namespace   crazy
// @description 记录落网音乐到 last.fm
// @include     http://www.luoo.net/*
// @require     http://justan.github.io/gmscrobber/simple_scrobbler_user.js
// @version     20170324
// @grant       GM_log 
// @grant       GM_getValue 
// @grant       GM_setValue
// @grant       GM_deleteValue 
// @grant       GM_xmlhttpRequest 
// @grant       GM_registerMenuCommand 
// @grant       unsafeWindow 
// ==/UserScript==

var init = function(){
      log('init');
      scrobber.setSongInfoFN(getSongInfo);
      document.querySelector('.progress').addEventListener('click', function(e){
        var oldTime = getSongInfo().playTime;
        setTimeout(function(){
          var newTime = getSongInfo().playTime;
          var offset = oldTime - newTime;
          scrobber.seek(offset);
        }, 0);
      }, true);
      
      scrobber.on('nowplaying', function(){
        var loveEle = document.querySelector('#playerCt .PLFav');
        loveEle.addEventListener('click', function(e){
          var info = getSongInfo();
          if(!info.isLove){
            scrobber.love();
          }else{
            scrobber.unlove();
          }
        }, false);
        scrobber.getInfo(scrobber.song, function(info){
          var song = getSongInfo();
          document.querySelector('.player-large').title = '在 last.fm 中记录: ' + info.len + ' 次';      
          if(info.islove == '1' && !song.isLove || info.islove == '0' && song.isLove){
            loveEle.click();
          }
        });
      });
    };
    
    var scrobber = new Scrobbler({
      name: '落网',
      ready: init
    });
    
    var getSongInfo = function(){
      var song = {};
      var times = document.querySelector('.duration').textContent.replace(/\s+(.*?)\s+/, '$1').split('/');
      song.title = document.querySelector('.PLTrackname').textContent;
      song.artist = document.querySelector('.PLArtist').textContent;
      song.duration = timeParse(times[1]);
      song.playTime = timeParse(times[0]);
      song.album = document.querySelector('.PLAlbum').textContent;
      song.isLove = /icon-faved/.test(document.querySelector('#playerCt .PLFav').className);
      return song;
    };
    
    var timeParse = function(timeStr){
      var ts = timeStr.split(':');
      return ts[0] * 60 + ts[1] * 1;
    };