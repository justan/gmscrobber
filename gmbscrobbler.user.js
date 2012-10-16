var meta = <><![CDATA[
// ==UserScript==
// @name           google music scrobbler
// @namespace      http://gmscrobber.whosemind.net
// @description    记录 google music beta 到 last.fm
// @include        http://play.google.com/music/listen*
// @include        https://play.google.com/music/listen*
// @require        https://raw.github.com/justan/lrc/master/lrc.js
// @require        https://raw.github.com/justan/gmscrobber/master/simple_scrobbler_user.js
// @version        0.1.2
// @uso:script     111546
// @initiative     false
// @changelog      歌词支持
// ==/UserScript==
]]></>.toString();

meta = uso.metaParse(meta);

(function(){
var plug = <><![CDATA[
(function(){
  var XHR = XMLHttpRequest.prototype, _open = XHR.open, _send = XHR.send;
  XHR.open = function(){
    this.__type__ = arguments[0];
    this.__url__ = arguments[1];
    return _open.apply(this, arguments);
  };
  XHR.send = function(){
    this.__data__ = arguments[0];
    send(this);
    return _send.apply(this, arguments);
  };
  
  var list = {}, send = function(xhr){
    var path = xhr.__url__.replace(/\?.+/, '');
    if(list[path]){
      list[path].forEach(function(fn){
        fn.apply(null, [xhr.__url__, xhr.__data__]);
      });
    }
  };
  window['whosemind'] = {
    list: list,
  };
})()
]]></>.toString(), script = document.createElement('script');
script.innerHTML = plug;
document.body.appendChild(script);
})();

(function(){
var sc, gm = function(){
		var $statele, $timele, $artistele, $albumart,
    
    $flag,
    
		_clickHandler = function(){},
		likeHandler = function(){_clickHandler()},
		listener = function(){
			var info, len;
      
      $statele.addEventListener('click', function(){
        if(this.title == 'Play'){
          player.pause();
        }else{
          player.play();
        }
      }, false);
      
			setInterval(function(){
				info = getInfo();
				//log(JSON.stringify(info));
				len = player.history.length;
				if(len > 10){
					player.history.length = len;
				}
				
				if(len === 0 && info.title){
					log(info.title + " is the first song");
					player.newsong(info);
				}else if(len > 0 && !info.title && player.track){
					player.stop();
					player.track = null;
				}else if(len > 0 && info.title &&
					(player.history[0].title != info.title || player.history[0].artist != info.artist)){
					player.newsong(info);
				}else if(player.track){
					if($statele.title == "Play" && len && player.state != "pause"){//显示中的播放按钮
						player.pause();
					}else if($statele.title != "Play" && (player.playtime - player.lastplaytime) === 0){//不可信的定时器执行间隔
						player.buffer();
					}else if($statele.title != "Play" && player.playtime < player.lastplaytime && player.state != "seek"){//单曲循环
						player.newsong(info);
					}else if($statele.title != "Play" && player.state != "play"){
						player.play();
					}
				}
			}, 2000);
		},
		getInfo = function(){
			var fn = function(){
				return {title: fn.getTitle(),
					artist: fn.getArtist(),
					playtime: fn.getPlayTime(),
          album: fn.getAlbum(),
					duration: fn.getTotalTime()};
			};
			fn.getTitle = function(){
				return document.getElementById("playerSongTitle").firstChild.title;
			};
			fn.getArtist = function(){
				var artist = document.getElementById("playerArtist").firstChild.title;
				return artist;
			};
			fn.getTotalTime = function(){
				var ta = $timele.lastChild.innerHTML.split(":");
				return ta[0]*60 + ta[1]*1;
			};
			fn.getPlayTime = function(){
				var ta = $timele.firstChild.innerHTML.split(":");
				player.lastplaytime = player.playtime;
				player.playtime = ta[0]*60 + ta[1]*1;
				return player.playtime;
			};
      fn.getAlbum = function(){
        return $flag.parentNode.parentNode.nextSibling.nextSibling.nextSibling.firstChild.title
      };
			return fn;
		}(),
		checkFav = function(song){
      sc.getInfo(song, function(info){
        document.getElementById('playerSongInfo').title = '在 last.fm 中已记录: ' + info.len + '次';
      });
    },
    player = {
			state: "",
			history: [],
			lastplaytime: 0,
			playtime: 0,
			offset: 0,//实际播放时间与显示的播放时间差值
			track: null,
			newsong: function(song){
				sc.nowPlaying(song);
				this.history.unshift(song);
				this.track = {};
				this.state = "play";
				this.offset = 0;
				this.lastplaytime = 0;
				this.playtime = 0;
				checkFav(song);
			},
			seek: function(){
				this.state = "seek";
				log("seek");
				getInfo.getPlayTime();
				this.offset += (this.lastplaytime - this.playtime);
				log("realplaytime/offset: " + (this.playtime + this.offset) + " / " + this.offset);
			},
			pause: function(){
        log('pause...');
				sc.pause();
				this.state = "pause";
			},
			play: function(){
				var rpt;//real play time
				rpt = this.playtime + this.offset;
				log("play, now play time info, playtime: " + this.playtime + " / offset: " + this.offset);
				sc.play(rpt);
				this.state = "play";
			},
			buffer: function(){
        log('buffer..');
				sc.pause();
				this.state = "buffer";
			},
			stop: function(){
				log("stop");
				this.state = "stop";
				sc.stop();
			}
		};
		
		(function _init(){
      $flag = document.getElementById('song_indicator');
      $albumart = document.getElementById('playingAlbumArt');
			if($albumart && $flag){
        $timele = document.getElementById("time_container");
				document.getElementById("slider").addEventListener("click", function(){player.seek()}, false);
        $statele = document.getElementById("playPause");//播放按钮
        
        listener();
			}else{
        //log('nothing play');
				setTimeout(function(){_init()}, 2000);
			}
		})();
    
    bindSend(function(url, data){
      var d = decodeURIComponent(data.replace(/json=/, '')),
        info = JSON.parse(d), entries = info.entries, rate, song = {}, _ele;
      if(entries.length == 1 && !entries[0].creationDate){//rate
        log(d);
        rate = entries[0].rating;
        id = entries[0].id;
        _ele = document.getElementById('songs-all_' + id);
        song.title = _ele.children[0].firstChild.title;
        song.artist = _ele.children[2].firstChild.title;
        setTimeout(function(){
          switch(rate){
          case 0:
          case 1:
            sc.unlove(song);
            break;
          case 5:
            sc.love(song);
            break;
          }
        }, 0);
      }
    }, 'services/modifyentries');
	},
  bindSend = function(fn, path){
    var list = unsafeWindow.whosemind.list;
    list[path] = list[path] || [];
    list[path].push(fn);
  };
  
	uso.check(meta.version, meta.uso.script);
  unsafeWindow.addEventListener('DOMContentLoaded', function(){
    sc = new Scrobbler({name: "google music", ready: gm})
  }, false);
})();