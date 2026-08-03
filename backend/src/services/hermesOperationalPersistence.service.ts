import mongoose from 'mongoose';

export const getMongoOperationalStatus = (): 'up' | 'down' =>
  mongoose.connection.readyState === 1 ? 'up' : 'down';
