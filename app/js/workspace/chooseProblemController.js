'use strict';
define(function(require) {
  var _ = require('lodash');

  var dependencies = ['$scope', '$state', '$modal', 'mcdaRootPath', 'WorkspaceResource', 'InProgressResource'];

  var ChooseProblemController = function($scope, $state, $modal, mcdaRootPath, WorkspaceResource, InProgressResource) {
    // functions
    $scope.openChooseProblemModal = openChooseProblemModal;
    $scope.deleteWorkspace = deleteWorkspace;
    $scope.deleteInProgress = deleteInProgress;

    // init
    $scope.model = {};
    $scope.local = {};
    $scope.workspacesList = WorkspaceResource.query();
    $scope.inProgressWorkspaces = InProgressResource.query();

    $scope.$watch('local.contents', function(newVal) {
      if (!_.isEmpty(newVal)) {
        $scope.model.choice = 'local';
      }
    });

    function openChooseProblemModal() {
      $modal.open({
        templateUrl: mcdaRootPath + 'js/workspace/createWorkspace.html',
        controller: 'CreateWorkspaceController',
        resolve: {
          callback: function() {
            return function(workspaceType, workspace) {
              if (workspaceType === 'manual') {
                $state.go('manualInput');
              } else {
                $state.go('evidence', {
                  workspaceId: workspace.id,
                  problemId: workspace.defaultSubProblemId,
                  id: workspace.defaultScenarioId
                });
              }
            };
          }
        }
      });
    }

    function deleteWorkspace(workspace) {
      $modal.open({
        templateUrl: mcdaRootPath + 'js/workspace/deleteWorkspace.html',
        controller: 'DeleteWorkspaceController',
        resolve: {
          callback: function() {
            return function() {
              $scope.workspacesList = _.reject($scope.workspacesList, ['id', workspace.id]);
            };
          },
          workspace: function() {
            return workspace;
          }
        }
      });
    }

    function deleteInProgress(id, title) {
      $modal.open({
        templateUrl: mcdaRootPath + 'js/workspace/deleteWorkspace.html',
        controller: 'DeleteInProgressController',
        resolve: {
          callback: function() {
            return function() {
              $scope.inProgressWorkspaces = _.reject($scope.inProgressWorkspaces, ['id', id]);
            };
          },
          inProgressId: function() {
            return id;
          },
          title: function(){
            return title;
          }
        }
      });
    }
  };
  return dependencies.concat(ChooseProblemController);
});