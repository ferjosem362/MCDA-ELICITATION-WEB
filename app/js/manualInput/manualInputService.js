'use strict';
define(['lodash', 'angular'], function(_, angular) {
  var dependencies = [
    'InputKnowledgeService',
    'ConstraintService',
    'generateUuid',
    'currentSchemaVersion'
  ];
  var ManualInputService = function(
    InputKnowledgeService,
    ConstraintService,
    generateUuid,
    currentSchemaVersion
  ) {
    var INVALID_INPUT_MESSAGE = 'Missing or invalid input';
    var PROPORTION_PERCENTAGE = ConstraintService.percentage().label;
    var PROPORTION_DECIMAL = ConstraintService.decimal().label;
    var BELOW_OR_EQUAL_TO = ConstraintService.belowOrEqualTo().label;
    var POSITIVE = ConstraintService.positive().label;
    var FIRST_PARAMETER = 'firstParameter';
    var SECOND_PARAMETER = 'secondParameter';
    var THIRD_PARAMETER = 'thirdParameter';

    function getInputError(cell) {
      if (cell.inputParameters.id === 'empty') {
        return;
      }
      var error;
      var inputParameters = _.pick(cell.inputParameters, [
        FIRST_PARAMETER,
        SECOND_PARAMETER,
        THIRD_PARAMETER
      ]);
      _.find(inputParameters, function(inputParameter, key) {
        if (hasNotEstimableBound(cell, inputParameter)) {
          return;
        }
        var inputValue = cell[key];
        return _.find(inputParameter.constraints, function(constraint) {
          error = constraint.validator(inputValue, inputParameter.label, cell);
          return error;
        });
      });
      return error;
    }

    function hasNotEstimableBound(cell, parameter) {
      return (parameter.label === 'Lower bound' && cell.lowerBoundNE) ||
        (parameter.label === 'Upper bound' && cell.upperBoundNE);
    }

    function inputToString(cell) {
      if (getInputError(cell)) {
        return INVALID_INPUT_MESSAGE;
      } else {
        return cell.inputParameters.toString(cell);
      }
    }

    function getOptions(inputType) {
      return angular.copy(InputKnowledgeService.getOptions(inputType));
    }

    function createProblem(criteria, alternatives, title, description, inputData) {
      var newCriteria = buildCriteria(criteria);
      return {
        schemaVersion: currentSchemaVersion,
        title: title,
        description: description,
        criteria: newCriteria,
        alternatives: buildAlternatives(alternatives),
        performanceTable: buildPerformanceTable(inputData, newCriteria, alternatives)
      };
    }

    function prepareInputData(criteria, alternatives, oldInputData) {
      var dataSources = getDataSources(criteria);
      if (oldInputData) {
        return {
          effect: createInputTableRows(dataSources, alternatives, oldInputData.effect),
          distribution: createInputTableRows(dataSources, alternatives, oldInputData.distribution)
        };
      } else {
        return {
          effect: createInputTableRows(dataSources, alternatives),
          distribution: createInputTableRows(dataSources, alternatives)
        };
      }
    }

    function updateParameterConstraints(cell, unitOfMeasurement) {
      var newCell = angular.copy(cell);
      if (cell.inputParameters.firstParameter) {
        newCell.inputParameters.firstParameter.constraints = updateConstraints(cell, unitOfMeasurement, FIRST_PARAMETER);
      }
      if (cell.inputParameters.secondParameter) {
        newCell.inputParameters.secondParameter.constraints = updateConstraints(cell, unitOfMeasurement, SECOND_PARAMETER);
      }
      if (cell.inputParameters.thirdParameter) {
        newCell.inputParameters.thirdParameter.constraints = updateConstraints(cell, unitOfMeasurement, THIRD_PARAMETER);
      }
      return newCell;
    }

    function updateConstraints(cell, unitOfMeasurement, parameter) {
      var updatetableParameters = [
        'Value',
        'Lower bound',
        'Upper bound',
        'Standard error'
      ];
      if (_.includes(updatetableParameters, cell.inputParameters[parameter].label)) {
        return getNewConstraints(cell, unitOfMeasurement, parameter);
      } else {
        return cell.inputParameters[parameter].constraints;
      }
    }

    function getNewConstraints(cell, unitOfMeasurement, parameter) {
      var newConstraints = angular.copy(cell.inputParameters[parameter].constraints);
      newConstraints = removeBoundConstraints(newConstraints);
      if (unitOfMeasurement.lowerBound === 0) {
        newConstraints.push(getConstraintWithLowerBound(unitOfMeasurement));
      } else if (unitOfMeasurement.upperBound < Infinity) {
        newConstraints.push(ConstraintService.belowOrEqualTo(unitOfMeasurement.upperBound));
      }
      return newConstraints;
    }

    function getConstraintWithLowerBound(unitOfMeasurement) {
      if (unitOfMeasurement.upperBound === 100) {
        return ConstraintService.percentage();
      } else if (unitOfMeasurement.upperBound === 1) {
        return ConstraintService.decimal();
      } else {
        return ConstraintService.positive();
      }
    }

    function removeBoundConstraints(constraints) {
      return _.reject(constraints, function(constraint) {
        var label = constraint.label;
        return label === PROPORTION_PERCENTAGE || label === PROPORTION_DECIMAL ||
          label === BELOW_OR_EQUAL_TO || label === POSITIVE;
      });
    }

    function createInputTableRows(dataSources, alternatives, oldInputData) {
      return _.reduce(dataSources, function(accum, dataSource) {
        accum[dataSource.id] = createInputTableCells(dataSource, alternatives, oldInputData);
        return accum;
      }, {});
    }

    function createInputTableCells(dataSource, alternatives, oldInputData) {
      return _.reduce(alternatives, function(accum, alternative) {
        if (hasOldInputDataAvailable(oldInputData, dataSource.id, alternative.id)) {
          accum[alternative.id] = oldInputData[dataSource.id][alternative.id];
        } else {
          accum[alternative.id] = {};
        }
        accum[alternative.id].isInvalid = true;
        return accum;
      }, {});
    }

    function hasOldInputDataAvailable(oldData, dataSourceId, alternativeId) {
      return oldData && oldData[dataSourceId] && oldData[dataSourceId][alternativeId];
    }

    function getDataSources(criteria) {
      return _.reduce(criteria, function(accum, criterion) {
        return accum.concat(criterion.dataSources);
      }, []);
    }

    function createStateFromOldWorkspace(oldWorkspace) {
      var state = {
        oldWorkspace: oldWorkspace,
        useFavorability: hasFavorableCriterion(oldWorkspace),
        step: 'step1',
        isInputDataValid: false,
        description: oldWorkspace.problem.description,
        criteria: copyOldWorkspaceCriteria(oldWorkspace),
        alternatives: copyOldWorkspaceAlternatives(oldWorkspace)
      };
      state.inputData = createInputFromOldWorkspace(state.criteria,
        state.alternatives, oldWorkspace);
      return state;
    }

    function hasFavorableCriterion(workspace) {
      return _.some(workspace.problem.criteria, function(criterion) {
        return criterion.hasOwnProperty('isFavorable');
      });
    }

    function copyOldWorkspaceAlternatives(oldWorkspace) {
      return _.map(oldWorkspace.problem.alternatives, function(alternative, alternativeId) {
        return _.extend({}, alternative, {
          id: generateUuid(),
          oldId: alternativeId
        });
      });
    }

    function buildCriteria(criteria) {
      var newCriteria = _.map(criteria, function(criterion) {
        var newCriterion = _.pick(criterion, [
          'title',
          'description',
          'isFavorable'
        ]);
        newCriterion.dataSources = _.map(criterion.dataSources, buildDataSource);
        return [criterion.id, newCriterion];
      });
      return _.fromPairs(newCriteria);
    }

    function buildDataSource(dataSource) {
      var newDataSource = angular.copy(dataSource);
      newDataSource.scale = getScale(dataSource);
      if (newDataSource.unitOfMeasurement === '%') {
        newDataSource.unitOfMeasurement = 'Proportion';
      }
      delete newDataSource.oldId;
      return newDataSource;
    }

    function getScale(dataSource) {
      if (dataSource.unitOfMeasurement === '%' || dataSource.unitOfMeasurement === 'Proportion') {
        return [0, 1];
      } else {
        return [-Infinity, Infinity];
      }
    }

    function buildAlternatives(alternatives) {
      return _(alternatives).keyBy('id').mapValues(function(alternative) {
        return _.pick(alternative, ['title']);
      }).value();
    }

    function buildPerformanceTable(inputData, criteria, alternatives) {
      return _(criteria)
        .map(_.partial(buildEntriesForCriterion, inputData, alternatives))
        .flatten()
        .flatten()
        .value();
    }

    function buildEntriesForCriterion(inputData, alternatives, criterion, criterionId) {
      return _.map(criterion.dataSources, function(dataSource) {
        return buildPerformanceEntries(inputData, criterionId, dataSource.id, alternatives);
      });
    }

    function buildPerformanceEntries(inputData, criterionId, dataSourceId, alternatives) {
      return _.map(alternatives, function(alternative) {
        var effectCell = inputData.effect[dataSourceId][alternative.id];
        var distributionCell = inputData.distribution[dataSourceId][alternative.id];
        return {
          alternative: alternative.id,
          criterion: criterionId,
          dataSource: dataSourceId,
          performance: buildPerformance(effectCell, distributionCell)
        };
      });
    }

    function buildPerformance(effectCell, distributionCell) {
      return {
        effect: effectCell.inputParameters.buildPerformance(effectCell),
        distribution: distributionCell.inputParameters.buildPerformance(distributionCell)
      };
    }

    function copyOldWorkspaceCriteria(workspace) {
      return _.map(workspace.problem.criteria, function(criterion) {
        var newCrit = _.pick(criterion, ['title', 'description', 'isFavorable']); // omit scales, preferences
        newCrit.dataSources = copyOldWorkspaceDataSource(criterion);
        newCrit.id = generateUuid();
        return newCrit;
      });
    }

    function copyOldWorkspaceDataSource(criterion) {
      return _.map(criterion.dataSources, function(dataSource) {
        var newDataSource = _.pick(dataSource, [
          'source',
          'sourceLink',
          'strengthOfEvidence',
          'uncertainties',
          'unitOfMeasurement'
        ]);
        newDataSource.id = generateUuid();
        newDataSource.oldId = dataSource.id;
        return newDataSource;
      });
    }

    function createInputFromOldWorkspace(criteria, alternatives, oldWorkspace) {
      return _.reduce(oldWorkspace.problem.performanceTable, function(accum, tableEntry) {
        var dataSources = getDataSources(criteria);
        var dataSourceForEntry = _.find(dataSources, ['oldId', tableEntry.dataSource]);
        var alternative = _.find(alternatives, ['oldId', tableEntry.alternative]);
        if (dataSourceForEntry && alternative) {
          if (!accum.effect[dataSourceForEntry.id]) {
            accum.effect[dataSourceForEntry.id] = {};
            accum.distribution[dataSourceForEntry.id] = {};
          }
          accum.effect[dataSourceForEntry.id][alternative.id] = createCell('effect', tableEntry);
          accum.distribution[dataSourceForEntry.id][alternative.id] = createCell('distribution', tableEntry);
        }
        return accum;
      }, {
          effect: {},
          distribution: {}
        });
    }

    function createCell(inputType, tableEntry) {
      var performance = tableEntry.performance[inputType];
      if (performance) {
        var type = getType(inputType, tableEntry.performance);
        return InputKnowledgeService.getOptions(inputType)[type].finishInputCell(performance);
      } else {
        return undefined;
      }
    }

    function getType(inputType, performance) {
      if (inputType === 'effect') {
        return getEffectType(performance);
      } else {
        return getDistributionType(performance);
      }
    }

    function getEffectType(performance) {
      if (performance.effect.input) {
        return determineInputType(performance.effect.input);
      } else if (performance.effect.type === 'empty') {
        return performance.effect.hasOwnProperty('value') ? 'text' : 'empty';
      } else {
        return 'value';
      }
    }

    function determineInputType(input) {
      if (input.hasOwnProperty('stdErr')) {
        return 'valueSE';
      } else if (input.hasOwnProperty('lowerBound')) {
        return 'valueCI';
      } else if (input.hasOwnProperty('events')) {
        return 'eventsSampleSize';
      } else if (input.hasOwnProperty('sampleSize')) {
        return 'valueSampleSize';
      } else {
        return 'value';
      }
    }

    function getDistributionType(performance) {
      var types = {
        dnorm: 'normal',
        dgamma: 'gamma',
        dbeta: 'beta',
        exact: 'value',
        dsurv: 'gamma',
        dt: 'value'
      };
      if (performance.distribution.type === 'empty') {
        return performance.distribution.value ? 'text' : 'empty';
      } else {
        return types[performance.distribution.type];
      }
    }

    function findDuplicateValues(inputData) {
      return _.some(inputData, function(row) {
        return !isDuplicateValueRow(row);
      });
    }

    function isDuplicateValueRow(row) {
      return _.some(row, function(cell) {
        return cell.isInvalid || isNonValueCell(cell) || findCellThatIsDifferent(row, cell);
      });
    }

    function isNonValueCell(cell) {
      var nonValueInputs = [
        'normal',
        'beta',
        'gamma',
        'empty',
        'text'
      ];
      return _.includes(nonValueInputs, cell.inputParameters.id);
    }

    function findCellThatIsDifferent(row, cell) {
      return _.some(row, function(otherCell) {
        return compareCells(cell, otherCell);
      });
    }

    function compareCells(cell, otherCell) {
      var value = getValue(cell);
      var otherValue = getValue(otherCell);
      return value !== otherValue;
    }

    function getValue(cell) {
      if (cell.inputParameters.id === 'eventsSampleSize') {
        return cell.firstParameter / cell.secondParameter;
      } else {
        return cell.firstParameter;
      }
    }

    function findInvalidCell(inputData) {
      return _.some(inputData, function(row) {
        return _.some(row, 'isInvalid');
      });
    }

    function generateDistributions(inputData) {
      return _.mapValues(inputData.effect, _.partial(generateDistributionsForCriterion, inputData));
    }

    function generateDistributionsForCriterion(inputData, row, dataSource) {
      return _.mapValues(row, _.partial(generateDistributionForCell, inputData, dataSource));
    }

    function generateDistributionForCell(inputData, dataSource, cell, alternative) {
      if (cell.isInvalid) {
        return inputData.distribution[dataSource][alternative];
      }
      return cell.inputParameters.generateDistribution(cell);
    }

    return {
      createProblem: createProblem,
      inputToString: inputToString,
      getInputError: getInputError,
      prepareInputData: prepareInputData,
      getOptions: getOptions,
      createStateFromOldWorkspace: createStateFromOldWorkspace,
      findDuplicateValues: findDuplicateValues,
      findInvalidCell: findInvalidCell,
      generateDistributions: generateDistributions,
      updateParameterConstraints: updateParameterConstraints
    };
  };

  return dependencies.concat(ManualInputService);
});
