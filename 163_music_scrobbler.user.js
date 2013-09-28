// ==UserScript==
// @name        网易云音乐 scrobbler
// @namespace   http://gmscrobber.whosemind.net
// @description 记录网易云音乐到 last.fm
// @include     http://music.163.com/#*
// @include     http://music.163.com/
// @include     http://music.163.com/?*
// @require     https://raw.github.com/justan/lrc/master/lrc.js
// @require     https://raw.github.com/justan/gmscrobber/master/simple_scrobbler_user.js
// @version     0.1.2
// ==/UserScript==

var scrobbler = new Scrobbler({
  name: '网易云音乐'
, ready: function() {
    var that = this;
    this.setSongInfoFN(getSongInfo);
    this.on('nowplaying', function() {
      fetchSongInfo(this.song.id, function(album) {
        that.song.album = album;
        
        that.getInfo(that.song, function(info) {
          document.getElementById('g_player').title = '在 last.fm 中记录: ' + info.len + '次';
          
          that.song.extra = info;
          if(info.islove === '1') {
            document.querySelector('#g_player .icn-add').click();
            frames[0].document.querySelector('.ztag>ul>.xtag>.f-cb').click();
          }
        });
      })
    });
    
    //只能添加, 不能删除
    function fav(e) {
      that.song.extra.islove === '0' || that.love();
    }
    
    document.querySelector('#g_player .icn-add').addEventListener('click', function() {
      setTimeout(function() {
        var favEl = frames[0].document.querySelector('.ztag>ul>.xtag>.f-cb');
        favEl.removeEventListener('click', fav);
        favEl.addEventListener('click', fav, false);
      }, 0);
    }, false);
  }
});

var getSongInfo = function() {
  var artist = getInfo('#g_player .by');
  return {
    title: getInfo('#g_player .fc1')
  , artist: artist.replace(/,/g,  /\w/.test(artist) ? ' & ' : '&')
  , album: ''
  , playTime: uso.timeParse(getInfo('#g_player .time em'))
  , duration: uso.timeParse(getInfo('#g_player .time').split('/')[1])
  , id: document.querySelector('#g_player .fc1').href.replace(/.+?\?id\=(\d+)/, '$1')
  };
};

function getInfo(s) {
  return document.querySelector(s).textContent.trim().replace(/\s/g, ' ');//&nbsp;
}

function fetchSongInfo(id, cb) {
  var url = 'http://music.163.com/song?id=' + id;
  
  xhr({
    method: 'GET'
  , url: url
  , onload: function(d){
      var ablum = d.responseText.match(/所属专辑.+"s-fc7">(.+?)</)[1];
      cb(ablum);
    }
  , onerror: function(e) {
      log("歌曲信息获取失败.. \n" + JSON.stringify(e));
    }
  })
}