var meta = <><![CDATA[
// ==UserScript==
// @name           豆瓣电台dbscrobbler
// @namespace      http://gmscrobber.whosemind.net
// @description    记录 douban.fm 到last.fm
// @include        http://douban.fm/
// @include        http://douban.fm/?*
// @require        https://raw.github.com/justan/gmscrobber/master/simple_scrobbler_user.js
// @version        0.1.7
// @uso:script     98833
// @changelog      修正豆瓣长专辑名缺失问题
// @initiative     false
// @updateURL      http://userscripts.org/scripts/source/98833.meta.js
// ==/UserScript==
]]></>.toString();

meta = uso.metaParse(meta);
uso.check(meta.version, meta.uso.script);

(function(){
var douban = function(){
	var ready = function(){
		var ex = unsafeWindow.extStatusHandler,
			cmds = {start:"start", end:"e", next:"s", like: "r", unlike: "u", ban: 'b'};
			
		if(!sc.sk){
			return;
		}
		unsafeWindow.extStatusHandler = function(info){
			var song, albuminfo, o = info;
			log(o);
			o = JSON.parse(o);
			song = o.song;
			
      albuminfo = song.album;
			song.album = song.albumtitle;
			song.duration = song.len || 180;
			
			setTimeout(function(){
				if(song.ssid == null || song.subtype == "T"){
					log("无效歌曲, 跳过...");
					return;
				}
				var conn = "&";
				switch(o.type){
				case cmds.start:
					if(/\.{3}$/.test(song.album)){
						if(o.type == cmds.start){
							//song.album = "";
							getAlbum(albuminfo, function(at){
								sc.song.album = at;
								log("一个省略的专辑名...新的专辑名是: " + at);
							});
						}
					}
					//song.artist = song.artist.replace(/\s+\/\s+.+$/,"");//多个歌手，就保留第一个
					//song.artist = song.artist.replace(/\s*[\/\&]\s*/, " & ");
					
					song.artist = song.artist.split(/\s*[\/\&\;]\s*/);
					for(var i = 0, l = song.artist.length; i < l; i++){
						if(/\w/.test(song.artist)){
							conn = " & ";//英文名用" & "分割
							break;
						}
					}
					song.artist = song.artist.join(conn);
          song._doubanuname = unsafeWindow.$("#fm-user").text();
					sc.nowPlaying(song);
					sc.getInfo(song, function(p){
						log(JSON.stringify(p));
						if(song.like != p.islove){
							if(song.like){
								log("love " + song.title + "in last.fm");
								sc.love();
							}else{
								log("love " + song.title + "in douban.fm");
								o.type = cmds.like;
								ex(JSON.stringify(o));
								o.type = cmds.start;
								xhr({
									method: "GET",
									url: "http://douban.fm/j/mine/playlist?type=r&sid=" + o.song.sid + "&channel=0",
									onload: function(data){
										log("同步红星至豆瓣电台成功");
									},
									onerror: function(e){
										log("同步红星至豆瓣电台失败.. \n" + JSON.stringify(e));
									}
								});
							}
						}
						document.getElementById("radioplayer").parentNode.title = "在last.fm中记录 " + p.len + " 次";
					});
					break;
				case cmds.end:
					sc.scrobble();
					break;
				case cmds.like:
					sc.love();
					break;
				case cmds.unlike:
					sc.unlove();
					break;
				default:
					break;
				}
			
			}, 0);
			
			return ex.apply(this, arguments);
			//ex(o);
		};
	},
	sc = new Scrobbler({name: "豆瓣电台", type: 1, ready: ready}),
	getAlbum = function(info, cb){
		var url = "http://api.douban.com/music" + info.replace(/\/$/, '') + "?alt=json";
		xhr({
			method: "GET",
			url: url,
			onload: function(d){
				cb(JSON.parse(d.responseText)["title"]["$t"]);
			},
			onerror: function(e){
				log("专辑信息获取失败.. \n" + JSON.stringify(e));
			}
		});
	};
};

unsafeWindow.Do.ready(function() {
	setTimeout(function(){
		unsafeWindow.extStatusHandler ? douban() : log("init error");
	}, 1000);
});
})();
