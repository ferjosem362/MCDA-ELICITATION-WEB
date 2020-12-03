import {TableCell, TableRow} from '@material-ui/core';
import IAlternative from '@shared/interface/IAlternative';
import React from 'react';
import EditOverviewAlternativeButton from './EditOverviewAlternativeButton/EditOverviewAlternativeButton';

export default function OverviewAlternativeRow({
  alternative
}: {
  alternative: IAlternative;
}): JSX.Element {
  return (
    <TableRow>
      <TableCell></TableCell>
      <TableCell>{alternative.title}</TableCell>
      <TableCell>
        <EditOverviewAlternativeButton alternative={alternative} />
      </TableCell>
    </TableRow>
  );
}