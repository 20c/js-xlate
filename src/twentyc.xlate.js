/**
 * seamlessly switch between translations of ui elements and content
 * without page reload
 * 
 * author: Stefan Pratter
 * license: apache
 */

(function($) {

/**
 * twentyc xlate manager
 * @class
 * @static
 * @namespace twentyc
 */

twentyc.xlate = {

  /**
   * initialize xlate enabled elements
   * @method init
   * @param {Object} [config] object literal holding config attributes
   * @param {String} [config.lang="en"] default language
   */

  init : function(config) {

    var config = this.config = $.extend(
      {
        languages : {"en":"english"},
        default : "en"
      }, 
      config
    );

    var count = $('[data-xlate]').length,
        lang;

    this.language = this.default_language();

    // if there are elements which require vocabulary files for translation
    // make sure all the necessary vocabulary files have been loaded at this 
    // point
    if(count > 0) {
      for(lang in config.languages) {
        if(!twentyc.data.has("xlate-"+lang)) {
          throw("Elements using 'data-xlate' attribute found, but missing vocabulary file for language '"+lang+"'");
        }
      }
    }

    // for elements with empty data-xlate attribute automatically set it
    // to the text content of the element
    $('[data-xlate=""]').each(function() {
      $(this).attr("data-xlate", $(this).text());
    });

    // auto-populate language selects
    $('select[rel="xlate-language"]').each(function(idx) {
      var select = $(this),
          i,
          opt;
      
      select.empty();
      
      // populate
      for(i in config.languages) {
        opt = $('<option></option>');
        opt.attr('value', i).
            text(config.languages[i]).
            appendTo(select);
      }

      // trigger translate upon change
      select.change(function(ev) {
        twentyc.xlate.set_language($(this).val());
      });
    });

  },

  set_language : function(lang) {
    console.log("Setting language", lang, this.language);
    if(lang == this.language)
      return;
    this.language = lang;
    this.translate(lang);
  },

  translate : function(lang) {
    $('[data-xlate], [data-xlate-src]').xlate("translate", lang);
  },

  /**
   * return the default language as specified in config
   * during init()
   * @method default_language
   * @return {String} lang default language (eg. 'en')
   */
  
  default_language : function() {
    return this.config["default"];
  }

}

twentyc.xlate.source = new twentyc.cls.Registry();

twentyc.xlate.source.register(
  "Base",
  {
    Base : function(element, lang) {
      this.element = element;
      this.lang = lang;
      this.id = "xlate-source-base";
    },
    load : function(callback) {
      throw("The load() method needs to be overwritten by your class")
    }
  }
);

twentyc.xlate.source.register(
  "get",
  {
    get : function(element, lang) {
      this.Base(element, lang);
      this.url = element.data("xlate-url").replace("%lang%",this.lang);
      this.id = "xlate:"+this.url;
    },
    load : function(callback) {
      if(!twentyc.data.loaders.assigned(this.id))
        twentyc.data.loaders.assign(this.id, "xlateGet");
      twentyc.data.load(this.id, { 
        url : this.url,
        callback : callback
      });
    }
  },
  "Base"
);

/**
 * define a new data getter for retrieving translations from
 * server source
 */

twentyc.data.loaders.register(
  "xlateGet",
  {
    retrieve : function(data) {
      return data;
    }
  },
  "XHRGet"
);

/**
 * jquery xlate plugin
 */

twentyc.jq.plugin(
  "xlate",
  {
    init : function(conf) {
    },
    
    /**
     * translate contents of the elements in jquery resultset
     */
    translate : function(lang) {
      var voc = twentyc.data.get("xlate-"+twentyc.xlate.language);
      this.each(function(idx) {
        var el = $(this);
        var vocId = el.data("xlate");
        var srcId = el.data("xlate-src")
        
        if(typeof vocId == "string") {
          // translate from vocabulary data
          el.html(tc.u.get(voc, vocId, vocId));
        } else if(srcId) { 
          var src = new (twentyc.xlate.source.get(srcId))(el, lang);
          src.load(function(data) {
            el.html(data.data);
          });
        }
      });
    }
  },
  {
  }
);

})(jQuery);
