
/* Services */

angular.module('maporamaClientsServices', ['ngResource']).
    factory('ClientPoints', function($resource){
  return $resource('http://stagingwebservices.aws-maporama.com/:customer/tables/:table.json?t=:unique&maporamakey=:key&customFilter1_and=:filter&rowCount=:rowCount&rowOffset=:rowOffset&isajax=true', {}, {}, {});
});