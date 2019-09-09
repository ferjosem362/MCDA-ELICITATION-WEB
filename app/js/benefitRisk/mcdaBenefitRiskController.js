'use strict';
define(['lodash', 'angular'], function(_, angular) {
  var dependencies = [
    '$scope',
    '$transitions',
    '$state',
    '$stateParams',
    '$modal',
    'McdaBenefitRiskService',
    'Tasks',
    'TaskDependencies',
    'ScenarioResource',
    'WorkspaceService',
    'WorkspaceSettingsService',
    'EffectsTableService',
    'subProblems',
    'currentSubProblem',
    'currentScenario',
    'isMcdaStandalone'
  ];

  function MCDABenefitRiskController(
    $scope,
    $transitions,
    $state,
    $stateParams,
    $modal,
    McdaBenefitRiskService,
    Tasks,
    TaskDependencies,
    ScenarioResource,
    WorkspaceService,
    WorkspaceSettingsService,
    EffectsTableService,
    subProblems,
    currentSubProblem,
    currentScenario,
    isMcdaStandalone
  ) {
    // functions
    $scope.copyScenario = copyScenario;
    $scope.newScenario = newScenario;
    $scope.scenarioChanged = scenarioChanged;

    $scope.deregisterTransitionListener = $transitions.onStart({}, function(transition) {
      setActiveTab(transition.to().name, transition.to().name);
    });

    // init
    var baseProblem = angular.copy($scope.workspace.problem);
    var baseState = { problem: baseProblem };
    $scope.percentifiedBaseState = WorkspaceService.percentifyCriteria(baseState);
    $scope.dePercentifiedBaseState = WorkspaceService.dePercentifyCriteria(baseState);
    $scope.isEditTitleVisible = false;
    $scope.scenarioTitle = {};
    $scope.selections = {};
    $scope.isDuplicateScenarioTitle = false;
    $scope.tasks = _.keyBy(Tasks.available, 'id');

    $scope.scalesPromise = WorkspaceService.getObservedScales(baseProblem).then(function(observedScales) {
      $scope.workspace.scales.base = observedScales;
      $scope.workspace.scales.basePercentified = WorkspaceService.percentifyScales($scope.percentifiedBaseState.problem.criteria, observedScales);
      $scope.percentifiedBaseState = addScales($scope.percentifiedBaseState, $scope.workspace.scales.basePercentified);
      $scope.dePercentifiedBaseState = addScales($scope.dePercentifiedBaseState, $scope.workspace.scales.base);
      initState(currentScenario);
    });
    $scope.effectsTableInfo = EffectsTableService.createEffectsTableInfo(baseProblem.performanceTable);

    $scope.subProblems = subProblems;
    $scope.subProblem = currentSubProblem;
    $scope.workspace.scales = {};
    $scope.isStandalone = isMcdaStandalone;
    determineActiveTab();

    $scope.$watch('scenario.state', updateTaskAccessibility);
    $scope.$watch('aggregateState', WorkspaceService.hasNoStochasticResults, true);
    $scope.$on('$destroy', function() {
      $scope.deregisterTransitionListener();
    });
    $scope.$on('elicit.settingsChanged', function() {
      updateState();
    });
    $scope.$on('elicit.resultsAccessible', function(event, scenario) {
      $scope.scenario = scenario;
      updateBaseAggregateStates(scenario);
      updateState();
    });

    function addScales(state, scales) {
      return _.merge({}, state, {
        problem: WorkspaceService.setDefaultObservedScales(state.problem, scales)
      });
    }

    function initState(scenario) {
      $scope.scenario = scenario;
      updateBaseAggregateStates(scenario);
      updateState();
      $scope.hasMissingValues = WorkspaceService.checkForMissingValuesInPerformanceTable($scope.aggregateState.problem.performanceTable);
      updateTaskAccessibility();
    }

    function updateState() {
      if (WorkspaceSettingsService.usePercentage()) {
        $scope.workspace.scales.observed = $scope.workspace.scales.basePercentified;
        $scope.aggregateState = $scope.percentifiedBaseState;
      } else {
        $scope.workspace.scales.observed = $scope.workspace.scales.base;
        $scope.aggregateState = $scope.dePercentifiedBaseState;
      }
      updateScenarios();
    }

    function updateBaseAggregateStates(scenario){
      $scope.percentifiedBaseState = WorkspaceService.percentifyCriteria(WorkspaceService.buildAggregateState(baseProblem, currentSubProblem, scenario));
      $scope.dePercentifiedBaseState = WorkspaceService.dePercentifyCriteria(WorkspaceService.buildAggregateState(baseProblem, currentSubProblem, scenario));
    }


    function updateScenarios() {
      ScenarioResource.query(_.omit($stateParams, ['id'])).$promise.then(function(scenarios) {
        $scope.scenarios = scenarios;
        $scope.scenariosWithResults = WorkspaceService.filterScenariosWithResults(baseProblem, currentSubProblem, scenarios);
      });
    }

    function determineActiveTab() {
      setActiveTab($state.current.name, 'evidence');
    }

    function setActiveTab(activeStateName, defaultStateName) {
      var task = findAvailableTask(activeStateName);
      $scope.activeTab = task ? task.activeTab : defaultStateName;
    }

    function findAvailableTask(taskId) {
      return _.find(Tasks.available, function(task) {
        return task.id === taskId;
      });
    }

    function updateTaskAccessibility() {
      $scope.tasksAccessibility = {
        preferences: TaskDependencies.isAccessible($scope.tasks.preferences, $scope.aggregateState).accessible,
        results: TaskDependencies.isAccessible($scope.tasks.results, $scope.aggregateState).accessible
      };
    }

    function copyScenario() {
      $modal.open({
        templateUrl: '../preferences/newScenario.html',
        controller: 'NewScenarioController',
        resolve: {
          scenarios: function() {
            return $scope.scenarios;
          },
          type: function() {
            return 'Copy';
          },
          callback: function() {
            return function(newTitle) {
              McdaBenefitRiskService.copyScenarioAndGo(newTitle, $scope.subProblem);
            };
          }
        }
      });
    }

    function newScenario() {
      $modal.open({
        templateUrl: '../preferences/newScenario.html',
        controller: 'NewScenarioController',
        resolve: {
          scenarios: function() {
            return $scope.scenarios;
          },
          type: function() {
            return 'New';
          },
          callback: function() {
            return function(newTitle) {
              McdaBenefitRiskService.newScenarioAndGo(newTitle, $scope.workspace, $scope.subProblem);
            };
          }
        }
      });
    }

    function scenarioChanged(newScenario) {
      if (!newScenario) {
        return; // just a title edit
      } else {
        var stateToGo =
          ($state.current.name === 'smaa-results' ||
            $state.current.name === 'deterministic-results') ? $state.current.name : 'preferences';
        $state.go(stateToGo, {
          workspaceId: $scope.workspace.id,
          problemId: $scope.subProblem.id,
          id: newScenario.id
        });

      }
    }
  }
  return dependencies.concat(MCDABenefitRiskController);
});
