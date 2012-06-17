this.meta = <><![CDATA[
// ==UserScript==
// @name        QQ音乐 online scrobbler
// @namespace   http://gmscrobber.whosemind.net
// @description 记录qq在线音乐到 last.fm
// @match       http://y.qq.com/
// @match       http://y.qq.com/?*
// @match       http://y.qq.com/#*
// @exclude     http://y.qq.com/y/*
// @require     https://raw.github.com/justan/gmscrobber/master/simple_scrobbler_user.js
// @version     0.0.2
// @uso:script  136050
// @updateURL   https://raw.github.com/justan/gmscrobber/master/qqmusicscrobber.user.js
// @downloadURL   https://raw.github.com/justan/gmscrobber/master/qqmusicscrobber.user.js
// ==/UserScript==
]]></>.toString();

this.meta = uso.metaParse(this.meta);

var init = function(){
  log('init');
  scrobber.setSongInfoFN(getSongInfo, {checktime: 4000});
  document.getElementsByClassName('player_bar')[0].addEventListener('click', function(e){
    var oldTime = getSongInfo().playTime;
    setTimeout(function(){
      var newTime = getSongInfo().playTime;
      offset = oldTime - newTime;
      scrobber.seek(offset);
    }, 0);
  }, true);
  
  scrobber.on('nowplaying', function(){
    var loveEle = document.getElementsByClassName('music_op')[0].firstChild;
    loveEle.addEventListener('click', function(e){
      if(loveEle.title == '喜欢'){
        scrobber.love();
      }else if(loveEle.title == '取消喜欢'){
        scrobber.unlove();
      }
    }, false);
    scrobber.getInfo(scrobber.song, function(info){
      document.getElementById('divplayer').title = '在 last.fm 中记录: ' + info.len + ' 次';
      //同步 last.fm 红星歌曲到 qq music
      if(info.islove == '1' && loveEle.title == '喜欢' || info.islove == '0' && loveEle.title == '取消喜欢'){
        //unsafeWindow.g_topPlayer.like(null, loveEle, unsafeWindow.g_topPlayer.getCurSongInfo());
        document.getElementsByClassName('music_op')[0].children[0].click();
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
  var songinfo = document.getElementById('divsonginfo');
  song.title = songinfo.getElementsByClassName('music_name')[0].title;
  song.artist = songinfo.getElementsByClassName('singer_name')[0].title;
  song.duration = timeParse(document.getElementById('ptime').innerHTML);
  song.playTime = song.duration * document.getElementById('spanplaybar').style.width.replace(/%/, '') / 100;
  song.album = songinfo.getElementsByClassName('album_pic')[0].title;
  return song;
};

var timeParse = function(timeStr){
  var ts = timeStr.split(':');
  return ts[0] * 60 + ts[1] * 1;
};