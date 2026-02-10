import type { ElementRect } from '@/lib/types/trail'

const DB_NAME = 'trailguide'
const STORE_NAME = 'screenshots'
const DB_VERSION = 1

export interface ScreenshotData {
  screenshot: string
  elementRect?: ElementRect
  viewportSize?: { width: number; height: number }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveScreenshots(
  steps: Array<{ id: string; screenshot?: string; elementRect?: ElementRect; viewportSize?: { width: number; height: number } }>
): Promise<void> {
  const stepsWithScreenshots = steps.filter((s) => s.screenshot)
  if (stepsWithScreenshots.length === 0) return

  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)

  for (const step of stepsWithScreenshots) {
    store.put(
      {
        screenshot: step.screenshot,
        elementRect: step.elementRect,
        viewportSize: step.viewportSize,
      },
      step.id
    )
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

export async function loadScreenshots(
  stepIds: string[]
): Promise<Map<string, ScreenshotData>> {
  if (stepIds.length === 0) return new Map()

  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  const results = new Map<string, ScreenshotData>()

  const promises = stepIds.map(
    (id) =>
      new Promise<void>((resolve) => {
        const request = store.get(id)
        request.onsuccess = () => {
          if (request.result) results.set(id, request.result)
          resolve()
        }
        request.onerror = () => resolve()
      })
  )

  await Promise.all(promises)
  db.close()
  return results
}

export async function deleteScreenshots(stepIds: string[]): Promise<void> {
  if (stepIds.length === 0) return

  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)

  for (const id of stepIds) {
    store.delete(id)
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}
