
/**
 * Maporama core functions. All functions
 * will be added to M namespace.
 * 
 * @static
 * @module geolibrary
 */
var M = M || {};

M.Singletons = M.Singletons || {};

M.Settings = {
	geoServerUrl: "",
	geoPlatformUrl: "",
	geoPlatformCustomer: "",
	geoRasterServiceUrl:"",
	defaultPolygonLayer: "polygonLayer",
	defaultCityLayer: "cityLayer"
};


M.Engines = {
	OPEN_LAYERS: "openlayers",
	GOOGLE: "google"
};

M.useEvents = function( className )
{
	M.mix( M.EventDispatcher, className  );
};



/**
 * Bind function context.
 * 
 * @method bind
 * @param fn
 * @param c
 */
M.bind = function(fn, c) 
{
    return function() {
        return fn.apply(c || fn, arguments);
    };
};

/**
 * Extend a class
 * 
 * @param subClass
 * @param superClass
 */
M.mix = function(source, dest) {

	var tmp = dest.prototype;
	
	dest.prototype = new source();
	dest.prototype.constructor = dest;
	
	for( var key in tmp )
		dest.prototype[key] = tmp[key];
};

M.JSON = {};
M.JSON.parse = function( data )
{
	//Remove \n
	if ( data )
		data = data.replace(/\n/g, '');
	
	var result = null;
	
	try
	{
		result = eval("x = " + data);
	}
	catch(err) 
	{
	}
	
	return result;
};


M.util = {};
M.util.offset= function(el) {
    // TODO: window margins
    //
    // Okay, so fall back to styles if offsetWidth and height are botched
    // by Firefox.
    
    if (!el.offsetWidth && !el.style)
    	return;
    
    var width = el.offsetWidth || parseInt(el.style.width, 10),
        height = el.offsetHeight || parseInt(el.style.height, 10),
        doc_body = document.body,
        top = 0,
        left = 0;

    var calculateOffset = function(el) {
        if (el === doc_body || el === document.documentElement) return;
        top += el.offsetTop;
        left += el.offsetLeft;

        var style = el.style.transform ||
            el.style.WebkitTransform ||
            el.style.OTransform ||
            el.style.MozTransform ||
            el.style.msTransform;

        if (style) {
            if (match = style.match(/translate\((.+)px, (.+)px\)/)) {
                top += parseInt(match[2], 10);
                left += parseInt(match[1], 10);
            } else if (match = style.match(/translate3d\((.+)px, (.+)px, (.+)px\)/)) {
                top += parseInt(match[2], 10);
                left += parseInt(match[1], 10);
            } else if (match = style.match(/matrix3d\(([\-\d,\s]+)\)/)) {
                var pts = match[1].split(',');
                top += parseInt(pts[13], 10);
                left += parseInt(pts[12], 10);
            } else if (match = style.match(/matrix\(.+, .+, .+, .+, (.+), (.+)\)/)) {
                top += parseInt(match[2], 10);
                left += parseInt(match[1], 10);
            }
        }
    };

    calculateOffset(el);

    try {
        while (el = el.offsetParent) calculateOffset(el);
    } catch(e) {
        // Hello, internet explorer.
    }

    // Offsets from the body
    top += doc_body.offsetTop;
    left += doc_body.offsetLeft;
    // Offsets from the HTML element
    top += doc_body.parentNode.offsetTop;
    left += doc_body.parentNode.offsetLeft;

    // Firefox and other weirdos. Similar technique to jQuery's
    // `doesNotIncludeMarginInBodyOffset`.
    var htmlComputed = document.defaultView ?
        window.getComputedStyle(doc_body.parentNode, null) :
        doc_body.parentNode.currentStyle;
    if (doc_body.parentNode.offsetTop !==
        parseInt(htmlComputed.marginTop, 10) &&
        !isNaN(parseInt(htmlComputed.marginTop, 10))) {
        top += parseInt(htmlComputed.marginTop, 10);
        left += parseInt(htmlComputed.marginLeft, 10);
    }

    return {
        top: top,
        left: left,
        height: height,
        width: width
    }
};


(function( M )
{
	/**
	 * Ajax class is used to make XHR requests.
	 * 
	 * @class Ajax
	 * @module core
	 * @version 0.1.0
	 * 
	 * @constructor Ajax
	 */
	function Ajax()
	{
		//this.createXhr();
	}
	
	Ajax.prototype = {
			
		/**
		 * Creates a new XHR request
		 * depending on the browser. 
		 * 
		 * @method createXhr
		 * @param options {Object}
		 */
		createXhr: function( options )
		{
			if( options )
				this.options = options;
			
			var ajax = this;
			
			//Don't create XDR object if the url points to the origin
			//IE doesn't like to this
			if( this.isIE() && !this.isSameWithOrigin(this.url) )
			{
				//if( this.xhr )
				//	this.xhr.abort();
				
				this.xhr = new XDomainRequest();
				this.xhr.onload = function(){ ajax.onComplete(); };
			    this.xhr.onerror = function() { ajax.onError(); };
			    this.xhr.onprogress = function() {};
			 	this.xhr.ontimeout = function() {};
			}
			else
			{
				if (!!window.XMLHttpRequest) 
				{
					this.xhr = new window.XMLHttpRequest(); // Most browsers
				}
				else if (!!window.ActiveXObject) 
				{
					this.xhr = new window.ActiveXObject('Microsoft.XMLHTTP'); // Some IE
				}
			}
			
			if( !this.xhr )
				throw new Error("Unable to create XHR object!");
			
			
			this.xhr.onreadystatechange = function () 
			{
				 if (this.readyState === 4) 
				 {
				 	//check Session Expired status code (501)
				 	if (this.status == 501)
						ajax.onSessionTimeout();
					else
					{	
						if (this.status >= 400 || this.status == 0)
							ajax.onError();
						else
							ajax.onComplete();
					}
				  }
			 };
			 
			 this.xhr.onprogress = function() {};
			 this.xhr.ontimeout = function() {};
			 
			 return;
		},
		
		abort: function()
		{
			this.xhr.abort();
		},
		
		/**
		 * Helper function for IE check.
		 * 
		 * @method isIE
		 */
		isIE: function()
		{
			if (navigator.appVersion.indexOf("MSIE") != -1)
				return true;
			
			return false;
		},
		
		/**
		 * Helper function to compare the domains of two URLs
		 * 
		 * @method isSameWithOrigin
		 */
		isSameWithOrigin: function ( url )
		{
			// if url path is relative, url path is same with origin
			if (url.indexOf("http") == -1)
				return true;
			
			var reg = new RegExp("^http(s)?://.*?(/|$)","i");
			
			var newHost = reg.exec(url)[0];
			var originHost = reg.exec( window.location.href)[0];
			
			return  ( originHost === newHost );
		},
		
		attachIsAjaxParameter: function( url )
		{
			var isQueryString = false;
			
			for (var i=0; i<url.length; i++)
			{
				if (url.charAt(i) == '?')
				{
					url = url + "&isajax=true";
					isQueryString = true;
					
					break;
				}
			}
			
			if (!isQueryString)
			{
				url = url + "?isajax=true";
			}
			
			return url;
		},
		
		/**
		 * Send XHR request to server.
		 * 
		 * @param url
		 * @param options
		 */
		send: function( url, options )
		{
			this.options = options;
			this.url = this.attachIsAjaxParameter(url);
			
			if( !this.xhr )
				this.createXhr();
					    	
		    this.xhr.open(options.method, this.url, true);

		    // IE needs timeout set after xhr.open()
		    this.xhr.timeout = 2000000;
		    		    
		    //Use credentials 
		    if(this.xhr.withCredentials !== undefined)
		    	if( options.withCredentials )
		    		this.xhr.withCredentials  = options.withCredentials;
		    
		    // IE XDR doesn't support request headers
		    if(this.xhr.setRequestHeader && options.headers)
		    	for( var i = 0; i < options.headers.length ; i++ )
		    		this.xhr.setRequestHeader(  options.headers[i].name , options.headers[i].value  );
		    
		    //Data payload
		    if(options.data)
		    	this.xhr.send(options.data);
		    else
		    	this.xhr.send(null);
		   
		    
		    function timeoutHandler() {
		        throw new Error('Loading timeout: ' + url);
		    };
		    
		    return this;
		},
		
		onComplete: function()
		{
			if( this.options.on.success )
				this.options.on.success( this.xhr.responseText );
		},
		
		onError: function()
		{
			if( this.options.on.error )
				this.options.on.error(this.xhr.responseText);
		},	
		
		onSessionTimeout: function()
		{
			//Redirect to Login when session expires
			window.location.href = "login";
		}
	};
	
	// Create & add an instance of ajax to maporama namespace
	M.ajax = function( url, confg )
	{
		return new Ajax().send(url, confg);
	};
	
})(M);


(function( M )
{
	/**
	 * ScriptManager class manages all js loading.
	 * 
	 * @class ScriptManager
	 * @module geolibrary
	 * @version 0.1.0
	 * @author Alexandru Ghiura
	 * 
	 * @constructor ScriptManager
	 * @param cfg {Object} - Configuration object.
	 * 
	 */
	var ScriptManager = function( cfg )
	{
		this.scriptsToLoad = [];
		this.baseUrl = cfg.baseUrl || "";
	    	
	};
	
	ScriptManager.prototype = {

		loadScript: function( url, callback, options )
		{
			var script = document.createElement("script");
		    script.type = "text/javascript";
		    
		    if( options )
		    {
		    	script.id = options.id;
		    }

		    if (script.readyState) //IE
		    {  
		        script.onreadystatechange = function() {
		        	
		            if (script.readyState == "loaded" || script.readyState == "complete")
		            {
		                script.onreadystatechange = null;
		                setTimeout( function() { callback(); }, 0 );
		            }
		        };
		    } else 
		    {  
		    	//Others
		        script.onload = function(){
		        	setTimeout( function() { callback(); }, 0 );
		        };
		    }

		    script.src = this.baseUrl + url;
		    document.getElementsByTagName("head")[0].appendChild(script);
		},
		
		loadScripts: function( scripts, callback )
		{
			this.scriptsToLoad = scripts.concat();
			this.recursiveLoad( callback );
		},
		
		recursiveLoad: function( callback )
		{
			if( this.scriptsToLoad.length == 0 )
			{
				callback();
				return;
			}
				
			this.loadScript( this.scriptsToLoad.shift(), M.bind( function() {
				this.recursiveLoad( callback );
			}, this));
		}
	};
	
	M.ScriptManager = ScriptManager;
	
	M.require = function( scripts, options, callback )
	{
		var manager = new ScriptManager( options );
		manager.loadScripts( scripts, callback );
	};
	
})(M);
		

