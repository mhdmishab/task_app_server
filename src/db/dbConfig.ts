
import admin, { ServiceAccount } from 'firebase-admin';
import serviceAccountKey from './firebaseServiceAccountKey/serviceAccountKey.json'; 
import dotenv from 'dotenv';
dotenv.config()

const firebaseConfig = {
    credential: admin.credential.cert(serviceAccountKey as ServiceAccount),
    databaseURL: process.env.database_url
};

admin.initializeApp(firebaseConfig);

const db = admin.firestore();
export { db };







