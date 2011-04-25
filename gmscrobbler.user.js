var meta = <><![CDATA[
// ==UserScript==
// @name           谷歌音乐gmscrobbler
// @namespace      http://whosemind.net
// @description    记录谷歌音乐到 last.fm
// @include        http://www.google.cn/music/player*
// @include        http://g.top100.cn/*/html/player.html*
// @require        https://github.com/justan/gmscrobber/raw/master/simple_scrobbler_user.js
// @version        0.3.4
// @uso:script     92863
// @changelog      更新多歌手记录问题
// ==/UserScript==
]]></>.toString();

meta = uso.metaParse(meta);

(function(){
var gm = function(){
		var titleReg = /^([^(]+)(\s*\()?.*/,
		artistReg = /^.*?\(\s*(.*?)\s*\)$/,
		$statele, $titlele, $timele,
		_clickHandler = function(){},
		likeHandler = function(){_clickHandler()},
		listener = function(){
			var info, len;
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
					if($statele.style.display != "none" && len && player.state != "pause"){//显示中的播放按钮
						player.pause();
						player.state = "pause";
					}else if($statele.style.display == "none" && (player.playtime - player.lastplaytime) === 0){//不可信的定时器执行间隔
						player.buffer();
					}else if($statele.style.display == "none" && player.playtime < player.lastplaytime && player.state != "seek"){//单曲循环
						player.newsong(info);
					}else if($statele.style.display == "none" && player.state != "play"){
						player.play();
					}
				}
			}, 2000);
		},
		getInfo = function(){
			var fn = function(){
				return $titlele.lastChild ? {title: fn.getTitle(),
					artist: fn.getArtist(),
					playtime: fn.getPlayTime(),
					duration: fn.getTotalTime()} : {};
			};
			fn.getTitle = function(){
				return $titlele.title.replace(titleReg, "$1");
			};
			fn.getArtist = function(){
				var artist, artists = [], len = $titlele.children.length, con = "&";
				for(var i = 1; i < len; i++){
					artists.unshift($titlele.children[i].innerHTML.replace(artistReg, "$1"));
				}
				if(/\w/.test(artists[0])){//多个英文名间需要连字符
					con = " & ";
				}
				artist = artists.join(con);
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
			return fn;
		}(),
		setFav = function(){
			var ele = document.getElementById("_whosemind_");
			if(ele){
				ele.style.display = "none";
			}else{
				GM_addStyle("#_whosemind_{line-height:15px;}\
					#_whosemind_:hover{ color: black; background-color: #D9E4F8;  -moz-border-radius: 3px;}\
					#_whosemind_ .icon, #_whosemind_:hover .fav>.icon{color: red;}\
					#_whosemind_:hover .icon{color: #8989CE;}\
					#_whosemind_ .fav>.icon{color: grey;}");
				var _iconele = document.getElementsByClassName("audio-panel-toolbar")[0];
				
				ele = document.createElement("div");
				ele.className = "goog-inline-block loved-button icon-toolbar-button";
				ele.id = "_whosemind_";
				ele.innerHTML = '<span><div class="icon">❤</div><span>取消喜欢</span></span><span class="fav"><div class="icon">❤</div><span>喜欢</span></span>';
				ele.style.display = "none";
				_iconele.appendChild(ele);
				ele.addEventListener("click", likeHandler, false);
			}
			
			sc.getInfo(sc.song, function(i){
				var fn1 = function(){
					ele.firstChild.style.display = "";
					ele.lastChild.style.display = "none";
					_clickHandler = function(){fn2();sc.unlove()};
				},
				fn2 = function(){
					ele.firstChild.style.display = "none";
					ele.lastChild.style.display = "";
					_clickHandler = function(){fn1();sc.love()};
				};
				if(i.islove == "1"){
					fn1();
				}else if(i.islove === "0"){
					fn2();
				}
				ele.title = "已记录" + i.len + "次";
				ele.style.display = "";
			});
		},
		getAlbum = function(){
			var playlists,  _albumele, item,
			    album0, ablum1;
			playlists = document.getElementsByClassName("playlist-node");
			for(var i = 0, l = playlists.length; i < l; i++){
			  item = playlists[i];
			  if(item.firstChild && item.firstChild.className == "playing-icon"){
			    //alert(item.title);
			    album0 = item.title.replace(artistReg, "$1");//左侧播放列表中专辑名
			    //log("album0: " + album0);
			    break;
			  }
			}
			_albumele = document.getElementsByClassName("album-image")[0];
			if(_albumele && _albumele.title){
				album1 = _albumele.title.replace(/^([^(]+)(\s*\()?.*/, "$1");//右侧专辑图片的专辑名
				//log("album1: " + album1);
				sc.song.album = new RegExp(_albumele.title).test(item.title) ? album0 : album1;
				log("album: " + sc.song.album);
			}else{
				setTimeout(function(){getAlbum()}, 1000);
			}
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
				setFav();
				setTimeout(getAlbum, 10000);//专辑封面在更换歌曲后可能来不及改变
			},
			seek: function(){
				this.state = "seek";
				log("seek");
				getInfo.getPlayTime();
				this.offset += (this.lastplaytime - this.playtime);
				log("realplaytime/offset: " + (this.playtime + this.offset) + " / " + this.offset);
			},
			pause: function(){
				sc.pause();
			},
			play: function(){
				var rt;//remain time
				rt = (getInfo.getTotalTime() * sc.scrate - (this.playtime + this.offset))*1000;
				log("play, now play time info, playtime: " + this.playtime + " / remain time" + rt/1000 + " / offset: " + this.offset);
				sc.play(rt);
				this.state = "play";
			},
			buffer: function(){
				this.state = "buffer";
				this.pause();
			},
			stop: function(){
				log("stop");
				this.state = "stop";
				sc.stop();
			}
		};
		
		(function _init(){
			$statele = document.getElementById(":2");//播放按钮
			if($statele){
				document.getElementsByClassName("playing-background-middle")[0].
					addEventListener("click", function(){player.seek()}, false);
				$titlele = document.getElementsByClassName("playing-title")[0];
				$timele = document.getElementsByClassName("playing-time")[0];
				listener();
			}else{
				setTimeout(function(){_init()}, 1000);
			}
		})();
	},
	
	sc = new Scrobbler({name: "谷歌音乐", ready: gm}),
	RE = 6, i = 0;

if(location.host != "g.top100.cn"){
	if(unsafeWindow.top.location == unsafeWindow.location){//http://www.google.cn/music/player
		uso.check(meta.version, meta.uso.script, false);
	}else{
		(function _ses(){
			if(!sc.sk){
				sc.init();
				setTimeout(function(){
					log("3秒后重试");
					if(i < RE){
						_ses();
						i++;
					}else{
						return;
					}
				}, 3000);
			}else{
				log("session got right now");
			}
		})();
	}
}else{
	uso.check(meta.version, meta.uso.script, false);
}
})();
