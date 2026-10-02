const storagePrefix = 'befinity-os.daily.'

export function loadDailyNote(dateKey: string): string | null {
  return window.localStorage.getItem(`${storagePrefix}${dateKey}`)
}

export function saveDailyNote(dateKey: string, markdown: string): void {
  window.localStorage.setItem(`${storagePrefix}${dateKey}`, markdown)
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
