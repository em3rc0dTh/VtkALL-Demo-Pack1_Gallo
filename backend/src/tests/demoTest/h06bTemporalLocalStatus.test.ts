import { summarizeChecks, createTemporalClient, describeNamespace } from './h06bTemporalUtils';

const run = async () => {
  const checks = [];

  try {
    const { address, connection } = await createTemporalClient();
    checks.push({ name: 'temporal address validation', passed: true, detail: address });
    checks.push({ name: 'temporal tcp readiness', passed: true });
    checks.push({ name: 'temporal sdk connection', passed: true });

    const namespace = await describeNamespace(connection);
    checks.push({
      name: 'temporal namespace readiness',
      passed: String(namespace?.namespaceInfo?.name || '') === 'default',
      code: String(namespace?.namespaceInfo?.name || '') === 'default' ? undefined : 'TEMPORAL_NAMESPACE_UNAVAILABLE',
      detail: String(namespace?.namespaceInfo?.name || ''),
    });

    await connection.close();
  } catch (error: any) {
    const message = String(error?.message || error);
    const code = /^Invalid TEMPORAL_ADDRESS/.test(message)
      ? 'TEMPORAL_ADDRESS_HAS_SCHEME'
      : /ECONNREFUSED|ENOTFOUND|No connection established|TCP timeout/i.test(message)
        ? 'TEMPORAL_HOST_UNREACHABLE'
        : 'TEMPORAL_CONNECTION_FAILED';
    checks.push({
      name: 'temporal local status',
      passed: false,
      code,
      detail: message,
    });
  }

  const summary = summarizeChecks(checks);
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.ok) process.exit(1);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
