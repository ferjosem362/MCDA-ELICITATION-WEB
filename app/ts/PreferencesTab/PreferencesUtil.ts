import IProblemCriterion from '@shared/interface/Problem/IProblemCriterion';
import IScenarioPvf from '@shared/interface/Scenario/IScenarioPvf';
import _ from 'lodash';
import IScenario from '@shared/interface/Scenario/IScenario';
import IPvf from '@shared/interface/Problem/IPvf';
import IPreferencesCriterion from '@shared/interface/Preferences/IPreferencesCriterion';

export function initPvfs(
  criteria: Record<string, IProblemCriterion>,
  currentScenario: IScenario
): Record<string, IPvf> {
  return _.mapValues(criteria, (criterion, id) => {
    const scenarioPvf = getScenarioPvf(id, currentScenario);
    return _.merge({}, criterion.dataSources[0].pvf, scenarioPvf);
  });
}

function getScenarioPvf(
  criterionId: string,
  currentScenario: IScenario
): IScenarioPvf {
  const scenarioCriterion = currentScenario.state.problem.criteria[criterionId];
  if (scenarioCriterion && scenarioCriterion.dataSources) {
    return scenarioCriterion.dataSources[0].pvf;
  }
}

export function createPreferencesCriteria(
  criteria: Record<string, IProblemCriterion>
): Record<string, IPreferencesCriterion> {
  return _.mapValues(criteria, (criterion, id) => {
    const dataSource = criterion.dataSources[0];
    let preferencesCriterion = {
      ..._.pick(criterion, ['title', 'description', 'isFavorable']),
      id: id,
      dataSourceId: dataSource.id,
      ..._.pick(dataSource, ['unitOfMeasurement', 'scale'])
    };
    return preferencesCriterion;
  });
}
