/* Credit: https://gist.github.com/thinkAmi */

function doGet(e) {
  var bsn = e.parameter.bsn;
  if (bsn === undefined) {
    bsn = 24044;
  }
  var params = '?bsn=' + bsn + '&subbsn=0';
  var rss = makeRss();
  var link = 'https://forum.gamer.com.tw/B.php' + params;
  var timezone = 'GMT+8:00';
  var language = 'zh-TW';
  var atomLink = ScriptApp.getService().getUrl() + params;

  rss.setLink(link);
  rss.setLanguage(language);
  rss.setAtomlink(atomLink);

  var html = UrlFetchApp.fetch(link).getContentText();
  var rssTitle = /<title>(.+?)<\/title>/.exec(html)[1];
  //var rssTitle = $(html).find("title").text();
  //var rssTitle = link;
  var rssLink = link;
  //var rssDescription = "我來試試看啊"; 
  Logger.log(rssTitle);
  rss.setTitle(rssTitle);
  //rss.setDescription(rssDescription);
  rss.setLink(link);

  var match;
  //var pattern = /<tr class="b-list__row"?>[^]*?<td class="b-list__main"[^]*?><a href="(.+?)">(.+?)<\/a>[^]*?<td class="b-list__count">[^]*?<td class="b-list__time">[^]*?href="(.+?)".+?target="_blank">(.+?)<\/a>/g;
  
  var _trs = searchNeedle(html, '<tr class="b-list__row">', '" class="b-list__main__title">');
  //var _urls = searchNeedle(html, '<td class="b-list__main">\n<a data-gtm="B頁文章列表" href="', '" class="b-list__main__title">');
  var _limit = 2;
  //rss.setDescription(_trs.length);
  
  for (var _i in _trs) {
    //var link_url = _urls[_i];
    var _tr = _trs[_i];
    var link_url = searchNeedle(_tr, '<td class="b-list__main">\n<a data-gtm="B頁文章列表" href="')[0];
    
    var post_url = "";
    // C.php?bsn=24044&snA=52610&tnum=123&page=5
    
    //if (/^C\.php/.exec(link_url)) {
    if (link_url.indexOf("C.php") === 0) {
      post_url = 'https://forum.gamer.com.tw/' + link_url;
      // https://forum.gamer.com.tw/C.php?bsn=24044&snA=52610&tnum=123&page=5
    //} else if (/^\/\/forum/.exec(link_url)) {
    //  post_url = 'https:' + link_url
    } else {
      // 本討論串已無文章
      continue;
    }
    //url = "https://forum.gamer.com.tw/" + link_url;
    
    /*
    rss.addItem({
      title: "測試 " + link_url,
      link: post_url,
      description: "測試描述",
      pubDate: "2018-07-19 09:37:23",
      timezone: timezone,
    });
    
    continue;
    */
    

    //Logger.log(url);

    var commentId = /tnum=(\d+)/.exec(post_url)[1];
    var commentId = 1;
    var post_html = UrlFetchApp.fetch(post_url).getContentText();
    /*
    var post_pattern = /<h1 class="c-post__header__title ">(.+?)<\/h1>[^]*?class="userid" target="_blank">(.*?)<\/a>[^]*?data-mtime="(.*?)" data-area="C">/g;
    
    var post_match = post_pattern.exec(post_html);
    if (!post_match) {
      // 文章已刪除
      continue;
    }
    */
    /*
    var post_match = ["標題", "作者", "2018-07-19 09:37:23", "測試"];
    
    var title = post_match[1];
    var author = post_match[2];
    var pubDate = post_match[3];
    //var desc = post_match[4];
    var desc = "測試";
    */
    var title = searchNeedle(post_html, '<h1 class="c-post__header__title', '</h1>')[0];
    title = searchNeedle(title, '>')[0];
    var author = searchNeedle(post_html, '" class="username" target="_blank">', '</a>\n<a href="//home.gamer.com.tw/')[0];
    var pubDate = searchNeedle(post_html, 'class="edittime tippy-post-info" data-hideip="', '" data-area="C">')[0];
    pubDate = searchNeedle(pubDate, '" data-mtime="')[0];
    //var pubDate = "2018-07-19 09:37:23";
    var desc = searchNeedle(post_html, '<div class="c-article__content">', '\n</div>\n</article>')[0];
    if (desc.lastIndexOf("</div>") === desc.length - 6) {
      desc = desc.substr(0, desc.length - 6);
    }

    if (desc !== undefined) {
      desc = desc.replace(/ data-src="/g,' src="');
    }
    
    /*
    Logger.log(commentId);
    Logger.log(title);
    Logger.log(pubDate);
    //Logger.log(formatDate(pubDate));
    Logger.log(pubDate);
    Logger.log(author);
    // Logger.log(desc);
    */
    
    rss.addItem({
      title: title,
      author: author,
      link: post_url,
      description: desc,
      //pubDate: formatDate(pubDate),
      pubDate: formatDate(pubDate),
      timezone: timezone,
      comment: pubDate,
    });
    
    if (_i > _limit) {
      break;
    }
  } // while (match = pattern.exec(html)) {

  return ContentService.createTextOutput(rss.toString())
  .setMimeType(ContentService.MimeType.RSS);
}

// ------------------------------------------------------------------------------

var makeRss = function(){
  var channel = XmlService.createElement('channel');
  var root = XmlService.createElement('rss')
  .setAttribute('version', '2.0')
  .setAttribute('xmlnsatom', "http://www.w3.org/2005/Atom")
  .addContent(channel);

  var title = '';
  var link = '';
  var description = '';
  var language = '';
  var atomlink = '';
  var items = {};

  var createElement = function(element, text){
    return XmlService.createElement(element).setText(text);
  };


  return {
    setTitle: function(value){ title = value; },
    setLink: function(value){ link = value; },
    setDescription: function(value){ description = value; },
    setLanguage: function(value){ language = value; },
    setAtomlink: function(value){ atomlink = value; },

    addItem: function(args){
      if (typeof args.title === 'undefined') { args.title = ''; }
      if (typeof args.author === 'undefined') { args.author = ''; }
      if (typeof args.link === 'undefined') { args.link = ''; }
      if (typeof args.description === 'undefined') { args.description = ''; }
      if (!(args.pubDate instanceof Date)) { throw 'pubDate Missing '  + args.comment ; }
      if (typeof args.timezone === 'undefined') { args.timezone = "GMT"; }
      if (typeof args.guid === 'undefined' && typeof args.link === 'undefined') { throw 'GUID ERROR'; }

      var item = {
        title: args.title,
        link: args.link,
        author: args.author,
        description: args.description,
        pubDate: Utilities.formatDate(args.pubDate, args.timezone, "EEE, dd MMM yyyy HH:mm:ss Z"),
        guid: args.guid === 'undefined' ? args.link : args.link
      };

      items[item.guid] = item;
    },

    toString: function(){
      channel.addContent(XmlService.createElement("atomlink")
                         .setAttribute('href', atomlink)
                         .setAttribute('rel', 'self')
                         .setAttribute('type', 'application/rss+xml')
                        );

      channel.addContent(createElement('title', title));
      //channel.addContent(createElement('author', author));
      channel.addContent(createElement('link', link));
      channel.addContent(createElement('description', description));
      channel.addContent(createElement('language', language));
      channel.addContent(XmlService.createElement('image')
                         .addContent(createElement("url", "https://m.gamer.com.tw/apple-touch-icon-144x144.png"))
                         .addContent(createElement("title", "哈啦區 - 巴哈姆特"))
                         .addContent(createElement("link", "https://forum.gamer.com.tw/")));


      for (var i in items) {
        channel.addContent(
          XmlService
          .createElement('item')
          .addContent(createElement('title', items[i].title))
          .addContent(createElement('author', items[i].author))
          .addContent(createElement('link', items[i].link))
          .addContent(createElement('description', items[i].description))
          .addContent(createElement('pubDate', items[i].pubDate))
          .addContent(createElement('guid', items[i].guid))
        );
      }

      var document = XmlService.createDocument(root);
      var xml = XmlService.getPrettyFormat().format(document);

      var result = xml.replace('xmlnsatom', 'xmlns:atom')
      .replace('<atomlink href=','<atom:link href=');

      return result;
    }
  };
};

var formatDate = function(dateString) {
  var p = /(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)/;
  var m = p.exec(dateString);
  var year = m[1];
  var month = m[2]
  var day = m[3]
  var hour = m[4]
  var minute = m[5]
  var second = m[6]
  return new Date(year, month - 1, day, hour, minute, second);
};

var searchNeedle = function (text, header, footer) {
  var _output = [];
  var _parts = text.split(header);
  for (var _i = 1; _i < _parts.length; _i++) {
    var _part = _parts[_i].trim();
    if (footer !== undefined) {
      _part = _part.substring(0, _part.indexOf(footer));
    }
    _output.push(_part);
  }
  
  return _output;
  /*
  
  if (_output.length > 1) {
    return _output;
  }
  else {
    return _output[0];
  } 
  */
}
