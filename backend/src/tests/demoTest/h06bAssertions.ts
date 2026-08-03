import assert from 'assert';
import {
  HermesSchedulingBridgeDecline,
  HermesSchedulingBridgeTurnResult,
} from '../../agent/hermes/scheduling/hermesSchedulingExecution.contract';

export const assertBridgeHandled = (
  result: HermesSchedulingBridgeTurnResult | HermesSchedulingBridgeDecline,
  message: string
): HermesSchedulingBridgeTurnResult => {
  assert(result.handled, message);
  return result as HermesSchedulingBridgeTurnResult;
};

export const assertBridgeDeclined = (
  result: HermesSchedulingBridgeTurnResult | HermesSchedulingBridgeDecline,
  message: string
): HermesSchedulingBridgeDecline => {
  assert(!result.handled, message);
  return result as HermesSchedulingBridgeDecline;
};
