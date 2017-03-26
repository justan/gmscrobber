﻿var log = function(){},GM_log,////unsafeWindow.console.log,//
	getVal = GM_getValue,
	setVal = GM_setValue,
	delVal = GM_deleteValue,
	xhr = GM_xmlhttpRequest,
	rmc = GM_registerMenuCommand,

	_md5 = hex_md5;
  
//simple scrobbler for userscript
var Scrobbler = function(){
	var apikey = "4472aff22b680a870bfd583f99644a03",
		secret = "cbc5528721f63b839720633d7c1258d2",
		apiurl = "http://ws.audioscrobbler.com/2.0/",	
		scrate = .9,
		tokenreg = /[?&]token=(.+?)(&|#|$)/,
		_timer, _shift;
    
  /**
   * Scrobbler
   * @constructor
   * @param {Object} info 该页面 scrobbler 信息
   * @param {Number} info.type 1: 手动调用scrobble记录歌曲; 
           0(缺省): 在调用 nowplaying 后根据播放时间自动调用 scrobble 记录歌曲
   * @param {String} info.name 该 scrobbler 名字, 会显示在 greasemonkey 菜单中
   * @param {Function} info.ready 回调. scrobbler sessionid 取得后会调用此函数.
   * @param {Number} [info.scrate] 自动记录的百分比, info.type == 1 时无效
   */
	var fn = function(info){
		this.type = info.type;
		this.name = info.name || "";
		this.ready = info.ready || function(){};
		this.scrate = info.scrate || scrate;
		this.init();
	};
	fn.prototype = {
		init: function(){
			var sk = getVal("session"),
        token = document.location.search.match(tokenreg),
        that = this;
      
      token = token && token[1];
			
			log(sk + "\n" + token + "\n" + document.location.href);
			if(sk){
				rmc("停止记录" + that.name, that.delSession);
				that.username = sk.split("/")[0];
				that.sk = sk.split("/")[1];
				setTimeout(function(){that.ready()}, 0);
			}else if(token){
				that.sk = "wait";
				that.ajax({method:"auth.getSession", _sig:"", token: token},
					function(d){
					log(JSON.stringify(d))
						if(d.session && d.session.key){
							that.sk = d.session.key;
							that.username = d.session.name;
							setVal("session",that.username + "/" + that.sk);
							rmc("停止记录" + that.name, that.delSession);
							that.ready();
						}
					}, true);
			}else{
				rmc("开始记录" + that.name, fn.redirect);
			}
      
      this.listeners = {};
		},
		
		getSession: function(){
			return this.sk;
		},
		delSession: function(){
			delVal("session");
			document.location = document.location.href.replace(tokenreg, "");
		},
    /**
     * 定期检查页面歌曲信息变化. 将歌曲信息获取函数传给此函数, 即可自动完成歌曲的记录.
     * @param {Function} getSongInfo 各页面脚本的歌曲信息获取函数.
        应该返回歌曲信息: {title: '', artist: '', duration: 0, playTime: '', album: ''}
     * @param {Object} opts 
     * @param {Nunber} opts.checktime 定时器周期, 毫秒
     */
    setSongInfoFN: (function(){
      var checkTime;
      var fn = function(getSongInfo, opts){
        opts = opts || {};
        checkTime = opts.checktime || 2000;
        
        var info = {}, that = this;
        
        setInterval(function(){
          try{
            that.getSongInfo = getSongInfo;
            info = getSongInfo();
            infoChecker.call(that, info);
          }catch(e){
            log(e.stack);
          }
        }, checkTime);
      };
      var oldSong = {};
      var infoChecker = function(song){
        if(song.title && song.artist && song.duration){
          if(song.title != oldSong.title || song.artist != oldSong.artist){
            this.nowPlaying(song);
          }else{
            //log(this.state)
            if(song.playTime != oldSong.playTime){
              if(song.playTime <= Math.ceil(checkTime / 1000) && (Date.now() / 1000 - this.timestamp > song.duration)){
                log(song.title + ' repeating.');
                //单曲重复
                this.nowPlaying(song);
              }else{
                this.state != 'play' && this.play(song.playTime + this.info.offset);
              }
            }else{
              this.state == 'play' && this.pause();
            }
          }
          oldSong = uso.clone(song);
        }
      };
      return fn;
    })(),
		
	//song's command
  
    /**
     * 向 last.fm 发送正在播放请求
     * @param {Object} song 歌曲信息
     * @param {String} song.title 曲名
     * @param {String} song.artist 歌手(多个歌手用 & 连接)
     * @param {String} song.duration 时长. 单位: 秒
     * @param {String} [song.album] 专辑名
     * @param {String} [song.playTime] 开始播放时的时间
     */
		nowPlaying: function(song){
			var that = this;
			this.song = song; //song: {title: "", artist: "", duration: "", album: ""}
			this.timestamp = Math.floor(new Date().getTime()/1000);
			this.info = {iscrobble: false, offset: 0};
			this.play(song.playTime || 0);
			//log(JSON.stringify(song));
			log(song.title + " now playing");
			this.ajax({
				method: "track.updateNowPlaying", 
				track: song.title,
				artist: song.artist,
				duration: song.duration,
				album: song.album,//
				_sig:""
			},
			function(d){
				//log(JSON.stringify(d));
			},
			true);
      
      //typeof meta != 'undefined' && that.record(song, 'nowplaying');
      this.fire('nowplaying');
      lyr.call(this);
		},
    
    //
    record: function(song, type){
      var query = uso.clone(song), path;
      query.source = document.location.host;
      query.version = meta.version;
      query.username = this.username;
      query = uso.paramSerialize(query);
      if(type == 'nowplaying'){
        path = '/nowplaying?';
      }else if(type == 'scrobble'){
        path = '/scrobble?';
      }else{
        return false;
      }
      xhr({
        method: 'GET',
        url: meta.namespace.replace('\/', '') + path + query
      });
    },
    
    /**
     * 向 last.fm 发送正在记录请求
     * @param {Object} [song] 歌曲信息. 当nowPlaying中的歌曲信息不全时, 应在此补全. last.fm 的播放记录以此为准
     */
		scrobble: function(song){
			var that = this;
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
				that.info.iscrobble = true;
				log(song.artist + "'s " + song.title + " / " + song.album + " scrobbled..");
			},
			true);
      //typeof meta != 'undefined' && that.record(song, 'scrobble');
      this.fire('scrobble');
		},
		/** love
     * @param {Object} [song] 歌曲信息. 事实上你可以听得是一首歌, love 的却是另一首
     */
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
      this.fire('love');
		},
		unlove: function(song){
			song = song || this.song;
			this.ajax({
				method: "track.unlove", 
				track: song.title,
				artist: song.artist,
				_sig:""
			},
			function(d){
				//log(JSON.stringify(d))
			},
			true);
      this.fire('unlove');
		},
    ban: function(song){
      song = song || this.song;
      this.ajax({
				method: "track.ban", 
				track: song.title,
				artist: song.artist,
				_sig:""
			},
			function(d){
				//log(JSON.stringify(d))
			},
			true);
      this.fire('ban');
    },
    unban: function(song){
      song = song || this.song;
      this.ajax({
				method: "track.unban", 
				track: song.title,
				artist: song.artist,
				_sig:""
			},
			function(d){
				//log(JSON.stringify(d))
			},
			true);
      this.fire('unban');
    },
		getInfo: function(song, callback){
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
				var n, t;
				if(d.track){
					n = d.track.userplaycount ? d.track.userplaycount : 0;
					if(d.track.userloved == "1"){
						t = "1";
					}else if(d.track.userloved === "0"){
						t = "0";
					}
				}else{
					n = 0;
					t = "0";
				}
				typeof callback == "function" && callback({islove: t, len: n});
			},
			true);
		},
		
	//play control
    /**
     * 开始播放. 从所有停止状态开始播放, 都应该调用此函数
     * @param {Number} [realPlayTime] 播放时校正. 
        当一首歌暂停次数太多的时候, 记录的播放时间可能会有误差, 传入 realPlayTime 即可校正播放的时间
     */
		play: function(realPlayTime){
			var that = this, rpt = realPlayTime, rt;
			this.state = "play";
      this.fire(this.state);
			
			if(!rpt){
				rpt = Math.floor(new Date().getTime()/1000) - this.timestamp;
			}
      rt = (Math.min(that.song.duration*this.scrate, 240) - rpt)*1000;//remain time
			if(!this.type && !this.info.iscrobble){
				clearTimeout(_timer);
        log('will scrobbler in: ' + rt/1000 + ' seconds')
				_timer = setTimeout(function(){that.scrobble()}, rt);
			}
		},
		pause: function(){
			this.type || clearTimeout(_timer);
			this.state = "pause";
      this.fire(this.state);
		},
		buffer: function(){
			this.type || clearTimeout(_timer);
			this.state = "buffer";
      this.fire(this.state);
		},
		stop: function(){
			this.type || clearTimeout(_timer);
			this.state = "stop";
      this.fire(this.state);
		},
		seek: function(offset){
      this.state = "seek";
      this.fire(this.state, offset);
			this.info.offset += offset;
      log('seek, offset: ' + offset + ', totle offset: ' + this.info.offset);
		},
		
		ajax: function(params, callback, auth){
			if(this.sk){
				params.sk = this.sk;
			}else{
				delete params.sk;
			}
			fn.ajax(params, callback, auth);
		},
    
    on: function(event, handler){
      this.listeners[event] = this.listeners[event] || [];
      this.listeners[event].push(handler);
      return this;
    },
    off: function(event, handler){
      var listeners = this.listeners[event] || [];
      if(handler){
        for(var i = 0, l = listeners.length; i < l; i++){
          if(handler == listeners[i]){
            delete listeners[i];
          }
        }
      }else{
        delete this.listeners[event];
      }
      return this;
    },
    fire: function(event){
      var listeners = this.listeners[event] || [];
      var args = [].slice.call(arguments);
      args.shift();
      
      for(var i = 0, l = listeners.length; i < l; i++){
        listeners[i] && listeners[i].apply(this, args);
      }
      return this;
    }
	};
	
	fn.redirect = function(){
		document.location = "http://www.last.fm/api/auth/?api_key=" + apikey + "&cb=" + encodeURIComponent(document.location.href.replace(/^https/,'http'));
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
				//alert(params.method + "failed");
				log("[ error ] " + params.method + " request failed.. " + JSON.stringify(e));
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
			}
		}
		str1 = uso.paramSerialize(params);
		keys.sort();
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

