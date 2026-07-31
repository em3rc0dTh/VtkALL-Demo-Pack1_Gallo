"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const businessProfiles_routes_1 = __importDefault(require("./businessProfiles.routes"));
const catalogOfferings_routes_1 = __importDefault(require("./catalogOfferings.routes"));
const customers_routes_1 = __importDefault(require("./customers.routes"));
const managedEntities_routes_1 = __importDefault(require("./managedEntities.routes"));
const cases_routes_1 = __importDefault(require("./cases.routes"));
const customerInteractions_routes_1 = __importDefault(require("./customerInteractions.routes"));
const appointments_routes_1 = __importDefault(require("./appointments.routes"));
const decisionRecords_routes_1 = __importDefault(require("./decisionRecords.routes"));
const notifications_routes_1 = __importDefault(require("./notifications.routes"));
const timelineEvents_routes_1 = __importDefault(require("./timelineEvents.routes"));
const attachments_routes_1 = __importDefault(require("./attachments.routes"));
const availabilitySlots_routes_1 = __importDefault(require("./availabilitySlots.routes"));
const workflowData_routes_1 = __importDefault(require("./workflowData.routes"));
const agentSim_routes_1 = __importDefault(require("./agentSim.routes"));
const workTeams_routes_1 = __importDefault(require("./workTeams.routes"));
const workTeamScheduleRules_routes_1 = __importDefault(require("./workTeamScheduleRules.routes"));
const workTeamScheduleOverrides_routes_1 = __importDefault(require("./workTeamScheduleOverrides.routes"));
const resourceReservations_routes_1 = __importDefault(require("./resourceReservations.routes"));
const admin_routes_1 = __importDefault(require("./admin.routes"));
const relationalController = __importStar(require("../controllers/relational.controller"));
const router = (0, express_1.Router)();
router.use('/admin', admin_routes_1.default);
router.use('/workflow-data', workflowData_routes_1.default);
router.use('/agent-sim', agentSim_routes_1.default);
// Relational endpoints
router.get('/customers/:id/cases', relationalController.getCustomerCases);
router.get('/customers/:id/managed-entities', relationalController.getCustomerManagedEntities);
router.get('/cases/:id/timeline', relationalController.getCaseTimeline);
router.get('/cases/:id/interactions', relationalController.getCaseInteractions);
router.get('/cases/:id/appointments', relationalController.getCaseAppointments);
router.get('/cases/:id/notifications', relationalController.getCaseNotifications);
router.get('/cases/:id/decisions', relationalController.getCaseDecisions);
router.get('/managed-entities/:id/cases', relationalController.getManagedEntityCases);
router.use('/business-profiles', businessProfiles_routes_1.default);
router.use('/catalog-offerings', catalogOfferings_routes_1.default);
router.use('/customers', customers_routes_1.default);
router.use('/managed-entities', managedEntities_routes_1.default);
router.use('/cases', cases_routes_1.default);
router.use('/customer-interactions', customerInteractions_routes_1.default);
router.use('/appointments', appointments_routes_1.default);
router.use('/decision-records', decisionRecords_routes_1.default);
router.use('/notifications', notifications_routes_1.default);
router.use('/timeline-events', timelineEvents_routes_1.default);
router.use('/attachments', attachments_routes_1.default);
router.use('/availability-slots', availabilitySlots_routes_1.default);
router.use('/work-teams', workTeams_routes_1.default);
router.use('/work-team-schedule-rules', workTeamScheduleRules_routes_1.default);
router.use('/work-team-schedule-overrides', workTeamScheduleOverrides_routes_1.default);
router.use('/resource-reservations', resourceReservations_routes_1.default);
exports.default = router;
