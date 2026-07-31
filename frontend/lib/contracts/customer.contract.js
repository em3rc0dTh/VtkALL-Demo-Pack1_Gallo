/**
 * @typedef {Object} CustomerResponse
 * @property {boolean} ok
 * @property {Object} customer
 * @property {string} customer._id
 * @property {boolean} reused
 */

export function assertCustomerResponse(payload) {
  if (!payload || payload.ok !== true || !payload.customer?._id) {
    throw new TypeError("Invalid CustomerResponse");
  }
  return payload;
}
