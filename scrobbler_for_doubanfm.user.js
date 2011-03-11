// ==UserScript==
// @name           Scrobbler for douban.fm
// @namespace      http://whosemind.net
// @include        http://www.google.cn/music/player*
// @include        http://g.top100.cn/*/html/player.html*
// @include        http://douban.fm/
// @include        http://douban.fm/?*
// @require        https://github.com/justan/gmscrobber/raw/master/md5-min.js
// @version        0.3.0
// ==/UserScript==

var log =  GM_log,//unsafeWindow.console.log,//
	getVal = GM_getValue,
	setVal = GM_setValue,
	delVal = GM_deleteValue,
	xhr = GM_xmlhttpRequest,
	rmc = GM_registerMenuCommand,

	_md5 = hex_md5;

var Scrobbler = function(){
	var apikey = "4472aff22b680a870bfd583f99644a03",
		secret = "cbc5528721f63b839720633d7c1258d2",
		apiurl = "http://ws.audioscrobbler.com/2.0/",	
		scrate = .9,
		tokenreg = /[?&]token=(\w{32})/;
	// info.type 1: 手动调用scrobble记录歌曲; 0(缺省): 根据播放起始时间和持续时间自动记录歌曲
	var fn = function(info){
		this.type = info.type;
		this.name = info && info.name || "";
		this.init(this);
	};
	fn.prototype = {
		init: function(that){
			var sk = getVal("session"),
				token = document.location.search.replace(tokenreg, "$1");
			
			if(sk){
				rmc("停止记录" + that.name);
				that.username = sk.split("/")[0];
				that.sk = sk.split("/")[1];
			}else if(token){
				this.ajax({method:"auth.getSession", _sig:"", token: token},
					function(d){
					//log(JSON.stringify(d))
						if(d.session && d.session.key){
							that.sk = d.session.key;
							that.username = d.session.name;
							setVal("session",that.username + "/" + that.sk);
							rmc("停止记录" + that.name, that.delSession);
						}
					}, true);
			}else{
				rmc("开始记录" + that.name, fn.redirect);
			}
		},
		
		getSession: function(){
			return this.sk;
		},
		delSession: function(){
				delVal("session");
				document.location = document.location.href.replace(tokenreg, "");
		},
		
	//song's command
		nowPlaying: function(song){
			var that = this;
			this.play();
			this.timestamp = Math.floor(new Date().getTime()/1000);
			this.song = song; //song: {title: "", artist: "", duration: "", album: ""}
			//log(JSON.stringify(song));
			this.ajax({
				method: "track.updateNowPlaying", 
				track: song.title,
				artist: song.artist,
				duration: song.duration,
				album: song.album,//
				_sig:""
			},
			function(d){
				log(JSON.stringify(d));
			},
			true);
			
			this.type || setTimeout(function(){that.scrobble}, that.durtion * scrate);
		},
		scrobble: function(song){
			song = song || this.song;
			this.ajax({
				method: "track.scrobble", 
				track: song.title,
				artist: song.artist,
				album: song.album,
				timestamp: this.timestamp,
				_sig:""
			},
			function(d){
				//log(JSON.stringify(d));
				log(song.artist + "'s " + song.title + " scrobbled..");
			},
			true);
		},
		love: function(song){
			song = song || this.song;			
			this.ajax({
				method: "track.love", 
				track: song.title,
				artist: song.artist,
				_sig:""
			},
			function(d){
				//log(JSON.stringify(d))
			},
			true);
		},
		unlove: function(song){
			song = song || this.song;
			this.ajax({
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
		getInfo: function(song){
			var that = this;
			song = song || this.song;
			this.ajax({
				method: "track.getInfo", 
				track: song.title,
				artist: song.artist,
				username: this.username,
				_sig:""
			},
			function(d){
				//log(JSON.stringify(d));
				var n = d.track.userplaycount ? d.track.userplaycount : 0, t;
				if(d.track.userloved == "1"){
					t = "love";
				}else if(d.track.userloved === "0"){
					t = "unlove";
				}
				that.call({islove: d.track.userloved, len: n});
			},
			true);
		},
		call: function(e){
			
		},
		
	//play control
		play: function(){
			this.state = "playing";
		},
		pause: function(){
			this.state = "pausing";
		},
		buffer: function(){
			this.state = "buffering";
		},
		stop: function(){
			this.state = "stopping";
		},
		seek: function(offset){
			
		},
		
		ajax: function(params, callback, auth){
			if(this.sk){
				params.sk = this.sk;
				fn.ajax(params, callback, auth);
			}else{
				delete params.sk;
			}
		},
	};
	
	fn.redirect = function(){
		document.location = "http://www.last.fm/api/auth/?api_key=" + apikey + "&cb=" + encodeURIComponent(document.location.href);
	};
	fn.ajax = function(params, callback, auth){
		var method = "POST",
			headers = {"Content-Type": "application/x-www-form-urlencoded"},
			url = apiurl + "?format=json",
			data = "";
		if(!auth){
			method = "GET";
			headers = {};
			url = url + "&" + fn.paramsInit(params);
			data = "";
		}else{
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
					//delVal(fn.name);
					//fn.redirect();
				}
				callback(res);
			},
			onerror: function(e){
				alert(params.method + "failed");
				log(params.method + " request failed.. " + JSON.stringify(e));
			}
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
			if(params[key]){
				keys.push(key + params[key]);
				str1 += encodeURIComponent(key) + "=" + encodeURIComponent(params[key]) + "&";
			}
		}
		keys.sort();
		str1 = str1.replace(/&$/, "");
		str2 = keys.join("") + secret;
		//log("str2: " + str2);
		//log("str1: " + str1);
		if(flag){
			return str1 + "&api_sig=" + _md5(str2);
		}else{
			return str1;
		}
	};
	return fn;
}();

(function(){
var douban = function(){
	var sc = new Scrobbler({name: "豆瓣电台", type: 1}),
		ex = unsafeWindow.extStatusHandler,
		cmds = {start:"start", end:"e", next:"s", like: "r", unlike: "u"};
	unsafeWindow.extStatusHandler = function(o){
		var song;
		log(o);
		o = JSON.parse(o);
		song = o.song;
		
		song.album = song.albumtitle;
		song.duration = song.len;
		
		if(song.artist == "豆瓣电台"){
			return;
		}else if(/\.{3}$/.test(song.album)){
			log("一个省略的专辑名...");
		}
		switch(o.type){
		case cmds.start:
			setTimeout(function(){
				sc.nowPlaying(song);
				sc.getInfo();
				sc.call = function(p){
					log(JSON.stringify(p));
					if(song.like != p.islove){
						if(song.like){
							log("love " + song.title + "in last.fm");
							sc.love();
						}else{
							log("love " + song.title + "in douban.fm");
							o.song.like = true;
							ex(JSON.stringify(o));
							o.song.like = false;
						}
					}
					document.getElementById("radioplayer").parentNode.title = "在last.fm中记录 " + p.len + " 次";
				}
			}, 0);
			break;
		case cmds.end:
			setTimeout(function(){sc.scrobble()}, 0);
			break;
		case cmds.like:
			setTimeout(function(){sc.love()}, 0);
			break;
		case cmds.unlike:
			setTimeout(function(){sc.unlove()}, 0);
			break;
		case cmds.next:
			break;
		default:
			break;
		}
		
		return ex.apply(this, arguments);
		//ex(o);
	};
};

unsafeWindow.Do('douban', 'counter', 'coverflow', function() {
	setTimeout(function(){
		unsafeWindow.extStatusHandler ? douban() : log("init error");
	}, 0);
});
})();