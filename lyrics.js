var lyr = function(){
  var fn = function(title, artist, album){
    xhr({
      method: 'POST',
      url: 'http://www.viewlyrics.com:1212/searchlyrics.htm',
      data: '<?xml version="1.0" encoding="utf-8"?><search filetype="lyrics" artist="' + artist + '" title="' + title + '" />',
      onload: function (d){
        var ele, lyrSrc = '';
        d.responseXML = new DOMParser().parseFromString(d.responseText, "text/xml");
        ele = d.responseXML.getElementsByTagName('fileinfo');
        log(d.responseText);
        for(var i = 0, l = ele.length; i < l; i++){
          //lyrs[i] = {url: ele[i].getAttribute('link'), album: ele[i].getAttribute('album')};
          if(album == ele[i].getAttribute('album')){
            break;
          }
        }
        if(l){
          lyrSrc = ele[i==l?0:i].getAttribute('link');
          log('lyrics link: ' + lyrSrc);
          xhr({
            method: 'GET',
            url: lyrSrc,
            overrideMimeType: 'text/plain; charset=gb2312',
            onload: function(d){
              alert(d.responseText)
            }
          });
        }else{
          log('no lyrics for ' + title);
        }
        //alert(d.responseXML);
      },
      onerror: function (e){
        //alert(JSON.stringify(e));
      }
    });
  };
  return fn;
}();