import { Connection, Client } from '@temporalio/client';
import { getTemporalConnectionOptions } from './connectionOptions';

export const getTemporalClient = async () => {
  const connection = await Connection.connect(getTemporalConnectionOptions());
  return new Client({ connection });
};
