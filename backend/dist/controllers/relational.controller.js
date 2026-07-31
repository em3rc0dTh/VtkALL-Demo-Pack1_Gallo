"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getManagedEntityCases = exports.getCaseDecisions = exports.getCaseNotifications = exports.getCaseAppointments = exports.getCaseInteractions = exports.getCaseTimeline = exports.getCustomerManagedEntities = exports.getCustomerCases = void 0;
const Case_model_1 = require("../models/Case.model");
const ManagedEntity_model_1 = require("../models/ManagedEntity.model");
const TimelineEvent_model_1 = require("../models/TimelineEvent.model");
const CustomerInteraction_model_1 = require("../models/CustomerInteraction.model");
const Appointment_model_1 = require("../models/Appointment.model");
const Notification_model_1 = require("../models/Notification.model");
const DecisionRecord_model_1 = require("../models/DecisionRecord.model");
const queryParser_1 = require("../utils/queryParser");
const response_1 = require("../utils/response");
const getRelationalData = async (req, res, model, filterKey) => {
    try {
        const { filterObj, pageNum, limitNum, sortObj } = (0, queryParser_1.parseQuery)(req.query);
        const filter = { ...filterObj, [filterKey]: req.params.id };
        const skip = (pageNum - 1) * limitNum;
        const [data, total] = await Promise.all([
            model.find(filter).sort(sortObj).skip(skip).limit(limitNum).exec(),
            model.countDocuments(filter).exec()
        ]);
        (0, response_1.sendListResponse)(res, data, { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) });
    }
    catch (error) {
        (0, response_1.sendErrorResponse)(res, 'INTERNAL_ERROR', error.message, {}, 500);
    }
};
const getCustomerCases = (req, res) => getRelationalData(req, res, Case_model_1.Case, 'customerId');
exports.getCustomerCases = getCustomerCases;
const getCustomerManagedEntities = (req, res) => getRelationalData(req, res, ManagedEntity_model_1.ManagedEntity, 'customerId');
exports.getCustomerManagedEntities = getCustomerManagedEntities;
const getCaseTimeline = (req, res) => getRelationalData(req, res, TimelineEvent_model_1.TimelineEvent, 'caseId');
exports.getCaseTimeline = getCaseTimeline;
const getCaseInteractions = (req, res) => getRelationalData(req, res, CustomerInteraction_model_1.CustomerInteraction, 'caseId');
exports.getCaseInteractions = getCaseInteractions;
const getCaseAppointments = (req, res) => getRelationalData(req, res, Appointment_model_1.Appointment, 'caseId');
exports.getCaseAppointments = getCaseAppointments;
const getCaseNotifications = (req, res) => getRelationalData(req, res, Notification_model_1.Notification, 'caseId');
exports.getCaseNotifications = getCaseNotifications;
const getCaseDecisions = (req, res) => getRelationalData(req, res, DecisionRecord_model_1.DecisionRecord, 'caseId');
exports.getCaseDecisions = getCaseDecisions;
const getManagedEntityCases = (req, res) => getRelationalData(req, res, Case_model_1.Case, 'managedEntityId');
exports.getManagedEntityCases = getManagedEntityCases;