/**
 * 歌词查询
 * 歌词 API 来源于 (@solos)[https://github.com/solos] 的(歌词迷)[http://api.geci.me/en/latest/index.html]
 */
var lyr = function(){
  var lrc;
  var fn = function(){
    var title = this.song.title
      , artist = this.song.artist
      , album = this.song.album
      , startTime = this.song.playTime || 0
      , that = this
      ;
    
    log('lyric for ' + artist + '\'s ' + title + ' / ' + album + ' is getting..');
    
    var t1 = Date.now();
    lrc && lrc.stop();
    
    xhr({
      method: 'GET',
      url: 'http://geci.me/api/lyric/' + title + '/' + artist,
      onload: function (res){
        //log(res.responseText);
        var lyrSrc = '';
        res = JSON.parse(res.responseText);
        
        if(res.count){
          lyrSrc = res.result[0].lrc;
          log('lyrics link: ' + lyrSrc);
          xhr({
            method: 'GET',
            url: lyrSrc,
            //overrideMimeType: 'text/plain; charset=gb2312',
            onload: function(d){
              var txt = d.responseText;
              GM_log(txt);
              
              if(typeof Lrc != 'undefined'){
                lrc = (new Lrc(txt, function(txt, extra){
                  
                  txt && lrcOut.call(this, txt, extra);
                  //that.getSongInfo && lrcOut('player time: ' + that.getSongInfo().playTime)
                  //lrcOut(lrc.lrc.split('\n')[extra.originLineNum])
                }));
                //提前1秒显示歌词
                that.state === 'play' && lrc.play(startTime * 1000 + Date.now() - t1 + 1000);
              }
            },
            onerror: function(){
              lrcOut('some error occured..');
            }
          });
        }else{
          lrcOut('no lyrics for ' + title);
        }
      },
      onerror: function (e){
        lrcOut('搜索歌词失败! ' + JSON.stringify(e));
      }
    });
    
    this.off('pause', pause).off('play', pause).off('buffer', pause).
      on('pause', pause).on('play', pause).on('buffer', pause).
      off('seek', seek).on('seek', seek);
  };
  
  function pause(){
    log('pause')
    lrc && lrc.pauseToggle();
  }
  
  function seek(offset){
    lrc && lrc.seek(-offset * 1000);
  }

  return fn;
}();

