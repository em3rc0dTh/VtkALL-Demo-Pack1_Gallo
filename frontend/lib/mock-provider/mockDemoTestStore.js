const initialState = {
  customers: [],
  managedEntities: [],
  cases: [],
  resourceReservations: [],
  appointments: [],
  timelineEvents: [],
};

let state = {
  customers: [],
  managedEntities: [],
  cases: [],
  resourceReservations: [],
  appointments: [],
  timelineEvents: [],
};

export function getMockState() {
  return state;
}

export function resetMockStore() {
  state = {
    customers: [],
    managedEntities: [],
    cases: [],
    resourceReservations: [],
    appointments: [],
    timelineEvents: [],
  };
}
