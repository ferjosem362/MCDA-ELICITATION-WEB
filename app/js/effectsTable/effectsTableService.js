'use strict';
define(['lodash'], function(_) {
  var dependencies = [];

  var EffectsTableService = function() {
    function flattenValueTreeChildren(child) {
      if (child.criteria) {
        return child.criteria;
      } else {
        return _.flatten(_.map(child.children, 'criteria'));
      }
    }

    function pickOrderedIds(criteria, ids) {
      return _(criteria).
        filter(function(criterion) {
          return ids.indexOf(criterion.id) >= 0;
        })
        .value();
    }

    function buildEffectsTable(valueTree, criteria) {
      if (valueTree) {
        var favorabilityHeader = {
          isHeaderRow: true,
          headerText: 'Favorable effects'
        };
        var unFavorabilityHeader = {
          isHeaderRow: true,
          headerText: 'Unfavorable effects'
        };
        var orderedFavorableCriteria = pickOrderedIds(criteria, flattenValueTreeChildren(valueTree.children[0]));
        var orderedUnfavorableCriteria = pickOrderedIds(criteria, flattenValueTreeChildren(valueTree.children[1]));
        return [].concat(
          favorabilityHeader,
          orderedFavorableCriteria,
          unFavorabilityHeader,
          orderedUnfavorableCriteria);
      } else {
        return criteria;
      }
    }

    function createEffectsTableInfo(performanceTable) {
      return _.reduce(performanceTable, function(accum, tableEntry) {
        var criterionId = tableEntry.criterion;
        if (accum[criterionId]) { return accum; }
        if (tableEntry.alternative) {
          accum[criterionId] = {
            distributionType: tableEntry.performance.type,
            hasStudyData: true,
            studyDataLabelsAndUncertainty: _(performanceTable)
              .filter(function(tableEntry) {
                return criterionId === tableEntry.criterion;
              })
              .reduce(function(accum, entryForCriterion) {
                accum[entryForCriterion.alternative] = buildLabel(entryForCriterion);
                return accum;
              }, {})
          };
        } else {
          accum[tableEntry.criterion] = {
            distributionType: 'relative',
            hasStudyData: false
          };
        }
        return accum;
      }, {});
    }

    function isStudyDataAvailable(effectsTableInfo) {
      return !!(_.find(effectsTableInfo, function(infoEntry) {
        return infoEntry.distributionType !== 'relative' &&
          _.find(infoEntry.studyDataLabelsAndUncertainty, function(labelAndUncertainty) {
            return labelAndUncertainty.hasUncertainty;
          });
      }));
    }

    function buildLabel(entryForCriterion) {
      var label = '';
      var performance = entryForCriterion.performance;
      var hasUncertainty = performance.type !== 'empty';
      var parameters = performance.parameters;
      if (performance.input) {
        var input = performance.input;
        switch (performance.type) {
          case 'exact':
            hasUncertainty = false;
            if (input.events) {
              label = input.events + ' / ' + input.sampleSize;
            } else if (input.scale === 'percentage') {
              label = input.value + '%';
              label = input.lowerBound ? label + ' (' + input.lowerBound + '%; ' +
                input.upperBound + '%)' : label;
              label = input.sampleSize ? label + ' (' + input.sampleSize + ')' : label;
            } else {
              label = input.value;
              label = input.stdErr ? label + ' (' + input.stdErr + ')' : label;
              label = input.lowerBound ? label + ' (' + input.lowerBound + '; ' +
                input.upperBound + ')' : label;
              label = input.sampleSize ? label + ' (' + input.sampleSize + ')' : label;
            }
            break;
          case 'dt':
            label = input.mu + ' (' + input.sigma + '), ' + (input.sampleSize);
            break;
          case 'dnorm':
            if (input.events && input.sampleSize) {
              label = input.events + ' / ' + input.sampleSize;
            } else if (input.value && input.sampleSize && input.scale === 'percentage') { //dichotomous
              label = input.value + '% (' + input.sampleSize + ')';
            } else if (input.value && input.sampleSize) { //dichotomous
              label = input.value + ' (' + input.sampleSize + ')';
            } else if (input.stdErr) {//with stdErr
              label = input.value ? input.value : input.mu; //exact to dist  vs manual normal dist
              label += ' (' + input.stdErr + ')';
            } else if (input.lowerBound) {//with confidence interval
              label = input.value + ' (' + input.lowerBound + '; ' + input.upperBound + ')';
            }
            break;
          case 'dbeta':
            label = input.events + ' / ' + input.sampleSize;
            break;
        }
      } else {
        switch (performance.type) {
          case 'exact':
            hasUncertainty = false;
            label = performance.value;
            break;
          case 'dt':
            label = parameters.mu + ' (' + Math.round(parameters.stdErr * 1000) / 1000 + '), ' + (parameters.dof + 1);
            break;
          case 'dnorm':
            label = parameters.mu + ' (' + Math.round(parameters.sigma * 1000) / 1000 + ')';
            break;
          case 'dbeta':
            label = (parameters.alpha - 1) + ' / ' + (parameters.beta + parameters.alpha - 2);
            break;
          case 'dgamma':
            label = (parameters.alpha) + ' / ' + (parameters.beta);
            break;
          case 'dsurv':
            label = (parameters.alpha - 0.001) + ' / ' + (parameters.beta - 0.001);
            break;
        }
      }
      return {
        label: label,
        hasUncertainty: hasUncertainty
      };
    }
    return {
      buildEffectsTable: buildEffectsTable,
      createEffectsTableInfo: createEffectsTableInfo,
      isStudyDataAvailable: isStudyDataAvailable
    };
  };

  return dependencies.concat(EffectsTableService);
});