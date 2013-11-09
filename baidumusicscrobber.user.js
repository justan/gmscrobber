// ==UserScript==
// @name        百度音乐 lastfm scrobbler
// @namespace   http:/justan.github.com/gmscrobber/
// @description 记录百度音乐到 last.fm
// @match       http://play.baidu.com/
// @match       http://play.baidu.com/?*
// @require     https://raw.github.com/justan/gmscrobber/master/simple_scrobbler_user.js
// @version     0.0.5
// @changelog   update userscript id
// @uso:script  162278
// ==/UserScript==

var meta = uso.metaParse(GM_info.scriptMetaStr);

var init = function(){
  log('init');
  scrobber.setSongInfoFN(getSongInfo, {checktime: 4000});
  scrobber.on('nowplaying', function(){
    scrobber.getInfo(scrobber.song, function(info){
      document.getElementsByClassName('main-panel')[0].title = '在 last.fm 中记录: ' + info.len + ' 次';
    });
  });
};

var scrobber = new Scrobbler({
  name: '百度音乐',
  ready: init
});

var getSongInfo = function(){
  var song = {};
  var songinfo = document.getElementsByClassName('main-panel')[0];
  song.title = songinfo.getElementsByClassName('songname')[0].innerHTML.replace(/<.+?>/gim,"");
  song.artist = songinfo.getElementsByClassName('artist')[0].innerHTML.replace(/<.+?>/gim,"");
  song.duration = timeParse(songinfo.getElementsByClassName('totalTime')[0].innerHTML.replace(/<.+?/gim,""));
  song.playTime = timeParse(songinfo.getElementsByClassName('curTime')[0].innerHTML.replace(/<.+?>/gim,""));
  song.album = document.getElementsByClassName('album-name')[0].innerHTML.replace(/<.+?/gim, "").trim();
  return song;
};

var timeParse = function(timeStr){
  var ts = timeStr.split(':');
  return ts[0] * 60 + ts[1] * 1;
};
