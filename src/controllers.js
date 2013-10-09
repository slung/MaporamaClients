function ClientsCtrl($scope, ClientPoints){
	
	// for (  var i = 0; i < Clients.length; i++ )
	for (  var i = 0; i < 1; i++ )
		ClientPoints.get({
			customer: Clients[i].name,
			table: Clients[i].table,
			unique: new Date().getTime(),
			key: Clients[i].key,
			filter: "and,active,yes,",
			rowCount: 10,
			rowOffset: 0
		},function(data){
			var rawData = data; 
		} );
	
}

myApp.controller('ClientsCtrl', ['$scope', 'ClientPoints', ClientsCtrl]);









////////////////////////////// OUT with the OLD, in with the NEW


M.Settings.geoPlatformUrl = "http://stagingwebservices.aws-maporama.com/";
//M.Settings.geoPlatformUrl = "http://geowebservices.maporama.com/"; 

var MaporamaClients = {
	
	pointArray: new google.maps.MVCArray(),
	pointsBounds: new google.maps.LatLngBounds(),
	heatmap: new google.maps.visualization.HeatmapLayer(),
	
	mapStyle: [{
		featureType : "administrative.country",
		stylers : [{
			hue : "#ff9100"
		}, {
			lightness : 50
		}, {
			saturation : 23
		}]
	}, {
		featureType : "poi.park",
		stylers : [{
			visibility : "off"
		}]
	}, {
		featureType : "administrative.province",
		elementType : "geometry",
		stylers : [{
			visibility : "off"
		}]
	}, {
		featureType : "road.arterial",
		stylers : [{
			visibility : "on"
		}, {
			gamma : 1.34
		}, {
			saturation : -25
		}, {
			lightness : 11
		}]
	}, {
		featureType : "poi",
		stylers : [{
			visibility : "off"
		}]
	}, {
		featureType : "transit.station",
		stylers : [{
			visibility : "off"
		}]
	}, {
		featureType : "road.arterial",
		elementType : "labels",
		stylers : [{
			saturation : -57
		}]
	}, {
		featureType : "road.arterial",
		elementType : "geometry",
		stylers : [{
			saturation : -17
		}, {
			lightness : 66
		}]
	}, {
		featureType : "administrative.country",
		elementType : "geometry",
		stylers : [{
			visibility : "on"
		}, {
			saturation : 5
		}, {
			lightness : 18
		}, {
			gamma : 0.69
		}]
	}, {
		featureType : "road.highway",
		elementType : "labels",
		stylers : [{
			visibility : "off"
		}]
	}, {
		featureType : "road.highway",
		elementType : "geometry",
		stylers : [{
			hue : "#00ffcc"
		}, {
			saturation : -84
		}, {
			lightness : 63
		}]
	}, {
		featureType : "administrative.neighborhood",
		elementType : "labels",
		stylers : [{
			visibility : "off"
		}]
	}, {
		featureType : "water",
		stylers : [{
			saturation : 20
		}, {
			gamma : 0.58
		}, {
			lightness : 3
		}, {
			hue : "#00aaff"
		}]
	}],

	init: function()
	{
		var mapOptions = {
			//styles: this.mapStyle,
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
	
	paginateRequests: function()
	{
		geoPlatform.searchPointsWithFilters( table, {
			rowCount: 50,
			success: M.bind( function( rawData ) {
			
				this.addDataToMap( rawData );
				
			}, this ),
			error: function(){
				//alert('error');
			}
		});
	},
	
	addDataToMap: function( rawData )
	{
		for ( var i = 0; i < rawData.length; i++  )
		{
			var latLng = new google.maps.LatLng(rawData[i].lat(), rawData[i].lon());
			
			this.pointArray.push(latLng);
			this.pointsBounds.extend(latLng);						
		}
		
		this.heatmap.setData(this.pointArray);
		
		this.heatmap.setMap(MaporamaClients.map);
		MaporamaClients.map.fitBounds(this.pointsBounds);
	}
};
