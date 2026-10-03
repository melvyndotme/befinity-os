import type { DirectoryHandle } from './file-system'

const databaseName = 'tact-notes'
const storeName = 'vault-folders'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(databaseName, 1)
    request.onerror = () => reject(request.error)
    request.onupgradeneeded = () => request.result.createObjectStore(storeName)
    request.onsuccess = () => resolve(request.result)
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase()
  return await new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode)
    const request = operation(transaction.objectStore(storeName))
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    transaction.oncomplete = () => database.close()
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function loadVaultFolder(userId: string): Promise<DirectoryHandle | undefined> {
  const folder = await withStore<DirectoryHandle | undefined>(
    'readonly',
    (store) => store.get(userId) as IDBRequest<DirectoryHandle | undefined>,
  )
  return folder
}

export async function saveVaultFolder(userId: string, folder: DirectoryHandle): Promise<unknown> {
  return await withStore('readwrite', (store) => store.put(folder, userId))
}
