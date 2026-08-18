/**
 * Scaler function that parses Japanese recipe quantities and dynamically rescales them.
 * e.g., "200g" -> base 2 servings -> target 4 servings => "400g"
 * "大さじ1.5" -> "大さじ3"
 * "1/2個" -> "1個"
 */

export function scaleQuantity(quantityStr: string, baseServings: number, targetServings: number): string {
  if (!quantityStr || baseServings <= 0 || targetServings <= 0 || baseServings === targetServings) {
    return quantityStr;
  }

  const ratio = targetServings / baseServings;

  // Handle fractional cases like "1/2" or "1/4"
  const fractionRegex = /^(\d+)\/(\d+)(.*)$/;
  const fracMatch = quantityStr.trim().match(fractionRegex);
  if (fracMatch) {
    const num = parseFloat(fracMatch[1]);
    const den = parseFloat(fracMatch[2]);
    const rest = fracMatch[3];
    const val = (num / den) * ratio;
    return formatScaledNumber(val) + rest;
  }

  // Handle standard number regex (e.g. "200g", "大さじ1.5", "2切れ", "1/2")
  // Regex to extract prefix, number, and suffix
  const numRegex = /^([^0-9０-９\.]*)(([0-9]+(\.[0-9]+)?)|([０-９]+(\.[０-９]+)?))(.*)$/;
  const match = quantityStr.trim().match(numRegex);

  if (!match) {
    return quantityStr; // e.g. "適量", "少々", "お好みで"
  }

  const prefix = match[1] || "";
  const numStr = match[2];
  const suffix = match[7] || "";

  // Convert full-width numbers if any
  const normalizedNumStr = numStr.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
  const val = parseFloat(normalizedNumStr);

  if (isNaN(val)) return quantityStr;

  const scaledVal = val * ratio;
  return `${prefix}${formatScaledNumber(scaledVal)}${suffix}`;
}

function formatScaledNumber(num: number): string {
  if (Math.abs(num - Math.round(num)) < 0.05) {
    return Math.round(num).toString();
  }
  // Convert friendly decimals like 0.5 to 1/2
  if (Math.abs(num - 0.5) < 0.05) return "1/2";
  if (Math.abs(num - 0.25) < 0.05) return "1/4";
  if (Math.abs(num - 0.75) < 0.05) return "3/4";
  if (Math.abs(num - 1.5) < 0.05) return "1.5";
  if (Math.abs(num - 2.5) < 0.05) return "2.5";

  return (Math.round(num * 10) / 10).toString();
}
