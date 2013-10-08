M.one = function( selector, parent )
{
	var result = jQuery( selector );

	if( parent )	
		result = jQuery( parent ).find( selector );
		
	return result[0];
};

M.all = function( selector, parent )
{
	var result = jQuery( selector );

	if( parent )	
		result = jQuery( parent ).find( selector );
		
	return result;
};

M.append = function( element, content )
{
	return jQuery( element ).append( content );
};

M.mask = function( element, text )
{
	return jQuery( element ).mask(text);
};

M.unmask = function( element )
{
	return jQuery( element ).unmask();
};

M.getSelected = function( element )
{
	return jQuery(element).find(":selected")[0]
}

M.isMasked = function( element )
{
	return jQuery( element ).isMasked();
};

M.wrap = function( element, content )
{
	return jQuery( element ).wrap( content );
};

M.trimString = function( string, count )
{
	return string.substring(0, count) + "...";
};

// Merge Arrays
M.merge = function( first, second )
{
	return jQuery.merge( first, second );
};

// Merge objects
M.extend = function( first, second )
{
	return jQuery.extend( first, second );
};

M.browser = function()
{
	return jQuery.browser;
};

M.ie = function()
{
	var version = 0;
	
	if( jQuery.browser.msie == true )
	{
		version = jQuery.browser.version;
		
		if ( version.length > 3 )
			version = jQuery.browser.version.slice(0, 2);
		else
			version = jQuery.browser.version.slice(0, 1);
	}
	
	return version;
};

M.delegate = function( parent, selector, eventType, handler )
{
	return jQuery(parent).delegate( selector, eventType, handler );
};

M.on = function( selector, eventType, handler )
{
	return jQuery(selector).on( eventType, handler );
};

M.css = function( container, property, value )
{
	return  jQuery(container).css( property, value );
};

M.addClass = function( element, className )
{
	jQuery(element).addClass(className);
};
		
M.removeClass = function( element, className)
{
	jQuery(element).removeClass(className);
};

M.hasClass = function( element, className )
{
	return jQuery(element).hasClass(className);
};

M.decodeHTML = function( encodedString )
{
	return jQuery("<div/>").html(encodedString).text();
};

M.queryStringParameter = function( name, caseInsensitive ) {
	
	var location = decodeURIComponent(window.location.search);
	
	if (caseInsensitive)
	{
		name = name.toLowerCase();
		location = location.toLowerCase(); 
	}
	
    var match = RegExp('[?&]' + name + '=([^&]*)')
                    .exec(location);

    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
};

/*
 * Share Store locator related data via Facebook, Twitter and Email
 * 
 * shareTarget: POINT or ITINERARY
 */
