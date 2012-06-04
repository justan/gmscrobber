# [GMscrobber](http://whosemind.net/content/gmscrobber/) - Scrobble Anywhere

gmscrobber 的目标是提供一种简单的方法来将在线播放的音乐记录到 [last.fm](http://last.fm).
安装 gmscrobber 需要 [greasemonkey](http://www.greasespot.net/) 或者兼容环境(如 chrome + Tampermonkey 或 firefox + greasemonkey)

## 网站支持
目前支持的网站有: [豆瓣电台](http://douban.fm/), [谷歌音乐](http://g.top100.cn/16667639/html/player.html#loaded), [Google Music](http://music.google.com)

## 编写你自己的 scrobbler
使用 gmscrobber 将使编写你自己的 scrobbler 变得非常简单, 如果已有 javascript 和 userscript 的编写经验, 写一个 scrobbler 只需要以下几步: 

  1. 在你喜欢的在线音乐播放页面新建一个用户脚本文件, 引入 simple_scrobbler_user: 
   `// @require       https://raw.github.com/justan/gmscrobber/master/simple_scrobbler_user.js`
  2. 创建一个 Scrobber 示例: 
   `var scrobber = new Scrobber({name: '在线音乐', ready: init}`
  3. 创建你自己的播放器监控方法. 这是你代码的核心部分, 后面会详细讨论这一部分. 当歌曲开始播放的时候调用: 
   `scrobber.nowPlaying({name: 'Wish You Were Here', artist: 'Pink Floyd', duration: 280, album: 'Wish You Were Here'})`
  4. 大功告成

### 附加工具
require *simple_scrobbler_user* 后, 将会附送的几个可能有用的工具, 放置于 `uso` 对象中: 
    * `uso.metaParse` userscript 的meta解析函数
    * `uso.check` userscript.org 上脚本的自动升级工具
    * `uso.watchContent` 页面文字变化监控工具

### 关于页面播放器监控
目前有两种办法监控页面的播放状态:
  
  1. 最为普遍的, 可以设定时器监控页面歌曲信息变化, 如([谷歌音乐 scrobber](https://github.com/justan/gmscrobber/blob/master/gmscrobbler.user.js)).
  2. 在页面播放器有公开的播放状态变化函数的时候, 可以选择重新封装该函数, 如[豆瓣电台 scrobber](https://github.com/justan/gmscrobber/blob/master/dbscrobbler.user.js): 
  
```javascript
var ex = unsafeWindow.extStatusHandler;
unsafeWindow.extStatusHandler = function(){
  //your code here
  return ex.apply(this, arguments);
};
```