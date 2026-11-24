/**
 * Formats a numeric price or string amount into Bangladeshi Taka (৳ / BDT).
 * E.g. 1299.99 -> "৳1,299.99"
 *
 * @param {number|string} amount
 * @param {boolean} includeDecimals
 * @returns {string}
 */
export const formatBDT = (amount, includeDecimals = true) => {
    if (amount === null || amount === undefined || amount === '') {
        return includeDecimals ? '৳0.00' : '৳0';
    }

    const num = typeof amount === 'string'
        ? parseFloat(amount.replace(/[^0-9.-]/g, ''))
        : Number(amount);

    if (isNaN(num)) {
        return includeDecimals ? '৳0.00' : '৳0';
    }

    return `৳${num.toLocaleString('en-US', {
        minimumFractionDigits: includeDecimals ? 2 : 0,
        maximumFractionDigits: includeDecimals ? 2 : 0
    })}`;
};

export default formatBDT;
