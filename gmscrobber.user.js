// ==UserScript==
// @name           GMscrobber
// @namespace      http://whosemind.net
// @include        http://www.google.cn/music/player*
// @include        http://g.top100.cn/*/html/player.html*
// @require        http://pajhome.org.uk/crypt/md5/2.2/md5-min.js
// @version        0.2.2
// ==/UserScript==
var log = GM_log,
	getVal = GM_getValue,
	setVal = GM_setValue,
	delVal = GM_deleteValue,
	xhr = GM_xmlhttpRequest,
	rmc = GM_registerMenuCommand;

var _md5 = hex_md5;

var Scrobber = function(){
	var apikey = "4472aff22b680a870bfd583f99644a03",
		secret = "cbc5528721f63b839720633d7c1258d2",
		apiurl = "http://ws.audioscrobbler.com/2.0/";
	
	var scrate = .9;
	
	var _titlele, _timele, _statele,
		tokenreg = /[?&]token=(\w{32})/;
	var fn = function(type){
		this.history = [];
		this.info = {};
		this.type = type;
		this.interval = 2000;
		this.getSession();
		if(type == 2){
			this._rn = 6;
			this._s_retry = 0;
		}
	};
	fn.scrate = scrate;
	fn.prototype = {
		getSession: function(){
			var token = document.location.search.replace(tokenreg, "$1"),
				sk = getVal("session"),
				that = this;
			if(sk){
				log("type: " + this.type + ", there a sessionkey alreay : " + sk);
				fn.name = that.name = sk.split("/")[0];
				fn.sk = that.sk = sk.split("/")[1];
				this.type !== 0 && that.init();
				this.type != 2 && rmc("停止记录谷歌音乐", that.delsession);
			}else if(token){
				fn.ajax({method:"auth.getSession", _sig:"", token: token},function(d){
					//log(JSON.stringify(d))
					if(d.session && d.session.key){
						fn.sk = that.sk = d.session.key;
						fn.name = that.name = d.session.name;
						setVal("session",that.name + "/" + that.sk);
						that.type == 1 && that.init();
						that.type != 2 && rmc("停止记录谷歌音乐", that.delsession);
					}
				}, true);
			}else{
				//log("type: " + this.type + ", there no sessionid");
				if(this.type == 1 || this.type === 0){
					rmc("开始记录谷歌音乐", fn.redirect);
				}else if(this.type == 2){
					log("3秒后重试");
					this._s_retry++;
					(this._s_retry <= this._rn || !this._s_retry) && setTimeout(function(){that.getSession()}, 3000);
				}
			}
		},
		init: function(){
			var that = this;
			_statele = document.getElementById(":2");//播放按钮
			
			if(_statele){
				document.getElementsByClassName("playing-background-middle")[0].addEventListener("click", function(){that.track.seek()}, false);
				_titlele = document.getElementsByClassName("playing-title")[0];
				_timele = document.getElementsByClassName("playing-time")[0];
				setInterval(function(){that.listener()}, this.interval);
			}else{
				setTimeout(function(){that.init()}, 1000);
			}
		},
		delsession:function(){
			 delVal("session");
			 document.location = document.location.href.replace(tokenreg, "");
		},
		listener: function(){
			var info = this.info = this.getInfo(),
				len = this.history.length;
			if(len > 100){
				this.history.length = len;
			}
			if(len === 0 && info.title){
				log(info.title + " is the first song");
				this.newsong();
			}else if(len > 0 && !info.title && this.track){
				log("stop");
				this.track.stop();
				this.track = null;
			}else if(len > 0 && info.title && (this.history[0].title != info.title || this.history[0].artist != info.artist)){
				this.newsong();
			}else if(this.track){
				if(_statele.style.display != "none" && len && this.state != "pause"){//显示中的播放按钮
					this.track.pause();
					this.state = "pause";
				}else if(_statele.style.display == "none" && (info.playtime - this.lastplaytime) === 0 && this.state != "buffer"){//不可信的定时器执行间隔
					this.track.buffer();
					this.state = "buffer";
				}else if(_statele.style.display == "none" && info.playtime - this.lastplaytime < -10 && this.track.state != "seek"){
					this.track.seek(info.playtime - this.lastplaytime);//单曲循环
				}else if(_statele.style.display == "none" && this.state != "play"){
					this.track.play();
					this.state = "play";
				}
			}
		},
		newsong:function(){
			log(this.info.title + " now playing");		
			if(this.track){
				clearTimeout(this.track.timer);
			}
			this.history.unshift(this.info);
			this.track = new Track(this);
		},
		getInfo:function(){
			var titleReg = /^([^(]+)(\s*\()?.*/, artistReg = /^.*?\(\s*(.*?)\s*\)$/;
			var fn = function(){
				var that = this;
				return _titlele.lastChild ? {title: fn.getTitle(),
					artist: fn.getArtist(),
					playtime: fn.getPlayTime.apply(that),
					duration: fn.getTotalTime()} : {};
			};
			fn.getTitle = function(){
				return _titlele.title.replace(titleReg, "$1");
			};
			fn.getArtist = function(){
				return _titlele.lastChild.innerHTML.replace(artistReg, "$1");
			};
			fn.getPlayTime = function(){
				var that = this;
				var ta = _timele.firstChild.innerHTML.split(":");
				that.lastplaytime = that.playtime || 0;
				that.playtime = ta[0]*60 + ta[1]*1;
				return that.playtime;
			};
			fn.getTotalTime = function(){
				var ta = _timele.lastChild.innerHTML.split(":");
				return ta[0]*60 + ta[1]*1;
			};
			return fn;
		}()
	};
	fn.redirect = function(){
		document.location = "http://www.last.fm/api/auth/?api_key=" + apikey +
			"&cb=" + encodeURIComponent(document.location.href);
	};
	fn.ajax = function(params, callback, auth){
		var method = "POST", sk = fn.sk,
			headers = {"Content-Type": "application/x-www-form-urlencoded"},
			url = apiurl + "?format=json",
			data = "";
		if(!auth){
			method = "GET";
			headers = {};
			url = url + "&" + fn.paramsInit(params);
			data = "";
		}else{
			if(sk){
				params.sk = sk;
			}else{
				delete params.sk;
			}
			data = fn.paramsInit(params, true);
		}
		xhr({
			method: method,
			headers: headers,
			url: url,
			data: data,
			onload: function(d){
				var res = JSON.parse(d.responseText);
				//log(JSON.stringify(d));
				res.error && log(JSON.stringify(d));
				if(res.error == "9"){
					delVal(fn.name);
					fn.redirect();
				}
				callback(res);
			},
			onerror: function(e){
				unsafeWindow.alert(params.method + "failed");
				log(params.method + " request failed.. " + JSON.stringify(e));
			}微笑 舞起来  907778213
		});
	};
	fn.paramsInit = function(params){
		var keys = [], str1 = "", str2 = "", flag;
		if(typeof params._sig != "undefined"){
			delete params._sig;
			flag = true;
		}else{
			flag = end;
		}
		params.api_key = apikey;
		for(var key in params){
			keys.push(key + params[key]);
			str1 += encodeURIComponent(key) + "=" + encodeURIComponent(params[key]) + "&";
		}
		keys.sort();
		str1 = str1.replace(/&$/, "");
		str2 = keys.join("") + secret;
		//log(str2)
		if(flag){
			return str1 + "&api_sig=" + _md5(str2);
		}else{
			return str1;
		}
	};
	return fn;
}();

var Track = function(){
	var num = 0, clickHandler = function(){fn._clickHandler();};
	var fn = function(scr){
		var that = this;
		num++;
		this.scrobber = scr;
		this.index = num;
		this.info = scr.info;
		this.interval = scr.interval;
		this.timestamp = Math.floor(new Date().getTime()/1000);
		this.timer = 0;
		this.rplaytime = 0;
		this.offset = this.getPlayTime();
		this.isscrobbe = false;
		this.update();
	};
	fn.prototype = {
		getAlbum: function(){
			var _albumele = document.getElementsByClassName("album-image")[0], that = this;
			if(_albumele){
				this.album = _albumele.title.replace(/^([^(]+)(\s*\()?.*/, "$1");
				//log("album " + this.album)
			}else{
				setTimeout(function(){that.getAlbum()}, 1000);
			}
		},
		uptime: function(){
			var that = this;
			//this.offset && log("offset " + this.offset);
			this.rplaytime = this.scrobber.playtime - this.offset;
			//this.info.duration - this.rplaytime < 5 && log("...." + this.rplaytime);
			if(this.rplaytime > this.info.duration){//repeat
				log(this.info.title + "replaying");
				this.scrobber.newsong();
			}
			this.scrobber.track == this && setTimeout(function(){that.uptime()}, this.interval);
		},
		update: function(){
			var info = this.info, that = this;
			this.play();
			this.getInfo();
			setTimeout(function(){that.uptime()}, 0);
			Scrobber.ajax({
				method: "track.updateNowPlaying", 
				track: info.title,
				artist: info.artist,
				duration: info.duration,
				//album: info.album,//
				_sig:""
			},
			function(d){
				//log(JSON.stringify(d));
			},
			true);
		},
		scrobble: function(){
			var that = this;
			this.getAlbum();
			if(this.isscrobbe){
				return;
			}
			this.isscrobbe = true;
			Scrobber.ajax({
				method: "track.scrobble", 
				track: that.info.title,
				artist: that.info.artist,
				album: that.album,
				timestamp: that.timestamp,
				_sig:""
			},
			function(d){
				//log(JSON.stringify(d));
				log(that.info.artist + "'s " + that.info.title + " scrobbled..  real play time: " + that.rplaytime + " seconds");
			},
			true);
		},
		getInfo:function(){
			var ele = document.getElementById("_whosemind_"), that = this;
			if(ele){
				ele.style.display = "none";
			}
			Scrobber.ajax({
				method: "track.getInfo", 
				track: this.info.title,
				artist: this.info.artist,
				username: Scrobber.name,
				_sig:""
			},
			function(d){
				//log(JSON.stringify(d));
				if(!ele){
					ele = fn.elements();
				}
				var fn1 = function(){
					that.loved = true;
					ele.firstChild.style.display = "";
					ele.lastChild.style.display = "none";
					fn._clickHandler = function(){fn2();that.unlove()}
				},
				fn2 = function(){
					that.loved = false;
					ele.firstChild.style.display = "none";
					ele.lastChild.style.display = "";
					fn._clickHandler = function(){fn1();that.love();}
				};
				if(d.track.userloved == "1"){
					fn1();
				}else if(d.track.userloved === "0"){
					fn2();
				}else{
					
				}
				ele.title = "已记录" + (d.track.userplaycount ? d.track.userplaycount : 0) + "次";
				ele.style.display = "";
			},
			true);			
		},
		love: function(){
			Scrobber.ajax({
				method: "track.love", 
				track: this.info.title,
				artist: this.info.artist,
				_sig:""
			},
			function(d){
				//log(JSON.stringify(d))
			},
			true);
		},
		unlove: function(){
			Scrobber.ajax({
				method: "track.unlove", 
				track: this.info.title,
				artist: this.info.artist,
				_sig:""
			},
			function(d){
				//log(JSON.stringify(d))
			},
			true);
		},
		play: function(){
			//log(this.info.title + " playing")
			var that = this;
			clearTimeout(this.timer);
			if(this.rplaytime >= this.info.duration * Scrobber.scrate * 1000 && this.rplaytime < this.info.duration){
				that.scrobble();
			}else{
				this.timer = setTimeout(function(){that.scrobble()}, (that.info.duration * Scrobber.scrate - this.rplaytime) * 1000);
			}
			this.state = "play";
		},
		pause: function(){
			clearTimeout(this.timer);
			this.state = "stop";			
		},
		buffer: function(){
			this.pause();
		},
		seek: function(offset){
			var rt = this.getPlayTime(), lt = this.scrobber.lastplaytime;//注意赋值的次序
			var o = 0;
			if(offset){
				o = offset;
				log("auto seek " + o);
			}else{
				o = rt - lt;
			}
			this.offset = this.offset + o;
			this.state = "seek";
		},
		stop: function(){
			document.getElementById("_whosemind_").style.display = "none";
		},
		getPlayTime: function(){
			return this.scrobber.getInfo.getPlayTime.call(this.scrobber);
		}
	};
	fn._clickHandler = function(){};
	fn.elements = function(){
		GM_addStyle("#_whosemind_{line-height:15px;}\
					#_whosemind_:hover{ color: black; background-color: #D9E4F8;  -moz-border-radius: 3px;}\
					#_whosemind_ .icon, #_whosemind_:hover .fav>.icon{color: red;}\
					#_whosemind_:hover .icon{color: #8989CE;}\
					#_whosemind_ .fav>.icon{color: grey;}");
		var _iconele = document.getElementsByClassName("audio-panel-toolbar")[0];
		var ele = document.createElement("div");
		ele.className = "goog-inline-block loved-button icon-toolbar-button";
		ele.id = "_whosemind_";
		ele.innerHTML = '<span><div class="icon">❤</div><span>取消喜欢</span></span><span class="fav"><div class="icon">❤</div><span>喜欢</span></span>';
		_iconele.appendChild(ele);
		ele.addEventListener("click", clickHandler, false);
		return ele;
	};
	return fn;
}();

if(location.host != "g.top100.cn"){
	if(unsafeWindow.top == unsafeWindow){
		new Scrobber(1);
	}else{
		new Scrobber(2);
	}
}else{
	new Scrobber(0);
}