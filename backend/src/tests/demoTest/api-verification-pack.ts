import {
  classifyError,
  disconnectMongo,
  EXIT_PASS,
  printFinalStatus,
  runFull,
} from './apiVerificationSupport';

const main = async () => {
  let exitCode = EXIT_PASS;
  let caught: unknown;

  try {
    await runFull();
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
