import {
  classifyError,
  disconnectMongo,
  EXIT_CONTRACT_FAILURE,
  EXIT_PASS,
  printFinalStatus,
  printUsage,
  runScenario,
  ScenarioName,
  scenarioNames,
} from '../tests/demoTest/apiVerificationSupport';

const main = async () => {
  const scenario = (process.argv[2] || 'full') as ScenarioName;
  const caseId = process.argv[3];

  if (!scenarioNames.includes(scenario)) {
    printUsage();
    process.exitCode = EXIT_CONTRACT_FAILURE;
    return;
  }

  let exitCode = EXIT_PASS;
  let caught: unknown;

  try {
    await runScenario(scenario, caseId);
  } catch (error) {
    caught = error;
    exitCode = classifyError(error);
  } finally {
    await disconnectMongo();
  }

  printFinalStatus(exitCode, caught);
  process.exitCode = exitCode;
};

void main();
