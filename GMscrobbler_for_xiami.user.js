// ==UserScript==
// @name        GMscrobber for xiami
// @namespace   http://gmscrobber.whosemind.net
// @description 记录虾米音乐到 last.fm
// @include     http://www.xiami.com/radio/play
// @include     http://www.xiami.com/radio/play*
// @include     http://www.xiami.com/song/play*
// @require     http://justan.github.io/gmscrobber/simple_scrobbler_user.js
// @version     0.1.1
// ==/UserScript==

var meta = uso.metaParse(GM_info.scriptMetaStr)
  , root = unsafeWindow
  ;

var scrobbler = new Scrobbler({
  name: '虾米音乐'
, type: 1
, ready: function() {
    var that = this;
    var record, start, like = 'player_collected';
    
    if(root.Fm_afterplay){
      //虾米电台
      start = 'Fm_beforeplay';
      record = 'Fm_afterplay';
      
    }else{
    //虾米音乐盒
      start = 'player_changeSong';
      record = 'player_playRecord';
      
    }
    var startFn = root[start];
    root[start] = function(info) {
      log('start');
      setTimeout(function() {
        log(info);
        that.nowPlaying({
          artist: info.artist
        , title: info.songName
        , songId: info.songId
        });
        root.$.ajax({
          url: 'http://www.xiami.com/song/playlist/id/' + that.song.songId + '/object_name/default/object_id/0'
        , dataType: 'xml'
        , success: function(xml) {
            var album = xml.querySelector('track album_name').textContent;
            var like = xml.querySelector('track grade').textContent === '1';
            that.song.album = album;
            setTimeout(function() {
              checkFav(like)
            }, 0);
          }
        });
      }, 0);
      return startFn.apply(this, arguments);
    };
    
    var recordFn = root[record];
    root[record] = function() {
      setTimeout(function() {
        that.scrobble();
      }, 0);
      return recordFn.apply(this, arguments);
    };
    
    var likeFn = root[like];
    root[like] = function(like) {
      setTimeout(function() {
        if(!that.song.autoFav){
          like * 1 ? that.love() : that.unlove();
        }
        that.song.autoFav = false;
      }, 0);
      return likeFn.apply(this, arguments);
    }
  }
});


function checkFav(like){
  var song = scrobbler.song;
  scrobbler.getInfo(song, function(info) {
    if((info.islove * 1) != like && !like){
      //同步 last.fm 红心到虾米
      root.$.get('http://www.xiami.com/song/fav?ids=' + song.songId, function(script) {
        song.autoFav = true;
        root.$('body').append(root.$(script));
      });
    }
    document.querySelector('.radio_player,#xiami_player').title = '在 last.fm 中记录: ' + info.len + ' 次';
  });
}
