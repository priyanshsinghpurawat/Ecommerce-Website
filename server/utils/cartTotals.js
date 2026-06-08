export const getUnitPrice = (product) =>
  (product.discountedPrice !== undefined && product.discountedPrice !== null)
    ? Number(product.discountedPrice)
    : Number(product.price);

export const computeCartSubtotal = (items = []) => {
  let subtotal = 0;
  for (const item of items) {
    if (!item.product) continue;
    const unitPrice = getUnitPrice(item.product);
    subtotal += unitPrice * item.quantity;
  }
  return subtotal;
};
