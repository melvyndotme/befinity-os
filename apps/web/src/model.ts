export type CaptureLane = 'sell' | 'deliver' | 'build' | 'reflect'

const laneLabels: Record<CaptureLane, string> = {
  sell: 'Sell',
  deliver: 'Deliver',
  build: 'Build',
  reflect: 'Reflect',
}

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
  return `---\ndate: ${dateKey}\ntype: daily\n---\n\n# ${dateKey}\n\n## M-HAG\n\n$1m collected by July 2027. What is the smallest move today that compounds?\n\n`
}

export function appendCapture(
  current: string,
  text: string,
  lane: CaptureLane,
  capturedAt = new Date(),
): string {
  const body = text.trim()
  if (!body) return current

  const dateKey = localDateKey(capturedAt)
  const note = current.trim() || dailyNoteTemplate(dateKey).trim()
  const time = localTimeLabel(capturedAt)
  const heading = `## ${time} — ${laneLabels[lane]}`
  return `${note}\n\n${heading}\n\n${body}\n`
}

export function noteFilePath(dateKey: string): string {
  return `daily/${dateKey}.md`
}

export function countOpenTasks(markdown: string): number {
  return (markdown.match(/^\s*- \[ \] /gm) ?? []).length
}
