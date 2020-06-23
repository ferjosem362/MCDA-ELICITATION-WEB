import {parallel, waterfall} from 'async';
import _ from 'lodash';
import pgPromise, {IMain} from 'pg-promise';
import IAlternative from '../app/js/interface/IAlternative';
import IAlternativeQueryResult from '../app/js/interface/IAlternativeQueryResult';
import ICriterion from '../app/js/interface/ICriterion';
import ICriterionQueryResult from '../app/js/interface/ICriterionQueryResult';
import IDataSource from '../app/js/interface/IDataSource';
import IDataSourceQueryResult from '../app/js/interface/IDataSourceQueryResult';
import {Distribution} from '../app/js/interface/IDistribution';
import {Effect} from '../app/js/interface/IEffect';
import IInProgressMessage from '../app/js/interface/IInProgressMessage';
import IInProgressWorkspace from '../app/js/interface/IInProgressWorkspace';
import IValueCellQueryResult from '../app/js/interface/IValueCellQueryResult';
import IWorkspaceQueryResult from '../app/js/interface/IWorkspaceQueryResult';
import {generateUuid} from '../app/js/manualInput/ManualInput/ManualInputService/ManualInputService';
import {
  mapAlternatives,
  mapCellValues,
  mapCombinedResults,
  mapCriteria,
  mapDataSources,
  mapWorkspace
} from './inProgressRepositoryService';

