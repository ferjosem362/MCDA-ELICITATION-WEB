'use strict';
define(['lodash'], function (_) {
  var dependencies = ['$scope', '$modalInstance', 'criteria', 'callback', 'oldCriterion', 'useFavorability'];
  var AddCriterionController = function ($scope, $modalInstance, criteria, callback, oldCriterion, useFavorability) {
    // functions
    $scope.isCreationBlocked = isCreationBlocked;
    $scope.addCriterion = addCriterion;
    $scope.cancel = $modalInstance.close;
    $scope.dataTypeChanged = dataTypeChanged;
    $scope.useFavorability = useFavorability;
    $scope.inputTypeChanged = inputTypeChanged;

    // init
    $scope.blockedReason = '';
    $scope.criterion = {
      inputType: 'distribution',
      inputMethod: 'assistedDistribution',
      dataType: 'dichotomous',
      parameterOfInterest: 'eventProbability',
      isFavorable: false
    };
    $scope.isAddOperation = !oldCriterion;
    $scope.isAddingCriterion = false;

    if (oldCriterion) {
      $scope.criterion = _.cloneDeep(oldCriterion);
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
      var regex = new RegExp(/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi);
      if (criterion.sourceLink && !criterion.sourceLink.match(regex)) {
        $scope.blockedReasons.push('Invalid URL');
      }
    }

    function isTitleDuplicate(title) {
      return _.find(criteria, ['title', title]);
    }

    function dataTypeChanged() {
      switch ($scope.criterion.dataType) {
        case 'dichotomous':
          $scope.criterion.parameterOfInterest = 'eventProbability';
          break;
        case 'continuous':
          $scope.criterion.parameterOfInterest = 'mean';
          break;
        default:
          $scope.criterion.parameterOfInterest = 'value';
      }
    }

    function inputTypeChanged(){
      if($scope.criterion.inputType === 'distribution' && $scope.criterion.dataType === 'other'){
        $scope.criterion.dataType = 'dichotomous';
      }
    }
  };
  return dependencies.concat(AddCriterionController);
});