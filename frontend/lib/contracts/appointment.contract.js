/**
 * @typedef {Object} AppointmentResponse
 * @property {boolean} ok
 * @property {Object} appointment
 * @property {string} appointment._id
 * @property {string} [resourceReservationId]
 */

export function assertAppointmentResponse(payload) {
  const reservation = payload?.resourceReservation || (
    payload?.resourceReservationId
      ? { _id: payload.resourceReservationId, status: payload.reservationStatus || 'booked' }
      : null
  );

  if (!payload || payload.ok !== true || !payload.appointment?._id || !reservation?._id) {
    throw new TypeError("Invalid AppointmentResponse");
  }

  return {
    ...payload,
    resourceReservation: reservation,
    resourceReservationId: reservation._id,
  };
}
