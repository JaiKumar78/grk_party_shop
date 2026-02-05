import mongoose from "mongoose";
import dotenv from 'dotenv'
import Store from '../models/storeModel.js'

dotenv.config()

const connectionString = process.env.MONGO_URL;

const connectDB = async () => {
  if (!connectionString) {
    console.log("MONGO_URL is not defined in environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(connectionString);
    console.log("Database connected");

    // Ensure no residual unique indexes on fields we no longer enforce uniqueness for
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections({ name: 'stores' }).toArray();
      
      // Only check indexes if the collection exists
      if (collections.length > 0) {
        const storeCollection = mongoose.connection.collection('stores');
        const indexes = await storeCollection.indexes();
        const indexNamesToDrop = indexes
          .filter(idx => idx.unique && (idx.key?.name || idx.key?.email))
          .map(idx => idx.name)
          .filter(Boolean);

        for (const indexName of indexNamesToDrop) {
          try {
            await storeCollection.dropIndex(indexName);
            console.log(`Dropped unique index on stores: ${indexName}`);
          } catch (dropErr) {
            if (!/index not found/i.test(String(dropErr))) {
              console.log(`Could not drop index ${indexName}:`, dropErr);
            }
          }
        }
      }
    } catch (idxErr) {
      // Silently ignore if collection doesn't exist - it will be created when first store is added
      if (idxErr.code !== 26 && idxErr.codeName !== 'NamespaceNotFound') {
        console.log('Index inspection error (non-fatal):', idxErr);
      }
    }
  } catch (err) {
    console.log("MongoDB connection error:", err);
    process.exit(1);
  }
};

export default connectDB;