(function( M )
{
	/**
	 * GeoPlarform class manages all communications with GeoPlatform API.
	 * 
	 * @class GeoPlarform
	 * @module geolibrary
	 * @version 0.1.0
	 * @author Alexandru Ghiura
	 * 
	 * @constructor GeoPlatform
	 * @param cfg {Object} - Configuration object.
	 * 
	 * <br /><br />
	 * Configuration object for GeoPlatform has four parameters:
	 * <ul>
	 *   <li><b>url</b> -  the url to GeoPlatform API</li>
	 *   <li><b>customer</b> - the customer ID</li>
	 *   <li><b>key</b> - Maporama API key</li>
	 *   <li><b>ajax</b> - ajax object used to make XHR requests. ex. ( <code>M.ajax</code> )</li>
	 * </ul>
	 * 
	 */
	var GeoPlatform = function( cfg )
	{
		this.settings = M.Settings;
		cfg = cfg || {};
		
		// Url
		this.url = this.settings.geoPlatformUrl;
		if( cfg.url )
			this.url = cfg.url;
		
		// Maporama key
		this.key = this.settings.key;
		if( cfg.key )
			this.key = cfg.key;
		
		// Maporama customer
		this.customer = this.settings.customer;
		if( cfg.customer )
			this.customer = cfg.customer; 
				
		// Ajax
	    this.ajax = M.ajax;
	    if( cfg.ajax )
	    	this.ajax = cfg.ajax;
	    	
	};
	
	GeoPlatform.prototype = {
		
		customFiltersToQueryString: function( customFilters, delimiter )
		{
			var url = "";
			delimiter = delimiter || "&";
			var count = 0;
			
			for( var filterName in customFilters )
			{
				if ( filterName.substring(0,6) == "custom" ) //Special IE8 check
				{
					var filter = customFilters[filterName];
					
					if( filter.conditions ) // IE8 check 
					{
						for(var i=0;i<filter.conditions.length; i++)
						{
							//Replace '&' char, other wise it will break the URL
							if ( filter.conditions[i].value && typeof filter.conditions[i].value != "number" )
								filter.conditions[i].value = filter.conditions[i].value.replace(/&/g, '%26');
							
							var condition = filter.conditions[i];
							var operator = condition.operator || "or";
							var operation = condition.operation || "contains";
							
							if ( i == 0 && count == 0)
								url += filterName  +"="+ operator +","+condition.field+","+operation+","+condition.value;
							else
								url += delimiter + filterName  +"="+ operator +","+condition.field+","+operation+","+condition.value;
								
							count++;
						}	
					}
				}
			}
			
			return url;
		},
		
		queryStringToCustomFilters: function( customFiltersQueryString, delimiter )
		{
			var customFilters = [];
			var customFiltersQueryStringSplitted = customFiltersQueryString.split(delimiter);
			
			//Iterates through each custom filter in the query string
			for (var i = 0; i < customFiltersQueryStringSplitted.length; i++)
			{
				var groupName = customFiltersQueryStringSplitted[i].split("=")[0];
				var groupBulkConditions = customFiltersQueryStringSplitted[i].split("=")[1];
				var groupBulkConditionsSplitted = groupBulkConditions.split(",");
				
				if (groupBulkConditionsSplitted.length < 4)
					return;
				
				var values = "";
				
				//This means it has multiple values
				if (groupBulkConditionsSplitted.length > 4)
				{
					var tempValues = [];
					
					for (var i = 3; i < groupBulkConditionsSplitted.length; i++ )
					{
						tempValues.push(groupBulkConditionsSplitted[i]);
					}
					
					values = tempValues.join();
				}
				else
				{
					//Only one value
					values = groupBulkConditionsSplitted[3];
				}
				
				var conditions = [];
				var conditionsInfo = {
					operator: groupBulkConditionsSplitted[0],
					field: groupBulkConditionsSplitted[1],
					operation: groupBulkConditionsSplitted[2],
					value: values
				};
				
				conditions.push( conditionsInfo );
				
				var customFilter = {
					group: groupName,
					conditions: conditions
				};
				
				customFilters.push( customFilter );

			}
			
			var filters = [];
			
			for (var i=0; i < customFilters.length; i++)
			{
				var filter = customFilters[i];
				filters[filter.group] = filters[filter.group] || {};
				filters[filter.group].conditions = filters[filter.group].conditions || []; 
				
				filters[filter.group].conditions = filters[filter.group].conditions.concat( filter.conditions );
				
			};
			
			return filters;
		},
		
		shortenUrl: function( longUrl, success )
		{
			var url = this.url + "shorturl?" + 'maporamakey=' + this.key;
			
			var cfg = {
		        method: 'POST',
		        on: {
		        	success: M.bind( function( data ) {
		        		
		        		if( success )
		        			success.apply( this, [ M.JSON.parse(data) ] );
		        		
		        	}, this),
		        	error: function ( error )
		        	{
		        		console.log(error);
		        	}
		        },
		        data: longUrl,
		        headers: [ { name:"Content-Type", value:"text/plain"} ]
		    };
		
		    // Send request
		    if (!this.ajax)
		        throw new Error("Ajax function is not defined");
			    
		    return this.ajax(url, cfg);
		},
		
		searchPointsWithFilters: function(tableName, options)
		{
			var url = this.url + this.customer + '/tables/' + tableName + '.json?t=' + new Date().getTime() + '&maporamakey=' + this.key;
			
			//set searchType
			if (options)
				if (options.searchQuery && options.proximity)
					url += '&searchType=quick;proxy';
				else
					if (options.searchQuery && !options.proximity)
						url += '&searchType=quick';
					else
						if (!options.searchQuery && options.proximity)
							url += '&searchType=proxy';
			
			if ( options && options.distinctColumns && options.distinctColumns.length > 0)
			{
				url += "&distinctColumns=" + options.distinctColumns.join();
			}
			
			if (options && options.searchQuery)
			{
				url += '&searchString=' + options.searchQuery;
			}
			
			var sortBy = "";
			
			if(options && options.sortBy)
			{
				url += '&sortMode=' + options.sortMode;
				
				sortBy += options.sortBy;
			}
			
			if (options && options.proximity && 
				options.proximity.latitude && 
				options.proximity.longitude)
			{
				if(options.proximity.distance)
					url += '&searchDistance=' + options.proximity.distance;
					
				url += '&searchCenter=' + options.proximity.latitude + ',' + options.proximity.longitude;
				url += '&showDistance=true';
				
				if ( options.sortBy instanceof Array && options.sortBy.length > 0)
				{
					sortBy = options.sortBy.join(';');
				}
				else
				{
					if ( sortBy )
						sortBy = 'distance;' + sortBy;
					else
						sortBy += 'distance';
				}
			}
			
			if(sortBy)
				url +="&sortBy="+sortBy;
			
			if (options && options.filters)
			{
				var filterFields = '&filterFields=';
				var filterValues = '&filterValues=';
				
				for(var filter = 0; filter < options.filters.length; filter++)
				{
					filterFields += options.filters[filter].field + ';';
					
					for(var filterValue = 0; filterValue < options.filters[filter].values.length; filterValue++)
						filterValues += options.filters[filter].values[filterValue] + "|";
					
					filterValues = filterValues.slice(0,filterValues.length-1);
					filterValues += ';';
				}
				
				filterFields = filterFields.slice(0,filterFields.length-1);
				filterValues = filterValues.slice(0,filterValues.length-1);
				
				url += filterFields + filterValues;
			}
			
			if(options && options.customFilters)
			{
				//if(options.customFilters.length > 0)
				url += "&" + this.customFiltersToQueryString( options.customFilters );
			}
			
									
			// Add active filter by default to take only active points
			// @TODO: Refactor this in Geoplatform
			//if( !options.cluster )
			//{
				var filterIndex = 1;
				
				if( options.customFilters )
				{
					for(var key in options.customFilters)
						filterIndex++;
				}
				
				if ( !this.settings.disableActiveFilter )
					url += '&customFilter'+ filterIndex +'_and=and,active,yes,';
			//}
			
			if( options.cluster )
			{
				//cluster=true
				
				url += "&compact=false";
				url += "&cluster=true";
				url += "&clusterType=" + options.cluster.clusterType;
				
				if( options.cluster.clusterType != 'grid')
				{
					url += "&clusterShapeTable=" + options.cluster.clusterShapeTable;
				}
				
				if (options.zoom)
					url += "&zoom=" + options.zoom;
					
				if( options.cluster.clusterGridCellSize )
                    url += "&clusterGridCellSize=" + options.cluster.clusterGridCellSize ;
			}
			
			
							
			if (options.bounds)
			{
				if( ( options.cluster && options.cluster.includeBounds ) || !options.cluster )
                {
                    url += '&searchType=area'; // TO take bounds in to consideration
                    url += "&north="+options.bounds.north;
                    url += "&south="+options.bounds.south;
                    url += "&east="+options.bounds.east;
                    url += "&west="+options.bounds.west; 
                }
			}
			
			if( options.rowCount && !options.cluster && !options.bounds )
			{
				url += "&rowCount="+ options.rowCount +"&rowOffset=0";
			}
			
			var cfg = {
		        method: 'GET',
		        on: {
		        	success: M.bind( function( data ) {
		        		
		        		if( options.success )
		        			options.success.apply( this, [ this.parse( data )] );
		        		
		        	}, this),
		        	error: options.error
		        }
		    };
		
		    // Send request
		    if (!this.ajax)
		        throw new Error("Ajax function is not defined");
			    
		    return this.ajax(url, cfg);
		},
		
		
		 /**
		 * Load points in a table and filter them based on a specific filter if one is spefified
		 * 
		 * @method filterPoints
		 * @param {String} tableName - Name of the GeoManager table.
		 */
		loadPoints: function( tableName, options)
		{
			return this.searchPointsWithFilters(tableName, options);
		},
		
		loadPointsFromQuery: function( queryName, options )
		{
			var filters = "";
			
			if (options && options.filters)
			{
				for( var i = 0; i < options.filters.length; i++)
				{
					var filter = options.filters[i];
					filters += "&" + filter.field + "=" + filter.values.join("|");
				}
			}
  
			this.loadFromQuery(
			    queryName,
			    M.bind( function ( data )
			    {
			      if( options.success )
		        		options.success.apply( this, [ this.parseFromQuery( data )] );
			    }, this),
			    null,
			    filters);
		},
		
		abort: function()
		{
			if( this.currentAjax )
				this.currentAjax.abort();
		},
		
		loadPOIs: function ( types , bounds , success ,error)
		{
			var url = this.url + this.customer + '/catalog/poi.json?maporamakey=' + this.key;
			
			if( types )
			{
				url += '&filterFields=metacatid&filterValues=';
				
				for( var i = 0; i < types.length; i++)
					url += types[i] + "|";
				
				url = url.slice(0,url.length-1);	
					
			}
			
			if( bounds )
			{
				url += "&searchType=area";
				url += "&north="+bounds.top;
				url += "&south="+bounds.bottom;
				url += "&east="+bounds.right;
				url += "&west="+bounds.left; 
			}
				
			
			var cfg = {
		        method: 'GET',
		        on: {
		        	success: M.bind( function( data ) {
		        		
		        		if( success )
		        			success.apply( this, [ this.parse( data )] );
		        		
		        	}, this),
		        	error: error
		        }
		    };
		
		    // Send request
		    if (!this.ajax)
		        throw new Error("Ajax function is not defined");
			    
		    this.ajax(url, cfg);
		},
		
		
		loadQueryPOIs: function ( types, bounds,  success, error ,query , queryParams )
		{
			
			var filters = "";
			
			if( types )
			{
				filters += '&types=';
				
				for( var i = 0; i < types.length; i++)
					filters += types[i] + "|";
				
				filters = filters.slice(0,filters.length-1);		
			}
			
			if( queryParams )
			{
				for( var i = 0; i < queryParams.length; i++)
				{
					var param = queryParams[i];
					filters += "&" + param.field + "=" + param.values.join("|");
				}
			}
			
			if( bounds )
			{
			
				filters += "&north="+bounds.top;
				filters += "&south="+bounds.bottom;
				filters += "&east="+bounds.right;
				filters += "&west="+bounds.left; 
			}
				
			this.loadFromQuery( query, success, error, filters );
		},
		
		
		
		/**
		 * Load data from GeoPlatform using a custom query
		 * 
		 * @method loadFromQuery
		 * @param {String} queryName - Name of the query
		 * @param success
		 * @param error
		 */
		loadFromQuery: function( queryName, success, error, filters )
		{
			if (!filters)
				filters = "";
			
			var url = this.url + this.customer + '/queries/' + queryName + '.json?t=' + new Date().getTime() + '&maporamakey=' + this.key + filters;
			
			var cfg = {
		        method: 'GET',
		        on: {
		        	success: M.bind( function( data ) {
		        		
		        		if( success )
		        			success.apply( this, [M.JSON.parse(data)] );
		        		
		        	}, this),
		        	error: error
		        }
		    };
		
		    // Send request
		    if (!this.ajax)
		        throw new Error("Ajax function is not defined");
		    
		    var f = function(){
				this.ajax(url, cfg);
			} 
		
			var wait_time = 1500;
				
				// IE Fix
				if( M.Settings.ieLessThan9  )
					setTimeout( M.bind( f, this), wait_time);
				else
					f.call(this);
		},
		
				
		
		/**
		 * Transform each point in MapoPoint or MapoCluster
		 * 
		 * @method parse
		 * @param data
		 */
		parse: function( data )
		{
			var rawdata = M.JSON.parse(data);
			var schema = new TableSchema( rawdata.Schema );
			var result = [];
			
			if( rawdata.Clusters )
				return this.parseWithClusters(rawdata, schema);
			
			for( var i=0;i<rawdata.Rows.length;i++ )
			{
				var item = rawdata.Rows[i];
				
				var point = new MapoPoint();
				
				point.setSchema( schema );
				point.parse( item );
				
				result.push( point );	
			}
			
			if ( !this.settings.disableMultpilePointDetection )
				result = this.parseMultiplePointDetection( result );
			
			return result;
		},
		
		/**
		 * Transform MapoPoints that are in the same location into MapoMultiplePoints
		 * 
		 * @method parseMultiplePointDetection
		 * @param points
		 */
		parseMultiplePointDetection: function( points )
		{
			var result = [];
			var ineleigiblePointIndexes = []; //contains the indexes of point that have been grouped already
			
			for ( var i = 0; i < points.length; i++ )
			{
				var currentPoint = points[i];
				
				var multiplePointFound = false;
				var multiplePoint = new MapoMultiplePoint();
				multiplePoint.data.push( currentPoint );
				
				for ( var j = i + 1; j < points.length; j++ )
				{
					if ( ineleigiblePointIndexes.indexOf(j) == -1 && this.floatsAreEqual( currentPoint.lat(), points[j].lat() )
						&& this.floatsAreEqual( currentPoint.lon(), points[j].lon() ) )
					{
						multiplePointFound = true;
						ineleigiblePointIndexes.push(j);
						multiplePoint.data.push( points[j] );
					}
				}
				
				if ( multiplePointFound )
				{
					result.push(multiplePoint);
				}
				else if ( ineleigiblePointIndexes.indexOf(i) == -1 )
				{
					//add the point if it's eligible (is not part of a multiple point)
					result.push(currentPoint);
				}
				
				multiplePoint = null;
			}
			
			return result;
		},
		
		/**
		 * Compares two float numbers for equality at 5 decimal precision
		 * 
		 * @method floatsAreEqual
		 * @param float1
		 * @param float2
		 */
		floatsAreEqual: function( float1, float2 )
		{
			return ( (Math.round(parseFloat(float1)*10000)/10000) == (Math.round(parseFloat(float2)*10000)/10000) )
		},
		
		parseWithClusters: function( rawdata, schema )
		{
			var result = [];
			
			for( var i=0;i<rawdata.NonClusters.length;i++)
			{
				var item = rawdata.NonClusters[i];
				var point = new MapoPoint();
				
				point.setSchema( schema );
				point.parse( item );
				
				result.push( point );
			}
			if ( !this.settings.disableMultpilePointDetection )
				result = this.parseMultiplePointDetection( result );
			
			for( var i=0;i<rawdata.Clusters.length;i++)
			{
				var item = rawdata.Clusters[i];
				var point = new MapoCluster();
				point.parse( item );
				
				result.push( point );
			}
			
			return result;
		},
		
		geocode: function( address, options, multipleResults )
		{
			var options = options || {};
		    
		    if( !options.engine )
		    	options.engine = M.Engines.GOOGLE;
		    
		    
		    switch( options.engine )
		    {
		    	case M.Engines.GOOGLE:
		    	{
					var geocoder = new google.maps.Geocoder();
					
				    var geocoderOptions = {};
				    geocoderOptions.address = address;
				    
				    if ( options.bounds )
				    	geocoderOptions.bounds = options.bounds;
				    
				    geocoder.geocode(geocoderOptions, M.bind( function( results, status ) {
				    	
				    	if (status == google.maps.GeocoderStatus.OK) {
				    		
				    		if( multipleResults )
				    		{
				    			var addresses = this.filterGeocodingResults( results, options );
				    			
				    			if( options.success )
					    			options.success.apply( this, [addresses]);
				    		} 
				    		else
				    		{
				    			var lat = results[0].geometry.location.lat();
					    		var lon = results[0].geometry.location.lng();
					    		var formatted_address = results[0].formatted_address;
					    		var bounds = [ 	results[0].geometry.viewport.getSouthWest().lat(), 
												results[0].geometry.viewport.getSouthWest().lng(),
												results[0].geometry.viewport.getNorthEast().lat(),
												results[0].geometry.viewport.getNorthEast().lng() ];
					    		
					    		if( options.success )
					    			options.success.apply( this, [lat, lon, formatted_address, bounds]);
				    		}
				    	}
				    }, this));
				    
				    break;
			    }
			    case M.Engines.OPEN_LAYERS:
			    {
			    	var url = "http://geowebservices.maporama.com/" + M.Settings.customer + "/coder.json?";
			    	//var url = "http://geowebservices.maporama.com/demo/coder.json?";
			    	url += "street=" + (address.street || "") + "&";
			    	url += "city=" + (address.city || "") + "&";
			    	url += "zip="+ (address.zip || "") + "&";
			    	url += "country=" + (address.country || "fr") + "&geocoder=maporama&"; 
			    	url += "maporamakey=" + M.Settings.key;
			    	//url += "maporamakey=2u7kdn4DnYE=";
			    	
			    	var cfg = {
				        method: 'GET',
				        on: {
				        	success: M.bind( function( results ) {
				        		results = M.JSON.parse(results);
				        		
				        		var addresses = [];
				        			
			        			for( var i=0; i < results.length; i++)
				    			{
				    				var item = results[i];
				    				
				    				addresses.push({
				    					index: i,
				    					lat: item.Location.Latitude,
				    					lon: item.Location.Longitude,
				    					latitude: item.Location.Latitude,
				    					longitude: item.Location.Longitude,
				    					street: item.StreetName,
				    					city: item.City,
				    					country: item.Country.toUpperCase(),
				    					zip: item.Zip,
				    					address: this.formatAddress(item.StreetName, item.City, item.Country.toUpperCase()),
				    					bounds: [ 	item.BoundingBox.SouthWest.Latitude, 
													item.BoundingBox.SouthWest.Longitude,
													item.BoundingBox.NorthEast.Latitude,
													item.BoundingBox.NorthEast.Longitude ]
				    				});
				    			}
				    			
				    			var result = (multipleResults) ? addresses : addresses[0];
				    			
				    			if( options.success )
					    			options.success.apply( this, [result]);
						    			
				        	}, this),
				        	error: M.bind( function( data ) {
				        		throw new Error("Unable to geocode!");
				        	}, this)
				        }
				    };
				    this.ajax(url, cfg);
				    break;
			    }
		    }	
		},
		
		createGeocoderAddress: function( index, result )
		{
			//Create standard address
			var address = {
	    					index: index,
	    					lat: result.geometry.location.lat(),
	    					lon: result.geometry.location.lng(),
	    					address: result.formatted_address,
	    					bounds: [ 	result.geometry.viewport.getSouthWest().lat(), 
										result.geometry.viewport.getSouthWest().lng(),
										result.geometry.viewport.getNorthEast().lat(),
										result.geometry.viewport.getNorthEast().lng() ]
    					};
    						
    		//Save result's country
    		var resultCountry = this.getCountryFromGoogleGeocoderResponse( result );
    		
    		if ( resultCountry )
    			address.country = resultCountry;
    						
    		return address;
		},
		
		filterGeocodingResults: function( results, options )
		{
			var addresses = [];
			var index = -1;
			
			for( var i=0; i<results.length;i++)
			{
				if ( !options.country || this.isGoogleAddressInCountry(results[i], options.country) )
					if ( !options.bounds || this.isGoogleAddressInBounds( results[i], options.bounds ) )
					{
						index++;
						
						var address = this.createGeocoderAddress( index, results[i] );
						addresses.push(address);
	    			}
			}
			
			if ( this.settings.sortByCountry )
				addresses.sort( M.bind(this.countryComparer, this) );
			
			return addresses;
		},
		
		/*
		 * Sorts array by specified country
		 */
		countryComparer: function( a, b )
		{
			if ( !a.country || !b.country || !this.settings.sortByCountry)
				return 0;
			
			if ( a.country.toUpperCase() == this.settings.sortByCountry.toUpperCase() &&
				 b.country.toUpperCase() != this.settings.sortByCountry.toUpperCase())
				return -1;
				
			if ( a.country.toUpperCase() != this.settings.sortByCountry.toUpperCase() &&
				 b.country.toUpperCase() == this.settings.sortByCountry.toUpperCase() )
				 return 1;
				 
			return 0;
		},
		
		isGoogleAddressInCountry: function (address, country)
		{
			if (country.toUpperCase() == "UK")
				country = "GB";
			
			var addressCountry = this.getCountryFromGoogleGeocoderResponse( address );
			
			if ( !addressCountry )
				return false;
			
			return ( addressCountry.toUpperCase() == country.toUpperCase() );
		},
		
		isGoogleAddressInBounds: function( address, bounds )
		{
			var addressLatLon = new  google.maps.LatLng(address.geometry.location.lat(), address.geometry.location.lng());
			
			return bounds.contains(addressLatLon);
		},
		
		formatAddress: function (street, city, country)
		{
			var address = "";
			
			if (street)
				address = street + ", ";
			
			address += city + ", " + country;
			
			return address;
		},
		
		reverseGeocode: function (lat, lng, options)
		{
			var options = options || {};
		    
		    if( !options.engine )
		    	options.engine = M.Engines.GOOGLE;
		    
		    switch( options.engine )
		    {
		    	case M.Engines.GOOGLE:
		    	{
					var geocoder = new google.maps.Geocoder();
				    var latLng = new google.maps.LatLng(lat, lng);
				    
				    geocoder.geocode({latLng: latLng}, M.bind( function( results, status ) {
				    	
				    	if (status == google.maps.GeocoderStatus.OK) {
				    		
				    		var address = results[0].formatted_address;
				    		var bounds = results[0].geometry.viewport;
				    		
				    		//Get country
				    		var country = this.getCountryFromGoogleGeocoderResponse( results[0] );
				    		
				    		if( options.success )
				    			options.success.apply( this, [address, bounds, country]);
				    	}
				    }, this));
			    }
		    }
		},
		
		getCountryFromGoogleGeocoderResponse: function( address )
		{
			for (var i = 0; i < address.address_components.length; i++)
			{
				var item = address.address_components[i];
				
				for (var j = 0; j < item.types.length; j++)
					if (item.types[j] == "country")
						return  item.short_name;
			}
			
			return null;
		},
		
		billing: function( mapCenter )
		{
			if ( !mapCenter )
				return;
			
			var tileProvider = null;
			
			//Set the tile provider
			if ( this.settings.customTileProvider )
			{
				if ( this.settings.customTileProvider == "maporama" )
					tileProvider = "osm";
				else if ( this.settings.customTileProvider == "premium" )
					tileProvider = "tomtom";
			} 
			
			var billingUrl = this.url + this.customer + "/map.json?lg=" 
							+ mapCenter.lon + "&lt=" + mapCenter.lat
							+ "&maporamaKey=" + this.key;
							
			if ( tileProvider )
				billingUrl += "&provider=" + tileProvider;
			
				var cfg = {
				        method: 'GET',
				        on: {
				        	success: M.bind( function( results ) {
				        	}, this),
				        	error: M.bind( function( data ) {
				        		throw new Error("Billing error!");
				        	}, this)
				        }
				    };
			
			this.ajax( billingUrl, cfg);
		},
	
		/**
		 * Calculates directions.
		 * 
		 * @param {String|LatLon} start
		 * @param {String|LatLon} end
		 * @param {Object} options 
		 */
		itinerary: function( start, end, options )
		{
			var options = options || {};
			var engine = options.engine || M.Engines.GOOGLE;
			
			if (engine == M.Engines.GOOGLE)
			{
				var unitSystem = ( options.unitSystem && options.unitSystem == "miles" ) ? google.maps.UnitSystem.IMPERIAL : google.maps.UnitSystem.METRIC;
				
				var service = new google.maps.DirectionsService();
				
				var request = {
					origin: start,
					destination: end,
					travelMode: options.travelMode || google.maps.TravelMode.DRIVING,
					unitSystem: unitSystem
				};
				
				service.route( request, M.bind( function( response, status) {
					
						if( status == google.maps.DirectionsStatus.OK ) {
							
							if( options.success )
								options.success.apply( this, [ response ] );
							
						}
						else
						{
							if( options.error )
								options.error.apply( this, [ response, status ] ); 
						}
						
					}, this )
				);
			}
			else if (engine == M.Engines.OPEN_LAYERS)
			{
				var url = this.url + this.customer + "/itinerary.json?maporamakey=" + this.key;
				
				var travelMode = options.travelMode || "vehicule"
				travelMode = (travelMode == "DRIVING") ? "vehicule" : "pedestrian";
				
				url += "&start=" + start.longitude + ";" + start.latitude;
				url += "&end=" + end.split(",")[1] + ";" + end.split(",")[0];
				url += "&mode=" + travelMode;
				url += "&language=" + (options.language || "fr").toLowerCase();
				
				var cfg = {
		        	method: 'GET',
		          	on: {
		           		success: M.bind( function( data ) {
		           			var convertedData = this.convertItineraryToGoogleFormat(M.JSON.parse(data));
		           			
		           			if (options.success)
				            	options.success(convertedData);
		           		}, this),
		           		
		           		error: function( data ) {
	             			if (options.error)
			            		options.error(data);
		           		}
		          	}
	      		};
	   
	   			this.ajax(url, cfg);
			}
		},
		
		convertItineraryToGoogleFormat: function (mapoData)
		{
			if ( !mapoData )
				return;
			
			mapoData.routes = [{legs: [{
				start_location: {
					lat: function ()
					{
						return mapoData.Segments[0].Start.Latitude;
					},
					lng: function ()
					{
						return mapoData.Segments[0].Start.Longitude;
					}
				},
				end_location: {
					lat: function ()
					{
						return mapoData.Polyline[mapoData.Polyline.length - 1].Latitude;
					},
					lng: function ()
					{
						return mapoData.Polyline[mapoData.Polyline.length - 1].Longitude;
					}
				},
				start_address: mapoData.Segments[0].Name,
				distance: {
					value: mapoData.Summary.Distance.Meters,
					text: mapoData.Summary.Distance.KmLabel
				},
				duration: {
					text: mapoData.Summary.Time.TimeLabel
				}
			}]}];
			
			// convert the steps
			var steps = [];
			
			for (var i = 0; i < mapoData.Segments.length; i++)
			{
				var segment = mapoData.Segments[i];
				
				steps.push({
					instructions: segment.Sentence,
					distance: {
						value: segment.SegmentSummary.Distance.Meters
					},
					start_location: {
						lat: (function(segment) {
							return function () {
								return segment.Start.Latitude;
							}
						})(segment),
						lng: (function(segment) {
							return function () {
								return segment.Start.Longitude;
							}
						})(segment)
					}
				});
			}

			mapoData.routes[0].legs[0].steps = steps;
						
			return mapoData;
		},
		
		parseFromQuery: function( data )
		{
			var rawdata = data;
			var result = [];
			
			for( var i=0; i<rawdata.length; i++ )
			{
				var item = rawdata[i];
				
				var point = new MapoAddressPoint();
				point.parse( item );
				
				result.push( point );
			}
			
			return result;
		},
		
		login: function(  user, password, remember,  success, error)
		{
			var cfg = {
	        	method: 'POST',
	          	on: {
	           		success: M.bind( function( data ) {
			            
			            if( success )
			            	success.apply( this, [M.JSON.parse(data)] );
	           		}, this),
	           		
	           		error: function( data ) {
	            
						if( data )
	             			error.apply(this, [M.JSON.parse(data)]);
	            		else
	             			throw new Error("Login faild");
	           		}
	          },
			  data: "username="+user+"&password="+password+"&remember="+remember
	          //Headers not supported by IE's XDR object (Life is hard and then you die)
	          //headers: [ { name:"Content-Type", value:"application/x-www-form-urlencoded"} ]
      		};
   
   			
   			var url = this.url + "login";
   			this.ajax(url, cfg);
    
   			return null;
  		},
  	
  		forgotPassword: function(  user, success, error)
		{
			var cfg = {
	        	method: 'POST',
	          	on: {
	           		success: M.bind( function( data ) {
			            
			            if( success )
			            	success.apply( this, [M.JSON.parse(data)] );
	           		}, this),
	           		
	           		error: function( data ) {
	            
						if( data )
	             			error.apply(this, [M.JSON.parse(data)]);
	            		else
	             			throw new Error("Forgot Password failed");
	           		}
	          },
			  data: "username=" + user
	          //Headers not supported by IE's XDR object (Life is hard and then you die)
	          //headers: [ { name:"Content-Type", value:"application/x-www-form-urlencoded"} ]
      		};
   
   			
   			var url = this.url + "forgot";
   			this.ajax(url, cfg);
    
   			return null;
  		},
  	
  		changePassword: function(user, oldPassword, newPassword, success, error)
  		{
  			var cfg = {
	        	method: 'POST',
	          	on: {
	           		success: M.bind( function( data ) {
			            
			            if( success )
			            	success.apply( this, [M.JSON.parse(data)] );
	           		}, this),
	           		
	           		error: function( data ) {
	            		
	            		//ignore error => succes callback treats error case too
	            		if( success )
			            	success.apply( this, null );
	            		
						// if( data )
	             			// error.apply(this, [M.JSON.parse(data)]);
	            		// else
	             			// throw new Error("Forgot Password failed");
	           		}
	          },
			  data: "username=" + user + "&oldPassword=" + oldPassword + "&newPassword=" + newPassword
	          //Headers not supported by IE's XDR object (Life is hard and then you die)
	          //headers: [ { name:"Content-Type", value:"application/x-www-form-urlencoded"} ]
      		};
   
   			
   			var url = this.url + "motdepasse";
   			this.ajax(url, cfg);
    
   			return null;
  		}
  	
	};
	
	var MapoCluster = function()
	{
		this._lat = null;
		this._lon = null;
		this.count = 0;
		this.type = 'cluster';
		this.id = null;
	};
	
	MapoCluster.prototype = {
		parse: function( rawdata )
		{
			this.id = rawdata.Id;
			this._lat = rawdata.Center.Latitude;
			this._lon = rawdata.Center.Longitude;
			this.count = rawdata.Count;
			this.bounds = [rawdata.MinLat, rawdata.MinLon, rawdata.MaxLat, rawdata.MaxLon];
		},
		
		lat: function()
		{
			return this._lat;
		},
		
		lon: function()
		{
			return this._lon;
		}
	};
	
	/**
	 * MapoPoint is main class for points.
	 * 
	 * @class MapoPoint
	 * @constructor MapoPoint
	 * @param {TableSchema} schema 
	 * @for GeoPlatform
	 */
	var MapoPoint = function( schema )
	{
		this.data = {};
		this.schema = schema;
		this.type = 'point';
	};
	
	MapoPoint.prototype = {
			
		/**
		 * Get point latitude
		 * @return {float}
		 */
		lat: function()
		{
			return this.data[ this.schema.columnName('lat') ];
		},
		
		/**
		 * Get point longitude
		 * @return {float}
		 */
		lon: function()
		{
			return this.data[ this.schema.columnName('lon') ];
		},
		
		/**
		 * Get point city
		 * @return {string}
		 */
		city: function()
		{
			return this.data[ this.schema.columnName('city') ];
		},
		
		/**
		 * Get point zip
		 * @return {string}
		 */
		zip: function()
		{
			return this.data[ this.schema.columnName('zip') ];
		},
		
		/**
		 * Get point name
		 * @return {string}
		 */
		name: function()
		{
			return this.data[ this.schema.columnName('name') ];
		},
		
		/**
		 * Get point country
		 * @return {string}
		 */
		country: function()
		{
			return this.data[ this.schema.columnName('country') ];
		},
		
		/**
		 * Get point address
		 * @return {string}
		 */
		address: function()
		{
			return this.data[ this.schema.columnName('address') ];
		},
		
		getFormatDistance: function()
		{
			var d = Number( this.data.distance )/1000;
			var result = d.toString().split('.');
			var num = result[0];
			
			if( result[1] )
				num += '.' + result[1].substr(0, 2);
			
			return num;
		},
		
		/**
		 * Change point schema
		 * 
		 * @method setSchema
		 * @param schema
		 */
		setSchema: function( schema )
		{
			this.data = {};
			this.schema = schema;
		},
		
		/**
		 * Pars JSON to MapoPoint
		 * @return
		 */
		parse: function( rawdata )
		{
			this.data = {};
			
			for( var key in rawdata )
			{
				var item = rawdata[key];
				this.data[ item.columnName ] = item.columnValue;
			}
			
			this.formatDistance = this.getFormatDistance();
		}
	};
	
	/**
	 * MapoMultiplePoint is main class for multiple points.
	 * They represent points that are located at the same coordinates.
	 * 
	 * @class MapoMultiplePoint
	 * @constructor MapoMultiplePoint
	 * @for GeoPlatform
	 */
	
	var MapoMultiplePoint = function()
	{
		this.data = [];
		this.type = 'multiplePoint';
	};
	
	MapoMultiplePoint.prototype = {
		
		lat: function()
		{
			if ( this.data.length < 2 )
				throw("Multiple point length error!");
			
			return this.data[0].lat();
		},
		
		lon: function()
		{
			if ( this.data.length < 2 )
				throw("Multiple point length error!");
			
			return this.data[0].lon();
		},
		
		getFormatDistance: function()
		{
			if ( this.data.length < 2 )
				throw("Multiple point length error!");
			
			return this.data[0].getFormatDistance();
		}
	};
	
	var MapoAddressPoint = function()
	{
		this.data = {};
		this.type = 'point';
	};
	
	MapoAddressPoint.prototype = {
		parse: function( rawdata )
		{
			this.data = rawdata;
		},
		
		lat: function()
		{
			return this.data.latitude;
		},
		
		lon: function()
		{
			return this.data.longitude;
		}
	};
	
	/**
	 * Class used to extract customer table schema
	 * 
	 * @version 0.1.0
	 * @class TableSchema
	 * 
	 * @constructor TableSchema
	 * @param {Object} data
	 */
	var TableSchema = function( data )
	{
		this.columns = [];
		
		if( data )
			this.parse( data );
	};
	
	TableSchema.prototype = {
	
		/**
		 * Parse rawdata into table schema.
		 * 
		 * @param {Object} rawdata
		 */
		parse: function( rawdata )
		{
			this.columns = [];
			
			for( var key in rawdata.Columns )
			{
				var item = rawdata.Columns[key];
				
				this.columns.push({
					customName: item.CustomName,
					dataType: 	item.DataType,
					pseudoType: item.PseudoType
				});
			}
		},
		
		columnName: function( pseudoName )
		{
			for( var i = 0; i < this.columns.length; i++)
			{
				var column = this.columns[i];
				
				if( column.pseudoType == pseudoName )
					return column.customName;
			}
			
			return null;
		}
	};
	
	
	// Publish GeoPlatform class under M namespace
	M.GeoPlatform = GeoPlatform;
	M.MapoAddressPoint = MapoAddressPoint;
	
})(M);

