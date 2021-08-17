import {Button, Typography} from '@material-ui/core';
import {getPercentifiedValue} from 'app/ts/DisplayUtil/DisplayUtil';
import {SettingsContext} from 'app/ts/McdaApp/Workspace/SettingsContext/SettingsContext';
import {getUnitLabel} from 'app/ts/util/getUnitLabel';
import React, {useContext, useState} from 'react';
import {EquivalentChangeContext} from '../EquivalentChangeContext/EquivalentChangeContext';
import EquivalentChangeValueInput from './EquivalentChangeInput/EquivalentChangeValueInput';

export default function EquivalentChangeValueStatement() {
  const {referenceCriterion, referenceValueBy} = useContext(
    EquivalentChangeContext
  );
  const {getUsePercentage} = useContext(SettingsContext);

  const [isDialogOpen, setDialogOpen] = useState<boolean>(false);
  const usePercentage = getUsePercentage(referenceCriterion.dataSources[0]);
  const anchorElement = document.getElementById(
    'reference-value-by'
  ) as HTMLButtonElement;
  function openDialog(event: React.MouseEvent<HTMLButtonElement>): void {
    setDialogOpen(true);
  }

  function closeDialog(): void {
    setDialogOpen(false);
  }
  const unit = referenceCriterion.dataSources[0].unitOfMeasurement;

  return (
    <>
      <Typography>
        The change of {referenceCriterion.title} by{' '}
        <Button id="reference-value-by" onClick={openDialog} variant="outlined">
          {getPercentifiedValue(referenceValueBy, usePercentage)}
        </Button>
        {getUnitLabel(unit, usePercentage)} is the basis for calculating the
        equivalent changes in the table below.
      </Typography>
      <EquivalentChangeValueInput
        anchorElement={anchorElement}
        isDialogOpen={isDialogOpen}
        closeDialog={closeDialog}
      />
    </>
  );
}
