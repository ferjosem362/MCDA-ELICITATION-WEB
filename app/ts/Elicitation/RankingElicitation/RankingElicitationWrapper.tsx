import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import React from 'react';
import IInputCriterion from '../Interface/IInputCriterion';
import IOrdinalRanking from '../Interface/IOrdinalRanking';
import RankingElicitation from './RankingElicitation/RankingElicitation';
import {RankingElicitationContextProviderComponent} from './RankingElicitationContext';

export default function RankingElicitationWrapper({
  criteria,
  cancel,
  save
}: {
  criteria: IInputCriterion[];
  cancel: () => void;
  save: (preferences: IOrdinalRanking[]) => void;
}) {
  return (
    <RankingElicitationContextProviderComponent
      inputCriteria={criteria}
      cancel={cancel}
      save={save}
    >
      <Grid container justify="center" component={Box} mt={2}>
        <RankingElicitation />
      </Grid>
    </RankingElicitationContextProviderComponent>
  );
}