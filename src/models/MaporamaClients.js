M.Settings.geoPlatformUrl = "http://stagingwebservices.aws-maporama.com/";
//M.Settings.geoPlatformUrl = "http://geowebservices.maporama.com/"; 

var MaporamaClients = {
	
	pointArray: new google.maps.MVCArray(),
	pointsBounds: new google.maps.LatLngBounds(),
	heatmap: new google.maps.visualization.HeatmapLayer(),
	
	init: function()
	{
		var mapOptions = {
	    zoom: 3,
	    center: new google.maps.LatLng(45.460131,6.855469),
	    mapTypeId: google.maps.MapTypeId.ROADMAP
	  };
	
	  MaporamaClients.map = new google.maps.Map(document.getElementById('map-canvas'),
	      mapOptions);
	
		MaporamaClients.loadClientPoints();
	},
	
	loadClientPoints: function()
	{
		if ( !Clients || Clients.length == 0 )
			return null;
		
		for (  var i = 0; i < Clients.length; i++ )
		{
			var client = Clients[i];
			
			setTimeout(function( client ){
				MaporamaClients.getClientPoints( client.name, client.key, client.table );
			}, 500, client);
		}
	},
	
	getClientPoints: function( name, key, table )
	{
		var geoPlatform = new M.GeoPlatform({
			key: key,
			customer: name
		});
		
		geoPlatform.searchPointsWithFilters( table, {
					rowCount: 99999999,
					success: M.bind( function( rawData ) {
					
						for ( var i = 0; i < rawData.length; i++  )
						{
							var latLng = new google.maps.LatLng(rawData[i].lat(), rawData[i].lon());
							
							this.pointArray.push(latLng);
							this.pointsBounds.extend(latLng);						
						}
						
						this.heatmap.setData(this.pointArray);
						
						this.heatmap.setMap(MaporamaClients.map);
						MaporamaClients.map.fitBounds(this.pointsBounds);
						
					}, this ),
					error: function(){
						//alert('error');
					}
				});
	},
	
};
