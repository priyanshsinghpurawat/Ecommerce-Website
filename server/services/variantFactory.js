import crypto from 'crypto';
import { Variant } from '../models/variant.model.js';

export class VariantFactory {
  static generateMatrix(options, productCode) {
    if (!options || !options.length) return [];

    const optionNames = options.map((o) => o.name);
    const optionValues = options.map((o) => o.values);

    const combinations = this.cartesianProduct(optionValues);

    return combinations.map((combo) => {
      const optionValues = {};
      optionNames.forEach((name, i) => {
        optionValues[name] = combo[i];
      });

      const baseSKU = this.generateBaseSKU(productCode, optionValues);
      return {
        optionValues,
        sku: baseSKU,
        price: null,
        compareAtPrice: null,
        stock: 0,
        images: [],
      };
    });
  }

  static cartesianProduct(arrays) {
    return arrays.reduce(
      (acc, curr) => {
        return acc.flatMap((a) => curr.map((c) => [...a, c]));
      },
      [[]],
    );
  }

  static generateBaseSKU(productCode, optionValues) {
    const suffix = Object.entries(optionValues)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v.substring(0, 3).toUpperCase().replace(/\s+/g, ''))
      .join('-');

    return `${productCode}-${suffix}`.substring(0, 64);
  }

  static async ensureUniqueSKU(baseSKU, productId, excludeId = null) {
    let sku = baseSKU;
    let attempt = 0;
    const maxAttempts = 10;

    while (attempt < maxAttempts) {
      const query = { sku, product: { $ne: productId } };
      if (excludeId) query._id = { $ne: excludeId };

      const exists = await Variant.exists(query);
      if (!exists) return sku;

      const hash = crypto.randomBytes(2).toString('hex').toUpperCase();
      sku = `${baseSKU}-${hash}`;
      attempt++;
    }

    throw new Error(
      `Unable to generate unique SKU for base: ${baseSKU} after ${maxAttempts} attempts`,
    );
  }

  static generateSKUsForOptions(productCode, options) {
    const matrix = this.generateMatrix(options, productCode);
    return matrix.map((m) => m.sku);
  }
}
