'use strict';

angular.module('d3', []);
angular.module('manacher', []);
angular.module('d3Directives', ['d3', 'manacher']);

var App = angular.module('App', ['d3Directives', 'ngRoute'])
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider
            .otherwise({
                redirectTo: '/'
            });
    }]);

App.controller('ManacherController', ['$scope',
    function($scope) {
        $scope.string = 'babcbabcbaccba';
    }
]);

App.config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when('/', {
                  templateUrl: 'app/views/manacher.html',
                  controller: 'ManacherController'
              });
}]);

