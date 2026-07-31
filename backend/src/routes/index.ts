import { Router } from 'express';
import businessProfilesRoutes from './businessProfiles.routes';
import catalogOfferingsRoutes from './catalogOfferings.routes';
import customersRoutes from './customers.routes';
import managedEntitiesRoutes from './managedEntities.routes';
import casesRoutes from './cases.routes';
import customerInteractionsRoutes from './customerInteractions.routes';
import appointmentsRoutes from './appointments.routes';
import decisionRecordsRoutes from './decisionRecords.routes';
import notificationsRoutes from './notifications.routes';
import timelineEventsRoutes from './timelineEvents.routes';
import attachmentsRoutes from './attachments.routes';
import availabilitySlotsRoutes from './availabilitySlots.routes';
import workflowDataRoutes from './workflowData.routes';
import agentSimRoutes from './agentSim.routes';
import workTeamsRoutes from './workTeams.routes';
import workTeamScheduleRulesRoutes from './workTeamScheduleRules.routes';
import workTeamScheduleOverridesRoutes from './workTeamScheduleOverrides.routes';
import resourceReservationsRoutes from './resourceReservations.routes';
import landingRoutes from './landing.routes';

import adminRoutes from './admin.routes';
import * as relationalController from '../controllers/relational.controller';

const router = Router();

router.use('/admin', adminRoutes);
router.use('/workflow-data', workflowDataRoutes);
router.use('/agent-sim', agentSimRoutes);
router.use('/', landingRoutes);

// Relational endpoints
router.get('/customers/:id/cases', relationalController.getCustomerCases);
router.get('/customers/:id/managed-entities', relationalController.getCustomerManagedEntities);
router.get('/cases/:id/timeline', relationalController.getCaseTimeline);
router.get('/cases/:id/interactions', relationalController.getCaseInteractions);
router.get('/cases/:id/appointments', relationalController.getCaseAppointments);
router.get('/cases/:id/notifications', relationalController.getCaseNotifications);
router.get('/cases/:id/decisions', relationalController.getCaseDecisions);
router.get('/managed-entities/:id/cases', relationalController.getManagedEntityCases);

router.use('/business-profiles', businessProfilesRoutes);
router.use('/catalog-offerings', catalogOfferingsRoutes);
router.use('/customers', customersRoutes);
router.use('/managed-entities', managedEntitiesRoutes);
router.use('/cases', casesRoutes);
router.use('/customer-interactions', customerInteractionsRoutes);
router.use('/appointments', appointmentsRoutes);
router.use('/decision-records', decisionRecordsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/timeline-events', timelineEventsRoutes);
router.use('/attachments', attachmentsRoutes);
router.use('/availability-slots', availabilitySlotsRoutes);
router.use('/work-teams', workTeamsRoutes);
router.use('/work-team-schedule-rules', workTeamScheduleRulesRoutes);
router.use('/work-team-schedule-overrides', workTeamScheduleOverridesRoutes);
router.use('/resource-reservations', resourceReservationsRoutes);

export default router;