(function( M )
{
	/**
	 * GeoServer class.
	 * 
	 * @class GeoServer
	 * @module geolibrary
	 * @version 0.1.0
	 * @constructor GeoServer
	 * @param cfg {Object} - Configuration object
	 */
	var GeoServer = function ( cfg ) 
	{
	    this.namespace = cfg.customer;
	    this.settings = M.Settings;
	    
	    // Url
		this.serverUrl =  this.settings.cacheServerUrl == null ? this.settings.geoServerUrl : this.settings.cacheServerUrl ; //+ cfg.customer;
		
		
		
		if( cfg.url )
			this.serverUrl = cfg.url; //+ cfg.customer;
		
		
			
	    // Ajax
	    this.ajax = M.ajax;
	    if( cfg.ajax )
	    	this.ajax = cfg.ajax;
	    	
	    this.layers = [];
	};
	
	
	GeoServer.prototype = {
			
		/**
		 * Generates a new WMS layer to be used with OpenLayers.
		 * 
		 * @param layerName
		 * @param format
		 */
		generateWMS: function (geoLayerName, layerName, format, params,sld, style, map) {
		
		    var serverLayer = this.namespace + ":" + geoLayerName;
		   
		    if (!format) {
		        format = "image/png";
		    }
		    
		    if(this.settings.cacheServerUrl)
		    	serverLayer += "_cached";
		    
		    // setup tiled layer
		    var wms = new OpenLayers.Layer.WMS(layerName, this.serverUrl + "/wms?" , {
		        LAYERS: serverLayer,
		        STYLES: style ,
		        format: 'image/png',
		        transparent: 'true',
		        VERSION: '1.1.1',
		        viewparams: params,
		        tiled: 'yes'

		        //tilesorigin: [map.maxExtent.left, map.maxExtent.bottom]
		    }, {
		        //ratio: 1.5,
		        opacity: 0.75,
		        singleTile: false,
		        tileOptions: { maxGetUrlLength: 2048 },
		        //transitionEffect: 'resize',
		        buffer: 0,
		        tileSize : new OpenLayers.Size(256,256),
		        displayOutsideMaxExtent: true//,
		        //isBaseLayer: false,
//		        yx: {
//		            'EPSG:4326': true
//		        }
		    });
		    
		    
		    if( sld )
		    {
		    	var sldString = sld.toXMLString();
		    	wms.mergeNewParams({SLD_BODY: sldString});
		    	
		    	wms.sld = sld;
		    }
		    
		    // Store generated wms
		    this.layers[layerName] = wms;
		    
		    return wms;
		},
		
		/**
		 * Get feature info. Return the feature information related to a specific point.
		 * 
		 * @param layerName
		 * @param lat
		 * @param lon
		 * @param zoom
		 * @param callback
		 * @param error
		 */
		getFeatureInfo: function (layerName, lat, lon, zoom, callback, error) {
		
		    var zoomFactor = Math.pow(2, zoom);
		    var wms = this.layers[layerName];
		    var template = '<ogc:Filter xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc"><ogc:Intersects><ogc:PropertyName>the_geom</ogc:PropertyName><gml:Point srsName="http://www.opengis.net/gml/srs/epsg.xml%234326"><gml:coordinates>{lat},{lon}</gml:coordinates></gml:Point></ogc:Intersects></ogc:Filter>';
		    
		    
		    var q = this.serverUrl + "/wfs?";
		    q += "&REQUEST=GetFeature";
		    q += "&typeName=" + wms.tableName;
		    q += "&OUTPUTFORMAT=json";
		    q += "&SRS=EPSG:4326";
		    q += "&filter=" + template.replace(new RegExp('{lat}', 'gi'), lat).replace(new RegExp('{lon}', 'gi'), lon);
		
			var geoserver = this;
		    var url = encodeURI(q);
		    var cfg = {
		        method: 'GET',
		        on: {
					success: function( data ) {
						callback.apply( geoserver, [data, lat, lon] );
					},
					error: error
		        }
		    };
		
		    //send request
		    if (!this.ajax)
		        throw new Error("Ajax function is not defined");
		    
		    this.ajax(url, cfg);
		},
		
		/**
		 * Change color for the polygont located at lat, lon
		 * 
		 *  @param layerName
		 *  @param lat
		 *  @param lon
		 *  @param newColor
		 *  @param options
		 */
		changePolygonColor: function (layerName, lat, lon, newColorHexa, options)
		{
			 //create SLDPolygonSymbolizer for selected polygon
		     var selectedPolygonSymbolizer = new M.SLDPolygonSymbolizer("#0000FF", "#000000", {fillOpacity: 1, strokeWidth: 4});
		     
		     //create SLDPolygonSymbolizer for all other polygons
		     var otherPolygonSymbolizer = new M.SLDPolygonSymbolizer("#F0D090", "#000000");
		     
		     //create contains filter for selected polygon
		     var containsFilter = new M.SLDContainsFilter(lat, lon, selectedPolygonSymbolizer);
		     
		     //create else filter for other polygons
		     //  var elseFilter = new M.SLDElseFilter(otherPolygonSymbolizer);
		     
		     //create Contains rule
		     var containsRule = new M.SLDRule([containsFilter],"selectRule");
		     
		     //create Else rule
		    // var elseRule = new M.SLDRule([elseFilter]);
		  
		  	
		     var wms = this.layers[layerName];
		     
		     //TODO create a GetUserLayer for SLDLayers
		     wms.sld.sldLayers[0].addRule(containsRule );
		     
			//create corresponding user Layer
		     //var sldLayer = new M.SLDUserLayer(this.namespace + ":" + wms.tableName, [containsRule, elseRule]);
			//var sldLayer = new SLDUserLayer(this.namespace + ":" + layerName, [containsRule].concat(this.oldRules));
			  
			//var sld = new M.SLD([sldLayer]);
			 
			wms.mergeNewParams({SLD_BODY: wms.sld.toXMLString() });
		},
		
		changeColors: function (layerName, rules)
		{
			var sldLayer = new M.SLDUserLayer(this.namespace + ":" + layerName, rules);
			var sld = new M.SLD([sldLayer]);
			var wms = this.layers[layerName];
			wms.mergeNewParams({SLD_BODY: sld.toXMLString() });
			
			this.oldRules = rules;
		}
	};
	
	// Publish GeoServer class under M namespace
	M.GeoServer = GeoServer;
	
})(M);



