import {FormControlLabel} from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Grid from '@material-ui/core/Grid';
import InlineHelp from 'app/ts/InlineHelp/InlineHelp';
import DisplayWarnings from 'app/ts/util/DisplayWarnings';
import React, {useContext, useState} from 'react';
import {SmaaResultsContext} from '../../SmaaResultsContext/SmaaResultsContext';

export default function UncertaintyOptions() {
  const {
    problemHasStochasticMeasurements,
    problemHasStochasticWeights,
    useMeasurementsUncertainty,
    useWeightsUncertainty,
    warnings,
    recalculate,
    setUseMeasurementsUncertainty,
    setUseWeightsUncertainty
  } = useContext(SmaaResultsContext);

  const [isDirty, setIsDirty] = useState<boolean>(false);

  function handleMeasurementsUncertainty(): void {
    setIsDirty(true);
    setUseMeasurementsUncertainty(!useMeasurementsUncertainty);
  }

  function handleWeightsUncertainty(): void {
    setIsDirty(true);
    setUseWeightsUncertainty(!useWeightsUncertainty);
  }

  function handleRecalculateClick(): void {
    setIsDirty(false);
    recalculate();
  }

  return (
    <Grid item container>
      <Grid item xs={3}>
        Take into account uncertainty in:
      </Grid>
      <Grid container item xs={9}>
        <Grid item xs={12}>
          <FormControlLabel
            value="measurements-uncertainty"
            control={
              <Checkbox
                id="measurements-uncertainty-checkbox"
                checked={useMeasurementsUncertainty}
                onChange={handleMeasurementsUncertainty}
                disabled={!problemHasStochasticMeasurements}
                color="primary"
              />
            }
            label="measurements"
            labelPlacement="end"
          />
          <InlineHelp helpId="smaa-measurements-uncertainty" />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            value="weights-uncertainty"
            control={
              <Checkbox
                id="weights-uncertainty-checkbox"
                checked={useWeightsUncertainty}
                onChange={handleWeightsUncertainty}
                disabled={!problemHasStochasticWeights}
                color="primary"
              />
            }
            label="weights"
            labelPlacement="end"
          />
          <InlineHelp helpId="smaa-weights-uncertainty" />
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <Button
          id="recalculate-button"
          color="primary"
          variant="contained"
          onClick={handleRecalculateClick}
          disabled={!isDirty}
        >
          Recalculate
        </Button>
      </Grid>
      <DisplayWarnings identifier="smaa-results" warnings={warnings} />
    </Grid>
  );
}
