import {Grid, TableCell, Tooltip} from '@material-ui/core';
import ICriterion from '@shared/interface/ICriterion';
import IDataSource from '@shared/interface/IDataSource';
import IUnitOfMeasurement from '@shared/interface/IUnitOfMeasurement';
import {ManualInputContext} from 'app/ts/ManualInput/ManualInputContext';
import React, {useContext, useState} from 'react';
import InlineTooltip from '../InlineTooltip/InlineTooltip';
import UnitOfMeasurementDialog from './UnitOfMeasurementDialog/UnitOfMeasurementDialog';

export default function UnitOfMeasurementCell({
  criterion,
  dataSource
}: {
  criterion: ICriterion;
  dataSource: IDataSource;
}) {
  const {setDataSource} = useContext(ManualInputContext);

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  function openDialog(): void {
    setIsDialogOpen(true);
  }

  function closeDialog(): void {
    setIsDialogOpen(false);
  }

  function handleUnitOfMeasurementChanged(
    newUnitOfMeasurement: IUnitOfMeasurement
  ): void {
    closeDialog();
    setDataSource(criterion.id, {
      ...dataSource,
      unitOfMeasurement: newUnitOfMeasurement
    });
  }

  function createLabel(): JSX.Element {
    if (dataSource.unitOfMeasurement.label) {
      return (
        <Tooltip title="Edit unit of measurement">
          <span>{dataSource.unitOfMeasurement.label}</span>
        </Tooltip>
      );
    } else {
      return <InlineTooltip />;
    }
  }

  function createScalesLabel(): JSX.Element {
    return (
      <span>
        [{dataSource.unitOfMeasurement.lowerBound},{' '}
        {dataSource.unitOfMeasurement.upperBound}]
      </span>
    );
  }

  return (
    <TableCell id={`ds-unit-${dataSource.id}`} align="center">
      <Grid container>
        <Grid item xs={12} onClick={openDialog} style={{cursor: 'pointer'}}>
          {createLabel()}
        </Grid>
        <Grid item xs={12}>
          {createScalesLabel()}
        </Grid>
      </Grid>

      <UnitOfMeasurementDialog
        unitOfMeasurement={dataSource.unitOfMeasurement}
        callback={handleUnitOfMeasurementChanged}
        isDialogOpen={isDialogOpen}
        cancel={closeDialog}
      />
    </TableCell>
  );
}