(function( M )
{
	/**
	 * MaporamaMap class is used to display points and polygons.
	 * 
	 * @class MaporamaMap
	 * @module geolibrary
	 * @version 0.1.0
	 * @author Alexandru Ghiura
	 */
	var MaporamaMap = function( cfg )
	{
		// Check for engine
		if( cfg.engine != M.Engines.OPEN_LAYERS && cfg.engine != M.Engines.GOOGLE )
			throw new Error("Wrong value for engine, please use Google or OpenLayers");
			
		this.settings = M.Settings;
	
		// Maporama key
		this.key = this.settings.key;
		if( cfg.key )
			this.key = cfg.key;
		
		// Maporama customer
		this.customer = this.settings.customer;
		if( cfg.customer )
			this.customer = cfg.customer; 
		
		// GeoServer
		this.geoServer = new M.GeoServer({
			customer: this.customer 
		});
		
		// GeoPlatform
		this.geoPlatform = new M.GeoPlatform({
			customer: this.customer,
			key: this.key
		});
		
		// GeoRasterService
		this.geoRasterService = new M.GeoRasterService({
			customer: this.customer,
			dispatcher: this
		});

		// Create map engine
		this.engine = EngineFactory.create( 
			cfg.engine,
			{
				dispatcher: this,
				geoServer: this.geoServer,
				geoPlatform: this.geoPlatform,
				geoRasterService:this.geoRasterService
			}
		);
		
		// Init map
		if( cfg.autoInit && cfg.mapContainer !== null )
			this.initMap( cfg.mapContainer, cfg.mapOptions || cfg );
	};
	
	MaporamaMap.prototype = {
		
		/**
		 * Init map engine. The engine can be
		 * OpenLayers or Google Map.
		 */
		initMap: function( container, options )
		{
			this.engine.initMap( container, options || {} );
		},
		
		/*
		 * Returns true if "bounds1" shares any point with "bounds2"
		 */
		boundsIntersect: function( bounds1, bounds2 )
		{
			return this.engine.boundsIntersect( bounds1, bounds2 );
		},
		
		computeDistanceBetweenPoints: function(point1, point2)
		{
			return this.engine.computeDistanceBetweenPoints(point1, point2);
		},
		
		enableDisableDragZoom: function( enabled )
		{
			this.engine.enableDisableDragZoom( enabled );
		},
		
		setMarkerForPoint: function( point, marker )
		{
			return this.engine.setMarkerForPoint(point, marker);
		},
		
		getPointsInBounds: function ( bounds )
		{
			return this.engine.getPointsInBounds( bounds );
		},
		
		getMarkerForPoint: function( point )
		{
			return this.engine.getMarkerForPoint(point);
		},
		
		getMarkersInFrontendCluster: function()
		{
			return this.engine.getMarkersInFrontendCluster();
		},
		
		addMarkerListener: function( marker, eventName, func )
		{
			this.engine.addMarkerListener( marker, eventName, func );
		},
		
		addListener: function( itemToListenOn, eventName, func )
		{
			this.engine.addListener( itemToListenOn, eventName, func );
		},
		
		addScale: function()
		{
			this.engine.addScale();
		},
		
		addSpecialPoint: function( point )
		{
			return this.engine.addSpecialPoint( point );
		},
		
		getLatLonForPoint: function( point )
		{
			return this.engine.getLatLonForPoint( point );
		},
		
		removeSpecialPoint: function( point )
		{
			this.engine.removeSpecialPoint( point );
		},
		
		zoomToMarkers: function()
		{
			this.engine.zoomToMarkers();
		},
		
		/**
		 * Loads polygons from a table using GeoServer.
		 * 
		 * @param tableName
		 */
		showPolygonsFromTable: function( tableName, params )
		{
			this.showGeoLayer(this.settings.defaultPolygonLayer, tableName, params);
		},
		
		showGeoLayer: function (mapLayerName, geoLayerName, params, sld, style)
		{
			this.engine.showGeoLayer( mapLayerName, geoLayerName, params, sld, style );
		},
		
		showGeoRasterLayer: function(mapName,options)
		{
			options = options || null;
			this.engine.showGeoRasterLayer( mapName,options);
		},
		
		removeLayerByName: function ( layerName )
		{
			this.engine.removeLayerByName( layerName );
		},
		
		showPoint: function( point )
		{
			this.engine.showPoint( point );
		},
		
		showHidePoint: function( point, show )
		{
			this.engine.showHidePoint( point, show );
		},
		
		showPoints: function( points )
		{
			this.engine.showPoints( points );
		},
		
		showAllPoints: function()
		{
			this.engine.showAllPoints();
		},
		
		hideAllPoints: function()
		{
			this.engine.hideAllPoints();
		},
		
		getPoints: function()
		{
			return this.engine.getPoints();
		},
		
		showPOIs : function ( value, types )
		{
			this.engine.showPOIs( value, types );
		},
		
		/*
		 * Shows all loaded POIs for the given POI types
		 */
		showQueryPOIs : function (types)
		{
			this.engine.showQueryPOIs( types );
		},
		
		//options.poiTypes
		//options.query
		//options.queryParams
		loadPOIs: function( options )
		{
			this.engine.loadPOIs( options );
		},
		
		/*
		 * Retirns the engine specific bounds from an array representing custom bounds
		 */
		getBounds: function( bounds )
		{
			return this.engine.getBounds( bounds );
		},
		
		calculateBounds: function()
		{
			return this.engine.calculateBounds();
		},
		
		addPOI: function ( p )
		{
			this.engine.addPOI( p );
		},
		
		addPoints: function( points, zoomTo, options )
		{
			this.engine.addPoints( points, zoomTo, options );
		},
		
		addDraggablePoint: function()
		{
			this.engine.addDraggablePoint();
		},
		
		removeDraggablePoint: function( feature )
		{
			this.engine.removeDraggablePoint( feature );
		},
		
		focusDraggablePins: function()
		{
			this.engine.focusDraggablePins();
		},
		
		addTileLayer: function( name, url )
		{
			this.engine.addTileLayer( name, url );
		},
		
		addPoint: function( point )
		{
			this.engine.addPoint( point );
		},
		
		removePoint: function( point )
		{
			this.engine.removePoint( point );
		},
		
		addDynamicCirclePoints: function ( points, intervals )
		{
			this.engine.addDynamicCirclePoints( points,intervals );
		},
		
		removeAllPoints: function()
		{
			this.engine.removeAllPoints();
		},
		
		createMarker: function( point )
		{
			return this.engine.createMarker( point );
		},
		
		createMarkerIcon: function( point )
		{
			return this.engine.createMarkerIcon( point );
		},
		
		createPOIIcon: function( poi )
		{
			this.engine.createPOIIcon( poi );
		},
		
		pan: function( deltaX, deltaY )
		{
			this.engine.pan( deltaX, deltaY );
		},
		
		createPopup: function(html, options)
		{
			return this.engine.createPopup(html, options);
		},
		
		removePopup: function( popup )
		{
			this.engine.removePopup( popup );
		},
		
		addPopup: function( popup, options )
		{
			this.engine.addPopup( popup, options );
		},
		
		getPopupDOMElement: function( popup )
		{
			return this.engine.getPopupDOMElement(popup);
		},
		
		onMap: function( eventName, callback, context )
		{
			this.engine.onMap( eventName, callback, context );
		},
		
		zoomTo: function( zoom )
		{
			this.engine.zoomTo( zoom );
		},
		
		zoomToPoints: function( points )
		{
			this.engine.zoomToPoints( points );
		},
		
		setCenter: function( lonLat, zoom )
		{
			this.engine.setCenter( lonLat, zoom );
		},
		
		setExtent: function( bounds )
		{
			this.engine.setExtent( bounds );
		},
		
		setOpacity: function( opacity, layerIndex )
		{
			this.engine.setOpacity( opacity, layerIndex );
		},
		
		showItinerary: function( itinerary, options )
		{
			this.engine.showItinerary( itinerary, options );	
		},
		
		removeItinerary: function()
		{
			this.engine.removeItinerary();
		},
		
		resize: function()
		{
			this.engine.resize();
		},
		
		zoomOut: function()
		{
			this.engine.zoomOut();
		},
		
		getLonLat: function( x, y )
		{
			return this.engine.getLonLat(x, y);
		},
		
		getZoom: function()
		{
			return this.engine.getZoom();
		},
		
		getCenter: function()
		{
			return this.engine.getCenter();
		},
		
		getStreetView: function()
		{
			return this.engine.getStreetView();
		}
		
	};
	
	var EngineFactory = function()
	{
	};
	
	EngineFactory.create = function( engineName, cfg )
	{
		switch( engineName )
		{
			case M.Engines.OPEN_LAYERS: return new M.OpenLayersMap( cfg );
			case M.Engines.GOOGLE: return new M.GoogleMap( cfg );
		}
		
		return null;
	};
	
	// Publish MaporamaMap class under M namespace
	M.MaporamaMap = MaporamaMap;
})(M);

(function( M )
{
	/**
	 * Used to generate a StyledLayerDescriptor XML string to be used when sending requests to GeoServer in order for GeoServer to apply styles to polygons or points according to certain rules.
	 * @class SLD
	 * @module sld
	 * @version 0.1.0
	 * @author Silviu Lung
	 * @constructor SLD 
	 * @param {Array} sldLayers - Array of SLDLayers (UserLayer or NamedLayer) to be added to the SLD.
	 */
	var SLD = function(sldLayers)
	{
		this.template = '<StyledLayerDescriptor>{userLayers}</StyledLayerDescriptor>';
		this.sldLayers = sldLayers;
	};
	
	SLD.prototype = 
	{
		/**
		 * Returns the entire SLD (StyleLayerDescriptor) as an XML string by adding the specified sldLayers.
		 * @method toXMLString
		 * @return {String}
		 */
		toXMLString: function()
		{
			var allUserLayers = "";
			
			for (var i=0;i<this.sldLayers.length;i++)
			{
				allUserLayers += this.sldLayers[i].toXMLString();
			}
			
			return (this.template).replace(new RegExp('{userLayers}', 'gi'), allUserLayers);
		}
	};
	
	/**
	 * Generates a SLD user layer
	 * 
	 * @class SLDUserLayer
	 * @module sld
	 * @version 0.1.0
	 * @author Silviu Lung
	 * @constructor SLDUserLayer
	 * @param {String} layerName - The name of the GeoServer layer the SLD rules will be applied to.
	 * @param {Array} rules - Array of rules for the given layer.
	 */
	var SLDUserLayer = function(layerName, rules)
	{
		this.template = '<UserLayer><Name>{layerName}</Name><UserStyle><FeatureTypeStyle>{Rules}</FeatureTypeStyle></UserStyle></UserLayer>';
		this.layerName = layerName;
		this.rules = rules;
	};
	
	SLDUserLayer.prototype = 
	{
		/**
		 * Returns the entire SLDUserLayer as an XML string by adding the specified layer name and the specified rules.
		 * @method toXMLString
		 * @return {String}
		 */
		toXMLString: function()
		{
			var result = this.template;
			var allRules = "";
			
			for (var i=0;i<this.rules.length;i++)
			{
				allRules += this.rules[i].toXMLString();
			}
			
			result = result.replace(new RegExp('{layerName}', 'gi'), this.layerName);
			result = result.replace(new RegExp('{rules}', 'gi'), allRules);
			
			return result;
		},
		
		getRuleIndexByName: function( name )
		{
			for( var i=0; i< this.rules.length; i++)
				if(this.rules[i].name == name )
					return i;
			
			return -1;
		},
		
		getRuleByName: function( name )
		{
			var index = this.getRuleIndexByName(rule.name);
			
			if( index > -1 )
				return  this.rules[i];
			
			return null;
		},
		
		removeRuleByName: function (name)
		{
			var index = this.getRuleIndexByName(rule.name);
			
			this.rules.splice(index,1);
		},
		
		
		addRule: function ( rule )
		{
			var index = this.getRuleIndexByName(rule.name);
			
			//If rule with the same name already exists replace it
			if( index > -1 )
				this.rules.splice(index ,1, rule);
			else
				this.rules =  [rule].concat( this.rules);
		}
		
	
		
		
	};
	
	var SLDPropertyRule = function(property, value, color)
	{
		this.property = property;
		this.value = value;
		this.color = color;
	};
	
	SLDPropertyRule.prototype = 
	{
		/**
		 * Returns the entire SLDRule as an XML string.
		 * @method toXMLString
		 * @return {String}
		 */
		toXMLString: function()
		{
			var symbolizer = new SLDPolygonSymbolizer(this.color, "#000000");
			var equalFilter = new SLDIsEqualToFilter(this.property, this.value, symbolizer);
			
			return new SLDRule([equalFilter]).toXMLString();
		}
	};
	
	/**
	 * Generates a SLD rule.
	 * 
	 * @class SLDRule
	 * @module sld
	 * @version 0.1.0
	 * @author Silviu Lung
	 * @constructor SLDRule
	 * @param {Array} filters - Array of filters for the rule.
	 */
	var SLDRule = function(filters, name)
	{
		this.template = '<Rule>{filters}</Rule>';
		this.filters = filters;
		this.name = name;
	};
	
	SLDRule.prototype = 
	{
		/**
		 * Returns the entire SLDRule as an XML string.
		 * @method toXMLString
		 * @return {String}
		 */
		toXMLString: function()
		{
			var result = this.template;
			var allFilters = "";
			
			for (var i=0;i<this.filters.length;i++)
			{
				allFilters += this.filters[i].toXMLString();
			}
			
			result = result.replace(new RegExp('{filters}', 'gi'), allFilters);
			
			return result;
		}
	};
	
	/**
	 * Generates a SLD filter with the "contains" spatial operator.
	 * 
	 * @class SLDIsEqualToFilter
	 * @module sld
	 * @version 0.1.0
	 * @author Alexandru GHiura
	 * @constructor SLDIsEqualToFilter
	 * @param {String} property
	 * @param {String} value
	 * @param {PolygonSymbolizer} symbolizer - Polygon Symbolizer 
	 */
	var SLDIsEqualToFilter = function(property, value, symbolizer)
	{
		this.template = '<Filter><PropertyIsEqualTo><PropertyName>{property}</PropertyName><Literal>{value}</Literal></PropertyIsEqualTo></Filter>';
		this.property = property;
		this.value = value;
		this.symbolizer = symbolizer;
	};	
	
	SLDIsEqualToFilter.prototype=
	{
		/**
		 * Returns the entire SLD SLDIsEqualToFilter as an XML string.
		 * @method toXMLString
		 * @return {String}
		 */
		toXMLString : function ()
		{
			var result = this.template;
			
			//replace lat and lon
			result = result.replace(new RegExp('{property}', 'gi'), this.property);
			result = result.replace(new RegExp('{value}', 'gi'), this.value);
			
			return result + this.symbolizer.toXMLString();
		}
	};
	
	var SLDIntervalFilter = function( min , max, property, symbolizer )
	{
		// min <= property <= max
		this.minMaxTemplate = '<Filter><And><PropertyIsLessThanOrEqualTo><PropertyName>{property}</PropertyName><Literal>{max}</Literal></PropertyIsLessThanOrEqualTo><PropertyIsGreaterThanOrEqualTo><PropertyName>{property}</PropertyName><Literal>{min}</Literal></PropertyIsGreaterThanOrEqualTo></And></Filter>';
		
		// min <= property
		this.minTemplate = '<Filter><PropertyIsGreaterThanOrEqualTo><PropertyName>{property}</PropertyName><Literal>{min}</Literal></PropertyIsGreaterThanOrEqualTo></Filter>';
		
		// property <= max
		this.maxTemplate = '<Filter><PropertyIsLessThanOrEqualTo><PropertyName>{property}</PropertyName><Literal>{max}</Literal></PropertyIsLessThanOrEqualTo></Filter>';
		
		this.min = min;
		this.max = max;
		this.property = property;
		this.symbolizer = symbolizer;
		
	};
	
	SLDIntervalFilter.prototype=
	{
		/**
		 * Returns the entire SLD SLDContainsFilter as an XML string.
		 * @method toXMLString
		 * @return {String}
		 */
		toXMLString : function ()
		{
			var result = this.minMaxTemplate;
			
			if (this.min && !this.max)
				result = this.minTemplate;
			else
				if (!this.min && this.max)
					result = this.maxTemplate;
			
			//replace min , max, property
			result = result.replace(new RegExp('{min}', 'gi'), this.min);
			result = result.replace(new RegExp('{max}', 'gi'), this.max);
			result = result.replace(new RegExp('{property}', 'gi'), this.property);
			
			return result + this.symbolizer.toXMLString();
		}
	};
	
	/**
	 * Generates a SLD filter with the "contains" spatial operator.
	 * 
	 * @class SLDContainsFilter
	 * @module sld
	 * @version 0.1.0
	 * @author Silviu Lung
	 * @constructor SLDContainsFilter
	 * @param {float} lat - Latitude
	 * @param {float} lon - Longitude
	 * @param {PolygonSymbolizer} symbolizer - Polygon Symbolizer 
	 */
	var SLDContainsFilter = function(lat, lon, symbolizer)
	{
		this.template = '<Filter><Contains><PropertyName>the_geom</PropertyName><Point srsName="http://www.opengis.net/def/crs/EPSG/0/4326"><Coordinates>{lon},{lat}</Coordinates></Point></Contains></Filter>';
		this.lat = lat;
		this.lon = lon;
		this.symbolizer = symbolizer;
	};
	
	SLDContainsFilter.prototype=
	{
		/**
		 * Returns the entire SLD SLDContainsFilter as an XML string.
		 * @method toXMLString
		 * @return {String}
		 */
		toXMLString : function ()
		{
			var result = this.template;
			
			//replace lat and lon
			result = result.replace(new RegExp('{lon}', 'gi'), this.lon);
			result = result.replace(new RegExp('{lat}', 'gi'), this.lat);
			
			return result + this.symbolizer.toXMLString();
		}
	};
	
	/**
	 * Generates a SLD "else" filter which matches all the the requests that were not matched by the previously defined filters. 
	 * 
	 * @class SLDElseFilter
	 * @module sld
	 * @version 0.1.0
	 * @author Silviu Lung
	 * @constructor SLDElseFilter
	 * @param {PolygonSymbolizer} symbolizer - Polygon Symbolizer.
	 */
	var SLDElseFilter = function(symbolizer)
	{
		this.template = '<SLDElseFilter/>';
		this.symbolizer = symbolizer;
	};
	
	SLDElseFilter.prototype=
	{
		/**
		 * Returns the entire SLDElseFilter as a XML string.
		 * @method toXMLString
		 * @return {String}
		 */
		toXMLString : function ()
		{
			return this.template + this.symbolizer.toXMLString();
		}
	};
	
	/**
	 * @class SLDPolygonSymbolizer
	 * @module sld
	 * @version 0.1.0
	 * @author Silviu Lung
	 * @constructor SLDPolygonSymbolizer
	 * @param {String} fillColor - Hexadecimal fill color.
	 * @param {String} strokeColor - Hexadecimal stroke color.
	 * @param {Object} options - {fillOpacity(between 0 and 1) and strokeWidth}
	 */
	var SLDPolygonSymbolizer = function(fillColor, strokeColor, options)
	{
		this.template = '<PolygonSymbolizer><Fill><CssParameter name="fill">{fillColor}</CssParameter></Fill><Stroke><CssParameter name="stroke">{strokeColor}</CssParameter><CssParameter name="stroke-width">{strokeWidth}</CssParameter></Stroke></PolygonSymbolizer>';
		this.fillColor = fillColor;
		this.strokeColor = strokeColor;
		
		//default values
		//this.fillOpacity = 0.5; 
		this.strokeWidth = 1;
		
		if (options)
		{
			// if ( (options.fillOpacity >= 0) && (options.fillOpacity <= 1) )
			// {
				// this.fillOpacity = options.fillOpacity;
			// }
			
			if (options.strokeWidth)
			{
				this.strokeWidth = options.strokeWidth;
			}
		}
	};
	
	SLDPolygonSymbolizer.prototype = {
	
		/**
		 * Returns the entire SLDPolygonSymbolizer as an XML string.
		 * @method toXMLString
		 * @return {String}
		 */
		toXMLString : function ()
		{
			var result = this.template;
			
			//replace fill and stroke color
			result = result.replace(new RegExp('{fillColor}', 'gi'), this.fillColor);
			result = result.replace(new RegExp('{strokeColor}', 'gi'), this.strokeColor);
			
			//replace optional parameters if exist, else use default values
			result = result.replace(new RegExp('{fillOpacity}', 'gi'), this.fillOpacity);
			result = result.replace(new RegExp('{strokeWidth}', 'gi'), this.strokeWidth);
			
			return result;
		}
	};
	
	// Publish all SLD classes under M namespace
	M.SLD = SLD;
	M.SLDUserLayer = SLDUserLayer;
	
	// Rules
	M.SLDRule = SLDRule;
	M.SLDPropertyRule = SLDPropertyRule;
	
	// Filters
	M.SLDIsEqualToFilter = SLDIsEqualToFilter;
	M.SLDContainsFilter = SLDContainsFilter;
	M.SLDElseFilter = SLDElseFilter;
	M.SLDIntervalFilter = SLDIntervalFilter;
	
	// Symbolizers
	M.SLDPolygonSymbolizer = SLDPolygonSymbolizer;
	
	
	
})(M);

