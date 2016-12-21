// ==UserScript==
// @name        QQ音乐 online scrobbler
// @namespace   http://gmscrobber.whosemind.net
// @description 记录qq在线音乐到 last.fm
// @match       https://y.qq.com/portal/player.html
// @match       https://y.qq.com/portal/player.html?*
// @require     https://justan.github.io/gmscrobber/simple_scrobbler_user.js
// @version     0.1.0
// @author      justan
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
  document.getElementById('progress').addEventListener('click', function(e){
    var oldTime = getSongInfo().playTime;
    setTimeout(function(){
      var newTime = getSongInfo().playTime;
      var offset = oldTime - newTime;
      scrobber.seek(offset);
    }, 0);
  }, true);
  
  scrobber.on('nowplaying', function(){
    var loveEle = document.querySelector('#opbanner a.btn_big_like');
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
      document.getElementById('opbanner').title = '在 last.fm 中记录: ' + info.len + ' 次';      
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
  var times = document.querySelector('#time_show').innerHTML.split(' / ');
  song.title = document.querySelector('#song_name a').title.replace(/\([^\)]*\)/, '');
  song.artist = document.querySelector('#singer_name a').title;
  song.duration = timeParse(times[1]);
  song.playTime = timeParse(times[0]);
  song.album = document.querySelector('#album_name a').title;
  song.isLove = !/^喜欢/.test(document.querySelector('#opbanner a.btn_big_like').title);
  return song;
};

var timeParse = function(timeStr){
  var ts = timeStr.split(':');
  return ts[0] * 60 + ts[1] * 1;
};
