var meta = <><![CDATA[
// ==UserScript==
// @name           豆瓣电台dbscrobbler
// @namespace      http://whosemind.net
// @description    记录 douban.fm 到last.fm
// @include        http://douban.fm/
// @include        http://douban.fm/?*
// @require        https://github.com/justan/gmscrobber/raw/master/simple_scrobbler.js
// @version        0.1
// @uso:script     98833
// ==/UserScript==
]]></>.toString();

meta = uso.metaParse(meta);
uso.check(meta);

(function(){
var douban = function(){
	var ready = function(){
		var ex = unsafeWindow.extStatusHandler,
			cmds = {start:"start", end:"e", next:"s", like: "r", unlike: "u"};
			
		if(!sc.sk){
			return;
		}
		unsafeWindow.extStatusHandler = function(o){
			var song, album;
			log(o);
			o = JSON.parse(o);
			song = o.song;
			
			song.album = song.albumtitle;
			song.duration = song.len || 180;
			
			if(song.artist == "豆瓣电台"){
				return;
			}else if(/\.{3}$/.test(song.album)){
				log("一个省略的专辑名...");
				//album = getalbum()
			}
			switch(o.type){
			case cmds.start:
				setTimeout(function(){
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
							}
						}
						document.getElementById("radioplayer").parentNode.title = "在last.fm中记录 " + p.len + " 次";
					});
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
			default:
				break;
			}
			
			return ex.apply(this, arguments);
			//ex(o);
		};
	},
	sc = new Scrobbler({name: "豆瓣电台", type: 1, ready: ready});
};

unsafeWindow.Do('douban', 'counter', 'coverflow', function() {
	setTimeout(function(){
		unsafeWindow.extStatusHandler ? douban() : log("init error");
	}, 0);
});
})();