// ==UserScript==
// @name        百度随心听 lastfm scrobbler
// @namespace   http://justan.github.io/gmscrobber/
// @description 记录百度随心听到 last.fm
// @match       http://fm.baidu.com/
// @match       http://fm.baidu.com/?*
// @require     https://raw.github.com/justan/gmscrobber/master/simple_scrobbler_user.js
// @version     0.0.1
// @uso:script  182622
// ==/UserScript==

var meta = uso.metaParse(GM_info.scriptMetaStr);

var init = function(){
  log('init');
  song_duration = 0;
  last_song_title = '';
  scrobber.setSongInfoFN(getSongInfo, {checktime: 4000});
  scrobber.on('nowplaying', function(){
    scrobber.getInfo(scrobber.song, function(info){
        document.getElementById('playerpanel-upctrl').title= '在 last.fm 中记录: ' + info.len + ' 次';
    });
  });
};

var scrobber = new Scrobbler({
  name: '百度随心听',
  ready: init
});

var getSongInfo = function(){
  var song = {};
  song.title = document.getElementById('playerpanel-songname').title;
  song.album = document.getElementById('playerpanel-albumname').title;
  var artists = document.getElementsByClassName('playerpanel-artistname');
  song.artist = [].slice.call(artists).map(function getName(artist) { return artist.title }).join(' / ');
  if (last_song_title != song.title) {
    song_duration = timeParse(document.getElementById('playerpanel-timeinfo').innerHTML.replace('-',''));
    last_song_title = song.title;
  }
  song.duration = song_duration;
  song.playTime = song_duration - timeParse(document.getElementById('playerpanel-timeinfo').innerHTML.replace('-',''));
  return song;
};

var timeParse = function(timeStr){
  var ts = timeStr.split(':');
  return ts[0] * 60 + ts[1] * 1;
};
