---
layout: default
---

# [GMscrobber](http://justan.github.com/gmscrobber/) - Scrobble Anywhere

>某个时候听了某个音乐，因此自己心中的什么，发生了很大的变化…之类的

gmscrobber 的目标是提供一种简单的方法来将在线播放的音乐记录到 [last.fm](http://last.fm).
安装 gmscrobber 需要 [greasemonkey](http://www.greasespot.net/) 或者兼容环境(如 chrome + Tampermonkey 或 firefox + greasemonkey)

## GMscrobber 的特点
  
  * 安全. 使用 last.fm 2.0 API 的 [WEB Authentication ](http://cn.last.fm/api/webauth). 只需在last.fm官方网站上输入用户名密码.
  * 非侵入式. 
  * 红星同步, 不记录豆瓣电台广告到 last.fm
  * 程序内可停止使用:>
  * 歌词支持. lrc 同步歌词输出在浏览器的 javascript 控制台(一般按 _F12_ 或 _Ctrl + Shift + K_ 打开)

## 网站支持
目前支持的网站有: [豆瓣电台](http://douban.fm/), [Google Music](http://music.google.com), [QQ 音乐](http://music.qq.com), [百度音乐盒](http://play.baidu.com), [网易云音乐](http://music.163.com), [虾米电台/虾米播放器](http://www.xiami.com)

## 下载<a name='下载'></a>

  - [豆瓣电台 scrobbler](dbscrobbler.user.js)
  - [QQ 音乐 scrobbler](qqmusicscrobber.user.js)
  - [网易云音乐 scrobbler](163_music_scrobbler.user.js)
  - [虾米音乐 scrobbler](GMscrobbler_for_xiami.user.js)
  - [百度随心听 scrobbler](baidufmscrobber.user.js)

基础支持(不支持红星同步): 

  - [Google Play scrobbler](gmscrobbler.user.js)
  - [百度音乐盒 scrobbler](baidumusicscrobber.user.js)
  - [Bus.fm scrobbler](bus.fm_scrobber.user.js)
  - [QQ 音乐电台 scrobbler](qqfmscrobber.user.js)

## 使用
在网站上首次使用 gmscrobbler 需要 last.fm 的认证. 认证以后, 脚本会自动运行. 认证操作如下:

  1. 下载安装对应网站的用户脚本.
  2. 打开需要记录的音乐网站.
  3. 在 greasemonkey(或其他兼容扩展) 命令菜单中选中 "开始记录..."
  4. 上一步会跳转到 last.fm 网站中进行认证. 确认后整个过程即已完成.
  
## 歌词
通过 [@solos] 的[歌词迷API](http://api.geci.me/en/latest/index.html), gmscrobbler 也对正在收听的歌曲提供了简单的在线歌词. 输出在浏览器的 javascript 控制台中(如在 Firefox 中 ctrl + shift + j 打开).

## 编写你自己的 scrobbler
使用 GMscrobber 将使编写你自己的 scrobbler 变得非常简单, 如果已有 javascript 和 userscript 的编写经验, 写一个 scrobbler 只需要以下几步: 

  1. 在你喜欢的在线音乐播放页面新建一个用户脚本文件, 引入 simple_scrobbler_user:   

         // @require  https://raw.github.com/justan/gmscrobber/master/simple_scrobbler_user.js
   
  2. 创建一个 Scrobber 实例:   
   `var scrobber = new Scrobber({name: '在线音乐', ready: init})`
   
  3. 创建你自己的播放器监控方法. 这是你代码的核心部分, [后面](#关于页面播放器监控)会详细讨论这一部分. 当歌曲开始播放的时候调用:   
     
         scrobber.nowPlaying({
           name: 'Wish You Were Here',//歌名
           artist: 'Pink Floyd',//歌手
           duration: 280,//曲长
           album: 'Wish You Were Here'//专辑名
         });
      
  4. 大功告成

### 关于页面播放器监控<a name='关于页面播放器监控'></a>
目前有两种办法监控页面的播放状态:
  
  1. 最为普遍的, 我们并不清楚页面播放器的代码结构, 此种情况下可以编写一个页面歌曲信息获取函数, 将其传给  `scrobber.setSongInfoFN`, 剩下的 gmscrobber 会聪明的处理好. 示例: [QQ 音乐 scrobber](https://github.com/justan/gmscrobber/blob/master/qqmusicscrobber.user.js).
  2. 在页面播放器有可访问的播放状态变化函数的时候, 可以选择重新封装该函数. 如[豆瓣电台 scrobber](https://github.com/justan/gmscrobber/blob/master/dbscrobbler.user.js):   

         var ex = unsafeWindow.extStatusHandler;
         unsafeWindow.extStatusHandler = function(songChangeInfo){
           //your code here
           return ex.apply(this, arguments);
         };
    
### scrobber 编写示例

  * [怎样记录 QQ 音乐到 last.fm](http://blog.whosemind.net/blog/2012/06/15/zen-yang-ji-lu-qqyin-le-dao-last-dot-fm/)

  
## [userscripts.org](https://userscripts.org/) 上的GMscrobber

  * [豆瓣电台 scrobbler](https://userscripts.org/scripts/show/98833)
  * [<del>谷歌音乐(g.cn/music) scrobbler</del>](https://userscripts.org/scripts/show/92863)
  * [Google music scrobbler](https://userscripts.org/scripts/show/111546)
  * [QQ 音乐](https://userscripts.org/scripts/show/136050)


联系
---
有任何问题, 欢迎提交到 [Github issue] 上.


[@solos]: https://github.com/solos
[Github issue]: https://github.com/justan/gmscrobber/issues?state=open