M.share = function( shareTarget, shareEngine, options ){
	
	options = options || {};
	var url = "";
	
	var language = "";
	
	if (M.Settings.language)
		language = "&LANGUAGE=" + M.Settings.language;
	
	switch ( shareTarget.toLowerCase() )
	{
		case 'point':
		{
			options.sharedField = options.sharedField || "id";
			options.sharedValue = options.sharedValue || options.point.pointId;
			
			url = M.Settings.shareUrl + 
				  "mapurl.html?key=" + M.Settings.key +
				  language + 
				  "&customer=" + M.Settings.customer +
				  "&tableName=" + M.Settings.tableName;
				  
			url = encodeURIComponent( url + "&" + options.sharedField + "=" + options.sharedValue );
			
			break;
		}
		
		case 'itinerary':
		{
			var itineraryParameters = "&startAddress=" + options.itinerary.startAddress +
									  "&endAddress=" + options.itinerary.endAddress +
									  "&endAddressString=" + options.itinerary.endAddressString +
									  "&travelMode=" + options.itinerary.travelMode;
									  
			url = M.Settings.shareUrl + 
				  "itineraryurl.html?key=" + M.Settings.key +
				  language + 
				  "&customer=" + M.Settings.customer;
				  
			url = encodeURIComponent( url + itineraryParameters );
			
			break;
		}
	}
	

	
	switch (shareEngine.toLowerCase())
	{
		case 'facebook':
		{
			url = decodeURIComponent( url );
			url = encodeURI( url );  
			
			this.dataManager = M.DataManager.getInstance();
			
			this.dataManager.shortenUrl( url, function( data ){
				
				var windowWidth = "660";
				var windowHeight = "280";
			    var centerWidth = (window.screen.width - windowWidth) / 2;
	    		var centerHeight = (window.screen.height - windowHeight) / 2;
				
				window.open(
					"http://www.facebook.com/sharer/sharer.php?u=" + data.id + "&t=test",
					null,
					"resizable=0,width=" + windowWidth + 
					",height=" + windowHeight +
					",left=" + centerWidth + 
					",top=" + centerHeight
				);
				
			} );
			
			break;
		}
		
		case 'twitter':
		{
			url = decodeURIComponent( url );
			url = encodeURI( url );  
			
			this.dataManager = M.DataManager.getInstance();
			
			this.dataManager.shortenUrl( url, function( data ){
				
				var windowWidth = "660";
				var windowHeight = "280";
			    var centerWidth = (window.screen.width - windowWidth) / 2;
	    		var centerHeight = (window.screen.height - windowHeight) / 2;
				
				window.open(
					'https://twitter.com/share?url=' + data.id, 
					null, 
					"resizable=yes,width=" + windowWidth + 
					",height=" + windowHeight +
					",left=" + centerWidth + 
					",top=" + centerHeight
				);
			} );
			
			break;
		}
		
		case 'mail':
		{
			options.mail = options.mail || {};
			
			var windowWidth = options.mail.windowWidth || "355";
			var windowHeight = options.mail.windowHeight || "320";
		    var centerWidth = (window.screen.width - windowWidth) / 2;
    		var centerHeight = (window.screen.height - windowHeight) / 2;
			
			var language = "";
			
			if (M.Settings.language)
				language = "&LANGUAGE=" + M.Settings.language;
			
			var emailUrl = 	'target=' + shareTarget + 
							language +
							'&url=' + url +
							'&name=' + options.mail.name + 
							'&address=' + options.mail.address +
							'&zip=' + options.mail.zip + 
							'&city=' + options.mail.city +
							'&country=' + options.mail.country +
							'&description=' + options.mail.description +
							'&tel=' + options.mail.tel +
							'&fax=' + options.mail.fax +
							'&email=' + options.mail.email +
							'&web=' + options.mail.web +
							'&openHours=' + options.mail.openHours
							
			emailUrl = encodeURIComponent(emailUrl);
			window.open('email.html?' + emailUrl, 
						null, 
						"resizable=0,width=" + windowWidth + 
						",height=" + windowHeight +
						",left=" + centerWidth + 
						",top=" + centerHeight
			);
			
			break;
		}
	}
};

M.shareMobile = function (pointID, shareEngine)
{
	var url = M.Settings.shareUrl + "?pointID=" + pointID;
	
	url = decodeURIComponent( url );
	url = encodeURI( url );  
	
	this.dataManager = M.DataManager.getInstance();
			
	switch (shareEngine.toLowerCase())
	{
		case 'facebook':
		{
			this.dataManager.shortenUrl( url, function( data ){
				var a = document.createElement("a");
				a.setAttribute("href", "http://www.facebook.com/sharer/sharer.php?u=" + data.id);
			    a.setAttribute("target", "_blank");
			
			    var dispatch = document.createEvent("HTMLEvents")
			    dispatch.initEvent("click", true, true);
			    a.dispatchEvent(dispatch);
			} );
			
			break;
		}
		
		case 'twitter':
		{
			this.dataManager.shortenUrl( url, function( data ){
				var a = document.createElement("a");
				a.setAttribute("href", "https://twitter.com/share?url=" + data.id);
			    a.setAttribute("target", "_blank");
			
			    var dispatch = document.createEvent("HTMLEvents")
			    dispatch.initEvent("click", true, true);
			    a.dispatchEvent(dispatch);
			} );
			
			break;
		}
	}
	
};