export default function InProgressWorkspaceRepository(db: any) {
  const pgp: IMain = pgPromise();

  function create(
    userId: string,
    callback: (error: any, createdId: string) => void
  ) {
    db.runInTransaction(
      _.partial(createInProgressWorkspaceTransaction, userId),
      callback
    );
  }

  function createInProgressWorkspaceTransaction(
    ownerId: string,
    client: any,
    transactionCallback: (error: any, createdId: string) => void
  ) {
    waterfall(
      [
        _.partial(createInProgressWorkspace, client, ownerId),
        _.partial(createInProgressCriteria, client),
        _.partial(createInProgressDataSources, client),
        _.partial(createInProgressAlternatives, client)
      ],
      transactionCallback
    );
  }

  function createInProgressWorkspace(
    client: any,
    ownerId: string,
    callback: (error: any, createdId: string) => {}
  ) {
    const query = `INSERT INTO inProgressWorkspace (owner, state, useFavourability, title, therapeuticContext) 
         VALUES ($1, $2, true, $3, $3) 
       RETURNING id`;
    client.query(query, [ownerId, {}, ''], function (
      error: any,
      result: {rows: any[]}
    ) {
      callback(error, error || result.rows[0].id);
    });
  }

  function createInProgressCriteria(
    client: any,
    inProgressworkspaceId: string,
    callback: (
      error: any | null,
      inProgressworkspaceId: string,
      createdCriteriaIds: string[]
    ) => {}
  ) {
    const toCreate = [
      {
        id: generateUuid(),
        orderindex: 0,
        isfavourable: true,
        title: 'criterion 1',
        description: '',
        inprogressworkspaceid: inProgressworkspaceId
      },
      {
        id: generateUuid(),
        orderindex: 1,
        isfavourable: false,
        title: 'criterion 2',
        description: '',
        inprogressworkspaceid: inProgressworkspaceId
      }
    ];
    const columns = new pgp.helpers.ColumnSet(
      [
        'id',
        'orderindex',
        'isfavourable',
        'title',
        'description',
        'inprogressworkspaceid'
      ],
      {table: 'inprogresscriterion'}
    );
    const query = pgp.helpers.insert(toCreate, columns) + ' RETURNING id';
    client.query(query, [], (error: any, result: {rows: [{id: string}]}) => {
      if (error) {
        callback(error, null, null);
      } else {
        callback(null, inProgressworkspaceId, _.map(result.rows, 'id'));
      }
    });
  }

  function createInProgressDataSources(
    client: any,
    inProgressworkspaceId: string,
    criterionIds: string[],
    callback: (error: any | null, inProgressworkspaceId: string) => {}
  ) {
    const toCreate = [
      {
        id: generateUuid(),
        orderindex: 0,
        criterionid: criterionIds[0],
        inprogressworkspaceid: inProgressworkspaceId
      },
      {
        id: generateUuid(),
        orderindex: 0,
        criterionid: criterionIds[1],
        inprogressworkspaceid: inProgressworkspaceId
      }
    ];
    const columns = new pgp.helpers.ColumnSet(
      ['id', 'orderindex', 'criterionid', 'inprogressworkspaceid'],
      {table: 'inprogressdatasource'}
    );
    const query = pgp.helpers.insert(toCreate, columns);
    client.query(query, [], (error: any) => {
      if (error) {
        callback(error, null);
      } else {
        callback(null, inProgressworkspaceId);
      }
    });
  }

  function createInProgressAlternatives(
    client: any,
    inProgressworkspaceId: string,
    callback: (error: any | null, inProgressworkspaceId: string) => {}
  ) {
    const toCreate = [
      {
        id: generateUuid(),
        orderindex: 0,
        inprogressworkspaceid: inProgressworkspaceId,
        title: 'alternative 1'
      },
      {
        id: generateUuid(),
        orderindex: 0,
        inprogressworkspaceid: inProgressworkspaceId,
        title: 'alternative 2'
      }
    ];
    const columns = new pgp.helpers.ColumnSet(
      ['id', 'orderindex', 'inprogressworkspaceid', 'title'],
      {table: 'inprogressalternative'}
    );
    const query = pgp.helpers.insert(toCreate, columns);
    client.query(query, [], (error: any) => {
      if (error) {
        callback(error, null);
      } else {
        callback(null, inProgressworkspaceId);
      }
    });
  }

  function get(
    inProgressId: number,
    callback: (error: any, result: IInProgressMessage) => void
  ): void {
    db.runInTransaction(
      _.partial(getTransaction, inProgressId),
      (
        error: any,
        results: [
          IInProgressWorkspace,
          ICriterion[],
          IAlternative[],
          IDataSource[],
          [
            Record<string, Record<string, Effect>>,
            Record<string, Record<string, Distribution>>
          ]
        ]
      ) => {
        if (error) {
          callback(error, null);
        } else {
          callback(null, mapCombinedResults(results));
        }
      }
    );
  }

  function getTransaction(
    inProgressId: number,
    client: any,
    transactionCallback: (
      error: any,
      results: [
        IInProgressWorkspace,
        ICriterion[],
        IAlternative[],
        IDataSource[],
        [
          Record<string, Record<string, Effect>>,
          Record<string, Record<string, Distribution>>
        ]
      ]
    ) => void
  ) {
    parallel(
      [
        _.partial(getWorkspace, inProgressId, client),
        _.partial(getCriteria, inProgressId, client),
        _.partial(getAlternatives, inProgressId, client),
        _.partial(getDataSources, inProgressId, client),
        _.partial(getInProgressValues, inProgressId, client)
      ],
      transactionCallback
    );
  }

  function getWorkspace(
    inProgressId: number,
    client: any,
    callback: (error: any, inProgressWorkspace: IInProgressWorkspace) => void
  ): void {
    const query = 'SELECT * FROM inProgressWorkspace WHERE id=$1';
    client.query(
      query,
      [inProgressId],
      (error: any, result: {rows: [IWorkspaceQueryResult]}) => {
        if (error) {
          callback(error, null);
        } else {
          callback(null, mapWorkspace(result.rows[0]));
        }
      }
    );
  }

  function getCriteria(
    inProgressId: number,
    client: any,
    callback: (error: any, criteria: ICriterion[]) => void
  ): void {
    const query =
      'SELECT * FROM inProgressCriterion WHERE inProgressWorkspaceId=$1';
    client.query(
      query,
      [inProgressId],
      (error: any, result: {rows: ICriterionQueryResult[]}) => {
        if (error) {
          callback(error, null);
        } else {
          callback(null, mapCriteria(result.rows));
        }
      }
    );
  }

  function getAlternatives(
    inProgressId: number,
    client: any,
    callback: (error: any, alternatives: IAlternative[]) => void
  ): void {
    const query =
      'SELECT * FROM inProgressAlternative WHERE inProgressWorkspaceId=$1';
    client.query(
      query,
      [inProgressId],
      (error: any, result: {rows: IAlternativeQueryResult[]}) => {
        if (error) {
          callback(error, null);
        } else {
          callback(null, mapAlternatives(result.rows));
        }
      }
    );
  }

  function getDataSources(
    inProgressId: number,
    client: any,
    callback: (error: any, dataSources: IDataSource[]) => void
  ) {
    const query =
      'SELECT * FROM inProgressDataSource WHERE inProgressWorkspaceId=$1';
    client.query(
      query,
      [inProgressId],
      (error: any, result: {rows: IDataSourceQueryResult[]}) => {
        if (error) {
          callback(error, null);
        } else {
          callback(null, mapDataSources(result.rows));
        }
      }
    );
  }

  function getInProgressValues(
    inProgressId: number,
    client: any,
    callback: (
      error: any,
      values: [
        Record<string, Record<string, Effect>>,
        Record<string, Record<string, Distribution>>
      ]
    ) => void
  ): void {
    const query =
      'SELECT * FROM inProgressWorkspaceCell WHERE inProgressWorkspaceId=$1';
    client.query(
      query,
      [inProgressId],
      (error: any, result: {rows: IValueCellQueryResult[]}) => {
        if (error) {
          callback(error, null);
        } else {
          callback(null, mapCellValues(result.rows));
        }
      }
    );
  }

  function updateWorkspace(
    {title, therapeuticContext, useFavourability, id}: IInProgressWorkspace,
    callback: (error: any) => void
  ): void {
    const query = `UPDATE inProgressWorkspace
                   SET (title, therapeuticContext, useFavourability) = ($1,$2,$3) 
                   WHERE id=$4`;
    db.query(
      query,
      [title, therapeuticContext, useFavourability, id],
      callback
    );
  }

  return {
    create: create,
    get: get,
    updateWorkspace: updateWorkspace
  };
}