//重新此方法可实现自己歌词输出
var lrcOut = function(txt){
  unsafeWindow.console && unsafeWindow.console.log(txt);
  //GM_log(txt);
};

//userscript 自动更新工具
var uso = {
	//usersctipt meta 解析工具
	metaParse: function(metadataBlock) {
	  var headers = {};
	  var line, name, prefix, header, key, value, _t;

		var lines = metadataBlock.split(/\n/).filter(function(line){return /\/\/ @/.test(line)});
		lines.forEach(function(line) {
		  _t = line.match(/\/\/ @(\S+)\s*(.*)/);
      name = _t[1];
      value = _t[2];

		  switch (name) {
			case "licence":
			  name = "license";
			  break;
		  }

		  _t = name.split(/:/).reverse();
      key = _t[0];
      prefix = _t[1];

		  if (prefix) {
			if (!headers[prefix]) 
			  headers[prefix] = new Object;
			header = headers[prefix];
		  } else
			header = headers;

		  if (header[key] && !(header[key] instanceof Array))
			header[key] = new Array(header[key]);

		  if (header[key] instanceof Array)
			header[key].push(value);
		  else
			header[key] = value;
		});

		headers["licence"] = headers["license"];

	  return headers;
	},
	/**
   * 自动升级工具
   * @param {String} ver 当前版本号
   * @param {String} id userscript.org 上的编号
   * @param {Function} cb 检测结果回调
   */
  check: function(ver, id, cb){
		var that = this, self = arguments.callee, flag = false;
		xhr({
		  method:"GET",
		  url:"https://userscripts.org/scripts/source/" + id + ".meta.js",
		  headers:{
			"Accept":"text/javascript; charset=UTF-8"
		  },
		  overrideMimeType:"application/javascript; charset=UTF-8",
		  onload:function(response) {
			var meta = that.metaParse(response.responseText),
				ver0 = meta.version, r;
				
			if(that.verCompare(ver, ver0) < 0){
				flag = true;
        if(meta.initiative == 'true' || meta.initiative == 'yes'){
          alert([
              meta.name + " ver" + ver0, "",
              meta.changelog].join("\n    "));
          document.location = "http://userscripts.org/scripts/source/" + id + ".user.js";
        }else{
          rmc("更新" + meta.name + " " + ver + " 至 " + ver0, function(){
            r = confirm([
              meta.name + " ver: " + ver0, "",
              "更新说明: " + meta.changelog, "",
              "是否更新?"].join("\n    "));
            if(r){
              document.location = "http://userscripts.org/scripts/source/" + id + ".user.js";
            }
          });
        }
			}
			typeof cb == "function" && cb(flag);
		  },
		  onerror: function(e){
			log("check version failed; \n" + JSON.stringify(e));
		  }
		});
	},
	verCompare: function(ver0, ver1){
		var a0 = ver0.split("."), a1 = ver1.split("."),
			len = Math.max(a0.length, a1.length);
		if(ver0 == ver1){
			return 0;
		}
		for(var i = 0; i < len; i++){
			if(a0[i] < a1[i] || typeof a0[i] == "undefined"){
				return -1;//ver0 < ver1
			}else if(a0[i] != a1[i]){
        break;
      }
		}
		return 1;
	},
  paramSerialize: function(params){
    var str = '';
    for(var key in params){
			if(params[key]){
				str += encodeURIComponent(key) + "=" + encodeURIComponent(params[key]) + "&";
			}
		}
    str = str.replace(/&$/, "");
    return str;
  },
  clone: function(obj){
    if(obj == null || typeof(obj) != 'object'){ return obj }
    var temp = obj.constructor(); // changed
    for(var key in obj){ temp[key] = arguments.callee(obj[key]) }
    return temp;
  },
  //str hh:mm:ss
  timeParse: function(str) {
    var ts = str.trim().match(/(?:(\d+):)?(\d\d?):(\d\d?)/);
    return (ts[1] || 0) * 3600 + ts[2] * 60 + ts[3] * 1 || 0;
  },
  
  //函数切面
  //前面的函数返回值传入 breakCheck 判断, breakCheck 返回值为真时不执行后面的函数
  beforeFn: function (oriFn, fn, breakCheck) {
    return function() {
      var ret = fn.apply(this, arguments);
      if(breakCheck && breakCheck.call(this, ret)){
        return ret;
      }
      return oriFn.apply(this, arguments);
    };
  },

  afterFn: function (oriFn, fn, breakCheck) {
    return function() {
      var ret = oriFn.apply(this, arguments);
      if(breakCheck && breakCheck.call(this, ret)){
        return ret;
      }
      fn.apply(this, arguments);
      return ret;
    }
  }
};