M.scrollTop = function( container, parent, elementToScrollTo, offset )
{
	jQuery(parent).scrollTop(0);
	
	//if nothing to scroll, do nothing
	if ( !jQuery(elementToScrollTo).offset() )
		return;
	
	jQuery(parent).animate(
		{ 
			scrollTop: jQuery(elementToScrollTo).offset().top - jQuery(container).offset().top - offset
		 }, 
		 { 
		 	duration: 300 
		 } );
};

M.toggle = function ( selector, duration, callback, easing )
{
	if ( !easing )
		jQuery(selector).toggle( duration, callback );
	else
		jQuery(selector).toggle( duration, easing, callback );
};

M.slideToggle = function ( selector, duration, easing, callback )
{
	if ( !easing )
		jQuery(selector).slideToggle( duration, callback );
	else
		jQuery(selector).slideToggle( duration, easing, callback );
};

M.height = function ( selector, height )
{
	jQuery(selector).height( height );
};

M.width = function ( selector, width )
{
	jQuery(selector).width( width );
};

M.isString = function(input)
{
    return typeof(input)=='string';
};

M.stringToBoolean = function(string){
	if (M.isString(string))
	{
        switch(string.toLowerCase()){
                case "true": case "yes": case "1": return true;
                case "false": case "no": case "0": case null: return false;
                default: return Boolean(string);
        }
     }
     
     return string;
};

M.NumberFormat = function( nStr, thousandSeparator, decimals, decimalSeparator )
{
	if( !decimals)
		nStr = Math.ceil(Number(nStr));
	else
		nStr = Number(nStr).toFixed( decimals );
	
	if (!thousandSeparator)
		thousandSeparator = " ";
		
	if (!decimalSeparator)
		decimalSeparator = "";
		
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? decimalSeparator + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + thousandSeparator + '$2');
	}
	
	return x1 + x2;
}

M.openFancyBox = function( urls )
{
	//do not open fancy box if nothing to open
	if ( urls.length > 0 )
		$.fancybox.open(urls);
}

M.UrlContainsHash = function()
{
	if (window.location.hash != '')
		return true;
	
	return false;
}

/*
 * Sets the hash in the URL
 * @param content - array of values to be put in the URL hash
 * @param separator - used for separating the values in the 'content' array
 */
M.setUrlHash = function( content, separator )
{
	if ( !content || content.length == 0)
	{
		window.location.hash = '';
		return;
	}
	
	var hash = '';
	
	separator = separator || '/';
	
	for ( var i=0; i < content.length - 1; i++ )
	{
		hash = hash + content[i] + separator;
	}
	
	hash = hash + content[content.length - 1];
	
	window.location.hash = hash;
}

/*
 * Gets the hash present in the URL in the form
 * of an array separated by the given or default separator
 * @param separator - separator if multiple values present in the URL hash
 */
M.getUrlHash = function( separator )
{
	separator = separator || '/';
	
	var hash = window.location.hash;
	
	if (!hash || hash == '')
		return;
		
	var hashSplitted = hash.split(separator);
	
	return hashSplitted;
}

if (!Array.prototype.indexOf)
{
  Array.prototype.indexOf = function(elt /*, from*/)
  {
    var len = this.length >>> 0;

    var from = Number(arguments[1]) || 0;
    from = (from < 0)
         ? Math.ceil(from)
         : Math.floor(from);
    if (from < 0)
      from += len;

    for (; from < len; from++)
    {
      if (from in this &&
          this[from] === elt)
        return from;
    }
    return -1;
  };
}

if(typeof String.prototype.trim !== 'function') {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, ''); 
  }
}

