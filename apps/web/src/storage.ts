const storagePrefix = 'tact-notes.daily.'
const legacyStoragePrefix = 'befinity-os.daily.'
const captureDraftPrefix = 'tact-notes.capture-draft.'

export function loadDailyNote(dateKey: string): string | null {
  return (
    window.localStorage.getItem(`${storagePrefix}${dateKey}`) ??
    window.localStorage.getItem(`${legacyStoragePrefix}${dateKey}`)
  )
}

export function saveDailyNote(dateKey: string, markdown: string): void {
  window.localStorage.setItem(`${storagePrefix}${dateKey}`, markdown)
}

export function loadCaptureDraft(dateKey: string): string {
  return window.localStorage.getItem(`${captureDraftPrefix}${dateKey}`) ?? ''
}

export function saveCaptureDraft(dateKey: string, draft: string): void {
  window.localStorage.setItem(`${captureDraftPrefix}${dateKey}`, draft)
}

export function clearCaptureDraft(dateKey: string): void {
  window.localStorage.removeItem(`${captureDraftPrefix}${dateKey}`)
}

export function downloadMarkdown(filename: string, markdown: string): void {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
