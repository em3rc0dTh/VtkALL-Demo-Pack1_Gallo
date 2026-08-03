import { GuardrailRule } from '../ruleTypes';
import { gr01TemporalWorkflowPurity } from './gr01-temporal-workflow-purity';
import { gr02TemporalActivityBoundary } from './gr02-temporal-activity-boundary';
import { gr03DomainServiceAuthority } from './gr03-domain-service-authority';
import { gr04ModelAccess } from './gr04-model-access';
import { gr05SchedulingInvariant } from './gr05-scheduling-invariant';
import { gr06DoubleBookingProtection } from './gr06-double-booking-protection';
import { gr07AvailabilityAuthority } from './gr07-availability-authority';
import { gr08SemanticErrors } from './gr08-semantic-errors';
import { gr09CaseCentered } from './gr09-case-centered';
import { gr10TimelineOwnership } from './gr10-timeline-ownership';
import { gr11OdooIsolation } from './gr11-odoo-isolation';
import { gr12GoDigitalIsolation } from './gr12-godigital-isolation';
import { gr13FrontendLeakage } from './gr13-frontend-leakage';
import { gr14ConfigHygiene } from './gr14-config-hygiene';
import { gr15SeedSeparation } from './gr15-seed-separation';
import { gr16DocsPresence } from './gr16-docs-presence';
import { gr17PersistentIdempotency } from './gr17-persistent-idempotency';
import { gr18AgentMcpTemporalBoundary } from './gr18-agent-mcp-temporal-boundary';
import { gr19AgentProcessContinuity } from './gr19-agent-process-continuity';
import { gr20ConversationIdentityStability } from './gr20-conversation-identity-stability';
import { gr21HermesFrontendIsolation } from './gr21-hermes-frontend-isolation';
import { gr22HermesNoMongoose } from './gr22-hermes-no-mongoose';
import { gr23HermesNoTemporal } from './gr23-hermes-no-temporal';
import { gr24HermesShadowNoWrites } from './gr24-hermes-shadow-no-writes';
import { gr25HermesShadowPrivate } from './gr25-hermes-shadow-private';
import { gr26HermesKeyNoDefault } from './gr26-hermes-key-no-default';
import { gr27HermesFailureFailOpen } from './gr27-hermes-failure-fail-open';
import { gr28HermesRoleSeparated } from './gr28-hermes-role-separated';
import { gr29HermesNoConfirmation } from './gr29-hermes-no-confirmation';
import { gr30HermesAccessFlags } from './gr30-hermes-access-flags';
import { gr31InteractionCentralService } from './gr31-interaction-central-service';
import { gr32VisibleHistoryExcludesShadow } from './gr32-visible-history-excludes-shadow';
import { gr33ConversationBusinessScope } from './gr33-conversation-business-scope';
import { gr34ContextReadersReadonly } from './gr34-context-readers-readonly';
import { gr35ContextNoRawDocs } from './gr35-context-no-raw-docs';
import { gr36ContextRedaction } from './gr36-context-redaction';
import { gr37ProcessReadonly } from './gr37-process-readonly';
import { gr38ShadowNotVisible } from './gr38-shadow-not-visible';
import { gr39NoFileConversationPersistence } from './gr39-no-file-conversation-persistence';
import { gr40CaseSelectionPriority } from './gr40-case-selection-priority';
import { gr41H05PositiveEligibility } from './gr41-h05-positive-eligibility';
import { gr42H05AmbiguousLegacy } from './gr42-h05-ambiguous-legacy';
import { gr43H05ActiveProcessLegacy } from './gr43-h05-active-process-legacy';
import { gr44H05AvailabilityLegacy } from './gr44-h05-availability-legacy';
import { gr45H05TransactionalLegacy } from './gr45-h05-transactional-legacy';
import { gr46H05ResponseValidation } from './gr46-h05-response-validation';
import { gr47H05RejectedHidden } from './gr47-h05-rejected-hidden';
import { gr48H05OneVisibleOutbound } from './gr48-h05-one-visible-outbound';
import { gr49H05NoLegacySideEffects } from './gr49-h05-no-legacy-side-effects';
import { gr50H05PublicDtoPrivate } from './gr50-h05-public-dto-private';
import { gr51H05FlagsDefaultDisabled } from './gr51-h05-flags-default-disabled';
import { gr52H05FrontendNoRuntime } from './gr52-h05-frontend-no-runtime';
import { gr53H05PersonalDataLegacy } from './gr53-h05-personal-data-legacy';
import { gr54H05AttachmentsLegacy } from './gr54-h05-attachments-legacy';
import { gr55H05NoTemporalWriteServices } from './gr55-h05-no-temporal-write-services';
import { gr56H06ADryRunOnly } from './gr56-h06a-dry-run-only';
import { gr57H06ANoTemporalSdk } from './gr57-h06a-no-temporal-sdk';
import { gr58H06ANoMongooseModels } from './gr58-h06a-no-mongoose-models';
import { gr59H06ASemanticAllowlist } from './gr59-h06a-semantic-allowlist';
import { gr60H06ANoRawWorkflowPrimitives } from './gr60-h06a-no-raw-workflow-primitives';
import { gr61H06ANoDomainWrites } from './gr61-h06a-no-domain-writes';
import { gr62H06ANoRealAvailability } from './gr62-h06a-no-real-availability';
import { gr63H06ASlotAuthority } from './gr63-h06a-slot-authority';
import { gr64H06ASeparateIntentProposal } from './gr64-h06a-separate-intent-proposal';
import { gr65H06AResultFalseFlags } from './gr65-h06a-result-false-flags';
import { gr66H06AFlagsDefaultDisabled } from './gr66-h06a-flags-default-disabled';
import { gr67H06ANoPublicDto } from './gr67-h06a-no-public-dto';
import { gr68H06ARedactedPersistence } from './gr68-h06a-redacted-persistence';
import { gr69H06ALegacyAuthoritative } from './gr69-h06a-legacy-authoritative';
import { gr70H06AFixtureResidueZero } from './gr70-h06a-fixture-residue-zero';
import { gr71H06BGatewayOnly } from './gr71-h06b-gateway-only';
import { gr72H06BNoAuthoritativeWorkflowId } from './gr72-h06b-no-authoritative-workflowid';
import { gr73H06BPreAvailabilityOnly } from './gr73-h06b-pre-availability-only';
import { gr74H06BDateOutsideScope } from './gr74-h06b-date-outside-scope';
import { gr75H06BNoAvailabilityCall } from './gr75-h06b-no-availability-call';
import { gr76H06BNoReservationCreate } from './gr76-h06b-no-reservation-create';
import { gr77H06BNoAppointmentCreate } from './gr77-h06b-no-appointment-create';
import { gr78H06BBackendIdempotency } from './gr78-h06b-backend-idempotency';
import { gr79H06BReuseActiveWorkflow } from './gr79-h06b-reuse-active-workflow';
import { gr80H06BNoDuplicateStart } from './gr80-h06b-no-duplicate-start';
import { gr81H06BFallbackSplit } from './gr81-h06b-fallback-split';
import { gr82H06BNoPostCommitLegacy } from './gr82-h06b-no-post-commit-legacy';
import { gr83H06BReconciliation } from './gr83-h06b-reconciliation';
import { gr84H06BNaturalizeAfterContext } from './gr84-h06b-naturalize-after-context';
import { gr85H06BDeterministicFallback } from './gr85-h06b-deterministic-fallback';
import { gr86H06BOneVisibleOutbound } from './gr86-h06b-one-visible-outbound';
import { gr87H06BNoPiiMetadata } from './gr87-h06b-no-pii-metadata';
import { gr88H06BFlagsDisabled } from './gr88-h06b-flags-disabled';
import { gr89H06BFrontendNoSelector } from './gr89-h06b-frontend-no-selector';
import { gr90H06BCleanup } from './gr90-h06b-cleanup';
import { gr91H06GCanonicalOrchestrator } from './gr91-h06g-canonical-orchestrator';
import { gr92H06GControllerThin } from './gr92-h06g-controller-thin';
import { gr93H06GOneVisibleOutbound } from './gr93-h06g-one-visible-outbound';
import { gr94H06GMultiFactProtection } from './gr94-h06g-multi-fact-protection';
import { gr95H06GNoPostCommitLegacy } from './gr95-h06g-no-post-commit-legacy';
import { gr96H06GNoNewBusinessCapabilities } from './gr96-h06g-no-new-business-capabilities';
import { gr97H07TriageOrchestrator } from './gr97-h07-triage-orchestrator';
import { gr98H07TriageContract } from './gr98-h07-triage-contract';
import { gr99H07AgentRegistry } from './gr99-h07-agent-registry';
import { gr100H07SkillReuse } from './gr100-h07-skill-reuse';
import { gr101H07MinimalSuite } from './gr101-h07-minimal-suite';

