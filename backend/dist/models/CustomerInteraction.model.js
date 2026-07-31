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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerInteraction = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const CustomerInteractionSchema = new mongoose_1.Schema({
    _id: { type: String, required: true },
    businessSlug: { type: String, required: true, index: true },
    caseId: { type: String, required: true },
    conversationId: { type: String, index: true },
    customerId: { type: String, index: true },
    managedEntityId: { type: String },
    channel: { type: String },
    direction: { type: String },
    visibility: { type: String, default: 'customer', index: true },
    interactionType: { type: String },
    messageId: { type: String },
    body: { type: String },
    message: { type: String },
    content: {
        text: { type: String },
        attachmentIds: { type: [String], default: [] },
    },
    participant: {
        type: { type: String },
        agentName: { type: String },
        runtime: { type: String },
    },
    execution: {
        correlationId: { type: String },
        causationId: { type: String },
        workflowId: { type: String },
        channel: { type: String },
    },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
}, {
    timestamps: true,
    strict: false,
    _id: false,
});
CustomerInteractionSchema.index({ businessSlug: 1, caseId: 1 });
CustomerInteractionSchema.index({ businessSlug: 1, conversationId: 1, createdAt: 1 });
CustomerInteractionSchema.index({ businessSlug: 1, caseId: 1, createdAt: -1 });
CustomerInteractionSchema.index({ businessSlug: 1, customerId: 1, createdAt: -1 });
CustomerInteractionSchema.index({ businessSlug: 1, visibility: 1, createdAt: -1 });
CustomerInteractionSchema.index({ businessSlug: 1, conversationId: 1, messageId: 1, direction: 1, 'participant.runtime': 1 }, { sparse: true });
exports.CustomerInteraction = mongoose_1.default.model('CustomerInteraction', CustomerInteractionSchema);