(function( M )
{
	/**
	 * MaporamaEvents class is used to catch and dispatch custom events.
	 * 
	 * @class MaporamaEvents
	 * @module core
	 * @version 0.1.0
	 * @author Alexandru Ghiura
	 */
	var EventDispatcher = function( cfg )
	{
		this.$events = {};
	};
	
	EventDispatcher.prototype = {
		
		/**
		 * Add listeners to the map.
		 * 
		 * @param eventName
		 * @param fn
		 * 
		 */
		on: function( eventName, fn )
		{
			this.$events[eventName] = this.$events[eventName] || [];
			
			// @TODO: search function befor push
			this.$events[eventName].push( fn );
		},
		
		/**
		 * Fire an event
		 * 
		 * @param {String} eventName
		 * @param {Object} params
		 */
		fire: function( eventName, params )
		{
			var functions = this.$events[eventName];
			
			for(var key in functions)
			{
				var fn = functions[key];
				fn.apply( this, [params]);
			}	
		},
		
		detach: function( eventName, fn )
		{
			var events = this.$events[eventName];
			
			for( var i=0; i< events.length; i++ )
			{
				if( events[i] == fn )
				{
					delete events[i];
					return;
				}
			}
			
			return;  
		}
	};
	
	M.EventDispatcher = EventDispatcher;
	
})(M);

(function (M)
{
	if (typeof OpenLayers != "undefined")
	{
		var orig = OpenLayers.Map.prototype.moveTo;
		
		OpenLayers.Map.prototype.moveTo = function(lonLat, zoom, options) {
		    	if (this.getZoom() == this.maxZoom && zoom > this.maxZoom)
		    		return;
		    		
		    	if (zoom < this.minZoom)
		    		return;
		    		
		    	if (zoom > this.maxZoom)
		    		zoom = this.maxZoom;
		    		
		        orig.apply(this, arguments);
	   };
	   
	   // add 'bc' and 'tc' (bottom-center, top-center) anchor support
		OpenLayers.Popup.Anchored.prototype.calculateNewPx = function (px) {
			var newPx = px.offset(this.anchor.offset);
        
	        //use contentSize if size is not already set
	        var size = this.size || this.contentSize;
	
	        var top = (this.relativePosition.charAt(0) == 't');
	        newPx.y += (top) ? -size.h : this.anchor.size.h;
	        
	        var left = (this.relativePosition.charAt(1) == 'l');
	        newPx.x += (left) ? -size.w : this.anchor.size.w;
			
			if (this.relativePosition.charAt(1) == 'c')
				newPx.x += -size.w / 2;
					
	        return newPx;   
		};
		
		// fix width and height
		var popupOrig = OpenLayers.Popup.prototype.setSize;
		
		OpenLayers.Popup.prototype.setSize = function(contentSize) {
	    		
	        popupOrig.apply(this, arguments);
	        
	        if (this.div != null) {
	            this.div.style.width = "";
	            this.div.style.height = "";
	        }
	        if (this.contentDiv != null){
	            this.contentDiv.style.width = "";
	            this.contentDiv.style.height = "";
	        }
	   	};
  	}
})(M);