export const guardrailRules: GuardrailRule[] = [
  gr01TemporalWorkflowPurity,
  gr02TemporalActivityBoundary,
  gr03DomainServiceAuthority,
  gr04ModelAccess,
  gr05SchedulingInvariant,
  gr06DoubleBookingProtection,
  gr07AvailabilityAuthority,
  gr08SemanticErrors,
  gr09CaseCentered,
  gr10TimelineOwnership,
  gr11OdooIsolation,
  gr12GoDigitalIsolation,
  gr13FrontendLeakage,
  gr14ConfigHygiene,
  gr15SeedSeparation,
  gr16DocsPresence,
  gr17PersistentIdempotency,
  gr18AgentMcpTemporalBoundary,
  gr19AgentProcessContinuity,
  gr20ConversationIdentityStability,
  gr21HermesFrontendIsolation,
  gr22HermesNoMongoose,
  gr23HermesNoTemporal,
  gr24HermesShadowNoWrites,
  gr25HermesShadowPrivate,
  gr26HermesKeyNoDefault,
  gr27HermesFailureFailOpen,
  gr28HermesRoleSeparated,
  gr29HermesNoConfirmation,
  gr30HermesAccessFlags,
  gr31InteractionCentralService,
  gr32VisibleHistoryExcludesShadow,
  gr33ConversationBusinessScope,
  gr34ContextReadersReadonly,
  gr35ContextNoRawDocs,
  gr36ContextRedaction,
  gr37ProcessReadonly,
  gr38ShadowNotVisible,
  gr39NoFileConversationPersistence,
  gr40CaseSelectionPriority,
  gr41H05PositiveEligibility,
  gr42H05AmbiguousLegacy,
  gr43H05ActiveProcessLegacy,
  gr44H05AvailabilityLegacy,
  gr45H05TransactionalLegacy,
  gr46H05ResponseValidation,
  gr47H05RejectedHidden,
  gr48H05OneVisibleOutbound,
  gr49H05NoLegacySideEffects,
  gr50H05PublicDtoPrivate,
  gr51H05FlagsDefaultDisabled,
  gr52H05FrontendNoRuntime,
  gr53H05PersonalDataLegacy,
  gr54H05AttachmentsLegacy,
  gr55H05NoTemporalWriteServices,
  gr56H06ADryRunOnly,
  gr57H06ANoTemporalSdk,
  gr58H06ANoMongooseModels,
  gr59H06ASemanticAllowlist,
  gr60H06ANoRawWorkflowPrimitives,
  gr61H06ANoDomainWrites,
  gr62H06ANoRealAvailability,
  gr63H06ASlotAuthority,
  gr64H06ASeparateIntentProposal,
  gr65H06AResultFalseFlags,
  gr66H06AFlagsDefaultDisabled,
  gr67H06ANoPublicDto,
  gr68H06ARedactedPersistence,
  gr69H06ALegacyAuthoritative,
  gr70H06AFixtureResidueZero,
  gr71H06BGatewayOnly,
  gr72H06BNoAuthoritativeWorkflowId,
  gr73H06BPreAvailabilityOnly,
  gr74H06BDateOutsideScope,
  gr75H06BNoAvailabilityCall,
  gr76H06BNoReservationCreate,
  gr77H06BNoAppointmentCreate,
  gr78H06BBackendIdempotency,
  gr79H06BReuseActiveWorkflow,
  gr80H06BNoDuplicateStart,
  gr81H06BFallbackSplit,
  gr82H06BNoPostCommitLegacy,
  gr83H06BReconciliation,
  gr84H06BNaturalizeAfterContext,
  gr85H06BDeterministicFallback,
  gr86H06BOneVisibleOutbound,
  gr87H06BNoPiiMetadata,
  gr88H06BFlagsDisabled,
  gr89H06BFrontendNoSelector,
  gr90H06BCleanup,
  gr91H06GCanonicalOrchestrator,
  gr92H06GControllerThin,
  gr93H06GOneVisibleOutbound,
  gr94H06GMultiFactProtection,
  gr95H06GNoPostCommitLegacy,
  gr96H06GNoNewBusinessCapabilities,
  gr97H07TriageOrchestrator,
  gr98H07TriageContract,
  gr99H07AgentRegistry,
  gr100H07SkillReuse,
  gr101H07MinimalSuite,
];
