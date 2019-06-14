'use strict';
define(['lodash', 'angular'], function(_, angular) {
  var dependencies = [];

  var EffectsTableService = function() {
    var NOT_ENTERED = 'Not entered';

    function buildEffectsTable(criteria) {
      var tableRows = addCanBePercentageToCriteria(angular.copy(criteria));
      var useFavorability = _.find(criteria, function(criterion) {
        return criterion.hasOwnProperty('isFavorable');
      });
      if (useFavorability) {
        var favorabilityHeader = {
          isHeaderRow: true,
          headerText: 'Favorable effects'
        };
        var unFavorabilityHeader = {
          isHeaderRow: true,
          headerText: 'Unfavorable effects'
        };
        var partition = _.partition(tableRows, ['isFavorable', true]);
        var orderedFavorableCriteria = partition[0];
        var orderedUnfavorableCriteria = partition[1];
        tableRows = [].concat(
          [favorabilityHeader],
          orderedFavorableCriteria,
          [unFavorabilityHeader],
          orderedUnfavorableCriteria);
      }
      tableRows = buildTableRows(tableRows);
      return tableRows;
    }

    function addCanBePercentageToCriteria(criteria) {
      return _.mapValues(criteria, function(criterion) {
        criterion.canBePercentage = canBePercentage(criterion);
        return criterion;
      });
    }

    function canBePercentage(criterion) {
      return !!_.find(criterion.dataSources, function(dataSource) {
        return _.isEqual(dataSource.scale, [0, 1]) || _.isEqual(dataSource.scale, [0, 100]);
      });
    }

    function buildTableRows(rows) {
      return _.reduce(rows, function(accum, row) {
        if (row.isHeaderRow) {
          return accum.concat(row);
        }
        var rowCriterion = _.omit(row, ['dataSources']);
        rowCriterion.numberOfDataSources = row.dataSources.length;
        accum = accum.concat(_.map(row.dataSources, function(dataSource, index) {
          return {
            criterion: rowCriterion,
            isFirstRow: index === 0,
            dataSource: dataSource
          };
        }));
        return accum;
      }, []);
    }

    function createEffectsTableInfo(performanceTable) {
      return _.reduce(performanceTable, function(accum, tableEntry) {
        var dataSourceId = tableEntry.dataSource;
        if (accum[dataSourceId]) { return accum; }
        if (tableEntry.alternative) {
          accum[dataSourceId] = {
            isAbsolute: true,
            studyDataLabelsAndUncertainty: _(performanceTable)
              .filter(['dataSource', dataSourceId])
              .reduce(buildLabels, {})
          };
        } else {
          accum[tableEntry.dataSource] = {
            isAbsolute: false,
            hasUncertainty: true
          };
        }
        return accum;
      }, {});
    }

    function buildLabels(accum, entryForCriterion) {
      accum[entryForCriterion.alternative] = buildLabel(entryForCriterion);
      return accum;
    }
    
    function isStudyDataAvailable(effectsTableInfo) {
      return !!(_.find(effectsTableInfo, function(infoEntry) {
        return infoEntry.distributionType !== 'relative';
      }));
    }

    function buildLabel(entryForCriterion) {
      var performance = entryForCriterion.performance;
      var hasUncertainty = determineUncertainty(performance.distribution);
      var effectLabel = buildEffectLabel(performance);
      var effectValue = buildEffectValueLabel(performance);
      var distributionLabel = buildDistributionLabel(performance.distribution);

      return {
        effectLabel: effectLabel,
        effectValue: effectValue,
        distributionLabel: distributionLabel,
        hasUncertainty: hasUncertainty
      };
    }

    function determineUncertainty(distribution) {
      return !!distribution &&
        distribution.type !== 'empty' &&
        distribution.type !== 'exact';
    }

    function buildEffectValueLabel(performance) {
      if (performance.effect && performance.effect.type !== 'empty') {
        return '' + performance.effect.value;
      } else {
        return '';
      }
    }

    function buildDistributionLabel(distribution) {
      if (!distribution) {
        return NOT_ENTERED;
      } else if (distribution.type === 'dt') {
        return buildStudentsTLabel(distribution.parameters);
      } else if (distribution.type === 'dnorm') {
        return buildNormalLabel(distribution.parameters);
      } else if (distribution.type === 'dbeta') {
        return buildBetaLabel(distribution.parameters);
      } else if (distribution.type === 'dsurv' || distribution.type === 'dgamma') {
        return buildGammaLabel(distribution.parameters);
      } else if (distribution.type === 'exact') {
        return distribution.value + '';
      } else if (distribution.type === 'empty') {
        return distribution.value ? distribution.value : '';
      }
    }

    function buildStudentsTLabel(parameters) {
      return 'Student\'s t(' +
        parameters.mu + ', ' +
        parameters.stdErr + ', ' +
        parameters.dof + ')';
    }

    function buildNormalLabel(parameters) {
      return 'Normal(' +
        parameters.mu + ', ' +
        parameters.sigma + ')';
    }

    function buildBetaLabel(parameters) {
      return 'Beta(' +
        parameters.alpha + ', ' +
        parameters.beta + ')';
    }

    function buildGammaLabel(parameters) {
      return 'Gamma(' +
        parameters.alpha + ', ' +
        parameters.beta + ')';
    }

    function buildEffectLabel(performance) {
      if (!performance.effect) {
        if (performance.distribution.input) {
          return buildEffectInputLabel(performance.distribution.input);
        } else if (performance.distribution.type === 'exact') {
          return performance.distribution.value;
        } else {
          return NOT_ENTERED;
        }
      } else if (performance.effect.input) {
        return buildEffectInputLabel(performance.effect.input);
      } else if (performance.effect.type === 'empty') {
        return performance.effect.value !== undefined ? performance.effect.value : '';
      } else {
        return performance.effect.value;
      }
    }

    function buildEffectInputLabel(input) {
      var percentage = input.scale === 'percentage' ? '%' : '';
      if (input.stdErr) {
        return input.value + percentage + ' (' + input.stdErr + percentage + ')';
      } else if (input.lowerBound && input.upperBound) {
        return input.value + percentage + ' (' + input.lowerBound + percentage + '; ' + input.upperBound + percentage + ')';
      } else if (input.value && input.sampleSize) {
        return input.value + percentage + ' / ' + input.sampleSize;
      } else if (input.events && input.sampleSize) {
        return input.events + ' / ' + input.sampleSize;
      } else {
        return input.value + percentage;
      }
    }

    return {
      buildEffectsTable: buildEffectsTable,
      createEffectsTableInfo: createEffectsTableInfo,
      isStudyDataAvailable: isStudyDataAvailable,
      buildTableRows: buildTableRows
    };
  };

  return dependencies.concat(EffectsTableService);
});
