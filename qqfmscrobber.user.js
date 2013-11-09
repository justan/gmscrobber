// ==UserScript==
// @name        QQ音乐电台 lastfm scrobbler
// @namespace   http://justan.github.io/gmscrobber/
// @description 记录QQ音乐电台到 last.fm
// @match       http://fm.qq.com/
// @match       http://fm.qq.com/?*
// @require     https://raw.github.com/justan/gmscrobber/master/simple_scrobbler_user.js
// @version     0.0.1
// @uso:script  182623
// ==/UserScript==

var meta = uso.metaParse(GM_info.scriptMetaStr);

var init = function(){
  log('init');
  scrobber.setSongInfoFN(getSongInfo, {checktime: 4000});
  scrobber.on('nowplaying', function(){
    scrobber.getInfo(scrobber.song, function(info){
      document.getElementById('divsongbar').title= '在 last.fm 中记录: ' + info.len + ' 次';
    });
  });
};

var scrobber = new Scrobbler({
  name: 'QQ音乐电台',
  ready: init
});

var getSongInfo = function(){
  var song = {};
  var songinfo = document.getElementById('divsongname').title.split(' - ')
  song.title = songinfo[0];
  song.artist = songinfo[1];
  song.album = '';
  var percentage = document.getElementById('divsongbar').style.width.replace('%', '');
  var left = timeParse(document.getElementById('divsongtime').innerHTML.replace('-',''));
  song.duration = left / (100 - percentage) * 100;
  song.playTime = song.duration - timeParse(document.getElementById('divsongtime').innerHTML.replace('-',''));
  return song;
};

var timeParse = function(timeStr){
  var ts = timeStr.split(':');
  return ts[0] * 60 + ts[1] * 1;
};
