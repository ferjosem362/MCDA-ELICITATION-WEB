import IAlternative from '@shared/interface/IAlternative';
import ICriterion from '@shared/interface/ICriterion';
import IRelativePerformance from '@shared/interface/IRelativePerformance';
import {checkTitleErrors} from 'app/ts/util/checkTitleErrors';
import {WorkspaceContext} from 'app/ts/Workspace/WorkspaceContext';
import _ from 'lodash';
import React, {createContext, useContext, useEffect, useState} from 'react';
import {
  getMissingValueWarnings,
  getScaleBlockingWarnings
} from './AddSubproblemUtil';
import IAddSubproblemContext from './IAddSubproblemContext';

export const AddSubproblemContext = createContext<IAddSubproblemContext>(
  {} as IAddSubproblemContext
);

export function AddSubproblemContextProviderComponent(props: {children: any}) {
  const {
    currentSubproblem,
    subproblems,
    alternatives,
    workspace,
    criteria,
    scales
  } = useContext(WorkspaceContext);
  const [title, setTitle] = useState<string>('');
  const [errors, setErrors] = useState<string[]>(getErrors());

  const [alternativeInclusions, setAlternativeInclusions] = useState<
    Record<string, boolean>
  >(initInclusions(alternatives));
  const baselineMap = getBaselineMap(
    alternatives,
    workspace.relativePerformances
  );
  const [criterionInclusions, setCriterionInclusions] = useState<
    Record<string, boolean>
  >(initInclusions(criteria));

  const [dataSourceInclusions, setDataSourceInclusions] = useState<
    Record<string, boolean>
  >(initDataSourceInclusions(criteria));

  const [scaleRangesWarnings, setScaleRangesWarnings] = useState<string[]>(
    getScaleBlockingWarnings(
      criterionInclusions,
      dataSourceInclusions,
      alternativeInclusions,
      workspace
    )
  );

  const [missingValueWarnings, setMissingValueWarnings] = useState<string[]>(
    getMissingValueWarnings(
      dataSourceInclusions,
      alternativeInclusions,
      scales,
      workspace
    )
  );

  function initInclusions(
    items: Record<string, ICriterion> | Record<string, IAlternative>
  ): Record<string, boolean> {
    return _.mapValues(items, () => {
      return true;
    });
  }

  function initDataSourceInclusions(
    criteria: Record<string, ICriterion>
  ): Record<string, boolean> {
    return _(criteria)
      .flatMap('dataSources')
      .keyBy('id')
      .mapValues(() => {
        return true;
      })
      .value();
  }

  function getErrors(): string[] {
    const titleError = checkTitleErrors(title, subproblems);
    if (titleError) {
      return [titleError];
    } else {
      return [];
    }
  }

  useEffect(() => {
    setErrors(getErrors());
  }, [title]);

  useEffect(() => {
    setScaleRangesWarnings(
      getScaleBlockingWarnings(
        criterionInclusions,
        dataSourceInclusions,
        alternativeInclusions,
        workspace
      )
    );
  }, [dataSourceInclusions, criterionInclusions, alternativeInclusions]);

  useEffect(() => {
    // take selections from currentSubproblem
  }, []);

  function updateAlternativeInclusion(id: string, newValue: boolean) {
    let newInclusions = {...alternativeInclusions};
    newInclusions[id] = newValue;
    setAlternativeInclusions(newInclusions);
  }

  function isAlternativeDisabled(id: string) {
    return _.filter(alternativeInclusions).length < 3 || isBaseline(id);
  }

  function updateCriterionInclusion(id: string, newValue: boolean) {
    let newInclusions = {...criterionInclusions};
    newInclusions[id] = newValue;
    setCriterionInclusions(newInclusions);
  }

  function isBaseline(id: string) {
    return baselineMap[id];
  }

  function getBaselineMap(
    alternatives: Record<string, IAlternative>,
    relativePerformances: IRelativePerformance[]
  ): Record<string, boolean> {
    return _.mapValues(alternatives, (alternative) => {
      return _.some(relativePerformances, (relativePerformance) => {
        return alternative.id === relativePerformance.baseline.id;
      });
    });
  }

  function updateDataSourceInclusion(id: string, newValue: boolean): void {
    let newInclusions = {...dataSourceInclusions};
    newInclusions[id] = newValue;
    setDataSourceInclusions(newInclusions);
  }

  function isDataSourceDeselectionDisabled(criterionId: string): boolean {
    const criterion = criteria[criterionId];
    const numberOfSelectedDataSources = _.countBy(
      criterion.dataSources,
      (dataSource) => {
        return dataSourceInclusions[dataSource.id];
      }
    ).true;
    return numberOfSelectedDataSources < 2 || !criterionInclusions[criterionId];
  }

  function isCriterionExcluded(criterionId: string): boolean {
    return !criterionInclusions[criterionId];
  }

  function isDataSourceExcluded(dataSourceId: string): boolean {
    return !dataSourceInclusions[dataSourceId];
  }

  function isAlternativeExcluded(alternativeId: string): boolean {
    return !alternativeInclusions[alternativeId];
  }

  return (
    <AddSubproblemContext.Provider
      value={{
        title,
        errors,
        isCriterionDeselectionDisabled:
          _.filter(criterionInclusions).length < 3,
        scaleRangesWarnings,
        missingValueWarnings,
        isCriterionExcluded,
        isDataSourceExcluded,
        isAlternativeExcluded,
        setTitle,
        updateAlternativeInclusion,
        updateCriterionInclusion,
        updateDataSourceInclusion,
        isAlternativeDisabled,
        isDataSourceDeselectionDisabled
      }}
    >
      {props.children}
    </AddSubproblemContext.Provider>
  );
}
