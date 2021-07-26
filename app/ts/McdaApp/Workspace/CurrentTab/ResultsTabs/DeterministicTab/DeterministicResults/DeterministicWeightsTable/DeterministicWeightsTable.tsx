import {
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@material-ui/core';
import ICriterion from '@shared/interface/ICriterion';
import {TPreferences} from '@shared/types/Preferences';
import ClipboardButton from 'app/ts/ClipboardButton/ClipboardButton';
import {CurrentScenarioContext} from 'app/ts/McdaApp/Workspace/CurrentScenarioContext/CurrentScenarioContext';
import {CurrentSubproblemContext} from 'app/ts/McdaApp/Workspace/CurrentSubproblemContext/CurrentSubproblemContext';
import ShowIf from 'app/ts/ShowIf/ShowIf';
import LoadingSpinner from 'app/ts/util/LoadingSpinner';
import significantDigits from 'app/ts/util/significantDigits';
import {InlineHelp} from 'help-popup';
import _ from 'lodash';
import React, {useContext} from 'react';
import {EquivalentChangeContext} from '../../../../Preferences/EquivalentChange/EquivalentChangeContext/EquivalentChangeContext';
import EquivalentChangeCell from '../../../../Preferences/PreferencesWeights/PreferencesWeightsTable/EquivalentChangeTableComponents/EquivalentChangeCell';
import {buildImportances} from '../../../../Preferences/PreferencesWeights/PreferencesWeightsTable/PreferencesWeightsTableUtil';
import {DeterministicResultsContext} from '../../DeterministicResultsContext/DeterministicResultsContext';

export default function DeterministicWeightsTable(): JSX.Element {
  const {filteredCriteria} = useContext(CurrentSubproblemContext);
  const {currentScenario} = useContext(CurrentScenarioContext);
  const {weights} = useContext(DeterministicResultsContext);
  const {canShowEquivalentChanges} = useContext(EquivalentChangeContext);

  return (
    <Grid container item xs={12}>
      <Grid item xs={9}>
        <Typography variant="h5">
          <InlineHelp helpId="representative-weights">Weights</InlineHelp>
        </Typography>
      </Grid>
      <Grid container item xs={3} justifyContent="flex-end">
        <ClipboardButton targetId="#deterministic-weights-table" />
      </Grid>
      <Grid item xs={12}>
        <LoadingSpinner showSpinnerCondition={!weights}>
          <Table id="deterministic-weights-table">
            <TableHead>
              <TableRow>
                <TitleCells
                  canShowEquivalentChanges={canShowEquivalentChanges}
                />
              </TableRow>
            </TableHead>
            <TableBody>
              <WeightRows preferences={currentScenario.state.prefs} />
            </TableBody>
          </Table>
        </LoadingSpinner>
      </Grid>
    </Grid>
  );

  function WeightRows({preferences}: {preferences: TPreferences}): JSX.Element {
    const importances = buildImportances(filteredCriteria, preferences);

    return (
      <>
        {_.map(filteredCriteria, (criterion: ICriterion) => (
          <TableRow key={criterion.id}>
            <TableCell id={`title-${criterion.id}`}>
              {criterion.title}
            </TableCell>
            <TableCell id={`weight-${criterion.id}`}>
              {significantDigits(weights.mean[criterion.id])}
            </TableCell>
            <TableCell id={`importance-${criterion.id}`}>
              {importances[criterion.id]}
            </TableCell>
            <ShowIf condition={canShowEquivalentChanges}>
              <TableCell id={`equivalent-change-${criterion.id}`}>
                <EquivalentChangeCell criterion={criterion} />
              </TableCell>
            </ShowIf>
          </TableRow>
        ))}
      </>
    );
  }
}

function TitleCells({
  canShowEquivalentChanges
}: {
  canShowEquivalentChanges: boolean;
}): JSX.Element {
  return (
    <>
      <TableCell>Criterion</TableCell>
      <TableCell>Weight</TableCell>
      <TableCell>Importance</TableCell>
      <ShowIf condition={canShowEquivalentChanges}>
        <TableCell>Equivalent change</TableCell>
      </ShowIf>
    </>
  );
}
