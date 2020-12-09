import {
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@material-ui/core';
import React, {useContext} from 'react';
import _ from 'lodash';
import UnitsHeader from 'app/ts/EffectsTable/EffectsTableHeaders/UnitsHeader/UnitsHeader';
import EffectsTableAlternativeHeaders from 'app/ts/EffectsTable/EffectsTableAlternativeHeaders/EffectsTableAlternativeHeaders';
import {getNextId, getPreviousId} from 'app/ts/util/swapUtil';
import IDataSource from '@shared/interface/IDataSource';
import OverviewDataSourceRow from '../OverviewDataSourceRow/OverviewDataSourceRow';
import {WorkspaceContext} from 'app/ts/Workspace/WorkspaceContext';
import SoEUncHeader from 'app/ts/EffectsTable/EffectsTableHeaders/SoEUncHeader/SoEUncHeader';
import ReferencesHeader from 'app/ts/EffectsTable/EffectsTableHeaders/ReferencesHeader/ReferencesHeader';
import {OverviewCriterionContext} from 'app/ts/Workspace/OverviewCriterionContext/OverviewCriterionContext';
import {OverviewDataSourceContextProviderComponent} from './OverviewDataSourceContext/OverviewDataSourceContext';

export default function OverviewDataSourceTable() {
  const {alternatives} = useContext(WorkspaceContext);
  const {dataSources} = useContext(OverviewCriterionContext);

  function renderDataSourceRows(dataSources: IDataSource[]): JSX.Element[] {
    return _.map(dataSources, renderDataSourceRow);
  }

  function renderDataSourceRow(
    dataSource: IDataSource,
    index: number
  ): JSX.Element {
    const previousDSId = getPreviousId(index, dataSources);
    const nextDSId = getNextId(index, dataSources);
    return (
      <OverviewDataSourceContextProviderComponent
        dataSource={dataSource}
        previousDataSourceId={previousDSId}
        nextDataSourceId={nextDSId}
        index={index}
      >
        <OverviewDataSourceRow key={dataSource.id} />
      </OverviewDataSourceContextProviderComponent>
    );
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell></TableCell>
          <UnitsHeader />
          <EffectsTableAlternativeHeaders
            alternatives={_.values(alternatives)}
          />
          <SoEUncHeader />
          <ReferencesHeader />
          <TableCell></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>{renderDataSourceRows(dataSources)}</TableBody>
    </Table>
  );
}
