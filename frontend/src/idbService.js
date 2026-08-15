import { openDB } from 'idb';

const DB_NAME = 'NovelFlowOfflineDB';
const DB_VERSION = 1;

export async function initDB() {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('telemetryQueue')) {
                db.createObjectStore('telemetryQueue', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('tagSyncQueue')) {
                db.createObjectStore('tagSyncQueue', { keyPath: 'id', autoIncrement: true });
            }
        },
    });
}

export async function enqueueOfflineAction(storeName, data) {
    const db = await initDB();
    await db.add(storeName, data);
}

export async function flushQueue(storeName) {
    const db = await initDB();
    const allRecords = await db.getAll(storeName);
    const tx = db.transaction(storeName, 'readwrite');
    await tx.objectStore(storeName).clear();
    await tx.done;
    return allRecords;
}

export async function getQueueSize(storeName) {
    const db = await initDB();
    return db.count(storeName);
}
