// ==UserScript==
// @name        萌否电台 scrobbler
// @namespace   https://greasyfork.org/users/8650
// @description 记录萌否电台到 last.fm
// @include     http://moe.fm/listen/*
// @require     https://raw.github.com/justan/lrc/master/lrc.js
// @require     http://justan.github.io/gmscrobber/simple_scrobbler_user.js
// @version     0.1.2
// @run-at      document-end
// @grant       GM_getValue
// @grant       GM_setValue 
// @grant       GM_deleteValue 
// @grant       GM_xmlhttpRequest 
// @grant       GM_registerMenuCommand 
// @grant       unsafeWindow
// @grant       GM_log
// ==/UserScript==

var init = function(){
    log('init');
    scrobber.setSongInfoFN(getSongInfo, {checktime: 4000});
    document.getElementsByClassName('buffer')[0].addEventListener('click', function(e){
        var oldTime = getSongInfo().playTime;
        setTimeout(function(){
            var newTime = getSongInfo().playTime;
            offset = oldTime - newTime;
            scrobber.seek(offset);
        }, 0);
    }, true);
    
    scrobber.on('nowplaying', function(){
        var loveEle = document.getElementsByClassName('button-love')[0];
        loveEle.addEventListener('click', function(e){
            if(loveEle.classList.contains('on')){
                scrobber.love();
            }else{
                scrobber.unlove();
            }
        }, false);
        scrobber.getInfo(scrobber.song, function(info){
            document.getElementsByClassName('radio')[0].title = '在 last.fm 中记录: ' + info.len + ' 次';
            //同步 last.fm 红心歌曲到 萌否电台
            if(info.islove == '1' && loveEle.classList.contains('on') || info.islove == '0' && !loveEle.classList.contains('on')){
                document.getElementsByClassName('button-love')[0].click();
            }
        });
    });
};

var scrobber = new Scrobbler({
    name: '萌否电台',
    ready: init
});

var getSongInfo = function(){
    var song = {};
    var songinfo = document.getElementsByClassName('radio');
    song.title = songinfo[0].getElementsByClassName('playlist_title')[0].innerText.replace(/song.\d{2,} /,'');
    song.artist = songinfo[0].getElementsByClassName('playlist_artist')[0].innerText.replace(/\/ /,'')
    song.duration = timeParse(songinfo[0].getElementsByClassName('time')[0].getElementsByTagName('strong')[0].innerText);
    song.playTime = song.duration + timeParse(songinfo[0].getElementsByClassName('time')[0].getElementsByTagName('span')[0].innerText);
    song.album = songinfo[0].getElementsByClassName('playlist_wiki_title')[0].innerText;
    // console.log(song);
    return song;
};

var timeParse = function(timeStr){
    var ts = timeStr.split(':');
    return ts[0] * 60 + ts[1] * 1;
};