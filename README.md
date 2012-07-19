# [GMscrobber](http://justan.github.com/gmscrobber/) - Scrobble Anywhere

>某个时候听了某个音乐，因此自己心中的什么，发生了很大的变化…之类的

gmscrobber 的目标是提供一种简单的方法来将在线播放的音乐记录到 [last.fm](http://last.fm).
安装 gmscrobber 需要 [greasemonkey](http://www.greasespot.net/) 或者兼容环境(如 chrome + Tampermonkey 或 firefox + greasemonkey)

## GMscrobber 的特点
  
  * 安全. 使用 last.fm 2.0 API 的 [WEB Authentication ](http://cn.last.fm/api/webauth). 用户只在last.fm官方网站上输入用户名密码.
  * 非侵入式. 和原来的页面融为一体, 就像它原来就在那里.
  * 内置自动升级模块. 紧急升级的时候可以选择主动提示用户升级.
  * 追求完美. 不想随便就记录一首歌曲? 对于开发者, GMscrobber 提供了精确的[歌曲控制](#歌曲控制相关)方法, 想让在 80% 时记录, 就不会在 79% 时记录.
  * 红星同步, 无视豆瓣电台广告...
  * 程序内可停止使用:>
  * 歌词支持(待完成).

## 网站支持
目前支持的网站有: [豆瓣电台](http://douban.fm/), [谷歌音乐](http://g.top100.cn/16667639/html/player.html#loaded), [Google Music](http://music.google.com), [QQ 音乐](http://music.qq.com)

## 编写你自己的 scrobbler
使用 GMscrobber 将使编写你自己的 scrobbler 变得非常简单, 如果已有 javascript 和 userscript 的编写经验, 写一个 scrobbler 只需要以下几步: 

  1. 在你喜欢的在线音乐播放页面新建一个用户脚本文件, 引入 simple_scrobbler_user: 
  
   ```javascript
   // @require  https://raw.github.com/justan/gmscrobber/master/simple_scrobbler_user.js
   ```
   
  2. 创建一个 Scrobber 实例: 
  
   `var scrobber = new Scrobber({name: '在线音乐', ready: init})`
   
  3. 创建你自己的播放器监控方法. 这是你代码的核心部分, [后面](#关于页面播放器监控)会详细讨论这一部分. 当歌曲开始播放的时候调用: 
  
    ```javascript
    scrobber.nowPlaying({
      name: 'Wish You Were Here',//歌名
      artist: 'Pink Floyd',//歌手
      duration: 280,//曲长
      album: 'Wish You Were Here'//专辑名
    });
    ```
    
  4. 大功告成

### 关于页面播放器监控
目前有两种办法监控页面的播放状态:
  
  1. 最为普遍的, 我们并不清楚页面播放器的代码结构, 此种情况下可以编写一个页面歌曲信息获取函数, 将其传给  `scrobber.setSongInfoFN`, 剩下的 gmscrobber 会聪明的处理好. 示例: [QQ 音乐 scrobber](https://github.com/justan/gmscrobber/blob/master/qqmusicscrobber.user.js).
  2. 在页面播放器有可访问的播放状态变化函数的时候, 可以选择重新封装该函数. 如[豆瓣电台 scrobber](https://github.com/justan/gmscrobber/blob/master/dbscrobbler.user.js): 
  
    ```javascript
    var ex = unsafeWindow.extStatusHandler;
    unsafeWindow.extStatusHandler = function(songChangeInfo){
      //your code here
      return ex.apply(this, arguments);
    };
    ```
    
### scrobber 编写示例

  * [怎样记录 QQ 音乐到 last.fm](http://blog.whosemind.net/blog/2012/06/15/zen-yang-ji-lu-qqyin-le-dao-last-dot-fm/)
  
## API
在脚本中 require *simple_scrobbler_user* 后, 将得到两个有效接口:

  * [构造函数 Scrobbler](#scrobbler)
  * [工具集 uso](#附加工具)

### Scrobbler
主要的构造函数, 接收一个对象参数:

`var scrobber = new Scrobber({name: '在线音乐', ready: init})`

`init`: 取得 sesionid 后的回调

提供两类实例方法.

  1. ####last.fm 记录相关:
    * scrobber.nowPlaying
    * scrobber.scrobble
    * scrobber.love
    * scrobber.unlove
    * scrobber.getInfo
    * scrobber.ban
    * scrobber.unban
    
  2. ####歌曲控制相关: 
    * scrobber.play  
    * scrobber.pause  
    * scrobber.buffer 
    * scrobber.stop 
    * scrobber.seek

### 附加工具
在脚本中 require *simple_scrobbler_user* 后, 将会附送的几个可能有用的工具, 放置于 `uso` 对象中: 

  * `uso.metaParse` userscript 的meta解析函数
  * `uso.check` userscript.org 上脚本的自动升级工具
  * `uso.watchContent` 页面文字变化监控工具
  
## [userscripts.org](https://userscripts.org/) 上的GMscrobber

  * [豆瓣电台 scrobbler](https://userscripts.org/scripts/show/98833)
  * [谷歌音乐(g.cn/music) scrobbler](https://userscripts.org/scripts/show/92863)
  * [Google music scrobbler](https://userscripts.org/scripts/show/111546)
  * [QQ 音乐](https://userscripts.org/scripts/show/136050)