/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */
var hexcase=0;function hex_md5(a){return rstr2hex(rstr_md5(str2rstr_utf8(a)))}function hex_hmac_md5(a,b){return rstr2hex(rstr_hmac_md5(str2rstr_utf8(a),str2rstr_utf8(b)))}function md5_vm_test(){return hex_md5("abc").toLowerCase()=="900150983cd24fb0d6963f7d28e17f72"}function rstr_md5(a){return binl2rstr(binl_md5(rstr2binl(a),a.length*8))}function rstr_hmac_md5(c,f){var e=rstr2binl(c);if(e.length>16){e=binl_md5(e,c.length*8)}var a=Array(16),d=Array(16);for(var b=0;b<16;b++){a[b]=e[b]^909522486;d[b]=e[b]^1549556828}var g=binl_md5(a.concat(rstr2binl(f)),512+f.length*8);return binl2rstr(binl_md5(d.concat(g),512+128))}function rstr2hex(c){try{hexcase}catch(g){hexcase=0}var f=hexcase?"0123456789ABCDEF":"0123456789abcdef";var b="";var a;for(var d=0;d<c.length;d++){a=c.charCodeAt(d);b+=f.charAt((a>>>4)&15)+f.charAt(a&15)}return b}function str2rstr_utf8(c){var b="";var d=-1;var a,e;while(++d<c.length){a=c.charCodeAt(d);e=d+1<c.length?c.charCodeAt(d+1):0;if(55296<=a&&a<=56319&&56320<=e&&e<=57343){a=65536+((a&1023)<<10)+(e&1023);d++}if(a<=127){b+=String.fromCharCode(a)}else{if(a<=2047){b+=String.fromCharCode(192|((a>>>6)&31),128|(a&63))}else{if(a<=65535){b+=String.fromCharCode(224|((a>>>12)&15),128|((a>>>6)&63),128|(a&63))}else{if(a<=2097151){b+=String.fromCharCode(240|((a>>>18)&7),128|((a>>>12)&63),128|((a>>>6)&63),128|(a&63))}}}}}return b}function rstr2binl(b){var a=Array(b.length>>2);for(var c=0;c<a.length;c++){a[c]=0}for(var c=0;c<b.length*8;c+=8){a[c>>5]|=(b.charCodeAt(c/8)&255)<<(c%32)}return a}function binl2rstr(b){var a="";for(var c=0;c<b.length*32;c+=8){a+=String.fromCharCode((b[c>>5]>>>(c%32))&255)}return a}function binl_md5(p,k){p[k>>5]|=128<<((k)%32);p[(((k+64)>>>9)<<4)+14]=k;var o=1732584193;var n=-271733879;var m=-1732584194;var l=271733878;for(var g=0;g<p.length;g+=16){var j=o;var h=n;var f=m;var e=l;o=md5_ff(o,n,m,l,p[g+0],7,-680876936);l=md5_ff(l,o,n,m,p[g+1],12,-389564586);m=md5_ff(m,l,o,n,p[g+2],17,606105819);n=md5_ff(n,m,l,o,p[g+3],22,-1044525330);o=md5_ff(o,n,m,l,p[g+4],7,-176418897);l=md5_ff(l,o,n,m,p[g+5],12,1200080426);m=md5_ff(m,l,o,n,p[g+6],17,-1473231341);n=md5_ff(n,m,l,o,p[g+7],22,-45705983);o=md5_ff(o,n,m,l,p[g+8],7,1770035416);l=md5_ff(l,o,n,m,p[g+9],12,-1958414417);m=md5_ff(m,l,o,n,p[g+10],17,-42063);n=md5_ff(n,m,l,o,p[g+11],22,-1990404162);o=md5_ff(o,n,m,l,p[g+12],7,1804603682);l=md5_ff(l,o,n,m,p[g+13],12,-40341101);m=md5_ff(m,l,o,n,p[g+14],17,-1502002290);n=md5_ff(n,m,l,o,p[g+15],22,1236535329);o=md5_gg(o,n,m,l,p[g+1],5,-165796510);l=md5_gg(l,o,n,m,p[g+6],9,-1069501632);m=md5_gg(m,l,o,n,p[g+11],14,643717713);n=md5_gg(n,m,l,o,p[g+0],20,-373897302);o=md5_gg(o,n,m,l,p[g+5],5,-701558691);l=md5_gg(l,o,n,m,p[g+10],9,38016083);m=md5_gg(m,l,o,n,p[g+15],14,-660478335);n=md5_gg(n,m,l,o,p[g+4],20,-405537848);o=md5_gg(o,n,m,l,p[g+9],5,568446438);l=md5_gg(l,o,n,m,p[g+14],9,-1019803690);m=md5_gg(m,l,o,n,p[g+3],14,-187363961);n=md5_gg(n,m,l,o,p[g+8],20,1163531501);o=md5_gg(o,n,m,l,p[g+13],5,-1444681467);l=md5_gg(l,o,n,m,p[g+2],9,-51403784);m=md5_gg(m,l,o,n,p[g+7],14,1735328473);n=md5_gg(n,m,l,o,p[g+12],20,-1926607734);o=md5_hh(o,n,m,l,p[g+5],4,-378558);l=md5_hh(l,o,n,m,p[g+8],11,-2022574463);m=md5_hh(m,l,o,n,p[g+11],16,1839030562);n=md5_hh(n,m,l,o,p[g+14],23,-35309556);o=md5_hh(o,n,m,l,p[g+1],4,-1530992060);l=md5_hh(l,o,n,m,p[g+4],11,1272893353);m=md5_hh(m,l,o,n,p[g+7],16,-155497632);n=md5_hh(n,m,l,o,p[g+10],23,-1094730640);o=md5_hh(o,n,m,l,p[g+13],4,681279174);l=md5_hh(l,o,n,m,p[g+0],11,-358537222);m=md5_hh(m,l,o,n,p[g+3],16,-722521979);n=md5_hh(n,m,l,o,p[g+6],23,76029189);o=md5_hh(o,n,m,l,p[g+9],4,-640364487);l=md5_hh(l,o,n,m,p[g+12],11,-421815835);m=md5_hh(m,l,o,n,p[g+15],16,530742520);n=md5_hh(n,m,l,o,p[g+2],23,-995338651);o=md5_ii(o,n,m,l,p[g+0],6,-198630844);l=md5_ii(l,o,n,m,p[g+7],10,1126891415);m=md5_ii(m,l,o,n,p[g+14],15,-1416354905);n=md5_ii(n,m,l,o,p[g+5],21,-57434055);o=md5_ii(o,n,m,l,p[g+12],6,1700485571);l=md5_ii(l,o,n,m,p[g+3],10,-1894986606);m=md5_ii(m,l,o,n,p[g+10],15,-1051523);n=md5_ii(n,m,l,o,p[g+1],21,-2054922799);o=md5_ii(o,n,m,l,p[g+8],6,1873313359);l=md5_ii(l,o,n,m,p[g+15],10,-30611744);m=md5_ii(m,l,o,n,p[g+6],15,-1560198380);n=md5_ii(n,m,l,o,p[g+13],21,1309151649);o=md5_ii(o,n,m,l,p[g+4],6,-145523070);l=md5_ii(l,o,n,m,p[g+11],10,-1120210379);m=md5_ii(m,l,o,n,p[g+2],15,718787259);n=md5_ii(n,m,l,o,p[g+9],21,-343485551);o=safe_add(o,j);n=safe_add(n,h);m=safe_add(m,f);l=safe_add(l,e)}return Array(o,n,m,l)}function md5_cmn(h,e,d,c,g,f){return safe_add(bit_rol(safe_add(safe_add(e,h),safe_add(c,f)),g),d)}function md5_ff(g,f,k,j,e,i,h){return md5_cmn((f&k)|((~f)&j),g,f,e,i,h)}function md5_gg(g,f,k,j,e,i,h){return md5_cmn((f&j)|(k&(~j)),g,f,e,i,h)}function md5_hh(g,f,k,j,e,i,h){return md5_cmn(f^k^j,g,f,e,i,h)}function md5_ii(g,f,k,j,e,i,h){return md5_cmn(k^(f|(~j)),g,f,e,i,h)}function safe_add(a,d){var c=(a&65535)+(d&65535);var b=(a>>16)+(d>>16)+(c>>16);return(b<<16)|(c&65535)}function bit_rol(a,b){return(a<<b)|(a>>>(32-b))};
