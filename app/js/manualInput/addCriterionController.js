'use strict';
define(['lodash'], function(_) {
  var dependencies = ['$scope', '$modalInstance', 'criteria', 'callback', 'oldCriterion', 'useFavorability', 'generateUuid'];
  var AddCriterionController = function($scope, $modalInstance, criteria, callback, oldCriterion, useFavorability, generateUuid) {
    // functions
    $scope.isCreationBlocked = isCreationBlocked;
    $scope.addCriterion = addCriterion;
    $scope.cancel = $modalInstance.close;
    $scope.useFavorability = useFavorability;

    // init
    $scope.blockedReason = '';
    $scope.isAddOperation = !oldCriterion;
    $scope.isAddingCriterion = false;
    $scope.sourceLinkValidity = {
      isInvalid: false
    };
    if (oldCriterion) {
      $scope.criterion = _.cloneDeep(_.find(criteria, ['id', oldCriterion.id]));
    } else {
      $scope.criterion = {
        id: generateUuid(),
        dataSources: [{
          id: generateUuid(),
          inputType: 'distribution',
          inputMethod: 'assistedDistribution',
          dataType: 'dichotomous',
          parameterOfInterest: 'eventProbability'
        }],
        isFavorable: false
      };
    }
    isCreationBlocked();

    function addCriterion(criterion) {
      $scope.isAddingCriterion = true;
      callback(criterion);
      $modalInstance.close();
    }

    function isCreationBlocked() {
      var criterion = $scope.criterion;
      $scope.blockedReasons = [];
      if (!criterion.title && !$scope.isAddingCriterion) {
        $scope.blockedReasons.push('No title entered');
      }
      if (isTitleDuplicate(criterion.title) && !$scope.isAddingCriterion && (!oldCriterion || oldCriterion.title !== criterion.title)) {
        $scope.blockedReasons.push('Duplicate title');
      }
      if($scope.sourceLinkValidity.isInvalid){
        $scope.blockedReasons.push('Invalid reference URL');
      }
    }

    function isTitleDuplicate(title) {
      return _.find(criteria, ['title', title]);
    }

  };
  return dependencies.concat(AddCriterionController);
});
