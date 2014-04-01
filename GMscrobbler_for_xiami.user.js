// ==UserScript==
// @name        GMscrobber for xiami
// @namespace   http://gmscrobber.whosemind.net
// @description 记录虾米音乐到 last.fm
// @include     http://www.xiami.com/radio/play
// @include     http://www.xiami.com/radio/play*
// @include     http://www.xiami.com/play*
// @require     http://justan.github.io/gmscrobber/simple_scrobbler_user.js
// @updateURL   http://justan.github.io/gmscrobber/GMscrobbler_for_xiami.user.js
// @version     0.2.1
// ==/UserScript==

var meta = uso.metaParse(GM_info.scriptMetaStr)
  , root = unsafeWindow
  ;

if(root.Fm_afterplay){
  //虾米电台
  init(true);
}else if(root.KISSY){
  //虾米音乐盒
  var timer = setInterval(function() {
    if(root.seiya){
      clearInterval(timer);
      init();
    }
  }, 100)
}else{
  log('xiami scrobbler fail!');
}
  
function init(isFM) {
  var scrobbler = new Scrobbler({
    name: '虾米音乐'
  , type: 1
  , ready: function() {
      var that = this;
      var record, start, like = 'player_collected'
        , ref
        ;
      
      if(isFM){
        start = 'Fm_beforeplay';
        record = 'Fm_afterplay';
        ref = root;
      }else{
        start = 'start';
        record = 'end';
        ref = root.seiya.eventListener.player
      }
      var startFn = ref[start];
      ref[start] = function(info) {
        log('start');
        if(!isFM) {
          info = JSON.parse(info.currentSong);
        }else{
          info.song = info.songName
        }
        info.song = info.song.replace(/;/g, '&');
        setTimeout(function() {
          log(info);
          var startTime = Date.now();
          that.song = {
            artist: info.artist
          , title: info.song
          , songId: info.songId
          };
          root.$.ajax({
            url: 'http://www.xiami.com/song/playlist/id/' + that.song.songId + '/object_name/default/object_id/0'
          , dataType: 'xml'
          , success: function(xml) {
              var album = xml.querySelector('track album_name').textContent;
              var like = xml.querySelector('track grade').textContent === '1';
              var duration = xml.querySelector('track length').textContent;
              setTimeout(function() {
                //补加歌曲时长
                that.nowPlaying({
                  artist: info.artist
                , title: info.song
                , songId: info.songId
                , duration: duration - Math.round((Date.now() - startTime)/1000)
                , album: album
                });
                checkFav(like)
              }, 0);
            }
          });
        }, 0);
        return startFn.apply(this, arguments);
      };
      
      var recordFn = ref[record];
      ref[record] = function() {
        setTimeout(function() {
          that.scrobble();
        }, 0);
        return recordFn.apply(this, arguments);
      };
      
      if(isFM){
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
      }else{
        //只对播放器主区域的红心按钮有效
        root.$('#J_trackFav').click(function() {
          var $favEl = root.$(this);
          if(fakeClick){
            return;
          }
          setTimeout(function() {
            if($favEl.hasClass('icon-faved')){
              that.unlove();
            }else{
              that.love();
            }
          }, 0);
        });
      }
    }
  });

  var fakeClick = false;
  function checkFav(like){
    var song = scrobbler.song;
    scrobbler.getInfo(song, function(info) {
      if((info.islove * 1) != like && !like){
        //同步 last.fm 红心到虾米
        if(isFM){
          root.$.get('http://www.xiami.com/song/fav?ids=' + song.songId, function(script) {
            song.autoFav = true;
            root.$('body').append(root.$(script));
          });
        }else{
          fakeClick = true;
          root.$('#J_trackFav')[0].click();
          fakeClick = false;
        }
      }
      document.querySelector('.radio_player,#J_playerWrap').title = '在 last.fm 中记录: ' + info.len + ' 次';
    });
  }
}
