/**
 * @typedef {Object} CaseResponse
 * @property {boolean} ok
 * @property {Object} case
 * @property {string} case._id
 * @property {string} case.caseNumber
 * @property {string} case.status
 */

export function assertCaseResponse(payload) {
  const caseObj = payload?.case || payload?.data;
  if (!payload || payload.ok !== true || !caseObj?._id) {
    throw new TypeError("Invalid CaseResponse");
  }
  return {
    ...payload,
    case: caseObj,
  };
}
