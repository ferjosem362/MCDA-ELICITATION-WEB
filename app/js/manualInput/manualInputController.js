'use strict';
define(['lodash', 'angular'], function(_, angular) {
  var dependencies = ['$scope',
    '$modal',
    '$state',
    '$stateParams',
    '$transitions',
    'InProgressResource',
    'ManualInputService',
    'OrderingService',
    'WorkspaceResource',
    'addKeyHashToObject'
  ];
  var ManualInputController = function($scope,
    $modal,
    $state,
    $stateParams,
    $transitions,
    InProgressResource,
    ManualInputService,
    OrderingService,
    WorkspaceResource,
    addKeyHashToObject
  ) {

    // functions
    $scope.openCriterionModal = openCriterionModal;
    $scope.addTreatment = addTreatment;
    $scope.removeTreatment = removeTreatment;
    $scope.isDuplicateTitle = isDuplicateTitle;
    $scope.goToStep1 = goToStep1;
    $scope.goToStep2 = goToStep2;
    $scope.createProblem = createProblem;
    $scope.removeCriterion = removeCriterion;
    $scope.checkInputData = checkInputData;
    $scope.resetData = resetData;
    $scope.resetRow = resetRow;
    $scope.saveInProgress = saveInProgress;
    $scope.favorabilityChanged = favorabilityChanged;
    $scope.alternativeUp = alternativeUp;
    $scope.alternativeDown = alternativeDown;
    $scope.criterionUp = criterionUp;
    $scope.criterionDown = criterionDown;

    // init
    $scope.treatmentInputField = {}; //scoping
    initState();

    $transitions.onStart({}, function(transition) {
      if ($scope.dirty) {
        var answer = confirm('There are unsaved changes, are you sure you want to leave this page?');
        if (!answer) {
          transition.abort();
        } else {
          $scope.dirty = false;
        }
      }
    });

    function initState() {
      if ($stateParams.workspace) {
        // copying existing workspace
        var oldWorkspace = $stateParams.workspace;
        $scope.state = {
          oldWorkspace: oldWorkspace,
          useFavorability: oldWorkspace.problem.valueTree ? true : false,
          step: 'step1',
          isInputDataValid: false,
          description: oldWorkspace.problem.description,
          criteria: ManualInputService.copyWorkspaceCriteria(oldWorkspace),
          alternatives: _.map(oldWorkspace.problem.alternatives, function(alternative) {
            return alternative;
          })
        };
        findUnknownCriteria($scope.state.criteria);
        favorabilityChanged();
        $scope.dirty = true;
        setStateWatcher();
      } else if (!$stateParams.inProgressId) {
        // new workspace
        $scope.state = {
          step: 'step1',
          isInputDataValid: false,
          useFavorability: false,
          criteria: [],
          alternatives: []
        };
        setStateWatcher();
      } else {
        // unfinished workspace
        InProgressResource.get($stateParams).$promise.then(function(response) {
          $scope.state = response.state;
          findUnknownCriteria($scope.state.criteria);
          favorabilityChanged();
          setStateWatcher();
        });
      }
    }

    function setStateWatcher() {
      $scope.$watch('state', function(newValue, oldValue) {
        if (!angular.equals(newValue, oldValue)) {
          $scope.dirty = true;
        }
      }, true);
    }

    function resetData() {
      $scope.state.inputData = ManualInputService.prepareInputData($scope.state.criteria, $scope.state.alternatives);
      $scope.state.isInputDataValid = false;
    }

    function resetRow(hash) {
      _.forEach($scope.state.inputData[hash], function(cell) {
        cell.label = 'No data entered';
        cell.isInvalid = true;
      });
    }

    function addTreatment(title) {
      $scope.state.alternatives.push({
        title: title
      });
      $scope.treatmentInputField.value = '';
    }

    function removeTreatment(alternative) {
      $scope.state.alternatives = _.reject($scope.state.alternatives, ['title', alternative.title]);
    }

    function isDuplicateTitle(title) {
      return _.find($scope.state.alternatives, ['title', title]);
    }

    function removeCriterion(criterion) {
      $scope.state.criteria = _.reject($scope.state.criteria, ['title', criterion.title]);
      findUnknownCriteria($scope.state.criteria);
    }

    function openCriterionModal(criterion) {
      $modal.open({
        templateUrl: '/js/manualInput/addCriterion.html',
        controller: 'AddCriterionController',
        resolve: {
          criteria: function() {
            return $scope.state.criteria;
          },
          callback: function() {
            return function(newCriterion) {
              if (criterion) { // editing not adding
                removeCriterion(criterion);
              }
              $scope.state.criteria.push(newCriterion);
              findUnknownCriteria($scope.state.criteria);
              favorabilityChanged();
            };
          },
          oldCriterion: function() {
            return criterion;
          },
          useFavorability: function() {
            return $scope.state.useFavorability;
          }
        }
      });
    }

    function checkInputData() {
      $scope.state.isInputDataValid = !_.find($scope.state.inputData, function(row) {
        return _.find(row, 'isInvalid');
      });
    }

    function goToStep1() {
      $scope.state.step = 'step1';
    }

    function goToStep2() {
      $scope.state.step = 'step2';
      $scope.state.alternatives = _.map($scope.state.alternatives, function(alternative) {
        return addKeyHashToObject(alternative, alternative.title);
      });
      $scope.state.criteria = _.map($scope.state.criteria, function(criterion) {
        return addKeyHashToObject(criterion, criterion.title);
      });
      $scope.state.inputData = ManualInputService.prepareInputData($scope.state.criteria, $scope.state.alternatives, $scope.state.inputData);
      if ($scope.state.oldWorkspace) {
        $scope.state.inputData = ManualInputService.createInputFromOldWorkspace($scope.state.criteria,
          $scope.state.alternatives, $scope.state.oldWorkspace, $scope.state.inputData);
        checkInputData();
      }
    }

    function createProblem() {
      var problem = ManualInputService.createProblem($scope.state.criteria, $scope.state.alternatives,
        $scope.state.title, $scope.state.description, $scope.state.inputData, $scope.state.useFavorability);
      WorkspaceResource.create(problem).$promise.then(function(workspace) {
        if ($stateParams.inProgressId) {
          InProgressResource.delete($stateParams);
        }
        var criteria = _.map($scope.state.criteria, function(criterion) {
          return { id: criterion.title };
        });
        var alternatives = _.map($scope.state.alternatives, function(alternative) {
          return { id: alternative.title };
        });
        OrderingService.saveOrdering(_.merge({}, {
          workspaceId: workspace.id
        }, $stateParams), criteria, alternatives).then(function() {
          $scope.dirty = false;
          $state.go('evidence', {
            workspaceId: workspace.id,
            problemId: workspace.defaultSubProblemId,
            id: workspace.defaultScenarioId
          });
        });
      });
      return problem;
    }

    function saveInProgress() {
      $scope.dirty = false;
      if ($stateParams.inProgressId) {
        InProgressResource.put($stateParams, $scope.state);
      } else {
        InProgressResource.save($scope.state).$promise.then(function(response) {
          $state.go('manualInputInProgress', {
            inProgressId: response.id
          });
        });
      }
    }

    function findUnknownCriteria(criteria) {
      $scope.hasUnknownDataType = _.find(criteria, function(criterion) {
        return criterion.dataType === 'Unknown';
      });
    }

    function favorabilityChanged() {
      $scope.hasMissingFavorability = _.find($scope.state.criteria, function(criterion) {
        return criterion.isFavorable === undefined;
      });
    }

    function alternativeUp(idx) {
      var mem = $scope.state.alternatives[idx];
      $scope.state.alternatives[idx] = $scope.state.alternatives[idx - 1];
      $scope.state.alternatives[idx - 1] = mem;
    }

    function alternativeDown(idx) {
      var mem = $scope.state.alternatives[idx];
      $scope.state.alternatives[idx] = $scope.state.alternatives[idx + 1];
      $scope.state.alternatives[idx + 1] = mem;
    }

    function criterionUp(idx) {
      var mem = $scope.state.criteria[idx];
      $scope.state.criteria[idx] = $scope.state.criteria[idx - 1];
      $scope.state.criteria[idx - 1] = mem;
    }

    function criterionDown(idx) {
      var mem = $scope.state.criteria[idx];
      $scope.state.criteria[idx] = $scope.state.criteria[idx + 1];
      $scope.state.criteria[idx + 1] = mem;
    }
  };
  return dependencies.concat(ManualInputController);
});