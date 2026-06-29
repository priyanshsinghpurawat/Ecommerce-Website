import { describe, it, expect } from 'vitest';
import { VariantFactory } from '../../services/variantFactory.js';

describe('VariantFactory', () => {
  describe('cartesianProduct', () => {
    it('returns empty array for empty input', () => {
      expect(VariantFactory.cartesianProduct([])).toEqual([[]]);
    });

    it('computes single array', () => {
      expect(VariantFactory.cartesianProduct([['a', 'b']])).toEqual([['a'], ['b']]);
    });

    it('computes two arrays', () => {
      const result = VariantFactory.cartesianProduct([['a', 'b'], ['1', '2']]);
      expect(result).toEqual([['a', '1'], ['a', '2'], ['b', '1'], ['b', '2']]);
    });

    it('computes three arrays', () => {
      const result = VariantFactory.cartesianProduct([['R', 'G'], ['S', 'M'], ['C1', 'C2']]);
      expect(result.length).toBe(8);
    });
  });

  describe('generateMatrix', () => {
    it('returns empty for no options', () => {
      expect(VariantFactory.generateMatrix([], 'PROD')).toEqual([]);
      expect(VariantFactory.generateMatrix(null, 'PROD')).toEqual([]);
    });

    it('generates matrix for single option', () => {
      const options = [{ name: 'Color', values: ['Red', 'Blue'] }];
      const matrix = VariantFactory.generateMatrix(options, 'SHIRT');
      expect(matrix).toHaveLength(2);
      expect(matrix[0].optionValues).toEqual({ Color: 'Red' });
      expect(matrix[1].optionValues).toEqual({ Color: 'Blue' });
    });

    it('generates matrix for multiple options', () => {
      const options = [
        { name: 'Color', values: ['Red', 'Blue'] },
        { name: 'Size', values: ['S', 'M'] }
      ];
      const matrix = VariantFactory.generateMatrix(options, 'SHIRT');
      expect(matrix).toHaveLength(4);
      expect(matrix[0].sku).toContain('SHIRT');
    });

    it('sets default values for each variant', () => {
      const options = [{ name: 'Color', values: ['Red'] }];
      const matrix = VariantFactory.generateMatrix(options, 'PROD');
      expect(matrix[0].price).toBeNull();
      expect(matrix[0].compareAtPrice).toBeNull();
      expect(matrix[0].stock).toBe(0);
      expect(matrix[0].images).toEqual([]);
    });
  });

  describe('generateBaseSKU', () => {
    it('generates SKU from product code and options', () => {
      const sku = VariantFactory.generateBaseSKU('SHIRT', { Color: 'Red', Size: 'M' });
      expect(sku).toBe('SHIRT-RED-M');
    });

    it('sorts options alphabetically by key', () => {
      const sku = VariantFactory.generateBaseSKU('P', { Size: 'M', Color: 'Red' });
      expect(sku).toBe('P-RED-M');
    });

    it('truncates long option values to 3 chars', () => {
      const sku = VariantFactory.generateBaseSKU('P', { Color: 'Midnight Blue' });
      expect(sku).toContain('MID');
    });

    it('truncates to 64 chars max', () => {
      const longCode = 'A'.repeat(50);
      const sku = VariantFactory.generateBaseSKU(longCode, { Color: 'Red' });
      expect(sku.length).toBeLessThanOrEqual(64);
    });
  });

  describe('generateSKUsForOptions', () => {
    it('returns array of SKU strings', () => {
      const options = [
        { name: 'Color', values: ['Red', 'Blue'] },
        { name: 'Size', values: ['S', 'M'] }
      ];
      const skus = VariantFactory.generateSKUsForOptions('TSHIRT', options);
      expect(skus).toHaveLength(4);
      skus.forEach(sku => expect(typeof sku).toBe('string'));
    });
  });
});
