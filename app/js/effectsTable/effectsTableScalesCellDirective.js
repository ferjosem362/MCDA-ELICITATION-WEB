'use strict';
define([], function() {

  var dependencies = ['$filter'];

  var EffectsTableScalesCellDirective = function($filter) {
    return {
      restrict: 'E',
      scope: {
        'scales': '=',
        'uncertainty': '=',
        'showPercentage': '=',
        'showMode': '=',
        'canBePercentage': '='
      },
      template: '<div>{{median}}</div>' +
        '<div class="uncertain" ng-show="uncertainty">{{lowerBound}}, {{upperBound}}</div>',
      link: function(scope) {
        scope.$watch('scales', initScales);
        scope.$watch('showPercentage', initScales);
        scope.$watch('showMode', initScales);

        function initScales(oldValue, newValue) {
          if(oldValue === newValue) { return; }
          if (scope.scales) {
            scope.lowerBound = getRoundedValue(scope.scales['2.5%']);
            scope.median = getRoundedValue(scope.showMode ? scope.scales.mode : scope.scales['50%']);
            scope.upperBound = getRoundedValue(scope.scales['97.5%']);
          }
        }
        function getRoundedValue(value) {
          if (value === null) { return; }
          if(!scope.canBePercentage) {return $filter('number')(value);}
          var numberOfDecimals = 1;
          if (Math.abs(value) < 0.01) {
            ++numberOfDecimals;
          }
          if (!scope.showPercentage && Math.abs(value) < 1) {
            numberOfDecimals += 2;
          }
          return $filter('number')(scope.showPercentage ? value * 100 : value, numberOfDecimals);
        }
      }
    };
  };
  return dependencies.concat(EffectsTableScalesCellDirective);
});
