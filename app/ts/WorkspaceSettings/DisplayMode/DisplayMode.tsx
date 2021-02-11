import {Grid, Select} from '@material-ui/core';
import {TDisplayMode} from '@shared/interface/Settings/TDisplayMode';
import InlineHelp from 'app/ts/InlineHelp/InlineHelp';
import {SettingsContext} from 'app/ts/Settings/SettingsContext';
import React, {ChangeEvent, useContext} from 'react';
import {WorkspaceSettingsContext} from '../WorkspaceSettingsContext/WorkspaceSettingsContext';

export default function DisplayMode(): JSX.Element {
  const {setLocalDisplayMode, localDisplayMode} = useContext(
    WorkspaceSettingsContext
  );
  const {isRelativeProblem, hasNoEffects, hasNoDistributions} = useContext(
    SettingsContext
  ); //FIXME limitations

  function handleSelectionChanged(event: ChangeEvent<HTMLInputElement>): void {
    const newDisplayMode = event.target.value as TDisplayMode;
    setLocalDisplayMode(newDisplayMode);
  }

  function getDisplayModeOptions(): JSX.Element[] {
    const enteredEffects = (
      <option key="1" value={'enteredEffects'}>
        Entered effects
      </option>
    );
    const enteredDistributions = (
      <option key="2" value={'enteredDistributions'}>
        Entered distributions
      </option>
    );
    const deterministicValues = (
      <option key="3" value={'deterministicValues'}>
        Values used in deterministic analysis
      </option>
    );
    const smaaValues = (
      <option key="4" value={'smaaValues'}>
        Values used in SMAA
      </option>
    );
    if (isRelativeProblem) {
      return [deterministicValues, smaaValues];
    } else if (hasNoEffects) {
      return [enteredDistributions, deterministicValues, smaaValues];
    } else if (hasNoDistributions) {
      return [enteredEffects, deterministicValues, smaaValues];
    } else
      return [
        enteredEffects,
        enteredDistributions,
        deterministicValues,
        smaaValues
      ];
  }

  return (
    <>
      <Grid item xs={6}>
        Measurements display mode{' '}
        <InlineHelp helpId="measurements-display-mode" />
      </Grid>
      <Grid item xs={6}>
        <Select
          native
          id="display-mode-selector"
          value={localDisplayMode}
          onChange={handleSelectionChanged}
          style={{minWidth: 220}}
        >
          {getDisplayModeOptions()}
        </Select>
      </Grid>
    </>
  );
}
