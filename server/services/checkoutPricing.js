// Amounts are integer paise. GST is charged on the product; the processing fee is 2% of its subtotal.
export const checkoutPricing = (basePaise) => {
  const gstPaise = Math.round(basePaise * 18 / 100);
  const processingFeePaise = Math.round((basePaise + gstPaise) * 2 / 100);
  return { basePaise, gstPaise, processingFeePaise,
    totalPaise: basePaise + gstPaise + processingFeePaise };
};
