import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import _ from 'lodash';
import React, {useContext} from 'react';
import {PreferencesContext} from '../../PreferencesContext';
import PartialValueFunctionButtons from './PartialValueFunctionButtons/PartialValueFunctionButtons';
import PartialValueFunctionPlot from './PartialValueFunctionPlot/PartialValueFunctionPlot';

export default function PartialValueFunctions() {
  const {pvfs, criteria} = useContext(PreferencesContext);

  function getPartialValueFunctions(): JSX.Element[] {
    return _.map(_.toArray(criteria), (criterion, index) => {
      return (
        <Grid key={criterion.id} container item lg={3} md={4} xs={6}>
          <Grid item xs={12} style={{textAlign: 'center'}}>
            {criterion.title}
          </Grid>
          <Grid item xs={12}>
            {getPlotOrQuestionMark(criterion.id, index)}
          </Grid>
          <Grid item xs={12} style={{textAlign: 'center'}}>
            <PartialValueFunctionButtons
              criterionId={criterion.id}
              index={index}
            />
          </Grid>
        </Grid>
      );
    });
  }

  function getPlotOrQuestionMark(criterionId: string, index: number) {
    if (pvfs[criterionId].direction) {
      return (
        <PartialValueFunctionPlot criterionId={criterionId} index={index} />
      );
    } else {
      return <div style={{fontSize: '144px', textAlign: 'center'}}>?</div>;
    }
  }

  return (
    <>
      <Grid container id="partial-value-functions-block">
        <Grid item xs={12}>
          <Typography id="partial-value-functions-header" variant="h4">
            Partial Value Functions
          </Typography>
        </Grid>
        <Grid container item xs={12}>
          {getPartialValueFunctions()}
        </Grid>
      </Grid>
    </>
  );
}
