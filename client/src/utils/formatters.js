export function formatINR(val, includeDecimals = true) {
  const num = Number(val) || 0;
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: 2
  });
}
