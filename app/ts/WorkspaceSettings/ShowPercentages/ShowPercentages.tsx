import {Grid, Radio, RadioGroup} from '@material-ui/core';
import {TPercentageOrDecimal} from '@shared/interface/Settings/TPercentageOrDecimal';
import InlineHelp from 'app/ts/InlineHelp/InlineHelp';
import React, {ChangeEvent, useContext} from 'react';
import {WorkspaceSettingsContext} from '../WorkspaceSettingsContext/WorkspaceSettingsContext';

export default function ShowPercentages(): JSX.Element {
  const {localShowPercentages, setLocalShowPercentages} = useContext(
    WorkspaceSettingsContext
  );

  function handleRadioChanged(event: ChangeEvent<HTMLInputElement>): void {
    setLocalShowPercentages(event.target.value as TPercentageOrDecimal);
  }

  return (
    <>
      <Grid item xs={6}>
        Show percentages or decimals <InlineHelp helpId="percentages" />
      </Grid>
      <Grid item xs={6}>
        <RadioGroup
          name="percentages-radio"
          value={localShowPercentages}
          onChange={handleRadioChanged}
        >
          <label id="show-percentages-radio">
            <Radio value="percentage" /> Percentages
          </label>
          <label id="show-decimals-radio">
            <Radio value="decimal" /> Decimals
          </label>
        </RadioGroup>
      </Grid>
    </>
  );
}
