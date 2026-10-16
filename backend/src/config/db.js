import mongoose from 'mongoose';

// Conecta a MongoDB. Se llama una sola vez desde server.js.
export async function connectDB(uri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  return mongoose.connection;
}
