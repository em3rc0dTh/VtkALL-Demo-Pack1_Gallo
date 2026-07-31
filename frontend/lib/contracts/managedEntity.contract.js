/**
 * @typedef {Object} ManagedEntityResponse
 * @property {boolean} ok
 * @property {Object} managedEntity
 * @property {string} managedEntity._id
 */

export function assertManagedEntityResponse(payload) {
  const managedEntity = payload?.managedEntity || payload?.data;
  if (!payload || payload.ok !== true || !managedEntity?._id) {
    throw new TypeError("Invalid ManagedEntityResponse");
  }
  return {
    ...payload,
    managedEntity,
  };
}
