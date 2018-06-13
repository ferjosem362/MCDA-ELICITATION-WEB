'use strict';
define(['lodash', 'angular'], function(_, angular) {
  var dependencies = ['$scope',
    '$state',
    '$stateParams',
    '$transitions',
    '$timeout',
    '$modal',
    'EffectsTableService',
    'InProgressResource',
    'ManualInputService',
    'OrderingService',
    'SchemaService',
    'WorkspaceResource',
    'generateUuid',
    'swap'
  ];
  var ManualInputController = function($scope,
    $state,
    $stateParams,
    $transitions,
    $timeout,
    $modal,
    EffectsTableService,
    InProgressResource,
    ManualInputService,
    OrderingService,
    SchemaService,
    WorkspaceResource,
    generateUuid,
    swap
  ) {

    // functions
    $scope.addAlternative = addAlternative;
    $scope.alternativeDown = alternativeDown;
    $scope.alternativeUp = alternativeUp;
    $scope.checkInputData = checkInputData;
    $scope.createProblem = createProblem;
    $scope.goToStep1 = goToStep1;
    $scope.goToStep2 = goToStep2;
    $scope.isDuplicateTitle = isDuplicateTitle;
    $scope.removeAlternative = removeAlternative;
    $scope.saveInProgress = saveInProgress;
    $scope.openCriterionModal = openCriterionModal;

    // init
    $scope.treatmentInputField = {}; //scoping
    $scope.criteriaErrors = [];
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

    // public functions
    function addAlternative(title) {
      $scope.state.alternatives.push({
        title: title,
        id: generateUuid()
      });
      $scope.alternativeInput.value = '';
    }

    function alternativeDown(idx) {
      swap($scope.state.alternatives, idx, idx + 1);
    }

    function alternativeUp(idx) {
      swap($scope.state.alternatives, idx, idx - 1);
    }

    function checkInputData() {
      $scope.state.isInputDataValid = !_.find($scope.state.inputData, function(row) {
        return _.find(row, 'isInvalid');
      });
    }

    function createProblem() {
      var problem = ManualInputService.createProblem($scope.state.criteria, $scope.state.alternatives,
        $scope.state.title, $scope.state.description, $scope.state.inputData, $scope.state.useFavorability);
      WorkspaceResource.create(problem).$promise.then(function(workspace) {
        if ($stateParams.inProgressId) {
          InProgressResource.delete($stateParams);
        }
        var criteria = _.map($scope.state.criteria, _.partialRight(_.pick, ['id']));
        var alternatives = _.map($scope.state.alternatives, _.partialRight(_.pick, ['id']));

        OrderingService.saveOrdering({
          workspaceId: workspace.id
        }, criteria, alternatives).then(function() {
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

    function goToStep1() {
      $scope.state.step = 'step1';
    }

    function goToStep2() {
      $scope.state.step = 'step2';
      $scope.criteriaRows = EffectsTableService.buildTableRows($scope.state.criteria);
      $scope.state.inputData = ManualInputService.prepareInputData($scope.state.criteria, $scope.state.alternatives,
        $scope.state.inputData);
      $timeout(checkInputData);
    }

    function isDuplicateTitle(title) {
      return _.find($scope.state.alternatives, ['title', title]);
    }

    function removeAlternative(alternative) {
      $scope.state.alternatives = _.reject($scope.state.alternatives, ['id', alternative.id]);
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

    function openCriterionModal() {
      $modal.open({
        templateUrl: '/js/manualInput/addCriterion.html',
        controller: 'AddCriterionController',
        resolve: {
          criteria: function() {
            return $scope.state.criteria;
          },
          callback: function() {
            return function(newCriterion) {
              $scope.state.criteria.push(newCriterion);
            };
          },
          oldCriterion: function(){
            return undefined;
          },
          useFavorability: function() {
            return $scope.state.useFavorability;
          }
        }
      });
    }

    // private functions
    function initState() {
      if ($stateParams.workspace) {
        // copying existing workspace
        var oldWorkspace = SchemaService.updateWorkspaceToCurrentSchema($stateParams.workspace);
        $scope.state = {
          oldWorkspace: oldWorkspace,
          useFavorability: _.find(oldWorkspace.problem.criteria, function(criterion){
            return criterion.hasOwnProperty('isFavorable');
          }) ? true : false,
          step: 'step1',
          isInputDataValid: false,
          description: oldWorkspace.problem.description,
          criteria: ManualInputService.copyWorkspaceCriteria(oldWorkspace),
          alternatives: _.map(oldWorkspace.problem.alternatives, function(alternative, alternativeId) {
            return _.extend({}, alternative, {
              id: generateUuid(),
              oldId: alternativeId
            });
          })
        };
        $scope.state.inputData = ManualInputService.createInputFromOldWorkspace($scope.state.criteria,
          $scope.state.alternatives, $scope.state.oldWorkspace);
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
          checkInputData();
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
  };
  return dependencies.concat(ManualInputController);
});
