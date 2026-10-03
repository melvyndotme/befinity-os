export function localDateKey(date = new Date()): string {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

export function localTimeLabel(date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export function dailyNoteTemplate(dateKey: string): string {
  return `---\ndate: ${dateKey}\ntype: daily\n---\n\n# ${dateKey}\n\n## M-HAG: $1m collected by July 2027. What is the smallest move today that compounds?\n\n`
}

export function appendCapture(current: string, text: string, capturedAt = new Date()): string {
  const body = text.trim().replaceAll(/\s*\n\s*/g, ' ')
  if (!body) return current

  const dateKey = localDateKey(capturedAt)
  const note = current.trim() || dailyNoteTemplate(dateKey).trim()
  const time = localTimeLabel(capturedAt)
  return `${note}\n- ${time}: ${body}\n`
}

export function noteFilePath(dateKey: string): string {
  return `daily/${dateKey}.md`
}

export function countOpenTasks(markdown: string): number {
  return (markdown.match(/^\s*- \[ \] /gm) ?? []).length
}
