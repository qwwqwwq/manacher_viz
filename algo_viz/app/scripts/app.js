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
        var initial = 'babcbabcbaccba';
        $scope.string = initial;
        $scope.textInput = initial;
        $scope.setString = function() {
            console.log($scope.textInput);
            $scope.string = $scope.textInput;
        }
    }
]);

App.config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when('/', {
                  templateUrl: 'app/views/manacher.html',
                  controller: 'ManacherController'
              });
}]);

