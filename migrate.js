import 'dotenv/config';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import fs from 'fs';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const commentsPath = './comments.json';

async function migrate() {
  try {
    const data = fs.readFileSync(commentsPath, 'utf8');
    const comments = JSON.parse(data);
    console.log(`Leídos ${comments.length} comentarios de ${commentsPath}`);

    const commentsCol = collection(db, 'comments');

    for (const comment of comments) {
      // Parsear la fecha "12/2/2026 10:59" -> DD/MM/YYYY HH:mm
      const [ datePart, timePart ] = comment.date.split(' ');
      const [ day, month, year ] = datePart.split('/').map(Number);
      const [ hour, minute ] = timePart.split(':').map(Number);

      const dateObj = new Date(year, month - 1, day, hour, minute);

      const newDoc = {
        name: comment.name,
        text: comment.text,
        date: comment.date,
        edited: !!comment.edited,
        ownerSessionId: 'migration', // Marcamos de dónde vienen
        createdAt: Timestamp.fromDate(dateObj)
      };

      await addDoc(commentsCol, newDoc);
      console.log(`Migrado comentario de: ${comment.name}`);
    }

    console.log('✅ Migración completada con éxito');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

migrate();
