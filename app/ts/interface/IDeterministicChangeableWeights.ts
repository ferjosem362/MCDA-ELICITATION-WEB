import IWeights from '@shared/interface/IWeights';
import IChangeableValue from './IChangeableValue';

export default interface IDeterministicChangeableWeights {
  weights: IWeights;
  importances: Record<string, IChangeableValue>;
  equivalentChanges: Record<string, IChangeableValue>;
  partOfInterval: number;
}
