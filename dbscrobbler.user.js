var meta = <><![CDATA[
// ==UserScript==
// @name           豆瓣电台dbscrobbler
// @namespace      http://whosemind.net
// @description    记录 douban.fm 到last.fm
// @include        http://douban.fm/
// @include        http://douban.fm/?*
// @require        https://github.com/justan/gmscrobber/raw/master/simple_scrobbler_user.js
// @version        0.1.3
// @changelog      同步last.fm红星歌曲到douban.fm
// @uso:script     98833
// ==/UserScript==
]]></>.toString();

meta = uso.metaParse(meta);
uso.check(meta.version, meta.uso.script);

(function(){
var douban = function(){
	var ready = function(){
		var ex = unsafeWindow.extStatusHandler,
			cmds = {start:"start", end:"e", next:"s", like: "r", unlike: "u"};
			
		if(!sc.sk){
			return;
		}
		unsafeWindow.extStatusHandler = function(info){
			var song, album, o = info;
			log(o);
			o = JSON.parse(o);
			song = o.song;
			
			song.album = song.albumtitle;
			song.duration = song.len || 180;//如果没有时间，就3分钟吧
			
			setTimeout(function(){
				if(song.ssid == null || song.subtype == "T"){
					log("广告, 略过...");
					return;
				}
				var conn = "&";
				switch(o.type){
				case cmds.start:
					if(/\.{3}$/.test(song.album)){
						if(o.type == cmds.start){
							song.album = "";
							getAlbum(song.aid, function(at){
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
	getAlbum = function(id, cb){
		var url = "http://api.douban.com/music/subject/" + id + "?alt=json";
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

unsafeWindow.Do('douban', 'counter', 'coverflow', function() {
	setTimeout(function(){
		unsafeWindow.extStatusHandler ? douban() : log("init error");
	}, 0);
});
})();
