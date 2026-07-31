import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const validateTemporalAddress = (address = process.env.TEMPORAL_ADDRESS || 'localhost:7233') => {
  if (/^https?:\/\//i.test(address)) {
    throw new Error('Invalid TEMPORAL_ADDRESS. Use host:port format, for example localhost:7233.');
  }
  return address;
};

export const env = {
  port: process.env.API_PORT || process.env.PORT || 4000,
  mongoUri: process.env.MONGO_URI || 'mongodb://vtkall:vtkall_password@localhost:27017/vtkall_demo_pack_1?authSource=admin',
  nodeEnv: process.env.NODE_ENV || 'development',
  temporalAddress: validateTemporalAddress,
};
