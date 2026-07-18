const { initializeApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator, doc, setDoc, getDoc } = require('firebase/firestore');
const test = require('node:test');
const assert = require('node:assert');

test('Firestore rules allow read/write when emulator is running', async () => {
  const host = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
  const [hostname, portStr] = host.split(':');
  const port = parseInt(portStr || '8080', 10);

  const app = initializeApp({
    projectId: 'trustlence',
    apiKey: 'fake-api-key',
  });
  
  const db = getFirestore(app);
  connectFirestoreEmulator(db, hostname, port);
  
  const testDoc = doc(db, 'users/test-user');
  await setDoc(testDoc, { name: 'TrustLance User' });
  
  const snap = await getDoc(testDoc);
  assert.strictEqual(snap.exists(), true);
  assert.strictEqual(snap.data().name, 'TrustLance User');
});
