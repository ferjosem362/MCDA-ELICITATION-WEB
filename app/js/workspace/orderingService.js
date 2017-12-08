'use strict';
define(['lodash'], function(_) {
  var dependencies = ['OrderingResource'];
  var OrderingService = function(OrderingResource) {

    function getOrderedCriteriaAndAlternatives(problem, stateParams) {
      return OrderingResource.get(stateParams).$promise.then(function(response) {
        var ordering = response.ordering;
        if (!ordering) {
          return {
            alternatives: _.map(problem.alternatives, function(alternative, alternativeId) {
              return _.extend({}, alternative, { id: alternativeId });
            }),
            criteria: _.map(problem.criteria, function(criterion, criterionId) {
              return _.extend({}, criterion, { id: criterionId });
            })
          };
        }

        var orderedAlternatives = _(ordering.alternatives)
          .filter(function(alternativeId) {
            return problem.alternatives[alternativeId];
          })
          .map(function(alternativeId) {
            return _.extend({}, problem.alternatives[alternativeId], {
              id: alternativeId
            });
          })
          .value();
        var orderedCriteria = _(ordering.criteria)
          .filter(function(criterionId) {
            return problem.criteria[criterionId];
          })
          .map(function(criterionId) {
            return _.extend({}, problem.criteria[criterionId], {
              id: criterionId
            });
          })
          .value();
        return {
          alternatives: orderedAlternatives,
          criteria: orderedCriteria
        };
      });
    }

    function saveOrdering(stateParams, criteria, alternatives) {
      return OrderingResource.put(stateParams, {
        criteria: _.map(criteria, 'id'),
        alternatives: _.map(alternatives, 'id')
      }).$promise;
    }

    return {
      getOrderedCriteriaAndAlternatives: getOrderedCriteriaAndAlternatives,
      saveOrdering: saveOrdering
    };
  };
  return dependencies.concat(OrderingService);
});