(function( M )
{
    /**
	 * OpenLayersMap class is base map using OpenLayersMap Engine.
	 * 
	 * @class OpenLayersMap
	 * @module geolibrary
	 * @version 0.1.0
	 */
	var OpenLayersMap = function( cfg )
	{
		this.map = null;
		this.polygonsLayers = [];
		this.markers = [];
		this.points = [];
		this.specialPoints = [];
		this.draggablePoints = [];
		this.pois = {};
		
		this.draggablePointsIndex = 0;
		
		this.dispatcher = cfg.dispatcher;
		this.geoPlatform = cfg.geoPlatform;
		this.geoServer = cfg.geoServer;
		this.geoRasterService = cfg.geoRasterService || null;
	};
	
	OpenLayersMap.prototype = {
		
		/**
		 * Init map.
		 * 
		 * @param container
		 * @param options
		 */
		initMap: function( container, options )
		{
			// OpenLayers.Util.onImageLoadError = function () {
			    // this.src = "../../images/no-tile.png";
			// }
			
			this.minZoom = options.minZoom || 2;
			this.maxZoom = options.maxZoom || 16;
			this.specialLayerBehind = options.specialLayerBehind;
			
			// Create map
			this.map = new OpenLayers.Map(  
			{
				div: container,
				projection: "EPSG:900936",
				minZoom: this.minZoom,
				maxZoom: this.maxZoom,
				controls: [new OpenLayers.Control.Navigation(
					{dragPanOptions: {enableKinetic: true},
					zoomBoxEnabled: true,
					mouseWheelOptions: {
						interval: 250,
						cumulative: true}}

				)], 
				displayProjection: new OpenLayers.Projection("EPSG:4326"), 
				maxExtent: new OpenLayers.Bounds(-200375080.34,-200375080.34,200375080.34,200370508.34)
			});
			
			// Add click listner
			this.map.events.register('click', this, this._onMapClick);
			this.map.events.register('touchstart', this, this._onMapClick);
			this.map.events.register('moveend', this, this._onMapMoveEnd);
			this.map.events.register('zoomend', this, this._onZoomEnd);
			this.map.events.register('movestart', this, this._onMoveStart);
		     
			// Controls
			// var mouseCtrl = new OpenLayers.Control.MousePosition();
			// this.map.addControl(mouseCtrl);
			
			var attributionTemplate = '';
			
			if (options && options.attributionTemplate)
			{
				this.map.addControl(new OpenLayers.Control.Attribution());
				attributionTemplate = options.attributionTemplate;
			}
			
			if (options && options.draggablePoints)
			{
				//Create draggable layer
				this.draggablePointsLayer = new OpenLayers.Layer.Vector("Draggable Layer", {
	                    renderers: OpenLayers.Layer.Vector.prototype.renderers
	            });
	            
	            this.dragControl = new OpenLayers.Control.DragFeature(this.draggablePointsLayer, {
        			onStart: M.bind(function(){
							this.putDraggableLayerOnTopOrBottom( true );
						}, this),
					featureCallbacks: {
						click: M.bind(function( feature ) {
						      this._onFeatureSelected( feature );
					    	}, this)
					}
	            });
	            
				this.map.addControl(this.dragControl);
					
				this.dragControl.activate();
				
				//Draggable Points layer must be over polygon layer and also over POI layer
				this.map.addLayer( this.draggablePointsLayer );
				
	            this.setLayersZIndex();
			}
		    
		    if(this.geoPlatform.settings.customTileProvider == 'maporama' )
		    {
		    	//Maporama tiles with OSM provider
		    	this.tileLayer = new OpenLayers.Layer.OSM(null, "http://raster.maporama.com/maporama/${z}/${x}/${y}.png", {
					attribution: attributionTemplate
				});
		    }
		    else if(this.geoPlatform.settings.customTileProvider == 'premium' )
		    {
		    	//Maporama tiles with TomTom provider
		    	this.tileLayer = new OpenLayers.Layer.OSM(null, "http://raster.maporama.com/premium/${z}/${x}/${y}.png", {
					attribution: attributionTemplate
				});
		    }
		    else
		    {
		    	//Default OSM tiles
		    	this.tileLayer = new OpenLayers.Layer.OSM(null, null, {
					attribution: attributionTemplate			
				});
		    }
			
			// if(this.geoPlatform.settings.customTileProvider == 'cloudmade' )
				// this.tileLayer =  new OpenLayers.Layer.CloudMade("CloudMade", {
			    // key: '9ed641170d494fd0bf9d16b37ff5b59c',
			    // styleId: 36515,
			    // attribution: attributionTemplate
			// });
			
			

			this.tileLayer.sphericalMercator = true;
			this.tileLayer.transitionEffect = 'resize';
			this.map.addLayers([this.tileLayer]);
			

			
			//if map bounds are specified on initialization => zoom to bounds
			if (options.bounds && options.bounds.length == 4)
				this.setExtent(options.bounds)
			else
			{
				var startLocation = options.startLocation ? new OpenLayers.LonLat( options.startLocation[1], options.startLocation[0] )  : new OpenLayers.LonLat( 2, 42 );
				var startZoom= options.startZoom ? options.startZoom : 5; 
				
				//transform from EPSG:4326 projection (default) to current projection used by map
				var proj = new OpenLayers.Projection("EPSG:4326");
				startLocation.transform( proj, this.map.getProjectionObject() );
				
				this.map.setCenter(startLocation, startZoom);
			}
			
			//put popups above Points (highest layer)
			this.map.Z_INDEX_BASE.Popup = 1500;
			
			this.dispatcher.fire('mapReady', []);
			
			return this.map;
		},
		
		addScale: function()
		{
			//Add ScaleLine Control
			var scaleline = new OpenLayers.Control.ScaleLine({
			    div: document.getElementById("scaleContainer"),
			    geodesic: true,
			    maxWidth: 125
			});
			
			this.map.addControl(scaleline);
		},
		
		setLayersZIndex: function()
		{
			if ( this.specialPointsLayer )
			{
				var specialZIndex = 200;
				if (this.specialLayerBehind)
					specialZIndex = 120;
					
				this.map.setLayerZIndex(this.specialPointsLayer, specialZIndex);
			}
			
			//Set Points and POIs layer Z Index
			if (this.pointsLayer)
			{
				//Points layer must be over polygon layer and also over POI layer
				this.map.setLayerZIndex(this.pointsLayer, 150);	
			}
			
			//Set Points and POIs layer Z Index
			if (this.poiLayer)
			{
				//POI layer must be over polygon layer and under Points layer
				this.map.setLayerZIndex(this.poiLayer, 100);
			}
			
			//Set Draggable Points and POIs layer Z Index
			if (this.draggablePointsLayer)
			{
				//POI layer must be over polygon layer and under Points layer
				this.map.setLayerZIndex(this.draggablePointsLayer, 50);
			}
			
			this.map.Z_INDEX_BASE.Popup = 1500;
		},
		
		/**
		 * Show a layer from GeoServer.
		 * 
		 * @param {String} mapLayerName
		 * @param {String} geoLayerName
		 * @params
		 */
		showGeoLayer: function (mapLayerName, geoLayerName , params, sld , style)
		{
			var layer = this.geoServer.generateWMS(geoLayerName, mapLayerName, null, params, sld, style,this.map );
			layer.tableName = geoLayerName;
			
			//remove layer if it exists
			var index = this.removeLayerByName(mapLayerName);
			
			//add new layer
			this.map.addLayer( layer );
			//if( index > -1)
				this.map.setLayerZIndex(layer, this.polygonsLayers.length * 100);
				
			//Set Layers Z Indexes
			this.setLayersZIndex();
			
			this.polygonsLayers.push( layer );
		},
		
		/**
		 * Show a layer from GeoRasterService.
		 * 
		 * @param {String} mapName
		 * @param {String} geoLayerName
		 * @params
		 */
		showGeoRasterLayer: function (name, options)
		{
			if(!this.geoRasterService)
				return;

			options = options || {};
			
			
			var geolayer = new OpenLayers.Layer.TMS(name, [""], { 
					getURL:M.bind(function(bounds){
						var z = this.map.getZoom();
						var res = this.map.getResolution();
					    var x = Math.round ((bounds.left - geolayer.maxExtent.left) / (res * geolayer.tileSize.w));
					    var y = Math.round ((geolayer.maxExtent.top - bounds.top) / (res * geolayer.tileSize.h));
					   
				        return this.geoRasterService.getTileUrl(z, x, y, name, options);
					}, this),
					isBaseLayer:false,
					maxExtent: new OpenLayers.Bounds(-20037508.3427892,-20037508.3427892,20037508.3427892,20037508.3427892),
					tileOrigin: new OpenLayers.LonLat(-180, -90),
					sphericalMercator:true,
					buffer:0
					});
			
			if(options.minZoom)
				geolayer.minResolution = this.map.getResolutionForZoom(options.minZoom);
			
			if(options.maxZoom)
				geolayer.maxResolution = this.map.getResolutionForZoom(options.maxZoom);
			
			//remove layer if it exists
			var index = this.removeLayerByName(name);
			
			geolayer.events.register('tileloaded', geolayer, M.bind( function( evt ) {
				this.geoRasterService._onTileLoaded();
			},this));
			

			this.map.events.register('zoomstart', this, this.geoRasterService._onChangeZoom);
			this.map.events.register('click', this, this._onGeoRasterClick);
			this.map.events.register('mousemove', this, this._onGeoRasterMouseOver);
			
			//add new layer
			this.map.addLayer( geolayer );
			
			if( index > -1)
				this.map.setLayerZIndex(geolayer,index);

			this.polygonsLayers.push( geolayer );
		},
		
		_onGeoRasterMouseOver: function(evt)
		{
			this._fireGeoRasterFeatureEvent(evt,'geoRasterMouseOver');
		},
		
		_onGeoRasterClick: function(evt)
		{
			OpenLayers.Event.stop(evt);
			this._fireGeoRasterFeatureEvent(evt,'geoRasterClick');
		},
		
		_fireGeoRasterFeatureEvent: function(evt, eventName)
		{

			var target = (window.event) ? window.event.srcElement : evt.target;
			var name = target.id.split('-')[0];
			
			var zoom = this.map.getZoom();
			var res = this.map.getResolutionForZoom(0);
			var maxExtent = new OpenLayers.Bounds(-20037508.3427892,-20037508.3427892,20037508.3427892,20037508.3427892);
			
			var pixelPos = new OpenLayers.Pixel(evt.x,evt.y);
			
			var position = this.map.getLonLatFromPixel(pixelPos);
			
			
			var numTiles = 1 << this.map.getZoom();
			
			//get the world coordinate ( at zoom 0)
			 var extent = this.map.calculateBounds(null, res);
	         var worldCoordinate = new OpenLayers.Pixel(
	                (1/res * (position.lon - maxExtent.left)),
	                (1/res * (maxExtent.top - position.lat))
	            );    
			
			
	     	var pixelCoordinate = new google.maps.Point(worldCoordinate.x
					* numTiles, worldCoordinate.y * numTiles);

			var tileCoordinate = new google.maps.Point(Math.floor(pixelCoordinate.x
					/ 256), Math.floor(pixelCoordinate.y / 256));
			
			var mapOffset = M.util.offset(this.map.div);			
			var feature =  this.geoRasterService.getFeature(evt.x,evt.y, zoom, tileCoordinate.x, tileCoordinate.y, mapOffset, name);
			
			if(feature)
			{
				//transform position from mercator to WGS84
				var position = this.map.getLonLatFromPixel(pixelPos);
				position.transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"));
				var eventArg ={
						properties: feature,
						lat: position.lat,
						lon:  position.lon,
						x: evt.x,
						y: evt.y
				}
				
				this.dispatcher.fire(eventName, eventArg);
			}
		},
		
		/**
		 * Remove a layer from the map.
		 * 
		 * @param {String} layerName
		 */
		removeLayerByName: function ( layerName )
		{
			var layers = this.map.layers;
			
			//Delete layer from maps
			for (var i = 0; i < layers.length; i++)
				if ( layers[i].name === layerName)
				{
					if(this.geoRasterService)
					{
						layers[i].events.remove('tileloaded');
						this.map.events.unregister("click", this, this._onGeoRasterClick);
						this.map.events.unregister("zoomstart", this, this.geoRasterService._onChangeZoom);
						this.map.events.unregister("mousemove", this, this._onGeoRasterMouseOver);
	
						this.geoRasterService._onRemove();
					}

					this.map.removeLayer(layers[i]);
					
					break;
				}
		
			//Set Layers Z Indexes
			this.setLayersZIndex();	
			
			//Delete layer even from polygonLayers array  which is used 
			//maybe for something important ( Don't ask, don't tell)
			for (var i = 0; i < this.polygonsLayers.length; i++)
				if ( this.polygonsLayers[i].name === layerName)
				{
					this.polygonsLayers.splice(i,1);
					return i;
				}
			
			return -1;
		},
		
		/**
		 * Gets a layer from the map.
		 * 
		 * @param {String} layerName
		 */
		getLayerByName: function ( layerName )
		{
			var layers = this.map.layers;
			
			//Delete layer from maps
			for (var i = 0; i < layers.length; i++)
				if ( layers[i].name === layerName)
					return layers[i];
			
			return null;
		},
		
		getDraggablePointsIndex: function()
		{
			return this.draggablePointsIndex++;
		},
		
		putDraggableLayerOnTopOrBottom: function ( onTop )
		{
			if ( !this.draggablePointsLayer )
				return;
				
			if ( onTop )
				this.map.setLayerZIndex(this.draggablePointsLayer, 200);
			else
				this.map.setLayerZIndex(this.draggablePointsLayer, 50);
		},
		
		addDraggablePoint: function( point )
		{
			var lonLat = this.getCenter();
			var proj = new OpenLayers.Projection("EPSG:4326");
			lonLat.transform( proj, this.map.getProjectionObject() );

			//Create Draggable Pin Feature
			var vector_point = new OpenLayers.Geometry.Point(lonLat.lon, lonLat.lat);
			var iconFeature = new OpenLayers.Feature.Vector(vector_point);
			var index = this.getDraggablePointsIndex();

			iconFeature.id = index.toString();

		    iconFeature.style ={
		    	externalGraphic: this.createDraggableMarkerIcon( point ),
			    graphicOpacity: 1.0,
			    graphicWith: 31,
			    graphicHeight: 37,
			    graphicYOffset: -26,
			    cursor: "pointer"
			}
			
			this.draggablePointsLayer.addFeatures(iconFeature);
		},
		
		removeDraggablePoint: function( feature )
		{
			if (!feature)
				return;
			
			feature = feature.details[0];
			
			for(var i=0; i<this.draggablePointsLayer.features.length; i++)
			{
				if ( feature.id == this.draggablePointsLayer.features[i].id )
				{
					this.draggablePointsLayer.selectedFeatures = feature;
					this.draggablePointsLayer.removeFeatures(feature, { silent: true });
					this.draggablePointsLayer.destroyFeatures(feature);
					break;
				}
			}
		},
		
		focusDraggablePins: function()
		{
			//Put on TOP
			this.putDraggableLayerOnTopOrBottom( true );
		},
		
		addTileLayer: function( name, url )
		{
			if (!name || !url || this.getLayerByName( name ) != null )
				return;
			
			var tileLayer = new OpenLayers.Layer.XYZ(
                name,
                url,
                {
                	sphericalMercator: true,
                	isBaseLayer: false
                }
           );
			
			//add new tile layer
			this.map.addLayer( tileLayer );
		},
		
		zoomToMarkers: function()
		{
			var pointsBounds = this.pointsLayer.getDataExtent();
			
			if (pointsBounds)
				this.map.zoomToExtent(pointsBounds);
		},
		
		addPoints: function( points, zoomTo, options )
		{
			if( !this.pointsLayer )
			{
				this.pointsLayer = new OpenLayers.Layer.Markers("points");
				this.pointsLayer.events.fallThrough = true;
				this.map.addLayer( this.pointsLayer );
			}
			
			//Set Layers Z Indexes
			this.setLayersZIndex();	
			
			if (!(options && options.bybassRemovePoints == true))
				this.removeAllPoints();
			
			// Add point on the map
			for( var i = 0; i < points.length; i ++ )
				this.addPoint( points[i] );
			
			if ( zoomTo )
				this.zoomToMarkers();	
		},
		
		/**
		 * Show POIs on the map.
		 * 
		 * @param {Boolean} value
		 * @param {String} types
		 */
		showPOIs : function ( value, types, query  )
		{
			if(types)
				this.poiTypes = types;
			
			if(query)
				this.poiQuery = query;
			
			if(value)
				this.map.events.register('moveend', this, this.loadPOIs);
			else
				this.map.events.unregister('moveend', this, this.loadPOIs);
		},
		
		/**
		 * Load POIs from GeoPlatform.
		 */
		loadPOIs: function(  options  )
		{
			if( !this.poiLayer )
			{
				this.poiLayer = new OpenLayers.Layer.Markers("pois");
				this.poiLayer.events.fallThrough = true;
				this.map.addLayer( this.poiLayer );	
			}
							
			//Set Layers Z Indexes
			this.setLayersZIndex();
				
			this.poiLayer.clearMarkers();
			
			var proj = new OpenLayers.Projection("EPSG:4326");
			
			if(options.query)
			{
				this.geoPlatform.loadQueryPOIs(
					options.poiTypes,
					this.map.getExtent().transform(  this.map.getProjectionObject(), proj  ),
					M.bind( function( data ) {
						
						for( var i = 0; i < data.length; i++ )
							this.addQueryPOI( data[i]);
						
						//after POIS added send notification
						this.dispatcher.fire('poisLoaded');
					}, this), 
					null,
					options.query ,
					options.queryParams
				);
			}
			else
			{
				this.geoPlatform.loadPOIs(
						options.poiTypes,
						this.map.getExtent().transform(  this.map.getProjectionObject(), proj  ),
						M.bind( function( data ) {
							
							for( var i = 0; i < data.length; i++ )
								this.addPOI( data[i]);
							
						}, this), 
						null
				);
			}
			
		},
		

		/**
		 * Add POI on the map.
		 * 
		 * @param p
		 */
		addPOI: function ( p )
		{
			// Check if poiLayer exists
			if( !this.poiLayer )
			{
				this.poiLayer = new OpenLayers.Layer.Markers("pois");
				this.poiLayer.events.fallThrough = true;
				this.map.addLayer( this.poiLayer );		
			}
			
			// Apply projection to lon, lat
			var lonLat = new OpenLayers.LonLat( p.lon(), p.lat() );
			var proj = new OpenLayers.Projection("EPSG:4326");
			lonLat.transform( proj, this.map.getProjectionObject() );
			
			// Store
			// Add Marker to layer
			// Create marker
			var marker = new OpenLayers.Marker( lonLat, this.createPOIIcon( p )  );
			marker.point = p;
			
			this.poiLayer.addMarker( marker);
		},
		
		//TODO you can refactor me
		addQueryPOI: function ( p )
		{
			// Check if poiLayer exists
			if( !this.poiLayer )
			{
				this.poiLayer = new OpenLayers.Layer.Markers("pois");
				this.map.addLayer( this.poiLayer );	
			}
			
			// Apply projection to lon, lat
			var lonLat = new OpenLayers.LonLat( p.lon, p.lat );
			var proj = new OpenLayers.Projection("EPSG:4326");
			lonLat.transform( proj, this.map.getProjectionObject() );
			
			// Store
			// Add Marker to layer
			// Create marker
			var marker = new OpenLayers.Marker( lonLat, this.createPOIIcon( p )  );
			marker.events.register('click', this, this._onPOIClick);
			marker.events.register('touchstart', this, this._onPOIClick);
			
			marker.poi = p;
			
			//hide POI
			marker.display(false);
			
			this.poiLayer.addMarker( marker);
			
			var poiCategory = p.metacatid;
			
			if (!this.pois[poiCategory])
				this.pois[poiCategory] = [];
				
			this.pois[poiCategory].push(marker);
		},
		
		addSpecialPoint: function( point )
		{
			if ( !this.specialPointsLayer )
			{
				this.specialPointsLayer = new OpenLayers.Layer.Markers("SpecialPoints");
				this.specialPointsLayer.events.fallThrough = true;
				this.map.addLayer( this.specialPointsLayer );	
			}
			
			// Apply projection to lon, lat
			var lonLat = new OpenLayers.LonLat( point.lon(), point.lat() );
			var proj = new OpenLayers.Projection("EPSG:4326");
			lonLat.transform( proj, this.map.getProjectionObject() );
			
			//Mark as special
			point.special = true;
			
			// Create marker
			var marker = new OpenLayers.Marker( lonLat, this.createMarkerIcon( point ) );
			marker.events.register('click', this, this._onPointClick);
			marker.events.register('mouseover', this, this._onPointOver);
			marker.events.register('mouseout', this, this._onPointExit);
			
			marker.point = point;
			
			// Save marker in point
			point.marker = marker;
			
			// Store
			// Add Marker to layer
			this.specialPointsLayer.addMarker( marker );
			
			this.setLayersZIndex();
			
			return point;
		},
		
		removeSpecialPoint: function( point )
		{
			if (!point || !point.marker)
				return;
			
			this.specialPointsLayer.removeMarker(point.marker);
		},
		
		removeAllSpecialPoints: function()
		{
			this.specialPointsLayer.clearMarkers();
		},
		
		getLatLonForPoint: function( point )
		{
			return { lat: point.lat, lon: point.lon };
		},
		
		/**
		 * Add point on the map.
		 * 
		 * @param p
		 */
		addPoint: function( p )
		{
			if( !this.pointsLayer )
			{
				this.pointsLayer = new OpenLayers.Layer.Markers("points");
				this.pointsLayer.events.fallThrough = true;
				this.map.addLayer( this.pointsLayer );		
			}
			
			var marker = this.getMarker( p );
			
			marker.events.register('touchstart', this, this._onPointClick);
			marker.events.register('click', this, this._onPointClick);
			
			marker.point = p;
			
			// Save marker in point
			p.marker = marker;
			
			// Store
			// Add Marker to layer
			this.pointsLayer.addMarker( marker );
			this.markers.push( marker );
			this.points.push( p );
		},
		
		getMarker: function (p)
		{
			return this.createMarker(p);
		},
		
		createMarker: function ( p )
		{
			if( !this.pointsLayer )
			{
				this.pointsLayer = new OpenLayers.Layer.Markers("points");
				this.pointsLayer.events.fallThrough = true;
				this.map.addLayer( this.pointsLayer );		
			}
			
			// Apply projection to lon, lat
			var lonLat = new OpenLayers.LonLat( p.lon(), p.lat() );
			var proj = new OpenLayers.Projection("EPSG:4326");
			lonLat.transform( proj, this.map.getProjectionObject() );
			
			// Create marker
			var	marker = new OpenLayers.Marker( lonLat, this.createMarkerIcon( p ) );
			marker.events.register('mouseover', this, this._onPointOver);
			marker.events.register('mouseout', this, this._onPointExit);
			marker.events.register('dblclick', this, this._onPointDblClick);
			
			return marker;
		},
		
		removePoint: function( point )
		{
			if( !this.pointsLayer )
				return;
			
			//Remove from Markers array
			for (var i = 0 ; i < this.markers.length; i++)
				if ( this.markers[i].point.marker.icon.url ==  point.marker.icon.url )
					this.pointsLayer.removeMarker( this.markers[i] );
			
			//Remove from Points array
			for (var i=0; i < this.points.length; i++)
			{
				if ( this.points[i].marker.icon.url == point.marker.icon.url  ){
					this.points.splice(i, 1);
					break;
				}
			}
		},
		
		/**
		 * Remove all points from the map.
		 */
		removeAllPoints: function()
		{
			if( !this.pointsLayer )
				return;
			
			for (var i = 0 ; i < this.markers.length; i++)
				this.pointsLayer.removeMarker( this.markers[i] );
			
			this.points = [];
			this.markers = [];
		},
		
		/**
		 * Create marker icon.
		 */
		createMarkerIcon: function( point )
		{
			var iconInfo = this.markerIcon( point );
			 
			if( point.type != 'cluster' )
			{
				if ( !point.special && iconInfo && iconInfo.size && iconInfo.url )
				{
					return new OpenLayers.Icon(iconInfo.url, iconInfo.size, iconInfo.offset);
				}
				else
				{
				
					if (point.marker && point.marker.icon)
					{
						if ( !point.marker.icon.size.w || !point.marker.icon.size.h)
						{
							point.marker.icon.size = {
								w: point.marker.icon.size,
								h: point.marker.icon.size
							};
						}
						
						var size = new OpenLayers.Size(point.marker.icon.size.w, point.marker.icon.size.h);
						var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
						
						if (point.marker.icon.offset)
							offset = new OpenLayers.Pixel(point.marker.icon.offset.x, point.marker.icon.offset.y);
							
						return new OpenLayers.Icon(point.marker.icon.url, size, offset);
					}
				}
			}
				
			return new OpenLayers.Icon(iconInfo.url, iconInfo.size, iconInfo.offset);
		},
		
		markerIcon: function()
		{
			var size = new OpenLayers.Size(36, 36);
			
			return {
				size: size,
				offset: new OpenLayers.Pixel(-(size.w/2), -size.h),
				url: 'http://mapping.power-cluster.net/mapping/images/m1.png'
			}
		},
		
		/**
		 * Create POI icon.
		 */
		createPOIIcon: function( poi )
		{
			var size = new OpenLayers.Size(36,36);
			var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
			
			return new OpenLayers.Icon('http://www.canadianhotelguide.com/images/poi_title_target_pin.png', size, offset);
		},
		
		pan: function( deltaX, deltaY )
		{
			this.map.pan( deltaX, deltaY );
		},
		
		getPoints: function()
		{
			return this.points;
		},
		
		createPopup: function( html, options)
		{
			var popup = null;
			var lonLat = new OpenLayers.LonLat( options.lon, options.lat );
			var proj = new OpenLayers.Projection("EPSG:4326");
			lonLat.transform( proj, this.map.getProjectionObject() );
			
			var offset = {x: 10, y: 10};
			
			if (options.offset)
				offset = options.offset; 
			
			if(!options.width)
				options.width = 130;
				
			if(!options.height)
				options.height = 30;
			
			 var anchor = {
			 	'size': new OpenLayers.Size(0,0), 
			 	'offset': new OpenLayers.Pixel(offset.x, offset.y)
			 	};
			
			popup =  new OpenLayers.Popup.Anchored(
				"feature", 
				lonLat, 
				new OpenLayers.Size(options.width, options.height), 
				html, 
				anchor,
				false );
			
			// Force the popup to always open to the bottom-center
			if (options.alignCenter)
				popup.calculateRelativePosition = function (px) {
						 return 'tc';
				};
			else
				popup.calculateRelativePosition = function (px) {
						 return 'tr';
				};
				
			popup.keepInMap = true;
			popup.panMapIfOutOfView = true;
			popup.autoSize = true;	
			
			return popup;
		},
		
		addMarkerListener: function( marker, eventName, func )
		{
			marker.events.register(eventName, this, func);
		},
		
		addPopup: function( popup )
		{
			this.map.addPopup( popup, true );
		},
		
		removePopup: function( popup )
		{
			this.map.removePopup( popup );
		},
		
		getPopupDOMElement: function( popup )
		{
			return popup.div;
		},
		
		transformLonLat: function( lon, lat, proj )
		{
			var lonLat = new OpenLayers.LonLat( lon, lat );
			var newProj = new OpenLayers.Projection( proj );
			lonLat.transform( newProj, this.map.getProjectionObject() );
			
			return lonLat;
		},
		
		calculateBounds: function()
		{
			var bounds = this.map.getExtent().transform(  this.map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
			
			var standardBounds = {
				south: bounds.bottom,
				west: bounds.left,
				north: bounds.top,
				east: bounds.right
			};
			
			return standardBounds;
		},
		
		showItinerary: function( itinerary, options )
		{
			if ( !itinerary || itinerary.routes.length < 1 )
				return;
			
			var strokeColor = options.strokeColor || "#000000";
			var strokeWidth = options.strokeWidth || 2;
			var strokeOpacity = options.strokeOpacity || 1.0;
			
			//Create lines layer if it doesn't exist
			if ( !this.linesLayer )
			{
				this.linesLayer = new OpenLayers.Layer.Vector("Lines Layer");
				this.map.addLayer( this.linesLayer );
			}
			
			this.linesLayer.destroyFeatures();	
			
			//Transform itinerary path into array of points to form a Line
			var itineraryPath = itinerary.Polyline;
			var itineraryPoints = [];
			
			for ( var i = 0; i < itineraryPath.length; i++ )
				itineraryPoints.push(new OpenLayers.Geometry.Point(itineraryPath[i].Longitude, itineraryPath[i].Latitude).
					transform(new OpenLayers.Projection("EPSG:4326"), this.map.getProjectionObject()));
			
			var itineraryLineString = new OpenLayers.Geometry.LineString(itineraryPoints);
			var itineraryStyle = {
				strokeColor: strokeColor,
		        strokeOpacity: strokeOpacity,
		        strokeWidth: strokeWidth
			};
			
			var itineraryFeature = new OpenLayers.Feature.Vector(itineraryLineString, null, itineraryStyle);
			this.linesLayer.addFeatures([itineraryFeature]);
			
			this.map.zoomToExtent(this.linesLayer.getDataExtent());
			
			this.dispatcher.fire('itineraryRendered');
		},
		
		removeItinerary: function()
		{
			if ( this.specialPointsLayer )
				this.map.setLayerZIndex(this.specialPointsLayer, 100);
			
			if (!this.linesLayer)
				return;
				
			this.linesLayer.destroyFeatures();
			//this.map.removeLayer( this.linesLayer );
		},
		
		/*
		 * Shows all loaded POIs for the given POI types
		 */
		showQueryPOIs : function ( types)
		{
			this.hideAllPOIs();
			
			for (var i=0; i<types.length; i++)
			{
				if ( this.pois[types[i]] )
				{
					for(var j=0; j< this.pois[types[i]].length; j++)
					{
						this.pois[types[i]][j].display(true);
					}
				}
			}
		},
		
		showPoints: function( points )
		{
			this.hideAllPoints();
			
			for( var i=0; i< points.length; i++)
				this.showPoint( points[i] );
		},
		
		showPoint: function( point )
		{
			var marker = this.getMarkerForPoint( point );
			
			if( marker )
				marker.display( true )
		},
		
		showHidePoint: function( point, show )
		{
			var marker = point.marker;
			
			if (!marker)
				marker = this.getMarkerForPoint( point );
			
			if( marker )
				marker.display( show );
		},
		
		showAllPoints: function()
		{
			this._showHideAllPoints( true );
		},
		
		hideAllPoints: function()
		{
			this._showHideAllPoints( false );
		},
		
		hideAllPOIs: function()
		{
			for( var i=0; i< this.poiLayer.markers.length; i++)
			{
				var marker = this.poiLayer.markers[i];
				marker.display( false )
			}
		},
		
		getMarkerForPoint: function( point )
		{
			for( var i=0; i< this.markers.length; i++)
			{
				var marker = this.markers[i];
				
				if ( marker.point.index != undefined )
				{
					if( marker.point.index == point.index )
						return marker;
				}
				else
					if ( marker.point == point )
						return marker;
			}
			
			return null;
		},
		
		setMarkerForPoint: function( point, marker )
		{
			for( var i=0; i< this.markers.length; i++)
			{
				if ( this.markers[i].point.index != undefined )
				{
					if( this.markers[i].point.index == point.index )
					{
						this.markers[i].icon.setUrl(marker.url);
						this.markers[i].icon.setSize(marker.size);
						
						return this.markers[i]
					}
				}
				else
					if( this.markers[i].point == point )
					{
						this.markers[i].icon.setUrl(marker.icon.url);
						this.markers[i].icon.setSize(marker.icon.size);
						
						return this.markers[i]
					}
			}
		},
		
		onMap: function( eventName, callback, context )
		{
			this.map.events.register(eventName, context, callback);
		},
		
		zoomTo: function( zoom )
		{
			this.map.zoomTo( zoom );
		},
		
		setCenter: function( lonLat, zoom )
		{
			var theLonLat = new OpenLayers.LonLat( lonLat.lon, lonLat.lat );
			
			this.map.setCenter( theLonLat );
			
			if ( zoom )
				this.map.zoomTo( zoom );
		},
		
		setExtent: function( bounds )
		{
			if (!bounds)
				return;
			
			var bounds  = new OpenLayers.Bounds(bounds[1], bounds[0], bounds[3], bounds[2]);
			
			var proj1 = new OpenLayers.Projection("EPSG:4326");
			var proj2 = this.map.getProjectionObject();
			bounds.transform( proj1,proj2 );
			
			// if at maximum zoom level the map won't move because it is instructed so in the prototype "moveTo",
			// so decrease the zoom by one and then try to move it
			if (this.getZoom() == this.maxZoom)
				this.map.zoomTo(this.maxZoom - 1);
			
			this.map.zoomToExtent(bounds);
		},
		
		setOpacity: function( opacity, layerIndex )
		{
			var index = layerIndex || 0;
			
			if ( this.polygonsLayers )
				this.polygonsLayers[index].setOpacity( opacity );
		},
		
		getLonLat: function( x, y )
		{
			var proj1 = new OpenLayers.Projection("EPSG:4326");
			var proj2 = this.map.getProjectionObject();
			
			var lonLat = new OpenLayers.LonLat(x, y).transform(proj1, proj2);
			
			return { lat: lonLat.lat, lon: lonLat.lon }
		},
		
		getZoom: function()
		{
			return this.map.getZoom();
		},
		
		getCenter: function()
		{
			var center = this.map.getCenter();
			
			center.transform(this.map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
			
			return center;
		},
		
		resize: function()
		{
			this.map.updateSize();
		},
		
		zoomOut: function()
		{
			this.map.zoomOut();
		},
		
		calculateRadius: function ( value, circleRadiusIntervals )
		{
			for (var i = 0; i < circleRadiusIntervals.length; i++)
			{
				//circleRadiusIntervals[i].max == null
				if (value >= circleRadiusIntervals[i].min)
					if (circleRadiusIntervals[i].max == null)
						return circleRadiusIntervals[i].radius;
					else
						if ( value <= circleRadiusIntervals[i].max)
							return circleRadiusIntervals[i].radius;
			}
		},
		
		computeCircleRadiusIntervals: function ( maxValue, intervals )
		{
			var circleRadiusIntervals = [];
			
			var minRadius = 3;
			var radiusStep = 3;
			
			//initiate first interval to compute the rest based on the first
			circleRadiusIntervals.push({
					min: 0,
					max: 100,
					radius: 3
			});
			
			for (var i=1; i<intervals.length - 1; i++)
			{
				circleRadiusIntervals.push({
					min: circleRadiusIntervals[ i - 1 ].max + 1,
					max: intervals[ i + 1 ],
					radius: minRadius * i + radiusStep
				});
			}
			
			return circleRadiusIntervals;
		},
		
		addDynamicCirclePoint: function ( p, circleRadiusIntervals )
		{
			// Apply projection to lon, lat
			var origin = new OpenLayers.Geometry.Point(p.lon, p.lat);
			origin.transform( new OpenLayers.Projection("EPSG:4326"), this.map.getProjectionObject() );
			
			// Create circle
			var point = new OpenLayers.Geometry.Point(origin.x, origin.y);
			var feature = new OpenLayers.Feature.Vector(point, {radius: this.calculateRadius(p.densite_commerciale, circleRadiusIntervals)})
			feature.point = p;
			
			// Add circle to layer
			this.circlesLayer.addFeatures( [feature]);
		},
		
		resetDragControl: function()
		{
			//Put draggable points on bottom
			this.putDraggableLayerOnTopOrBottom( false );
			
			//Fix DragControl bug when clicking outside of Feature (deactivate and activate control)
			if (this.dragControl)
			{
				this.dragControl.deactivate();
				this.dragControl.activate();
			}
		},
		
		computeDistanceBetweenPoints: function(point1, point2)
		{
			lonLat1 = this.getLatLonForPoint(point1);
			lonLat2 = this.getLatLonForPoint(point2);
			
			var proj = new OpenLayers.Projection("EPSG:4326");
			
			var point1 = new OpenLayers.Geometry.Point(lonLat1.lon, lonLat1.lat).transform(proj, this.map.getProjectionObject());
	        var point2 = new OpenLayers.Geometry.Point(lonLat2.lon, lonLat2.lat).transform(proj, this.map.getProjectionObject());       
	        
	        return point1.distanceTo(point2);
		},
		
		addDynamicCirclePoints: function ( points, intervals )
		{
			var mapLayerName = "polygonLayer";
			var maxValue = 0;
			
			//create circle style
			var style = new OpenLayers.StyleMap({
				"default": {
					graphicName: "circle",
					pointRadius: "${radius}",
					strokeColor: "#B23600",
					fillColor: "#FF8A00",
					fillOpacity: 0.7
				}
			});

			//remove layer if it exists
			var index = this.removeLayerByName(mapLayerName);
			this.circlesLayer = new OpenLayers.Layer.Vector("polygonLayer", {styleMap: style});
			
			this.handler = new OpenLayers.Handler.Feature(this, this.circlesLayer, 
				{ click: this._onCirclePointClick });
			this.handler.setMap(this.map);
			this.handler.activate();
			 
			//add new layer
			this.map.addLayer( this.circlesLayer );
			
			if( index > -1)
				this.map.setLayerZIndex(this.circlesLayer,index);
				
			//Set Layers Z Indexes
			this.setLayersZIndex();
			
			this.polygonsLayers.push( this.circlesLayer );
			
			maxValue = points[0].densite_commerciale;
			
			var circleRadiusIntervals = this.computeCircleRadiusIntervals( maxValue, intervals );
			
			for (var i = 0; i < points.length; i++)
				this.addDynamicCirclePoint(points[i], circleRadiusIntervals);
		},
		
		_onCirclePointClick: function (evt)
		{
			this.dispatcher.fire('circleclick', evt.point);
		},
		
		_showHideAllPoints: function( show )
		{
			for( var i=0; i< this.markers.length; i++)
			{
				var marker = this.markers[i];
				marker.display( show )
			}
		},

		_onMapMoveEnd: function( evt )
		{
			// if (evt.object.zoom > this.maxZoom)
			// {
				// this.map.setCenter( this.mapCenterBeforeMove );
				// this.map.zoomTo( this.maxZoom );
			// }
// 				
// 			
			// if (evt.object.zoom < this.minZoom)
			// {
				// this.map.setCenter( this.mapCenterBeforeMove );
				// this.map.zoomTo(this.minZoom);
			// }
					
			//Send to billing
			this.geoPlatform.billing( this.getCenter() ); 		
			
			//Fix DragControl bug when clicking outside of Feature (deactivate and activate control)
			this.resetDragControl();
			
			this.dispatcher.fire('boundsChanged', evt);
		},
		
		_onZoomEnd: function( evt )
		{
			//this.dispatcher.fire('boundsChanged', evt);
		},
	
		/**
		 * Called by the map engine when a click event is dispatched.
		 * 
		 * @param evt
		 */
		_onMapClick: function( evt )
		{
			//Fix DragControl bug when clicking outside of Feature (deactivate and activate control)
			this.resetDragControl();
			
			//transform from current map projection to default GeoServer projection(ESPG:4326) in order to send 
			//correct queries to GeoServer
			
		    var lonlat = this.map.getLonLatFromPixel( evt.xy);
		    var proj = new OpenLayers.Projection("EPSG:4326");
		    lonlat.transform( this.map.getProjectionObject(), proj);
		    this.dispatcher.fire("mapClick", {lon: lonlat.lon, lat: lonlat.lat});
		},
		
		/**
		 * This function is called when a feature is clicked on the map.
		 * 
		 * @param data - json data with informations about feature.
		 */
		_onFeatureInfo: function( data, lat, lon )
		{
			var result = M.JSON.parse( data );
			var info = result.features[0];
			
			if (info)
			{
				info.lat = lat;
				info.lon = lon;
			}
			
			this.dispatcher.fire('polygonClick', info);
		},
		
		/**
		 * Called by map when a POI is clicked.
		 */
		_onPOIClick: function( evt )
		{
			//Fix DragControl bug when clicking outside of Feature (deactivate and activate control)
			this.resetDragControl();
			
			var marker = evt.object;
			var p = marker.poi;
			 
			//this.map.addPopup( tooltip );
			this.dispatcher.fire('poiClick', [p]);
		},
		
		/**
		 * Called by map when a point is clicked.
		 */
		_onFeatureSelected: function( evt )
		{
			this.putDraggableLayerOnTopOrBottom( true );
			this.dispatcher.fire('featureSelected', evt);
		},
		
		_onFeatureUnselected: function( evt )
		{
			this.dispatcher.fire('featureUnselected', evt);
		},
		
		_onPointClick: function( evt )
		{
			//Fix DragControl bug when clicking outside of Feature (deactivate and activate control)
			this.resetDragControl();
			
			var marker = evt.object;
			var p = marker.point;
			 
			 
			if (p.type != "cluster")
				//this.map.addPopup( tooltip );
				this.dispatcher.fire('pointClick', [p]);
			else
				this.dispatcher.fire('clusterClicked', marker);
		},

		_onPointOver: function( evt )
		{
			var marker = evt.object;
			var p = marker.point;
			 
			this.dispatcher.fire('pointOver', [p]);
		},
		
		_onPointExit: function( evt )
		{      
			this.dispatcher.fire('pointExit', null);
		},
		
		_onPointDblClick: function(evt)
		{
			//Fix DragControl bug when clicking outside of Feature (deactivate and activate control)
			this.resetDragControl();
			
			var marker = evt.object;
			var p = marker.point;
			 
			this.dispatcher.fire('pointDblClick', [p]);
		},
		
		_onMoveStart: function (evt)
		{
			this.mapCenterBeforeMove = this.map.getCenter();
		}
	};
	
	M.OpenLayersMap = OpenLayersMap;
})(M);

(function( M )
{
    /**
	 * GoogleMap class is base map using Goolge Engine.
	 * 
	 * @class GoogleMap
	 * @module geolibrary
	 * @version 0.1.0
	 */
	var GoogleMap = function( cfg )
	{
		this.map = null;
		this.markers = [];
		this.specialMarkers = [];
		this.lastBounds = null;
	
		this.dispatcher = cfg.dispatcher;
		this.geoPlatform = cfg.geoPlatform;
		this.geoServer = cfg.geoServer;
		this.geoRasterService = cfg.geoRasterService || null;
	};
	
	GoogleMap.prototype = {
	
		initMap: function( container, options )
		{
			var node = container;
			var startLocation = options.startLocation ? new google.maps.LatLng( options.startLocation[0], options.startLocation[1] )  : new google.maps.LatLng( 48.868206, 2.346597 );
			var startZoom = options.startZoom || 5;
			var disableDefaultUI = options.hasOwnProperty("disableDefaultUI") ? options.disableDefaultUI : false;
			var zoomControl = options.hasOwnProperty("zoomControl") ? options.zoomControl : true;
			var panControl = options.hasOwnProperty("panControl") ? options.panControl : true;
			var streetViewControl = options.hasOwnProperty("streetViewControl") ? options.streetViewControl : true;
			var zoomControlOptions = options.hasOwnProperty("zoomControlOptions") ? options.zoomControlOptions : {};
			var panControlOptions = options.hasOwnProperty("panControlOptions") ? options.panControlOptions : {};
			var mapType = (options.hasOwnProperty("mapType") && options.mapType ) ? options.mapType : google.maps.MapTypeId.ROADMAP;
			var mapTypeControl = (options.hasOwnProperty("mapTypeControl")) ? options.mapTypeControl : true;
			var referenceStyle = (options.hasOwnProperty("referenceStyle") && options.referenceStyle) ? options.referenceStyle : null;
			var mapTypeControl = options.hasOwnProperty("mapTypeControl") ? options.mapTypeControl : true;
			var panControlOptions = options.hasOwnProperty("panControlOptions") ? options.panControlOptions : null;
			
			if( typeof node == "string" )
				node = document.getElementById( container );
				
			this.map = new google.maps.Map( node, {
				zoom: startZoom,
				minZoom: options.minZoom,
				maxZoom: options.maxZoom,
				center: startLocation,
				mapTypeId: mapType,
				disableDefaultUI: disableDefaultUI,
				zoomControl: zoomControl,
				panControl: panControl,
				streetViewControl: streetViewControl,
				mapTypeControl: mapTypeControl,
				mapTypeControlOptions: {
					position: google.maps.ControlPosition.RIGHT_TOP
				},
				panControlOptions: panControlOptions,
				zoomControlOptions: zoomControlOptions,
				scaleControl: options.scaleControl,
				scaleControlOptions: options.scaleControlOptions
			});
			
			this.map.setOptions({styles: referenceStyle});
			
			if(typeof this.map.enableKeyDragZoom === 'function' && typeof this.map.enableKeyDragZoom != 'undefined')
				this.map.enableKeyDragZoom();
			
			google.maps.event.addListener( this.map, 'mapoClick', M.bind( function( evt ) {
				
				var mapoPin = evt;
				 
				 if ( mapoPin.point.type == 'cluster' )
					this.dispatcher.fire('clusterClicked', evt);
				else
				{
					var markerMockup = {};
					markerMockup.point = mapoPin.point;
					
					this._onPointClick({marker: markerMockup});
				}
			}, this ));
			
			google.maps.event.addListener( this.map, 'mapoMouseOver', M.bind( function( evt ) {
				var mapoPin = evt;
				 
				 if ( mapoPin.point.type == 'cluster' )
					this.dispatcher.fire('clusterMouseOver', evt);
				else
				{
					var markerMockup = {};
					markerMockup.point = mapoPin.point;
					
					this._onPointOver({marker: markerMockup});
				}
			}, this ));
			
			google.maps.event.addListener( this.map, 'mapoMouseOut', M.bind( function( evt ) {
				var mapoPin = evt;
				 
				 if ( mapoPin.point.type == 'cluster' )
					this.dispatcher.fire('clusterMouseOut', evt);
				else
				{
					var markerMockup = {};
					markerMockup.point = mapoPin.point;
					
					this._onPointExit({marker: markerMockup});
				}
			}, this ));

			
			google.maps.event.addListener( this.map, 'dragend', M.bind( function( evt ) {
				this.dispatcher.fire('boundsChanged', []);
			}, this ));
		
		
		    // OLD ZOOM EVENT	
			// google.maps.event.addListener( this.map, 'zoom_changed', M.bind( function( evt ) {
				// this.dispatcher.fire('boundsChanged', []);
			// }, this ));
			
			// FIX BOUNDS WHEN ZOOMING 
			// zoom_changed is dispatched before map is updated 
			google.maps.event.addListener( this.map, 'zoom_changed', M.bind( function () 
            {
               var l =  google.maps.event.addListener( this.map, 'idle', M.bind( function( evt ) {
                   
                    this.dispatcher.fire('boundsChanged', []);
                    google.maps.event.removeListener(l);
                    
                 }, this ));
            }, this));
			
			var listener = google.maps.event.addListener( this.map, 'tilesloaded', M.bind( function( evt ) {
				this.dispatcher.fire('mapReady', []);
				google.maps.event.removeListener(listener);
			}, this ));
			
			// Directions
			this.displayDirections = new google.maps.DirectionsRenderer();
			this.displayDirections.setOptions({
				suppressMarkers: true
			});
		},
		
		enableDisableDragZoom: function( enabled )
		{
			if (enabled)
			{
				this.map.startDragZoomControl();
				var dz = this.map.getDragZoomObject();
				
				//Add Drag Start event listener
				google.maps.event.addListener(dz, 'dragstart',  M.bind( function( evt ) {
				this.dispatcher.fire('dragZoomStarted', evt);
			}, this ));	
			}
			else
				if (this.map.keyDragZoomEnabled())
				{
					this.map.endDragZoomControl();
				}
		},
		
		addListener: function( itemToListenOn, eventName, func )
		{
			google.maps.event.addListener( itemToListenOn, eventName, func);
		},
		
		addMarkerListener: function( marker, eventName, func )
		{
			this.addListener(marker, eventName, func);
		},
		
		enableFrontendClustering: function( markers, options )
		{
			this.markerCluster = new MarkerClusterer(this.map, this.markers, {
				styles: options.frontendClusterOptions.styles,
				gridSize: options.frontendClusterOptions.gridSize,
				maxZoom: options.frontendClusterOptions.maxZoom
			});
		},
		
		getMarkersInFrontendCluster: function()
		{
			if ( this.markerCluster )
				return this.markerCluster.getMarkers();
		},
		
		disableFrontendClustering: function()
		{
			if ( this.markerCluster )
				this.markerCluster.clearMarkers();
		},
		
		addPoints: function( points, zoomTo, options )
		{
			this.removeAllPoints();
						
			// Add point on the map
			for( var i = 0; i < points.length; i ++ )
				this.addPoint( points[i] );
			
			if ( options && options.useFrontendClustering )
			{
				this.frontendClusterOptions = options;
				this.enableFrontendClustering( this.markers, this.frontendClusterOptions );
			}
				
			
			if( zoomTo )
				this.zoomToPoints( points );
		},
		
		getPointsInBounds: function( bounds )
		{
			var pointsInBounds = [];
			
			if ( !bounds )
				bounds = this.map.getBounds();
			
			for ( var i=0; i<this.markers.length; i++ )
			{
				var currentMarker = this.markers[i];
				var currentMarkerLatLng = currentMarker.getPosition();
				
				if ( bounds.contains(currentMarkerLatLng) )
					pointsInBounds.push( currentMarker.point );
			}
			
			return pointsInBounds;
		},
		
		getLatLonForPoint: function(point)
		{
			return {
				lat: point.lat(),
				lon: point.lng()
			}
		},
		
		getCenter: function ()
		{
			return this.map.getCenter();
		},
		
		/**
		 * Remove all points from the map.
		 */
		removeAllPoints: function()
		{
			for (var i = 0 ; i < this.markers.length; i++)
			{
				this.markers[i].point.marker = null;
				this.markers[i].setMap( null );
			}
			
			this.markers = [];
			
			this.disableFrontendClustering();
		},
		
		addPoint: function( point )
		{
			var marker = this.getMarker( point );
			
			google.maps.event.addListener( marker, 'click', M.bind( function( evt ) {
				this._onPointClick({marker: marker});
			}, this ));
			
			google.maps.event.addListener( marker, 'mouseover', M.bind( function( evt ) {
				this._onPointOver({marker: marker});
			}, this ));
			
			google.maps.event.addListener( marker, 'mouseout', M.bind( function( evt ) {
				this._onPointExit({marker: marker});
			}, this ));
			
			// Set marker map
			
			if ( !this.frontendClusterOptions || !this.frontendClusterOptions.useFrontendClustering)
				marker.setMap( this.map );
				
			marker.point = point;
			marker.googleMap = this;
			
			// Store marker in points
			point.marker = marker;
			
			// Store marker
			this.markers.push( marker );
		},
		
		addSpecialPoint: function( point )
		{
			var marker = this.getMarker( point );
			
			google.maps.event.addListener( marker, 'click', M.bind( function( evt ) {
				this._onPointClick({marker: marker});
			}, this ));
			
			google.maps.event.addListener( marker, 'mouseover', M.bind( function( evt ) {
				this._onPointOver({marker: marker});
			}, this ));
			
			google.maps.event.addListener( marker, 'mouseout', M.bind( function( evt ) {
				this._onPointExit({marker: marker});
			}, this ));
			
			// Set marker map
			marker.setMap( this.map );
			marker.point = point;
			marker.googleMap = this;
			
			// Store marker in points
			point.marker = marker;
			
			// Store marker
			this.specialMarkers.push( marker );
			
			return point;
		},
		
		createMarker: function( point )
		{
			var marker = new  google.maps.Marker();
			marker.setIcon( this.createMarkerIcon( point ) );
			marker.setPosition( new google.maps.LatLng( point.lat(), point.lon()) );
			
			var markerInfo = this.markerInfo( point );
			
			if ( markerInfo && markerInfo.title )
				marker.setTitle(markerInfo.title);
			
			return marker;
		},
	
		createMarkerIcon: function( point )
		{
			var markerInfo = this.markerIcon( point );
			
			if (point.marker && point.marker.icon)
			{
				var size = null;
				if ( point.marker.icon.size && point.marker.icon.size.width && point.marker.icon.size.height )
					size = new google.maps.Size(point.marker.icon.size.width, point.marker.icon.size.height);
					
				var scaledSize = null;
				if ( point.marker.icon.scaledSize && point.marker.icon.scaledSize.width && point.marker.icon.scaledSize.height )
					scaledSize = new google.maps.Size(point.marker.icon.scaledSize.width, point.marker.icon.scaledSize.height);
					
				var anchor = null
				if ( point.marker.icon.anchor && point.marker.icon.anchor.x != undefined && point.marker.icon.anchor.y != undefined )
					anchor = new google.maps.Point(point.marker.icon.anchor.x, point.marker.icon.anchor.y);
					 
				return new google.maps.MarkerImage( point.marker.icon.url, size, anchor, point.marker.icon.offset && new google.maps.Point(point.marker.icon.offset.x, point.marker.icon.offset.y), scaledSize);				
			}
			
			var size = null;
			if ( markerInfo.size && markerInfo.size.width && markerInfo.size.height )
				size = new google.maps.Size(markerInfo.size.width, markerInfo.size.height);
			
			var scaledSize = null;
			if ( markerInfo.scaledSize && markerInfo.scaledSize.width && markerInfo.scaledSize.height )
				scaledSize = new google.maps.Size(markerInfo.scaledSize.width, markerInfo.scaledSize.height);
			
			return new google.maps.MarkerImage( markerInfo.url, size, null, markerInfo.anchor, scaledSize  );
		},
		
		markerIcon: function()
		{
			return 'http://www.openlayers.org/dev/img/marker-green.png';
		},
		
		markerInfo: function( point )
		{
			return null;
		},
		
		calculateBounds: function()
		{
			if (!this.map)
				return;
				
			var bounds = this.map.getBounds();
			
			if ( !bounds )
				return;
			
			var result = {
				north: bounds.getNorthEast().lat(),
				east: bounds.getNorthEast().lng(),
				south: bounds.getSouthWest().lat(),
				west: bounds.getSouthWest().lng()
			};
			
			return result;
		},
		
		showPoint: function( point )
		{
			var marker = this.getMarkerForPoint( point );
			
			if( marker )
				marker.setMap(this.map);
		},
		
		showGeoRasterLayer: function (name, options)
		{
			options = options || {};
			
			if(!this.geoRasterService)
				return;
			
			if(!this.GeosRasterListener)
				this.GeosRasterListener = [];

			var layer =  new google.maps.ImageMapType({
					getTileUrl : M.bind( 
						function(coord, zoom)
						{
							return this._getGeoRasterTileUrl(coord, zoom, name , options);
						},this),
					tileSize : new google.maps.Size(256, 256),
					isPng : true,
					name: name,
					minZoom : (options.minZoom || 0),
					maxZoom : (options.maxZoom || 18)
				
				});
			
			this.removeLayerByName(name);
			
			this.map.overlayMapTypes.push(layer);
						
			
			this.GeosRasterListener.push( google.maps.event.addDomListener(layer,'tilesloaded', M.bind( function( evt ) {
				this.geoRasterService._onTileLoaded();
			},this)));
			
			this.GeosRasterListener.push(google.maps.event.addDomListener(this.map,'zoom_changed', M.bind( function( evt ) {
				this.geoRasterService._onChangeZoom(); 
			},this)));
			
			this.GeosRasterListener.push(google.maps.event.addDomListener(this.map,'click', M.bind( function( evt ) {
				this._onGeoRasterClick(evt, name);
			},this)));
			
			this.GeosRasterListener.push(google.maps.event.addDomListener(this.map,'mousemove', M.bind( function( evt ) {
				this._onGeoRasterMouseOver(evt, name);
			},this)));
			
			
		},
		
		_getGeoRasterTileUrl: function(coord, zoom, mapName, options) 
		{
			 return this.geoRasterService.getTileUrl(zoom, coord.x, coord.y, mapName, options);
		},
		
		_onGeoRasterMouseOver: function(evt, name)
		{
			this._fireGeoRasterFeatureEvent(evt, name,'geoRasterMouseOver');
		},
		
		_onGeoRasterClick: function(evt, name)
		{
			
			this._fireGeoRasterFeatureEvent(evt, name,'geoRasterClick');
			
		},
		
		_fireGeoRasterFeatureEvent: function(evt, name, eventName)
		{
			var zoom = this.map.getZoom();
			var proj = this.map.getProjection();
			var numTiles = 1 << this.map.getZoom();
			var worldCoordinate = proj.fromLatLngToPoint(evt.latLng);
			
			var pixelCoordinate = new google.maps.Point(worldCoordinate.x
					* numTiles, worldCoordinate.y * numTiles);

			var tileCoordinate = new google.maps.Point(Math.floor(pixelCoordinate.x
					/ 256), Math.floor(pixelCoordinate.y / 256));
			
			var mapOffset = M.util.offset(this.map.getDiv());			
			var feature =  this.geoRasterService.getFeature(evt.pixel.x,evt.pixel.y, zoom, tileCoordinate.x, tileCoordinate.y, mapOffset, name);
		
			if(feature)
			{
				var eventArg ={
						properties: feature,
						lat: evt.latLng.lat(),
						lon:  evt.latLng.lng(),
						x: evt.pixel.x,
						y: evt.pixel.y
				}
				
				this.dispatcher.fire(eventName, eventArg);
			}
		},
		
		/**
		 * Remove a layer from the map.
		 * 
		 * @param {String} layerName
		 */
		removeLayerByName: function ( layerName )
		{
			var len = this.map.overlayMapTypes.length;
			for(var i=0;i<len;i++)
			{
				var layer = this.map.overlayMapTypes.getAt(i);
				if(layer.name === layerName)
				{
					if(this.GeosRasterListener)
					{
						for(var j=0;j<this.GeosRasterListener.length;j++)
						{
							google.maps.event.removeListener(this.GeosRasterListener[j]);
							this.GeosRasterListener[j] = null;
						}
					}
					
					this.map.overlayMapTypes.removeAt(i);
					
					this.GeosRasterListener =[];
					this.geoRasterService._onRemove();
					break;
				}
					
			}
		},
		
		removePoint: function( point )
		{
			for( var i=0; i< this.markers.length; i++)
			{
				if (point.marker == this.markers[i])
				{
					this.markers[i].setMap(null);
					this.markers.splice(i,1);
						
					break;
				}
			}
		},
		
		removeSpecialPoint: function( point )
		{
			if (!point)
				return;
			
			for( var i=0; i< this.specialMarkers.length; i++)
			{
				if (point.marker == this.specialMarkers[i])
				{
					this.specialMarkers[i].setMap(null);
					this.specialMarkers.splice(i,1);
						
					break;
				}
			}
		},
		
		showHidePoint: function( point, show )
		{
			if ( !point || !point.marker )
				return;
				
			point.marker.setVisible(show);
		},
		
		showAllPoints: function()
		{
			this._showHideAllPoints( true );
		},
		
		hideAllPoints: function()
		{
			this._showHideAllPoints( false );
		},
		
		_showHideAllPoints: function( show )
		{
			if ( this.frontendClusterOptions && this.frontendClusterOptions.useFrontendClustering)
			{
				if ( show )
					this.enableFrontendClustering( this.markers, this.frontendClusterOptions );
				else
					this.disableFrontendClustering();
			}
			else
			{
				for( var i=0; i< this.markers.length; i++)
				{
					var marker = this.markers[i];
					if (show)
						marker.setMap(this.map);
					else
						marker.setMap(null);
				}
			}
		},
		
		getPopupDOMElement: function( popup )
		{
			return popup.div_;
		},
		
		getMarker: function( point )
		{
			return this.createMarker( point );
		},
		
		getMarkerForPoint: function( point )
		{
			for( var i=0; i< this.markers.length; i++)
			{
				var marker = this.markers[i];
				if( marker.point.index == point.index )
					return marker;
			}
			
			return null;
		},
		
		getLonLat: function( x, y )
		{
			var latLon = new google.maps.LatLng(y, x);
			
			return { lat: latLon.lat(), lon: latLon.lng() }
		},
		
		getPoints: function()
		{
			var points = [];
			
			for( var i=0; i < this.markers.length; i++ )
				points.push( this.markers[i].point );
				
			return points;
		},
		
		pan: function( deltaX, deltaY )
		{
			this.map.panBy( deltaX, deltaY );
		},
		
		getZoom: function()
		{
			return this.map.getZoom();
		},
		
		zoomToPoints: function( points )
		{
			if( points.length == 0 )
				return;
				
			var markers = [];
			
			for( var i=0; i<points.length; i++ )
				markers.push( points[i].marker );
				
			this.zoomToMarkers( markers );
		},
		
		zoomToMarkers: function( m )
		{
			var bounds = new google.maps.LatLngBounds();
			
			var markers = m || this.markers;
			
			for( var i=0; i < markers.length; i++ )
			{
				var marker = markers[i];
				bounds.extend( marker.getPosition() );
			}
			
			//Include in Points bounds the center marker (special marker)
			if ( this.specialMarkers && this.specialMarkers.length == 1 )
				bounds.extend(this.specialMarkers[0].getPosition());
			
			this.lastBounds = bounds;
			
			this.map.fitBounds( bounds );
		},
		
		zoomTo: function( zoom )
		{
			this.map.setZoom( zoom );
		},
		
		getBounds: function( bounds )
		{
			if ( !bounds )
				return;
			
			var sw = new google.maps.LatLng(bounds[0], bounds[1]);
			var ne = new google.maps.LatLng(bounds[2], bounds[3]);
			return new google.maps.LatLngBounds(sw, ne);
		},
		
		/*
		 * Sets the map extent to the given bounds
		 */
		setExtent: function ( bounds )
		{
			if ( !bounds )
				return;
			
			this.map.fitBounds( this.getBounds(bounds) );
		},
		
		setCenter: function( latLng, zoom )
		{
			this.map.setCenter( new google.maps.LatLng( latLng.lat, latLng.lon ));
			
			if( zoom )
				this.map.setZoom( zoom );
		},
		
		resize: function()
		{
			//Resize Google Map by triggering the event
			google.maps.event.trigger(this.map, "resize");
		},
		
		createPopup: function( html, options )
		{
			var offset = options.offset || {x: -152, y: -25};
			
			var infoBox = new InfoBox({
				content: html, 
				closeBoxURL: options.closeUrl,
				closeBoxMargin: options.closeBoxMargin || "11px 10px 0px 0px",
				alignBottom: true,
				pixelOffset: new google.maps.Size(offset.x, offset.y),
				boxStyle: options.boxStyle
			});
			
			google.maps.event.addListener(infoBox, "domready", options.onDomReady);
			google.maps.event.addListener(infoBox, "closeclick", options.onCloseClick);
			
			return infoBox;
		},
		
		addPopup: function( popup, options )
		{
			if ( !options || !options.marker )
				return;
			
			popup.open( this.map, options.marker );
		},
		
		removePopup: function( popup )
		{
			popup.close();
		},
		
		showItinerary: function( itinerary, options )
		{
			if ( !itinerary )
				return;
			
			this.displayDirections.setMap( this.map );
			this.displayDirections.setDirections( itinerary );
			
			var directionsRendererOptions = {
				polylineOptions:{
					strokeColor: options.strokeColor
				}
			};
			
			//Set Renderer Options
			this.displayDirections.setOptions( directionsRendererOptions );
		},
		
		boundsIntersect: function( bounds1, bounds2 )
		{
			return bounds1.intersects( bounds2 );
		},
		
		removeItinerary: function()
		{
			this.displayDirections.setMap( null );
		},
		
		getStreetView: function ()
		{
			return this.map.getStreetView();
		},
		
		/**
		 * Called by map when a point is clicked.
		 */
		_onPointClick: function( evt )
		{
			this.dispatcher.fire('pointClick', [evt.marker.point]);
		},

		_onPointExit: function( evt )
		{      
			this.dispatcher.fire('pointExit', [evt.marker.point]);
		},
		
		_onPointOver: function( evt )
		{
			this.dispatcher.fire('pointOver', [evt.marker.point]);
		}
	};
	
	M.GoogleMap = GoogleMap;
	
})(M);

(function(M) {
	/**
	 * GeoRasterService class manages all communications with GeoRasterService
	 * API.
	 * 
	 * @class GeoRasterService
	 * @module geolibrary
	 * @version 0.1.0
	 * @author RIchard Borer
	 * 
	 * @constructor GeoRasterService
	 * @param cfg
	 *            {Object} - Configuration object.
	 * 
	 * <br />
	 * <br />
	 * Configuration object for GeoRasterService has three parameters:
	 * <ul>
	 * <li><b>url</b> - the url to GeoRasterService API</li>
	 * <li><b>customer</b> - the customer ID</li>
	 * <li><b>ajax</b> - ajax object used to make XHR requests. ex. (
	 * <code>M.ajax</code> )</li>
	 * </ul>
	 * 
	 */
	var GeoRasterService = function(cfg) {
		this.settings = M.Settings;
		this.tileList = [];
		this.utfGrid = new M.UtfGrid();

		cfg = cfg || {};

		// Url
		this.url = this.settings.geoRasterServiceUrl;
		if (cfg.url)
			this.url = cfg.url;

		// Maporama customer
		this.customer = this.settings.customer;
		if (cfg.customer)
			this.customer = cfg.customer;

		// dispatcher
		this.dispatcher = cfg.dispatcher;

		// Ajax
		this.ajax = M.ajax;
	}

	GeoRasterService.prototype = {

		/* return XYZ tile url for a quadtree integration*/
		getTileUrl : function(z, x, y, mapName, options) {
			
			var url = this.url + this.customer + '/' + mapName + '/' + z + '/'
					+ x + '/' + y + '.png';
			
			if(options && options.filters)
			{
				url += '?'
					
				 for(var key in options.filters){
			            url += '&' + key +'=' + options.filters[key];
			        }
			}
			
			this.tileList.push({
				src : url,
				key : this.getTileKey(z, x, y, mapName)
			});
			
			
			
			return url;
		},

		getTileKey : function(z, x, y, name) {
			return name +'-' + z + '-' + x + '-' + y;
		},

		getFeature : function(pixelX, pixelY, z, x, y, mapOffset, name) {
			
			var tileKey = this.getTileKey(z, x, y, name);
			
			var indexedTile = document.getElementById(tileKey);
			
			if (indexedTile) {
				var posX = pixelX - M.util.offset(indexedTile).left
						+ mapOffset.left;
				var posY = pixelY - M.util.offset(indexedTile).top
						+ mapOffset.top;
				
				return this.utfGrid.getFeature(posX, posY, tileKey );
			}
		},
		
		_dispose: function()
		{
			this.tileList = null;
			this.tileList = [];
			this.utfGrid._flushGrid();
		},

		_onTileLoaded : function() {
			var len = this.tileList.length;

			for ( var i = 0; i < len; i++) {
				this.utfGrid.getTileGrid(this.tileList[i]);
			}
		},

		_onChangeZoom : function() {
			this._dispose();
		},
		
		_onRemove : function() {
			this._dispose();
		}

	}
	
	// Publish GeoRasterService class under M namespace
	M.GeoRasterService = GeoRasterService;
})(M);

(function( M )
{
	/**
	 * UtfGrid class manages interactivity on GeoRasterService Layers.
	 * 
	 * @class UtfGrid
	 * @module geolibrary
	 * @version 0.1.0
	 * @author Richard Borer
	 * 
	 * @constructor UtfGrid
	 * 
	 * 
	 */
	var UtfGrid = function( )
	{
		//will contain all the tiles Utf grid and data
		//indexed by key, key look like z-x-y 
		this.tilecache = [];
			
		// Ajax
	    this.ajax = M.ajax;
	}
	
	
	UtfGrid.prototype = {
		
		getTileGrid: function(event)
		{
			//case drag the map, not reload
			if(this.tilecache[event.key])
				return;
			
			var url = event.src.replace('.png','.json');
			
			var cfg = {
		        method: 'GET',
		        on: {
		        	success: M.bind( function(data){
		        		 this._addTile(data, event);
		        		 }, this)
		        }
		    };
			
			 // Send request
		    if (!this.ajax)
		        throw new Error("Ajax function is not defined");
		        
		    this.ajax(url, cfg);
		},
		
		getFeature: function(x, y, tileKey)
		{
			var key = this._getKey(x, y, tileKey);
		
			var k = this.tilecache[tileKey].keys[key];
			
			if (this.tilecache[tileKey].data[k]) {
				return this.tilecache[tileKey].data[k];
			}
		},
		
		_getKey: function( x, y, tileKey)
		{
			var grid = this.tilecache[tileKey].grid;
			
			if (!grid)
				return;
				
			if ((y < 0) || (x < 0))
				return;
				
			if ((Math.floor(y) >= 256) || (Math.floor(x) >= 256))
				return;

			return this._resolveCode(grid[Math.floor((y / 4))].charCodeAt(Math.floor((x / 4))));
		},
		
		_resolveCode : function(key) {
			if (key >= 93)
				key--;
			if (key >= 35)
				key--;
			key -= 32;
			return key;
		},
		
		_addTile: function(data, event)
		{
			var jsonData = M.JSON.parse(data);
			this.tilecache[ event.key] = jsonData;
			this._indexTile( event );
		},
		
		_flushGrid: function()
		{
			this.tilecache = null;
			this.tilecache = [];
		},
		
		_indexTile:function( event )
		{
			var images = document.getElementsByTagName("img");
			var len = images.length;
			for(var i = 0; i < len; i++)
			{
			    if (images[i].src === event.src ){
			    	images[i].setAttribute('id', event.key);
			    	images[i].setAttribute('name', event.key);
			     break;
				}
			}
		}
		
		
			
			
	}

	// Publish UtfGrid class under M namespace
	M.UtfGrid = UtfGrid;
})(M);

