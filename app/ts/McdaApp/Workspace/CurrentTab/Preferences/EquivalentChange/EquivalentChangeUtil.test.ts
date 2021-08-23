import IUnitOfMeasurement from '@shared/interface/IUnitOfMeasurement';
import {TPvf} from '@shared/interface/Problem/IPvf';
import {ILinearPvf} from '@shared/interface/Pvfs/ILinearPvf';
import {
  getEquivalentChange,
  getEquivalentRangeValue,
  getInitialReferenceValueFrom,
  getInitialReferenceValueTo,
  getPartOfInterval,
  getTheoreticalRange
} from './equivalentChangeUtil';

describe('equivalentChangeUtil', () => {
  describe('getPartOfInterval', () => {
    it('should calculate the ratio of the chosen interval to the total range for a favourable criterion', () => {
      const from = 0;
      const to = 0.5;
      const lowerBound = 0;
      const upperBound = 1;
      const result = getPartOfInterval(from, to, lowerBound, upperBound);
      expect(result).toEqual(0.5);
    });

    it('should calculate the ratio of the chosen interval to the total range for an unfavourable criterion', () => {
      const from = 0.5;
      const to = 0;
      const lowerBound = 0;
      const upperBound = 1;
      const result = getPartOfInterval(from, to, lowerBound, upperBound);
      expect(result).toEqual(0.5);
    });
  });

  describe('getInitialReferenceValueFrom', () => {
    it('should return an inital value at 45% of the interval for an increasing pvf', () => {
      const pvf: ILinearPvf = {
        range: [0, 1],
        direction: 'increasing',
        type: 'linear'
      };
      const result = getInitialReferenceValueFrom(0, 1, pvf);
      expect(result).toEqual(0.25);
    });

    it('should return an inital value at 55% of the interval for a decreasing pvf', () => {
      const pvf: ILinearPvf = {
        range: [0, 1],
        direction: 'decreasing',
        type: 'linear'
      };
      const result = getInitialReferenceValueFrom(0, 1, pvf);
      expect(result).toEqual(0.75);
    });
  });

  describe('getInitialReferenceValueTo', () => {
    it('should return an inital value at 55% of the interval for an increasing pvf', () => {
      const pvf: ILinearPvf = {
        range: [0, 1],
        direction: 'increasing',
        type: 'linear'
      };
      const result = getInitialReferenceValueTo(0, 1, pvf);
      expect(result).toEqual(0.75);
    });

    it('should return an inital value at 45% of the interval for a decreasing pvf', () => {
      const pvf: ILinearPvf = {
        range: [0, 1],
        direction: 'decreasing',
        type: 'linear'
      };
      const result = getInitialReferenceValueTo(0, 1, pvf);
      expect(result).toEqual(0.25);
    });
  });

  const criterionWeight = 0.1;
  const partOfInterval = 0.5;
  const referenceWeight = 0.4;
  describe('getEquivalentRangeValue', () => {
    it('should return an improved value given a worst value, considering the weights, and ratio to the reference criterion, for an increasing pvf', () => {
      const pvf = {range: [0, 1], direction: 'increasing'} as TPvf;
      const result = getEquivalentRangeValue(
        criterionWeight,
        pvf,
        partOfInterval,
        referenceWeight
      );
      expect(result).toEqual(2);
    });

    it('should return an improved value given a worst value, considering the weights, and ratio to the reference criterion, for a decreasing pvf', () => {
      const pvf = {range: [0, 1], direction: 'decreasing'} as TPvf;
      const result = getEquivalentRangeValue(
        criterionWeight,
        pvf,
        partOfInterval,
        referenceWeight
      );
      expect(result).toEqual(-1);
    });
  });

  describe('getEquivalentValue', () => {
    it('should return the equivalent change for a second criterion, based on its pvf, a reference change and the relative weights of the criteria, for increasing pvf', () => {
      const pvf = {range: [0, 1], direction: 'increasing'} as TPvf;
      const result = getEquivalentChange(
        criterionWeight, // 0.1
        pvf,
        partOfInterval, // 0.5
        referenceWeight // 0.4
      );
      expect(result).toEqual(2);
    });

    it('should return the equivalent change for a second criterion, based on its pvf, a reference change and the relative weights of the criteria, for decreasing pvf', () => {
      const pvf = {range: [0, 1], direction: 'decreasing'} as TPvf;
      const result = getEquivalentChange(
        criterionWeight, // 0.1
        pvf,
        partOfInterval, // 0.5
        referenceWeight // 0.4
      );
      expect(result).toEqual(2);
    });
  });

  describe('getTheoreticalRange', () => {
    it('should return [-Infinity, Infinity] if the bounds are null', () => {
      const unit = {lowerBound: null, upperBound: null} as IUnitOfMeasurement;
      const usePercentage = false;
      const result = getTheoreticalRange(unit, usePercentage);
      const expectedResult = [-Infinity, Infinity];
      expect(result).toEqual(expectedResult);
    });

    it('should return [0,1] if usePercentage is false for a decimal unit', () => {
      const unit = {
        lowerBound: 0,
        upperBound: 1,
        type: 'decimal'
      } as IUnitOfMeasurement;
      const usePercentage = false;
      const result = getTheoreticalRange(unit, usePercentage);
      const expectedResult = [0, 1];
      expect(result).toEqual(expectedResult);
    });

    it('should return [0,1] if usePercentage is false for a percentage unit', () => {
      const unit = {
        lowerBound: 0,
        upperBound: 100,
        type: 'percentage'
      } as IUnitOfMeasurement;
      const usePercentage = false;
      const result = getTheoreticalRange(unit, usePercentage);
      const expectedResult = [0, 1];
      expect(result).toEqual(expectedResult);
    });

    it('should return [0,100] if usePercentage is true for a decimal unit', () => {
      const unit = {
        lowerBound: 0,
        upperBound: 1,
        type: 'decimal'
      } as IUnitOfMeasurement;
      const usePercentage = true;
      const result = getTheoreticalRange(unit, usePercentage);
      const expectedResult = [0, 100];
      expect(result).toEqual(expectedResult);
    });

    it('should return [0,100] if usePercentage is true for a percentage unit', () => {
      const unit = {
        lowerBound: 0,
        upperBound: 100,
        type: 'percentage'
      } as IUnitOfMeasurement;
      const usePercentage = true;
      const result = getTheoreticalRange(unit, usePercentage);
      const expectedResult = [0, 100];
      expect(result).toEqual(expectedResult);
    });

    it('should return the bounds otherwise', () => {
      const unit = {
        lowerBound: 37,
        upperBound: 42,
        type: 'custom'
      } as IUnitOfMeasurement;
      const usePercentage = true;
      const result = getTheoreticalRange(unit, usePercentage);
      const expectedResult = [37, 42];
      expect(result).toEqual(expectedResult);
    });
  });
});
