import { createClient } from '@/lib/supabase/client'

const BUCKET = 'screenshots'

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

export async function uploadScreenshot(
  userId: string,
  trailId: string,
  stepId: string,
  dataUri: string
): Promise<string | null> {
  try {
    const supabase = createClient()
    const path = `${userId}/${trailId}/${stepId}.png`

    // Convert data URI to Blob
    const base64 = dataUri.split(',')[1]
    if (!base64) return null
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    const blob = new Blob([bytes], { type: 'image/png' })

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { upsert: true, contentType: 'image/png' })

    if (error) return null
    return path
  } catch {
    return null
  }
}

export async function downloadScreenshot(path: string): Promise<string | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.storage.from(BUCKET).download(path)
    if (error || !data) return null

    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(data)
    })
  } catch {
    return null
  }
}

export async function deleteCloudScreenshot(path: string): Promise<void> {
  try {
    const supabase = createClient()
    await supabase.storage.from(BUCKET).remove([path])
  } catch {
    // best-effort
  }
}

export async function deleteCloudScreenshots(paths: string[]): Promise<void> {
  if (paths.length === 0) return
  try {
    const supabase = createClient()
    await supabase.storage.from(BUCKET).remove(paths)
  } catch {
    // best-effort
  }
}
