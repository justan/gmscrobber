// ==UserScript==
// @name        QQ音乐 online scrobbler
// @namespace   http://gmscrobber.whosemind.net
// @description 记录qq在线音乐到 last.fm
// @match       https://y.qq.com/n/ryqq/player
// @match       https://y.qq.com/n/ryqq/player?*
// @match       https://y.qq.com/portal/player.html
// @match       https://y.qq.com/portal/player.html?*
// @require     https://justan.github.io/gmscrobber/simple_scrobbler_user.js
// @version     0.1.1
// @author      justan
// @grant       GM_getValue
// @grant       GM_setValue 
// @grant       GM_deleteValue 
// @grant       GM_xmlhttpRequest 
// @grant       GM_registerMenuCommand 
// @grant       unsafeWindow


// ==/UserScript==

var init = function(){
  log('gmscrobbler init');
  scrobber.setSongInfoFN(getSongInfo);
  document.querySelector('.player_progress').addEventListener('click', function(e){
    var oldTime = getSongInfo().playTime;
    setTimeout(function(){
      var newTime = getSongInfo().playTime;
      var offset = oldTime - newTime;
      scrobber.seek(offset);
    }, 0);
  }, true);
  
  scrobber.on('nowplaying', function(){
    var loveEle = document.querySelector('a.btn_big_like');
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
      document.querySelector('.player__ft').title = '在 last.fm 中记录: ' + info.len + ' 次';
      //同步 last.fm 红星歌曲到 qq music
      if(info.islove == '1' && !song.isLove || info.islove == '0' && song.isLove){
        loveEle.click();
      }
    });
  });
};

var scrobber = new Scrobbler({
  name: 'QQ 音乐',
  ready: init
});

var getSongInfo = function(){
  var song = {};
  var times = document.querySelector('.player_music__time').innerHTML.split(' / ');
  song.title =document.querySelector('.song_info__name a').innerText.replace(/\([^\)]*\)/, '');
  song.artist = document.querySelector('.mod_song_info .playlist__author').title;
  song.duration = timeParse(times[1]);
  song.playTime = timeParse(times[0]);
  song.album = document.querySelector('.song_info__album a').innerText;
  song.isLove = document.querySelector('a.btn_big_like').className.includes('btn_big_like--like');
  return song;
};

var timeParse = function(timeStr){
  var ts = timeStr.split(':');
  return ts[0] * 60 + ts[1] * 1;
};
