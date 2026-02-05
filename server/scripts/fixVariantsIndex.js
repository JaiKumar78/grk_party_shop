// Migration script to fix the variants.sku unique index issue
// Run this once: node server/scripts/fixVariantsIndex.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URL || 'mongodb://localhost:27017/grkpartyshop';

console.log('Starting migration script...');
console.log('MongoDB URI:', MONGODB_URI ? 'Set' : 'Not set (using default)');

async function fixVariantsIndex() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('products');

        // List all indexes
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes.map(idx => idx.name));

        // Try to drop the old variants.sku index if it exists
        try {
            await collection.dropIndex('variants.sku_1');
            console.log('✅ Dropped old variants.sku_1 index');
        } catch (error) {
            if (error.code === 27 || error.message.includes('index not found')) {
                console.log('ℹ️  Old variants.sku_1 index does not exist (this is okay)');
            } else {
                throw error;
            }
        }

        // The new sparse index will be created automatically by Mongoose on next model load
        console.log('✅ Migration complete! The new sparse index will be created automatically.');
        console.log('⚠️  Restart your server to ensure the new index is created.');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing index:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

fixVariantsIndex();
