// Amounts are integer paise. GST is charged on the product; the processing fee is 2% of its subtotal.
export const checkoutPricing = (basePaise) => {
  const gstPaise = Math.round(basePaise * 18 / 100);
  const cgstPaise = Math.round(gstPaise / 2);
  const sgstPaise = gstPaise - cgstPaise;
  const invoiceTotalPaise = basePaise + gstPaise;
  const processingFeePaise = Math.round((basePaise + gstPaise) * 2 / 100);
  return { basePaise, gstPaise, cgstPaise, sgstPaise, invoiceTotalPaise, processingFeePaise,
    totalPaise: basePaise + gstPaise + processingFeePaise };
};
