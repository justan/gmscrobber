// ==UserScript==
// @name        落网 scrobbler
// @namespace   http://gmscrobber.whosemind.net
// @description 记录落网音乐到 last.fm
// @include     http://www.luoo.net/*
// @require     http://justan.github.io/gmscrobber/simple_scrobbler_user.js
// @version     0.1.0
// @grant       GM_log 
// @grant       GM_getValue 
// @grant       GM_setValue
// @grant       GM_deleteValue 
// @grant       GM_xmlhttpRequest 
// @grant       GM_registerMenuCommand 
// @grant       unsafeWindow 
// ==/UserScript==

var meta = uso.metaParse(GM_info.scriptMetaStr)
  , root = unsafeWindow
  , $ = root.$
  ;


if($.jPlayer) {
  var scrobbler = new Scrobbler({
    name: '落网'
  , ready: function() {
      var that = this;
      
      $('body').on($.jPlayer.event.playing, function(e) {
        var song = $.extend({duration: Math.round(e.jPlayer.status.duration)}, e.jPlayer.status.media);
        
        that.csa = e.jPlayer.options.cssSelectorAncestor;
        
        if(that.state === 'pause'){
          that.play();
        }else{
          setTimeout(function() {
            that.nowPlaying(song);
          
            that.getInfo(song, function(p) {
              var player = document.querySelector(that.csa)
                , $loveBtn = $(player.querySelector('.btn-action-like'))
                ;
              
              if(p.islove == '1' && !$loveBtn.hasClass('icon-like-large-actived')) {
                that.fakeClick = true;
                $loveBtn.click();
                that.fakeClick = false;
              }
            
              player.title = song.title + ' 在 last.fm 中记录 ' + p.len + ' 次';
            })
          }, 0);
        }
      }).on($.jPlayer.event.pause, function(e) {
        that.pause();
      });
      
      var favTimer = setInterval(function() {
        if(that.csa) {
          //只对播放器主区域的红心按钮有效
          $('body').on('click', that.csa + ' .btn-action-like', function() {
            if(that.fakeClick){
              log('fakeClick');
              return;
            }
            var $el = $(this);
            setTimeout(function(){
              if($el.hasClass('icon-like-large-actived')){
                that.unlove();
              }else{
                that.love();
              }
            }, 0);
          });
          clearInterval(favTimer);
        }
      }, 1000);
    }
  });
}