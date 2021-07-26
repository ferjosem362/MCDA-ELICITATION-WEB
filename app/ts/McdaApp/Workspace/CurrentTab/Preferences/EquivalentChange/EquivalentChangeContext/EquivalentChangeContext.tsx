import ICriterion from '@shared/interface/ICriterion';
import {CurrentScenarioContext} from 'app/ts/McdaApp/Workspace/CurrentScenarioContext/CurrentScenarioContext';
import {CurrentSubproblemContext} from 'app/ts/McdaApp/Workspace/CurrentSubproblemContext/CurrentSubproblemContext';
import {hasNoRange} from 'app/ts/McdaApp/Workspace/CurrentSubproblemContext/SubproblemUtil';
import {TEquivalentChange as TEquivalentChange} from 'app/ts/type/EquivalentChange';
import _ from 'lodash';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import {
  getInitialReferenceValueBy,
  getInitialReferenceValueFrom,
  getInitialReferenceValueTo,
  getPartOfInterval
} from '../equivalentChangeUtil';
import IEquivalentChangeContext from './IEquivalentChangeContext';

export const EquivalentChangeContext = createContext<IEquivalentChangeContext>(
  {} as IEquivalentChangeContext
);

export function EquivalentChangeContextProviderComponent({
  children
}: {
  children: any;
}): JSX.Element {
  const {filteredCriteria, observedRanges} = useContext(
    CurrentSubproblemContext
  );
  const {currentSubproblem} = useContext(CurrentSubproblemContext);
  const {currentScenario, pvfs, areAllPvfsSet} = useContext(
    CurrentScenarioContext
  );

  const [referenceCriterion, setReferenceCriterion] = useState<ICriterion>(
    filteredCriteria[0]
  );
  const [otherCriteria, setCriteria] = useState<ICriterion[]>(
    filteredCriteria.slice(1)
  );

  const [canShowEquivalentChanges, setCanShowEquivalentChanges] =
    useState<boolean>(false);

  useEffect(() => {
    if (pvfs && currentScenario) {
      setCanShowEquivalentChanges(
        _.every(pvfs, ['type', 'linear']) &&
          currentScenario.state.weights &&
          !_.isEmpty(observedRanges)
      );
    }
  }, [pvfs, currentScenario.state.weights, observedRanges, currentScenario]);

  const [configuredLowerBound, configuredUpperBound] = useMemo(() => {
    return getBounds(
      referenceCriterion.dataSources[0].id,
      currentSubproblem.definition.ranges,
      observedRanges
    );
  }, [
    currentSubproblem.definition.ranges,
    observedRanges,
    referenceCriterion.dataSources
  ]);
  const [lowerBound, setLowerBound] = useState<number>(configuredLowerBound);
  const [upperBound, setUpperBound] = useState<number>(configuredUpperBound);
  const [referenceValueBy, setReferenceValueBy] = useState<number>(
    getInitialReferenceValueBy(configuredLowerBound, configuredUpperBound)
  );
  const [referenceValueFrom, setReferenceValueFrom] = useState<number>(0);
  const [referenceValueTo, setReferenceValueTo] = useState<number>(100);
  const referenceWeight = currentScenario.state.weights
    ? currentScenario.state.weights.mean[referenceCriterion.id]
    : undefined;
  const [partOfInterval, setPartOfInterval] = useState<number>(
    getPartOfInterval(
      0,
      referenceValueBy,
      configuredLowerBound,
      configuredUpperBound
    )
  );
  const [equivalentChangeType, setEquivalentChangeType] =
    useState<TEquivalentChange>('amount');

  useEffect(reset, [
    referenceCriterion,
    pvfs,
    areAllPvfsSet,
    currentSubproblem.definition.ranges,
    observedRanges
  ]);

  useEffect(() => {
    setPartOfInterval(
      getPartOfInterval(
        referenceValueFrom,
        referenceValueTo,
        configuredLowerBound,
        configuredUpperBound
      )
    );
  }, [
    configuredLowerBound,
    configuredUpperBound,
    referenceValueFrom,
    referenceValueTo
  ]);

  useEffect(() => {
    setPartOfInterval(
      getPartOfInterval(
        0,
        referenceValueBy,
        configuredLowerBound,
        configuredUpperBound
      )
    );
  }, [configuredLowerBound, configuredUpperBound, referenceValueBy]);

  function reset(): void {
    if (areAllPvfsSet) {
      const [configuredLowerBound, configuredUpperBound] = getBounds(
        referenceCriterion.dataSources[0].id,
        currentSubproblem.definition.ranges,
        observedRanges
      );
      setLowerBound(configuredLowerBound);
      setUpperBound(configuredUpperBound);
      setReferenceValueBy(
        getInitialReferenceValueBy(configuredLowerBound, configuredUpperBound)
      );
      setReferenceValueFrom(
        getInitialReferenceValueFrom(
          configuredLowerBound,
          configuredUpperBound,
          pvfs[referenceCriterion.id]
        )
      );
      setReferenceValueTo(
        getInitialReferenceValueTo(
          configuredLowerBound,
          configuredUpperBound,
          pvfs[referenceCriterion.id]
        )
      );
    }
  }

  function updateReferenceCriterion(newId: string): void {
    setReferenceCriterion(_.find(filteredCriteria, ['id', newId]));
    setCriteria(_.reject(filteredCriteria, ['id', newId]));
  }

  return (
    <EquivalentChangeContext.Provider
      value={{
        canShowEquivalentChanges,
        otherCriteria,
        lowerBound,
        partOfInterval,
        referenceCriterion,
        upperBound,
        referenceValueBy,
        referenceValueFrom,
        referenceValueTo,
        referenceWeight,
        equivalentChangeType,
        setReferenceValueBy,
        setReferenceValueFrom,
        setReferenceValueTo,
        setEquivalentChangeType,
        updateReferenceCriterion
      }}
    >
      {children}
    </EquivalentChangeContext.Provider>
  );
}

function getBounds(
  dataSourceId: string,
  configuredRanges: Record<string, [number, number]>,
  observedRanges: Record<string, [number, number]>
): [number, number] {
  if (hasNoRange(configuredRanges, dataSourceId)) {
    return observedRanges[dataSourceId];
  } else {
    return configuredRanges[dataSourceId];
  }
}
