import { useEffect, useRef, useState } from 'react'
import { chooseFolder, type DirectoryHandle, supportsFolderWriting, writeDailyNote } from './file-system'
import { appendCapture, countOpenTasks, dailyNoteTemplate, localDateKey, noteFilePath, type CaptureLane } from './model'
import { downloadMarkdown, loadDailyNote, saveDailyNote } from './storage'

const dateKey = localDateKey()
const initialNote = loadDailyNote(dateKey) ?? dailyNoteTemplate(dateKey)

const lanes: Array<{ id: CaptureLane; label: string; detail: string }> = [
  { id: 'sell', label: 'Sell', detail: 'A conversation, offer, or next commercial move.' },
  { id: 'deliver', label: 'Deliver', detail: 'A client promise, training insight, or useful follow-through.' },
  { id: 'build', label: 'Build', detail: 'A prototype, workflow, system, or learning edge.' },
  { id: 'reflect', label: 'Reflect', detail: 'A decision, observation, or honest check-in.' },
]

export function App() {
  const [markdown, setMarkdown] = useState(initialNote)
  const [capture, setCapture] = useState('')
  const [lane, setLane] = useState<CaptureLane>('reflect')
  const [folder, setFolder] = useState<DirectoryHandle | null>(null)
  const [status, setStatus] = useState('Saved privately in this browser')
  const captureRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    saveDailyNote(dateKey, markdown)
  }, [markdown])

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        addCapture()
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'j') {
        event.preventDefault()
        captureRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  })

  function addCapture() {
    if (!capture.trim()) return
    setMarkdown((current) => appendCapture(current, capture, lane))
    setCapture('')
    setStatus('Capture added to today’s note')
  }

  async function connectFolder() {
    try {
      const selectedFolder = await chooseFolder()
      setFolder(selectedFolder)
      setStatus('Folder connected for this browser session')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setStatus(error instanceof Error ? error.message : 'Could not connect the folder')
    }
  }

  async function saveToFolder() {
    if (!folder) return
    try {
      await writeDailyNote(folder, dateKey, markdown)
      setStatus(`Saved to ${noteFilePath(dateKey)}`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not write the note')
    }
  }

  const selectedLane = lanes.find((item) => item.id === lane)

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark" /> Befinity OS</div>
        <p className="quiet-label">Your second brain, built around the work.</p>

        <nav aria-label="Workspace">
          <a className="nav-item nav-item-active" href="#today">Today <span>⌘J</span></a>
          <a className="nav-item" href="#review">Founder review</a>
        </nav>

        <section className="mhag">
          <p className="eyebrow">M-HAG</p>
          <strong>$1m by July 2027</strong>
          <p>Every capture should help you sell, deliver, build, or decide what to stop.</p>
        </section>

        <div className="sidebar-footer">
          <span className="status-dot" /> {status}
        </div>
      </aside>

      <section className="workspace" id="today">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Daily note</p>
            <h1>{dateKey}</h1>
          </div>
          <div className="header-actions">
            <button className="button button-quiet" onClick={() => downloadMarkdown(`${dateKey}.md`, markdown)}>
              Download .md
            </button>
            {folder ? (
              <button className="button button-primary" onClick={() => void saveToFolder()}>
                Save to folder
              </button>
            ) : supportsFolderWriting() ? (
              <button className="button button-primary" onClick={() => void connectFolder()}>
                Choose Markdown folder
              </button>
            ) : null}
          </div>
        </header>

        <section className="capture-card" aria-labelledby="capture-heading">
          <div>
            <p className="eyebrow" id="capture-heading">Interstitial capture</p>
            <p className="capture-prompt">What just happened, or what needs your attention?</p>
          </div>
          <textarea
            aria-label="New capture"
            ref={captureRef}
            value={capture}
            onChange={(event) => setCapture(event.target.value)}
            placeholder="A thought, a decision, an action, a voice-memo summary…"
            rows={3}
          />
          <div className="capture-actions">
            <div className="lane-picker" aria-label="Capture lane">
              {lanes.map((item) => (
                <button
                  className={item.id === lane ? 'lane lane-selected' : 'lane'}
                  key={item.id}
                  onClick={() => setLane(item.id)}
                  title={item.detail}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button className="button button-primary" onClick={addCapture}>
              Add to today <kbd>⌘↵</kbd>
            </button>
          </div>
          <p className="hint">{selectedLane?.detail} Voice memos become local attachments and transcripts in the next slice.</p>
        </section>

        <section className="editor-card">
          <label className="editor-label" htmlFor="daily-markdown">Today’s Markdown</label>
          <textarea
            id="daily-markdown"
            className="editor"
            value={markdown}
            onChange={(event) => {
              setMarkdown(event.target.value)
              setStatus('Saved privately in this browser')
            }}
            spellCheck
          />
        </section>
      </section>

      <aside className="review-panel" id="review">
        <p className="eyebrow">Founder review</p>
        <h2>Keep the system honest.</h2>
        <div className="review-stat">
          <span>Open tasks</span>
          <strong>{countOpenTasks(markdown)}</strong>
        </div>
        <div className="review-card">
          <p className="review-title">Today’s rule</p>
          <p>Capture first. Classify later. Do not let the tool become the work.</p>
        </div>
        <div className="review-card">
          <p className="review-title">Storage</p>
          <p>Browser-local by default. A selected folder writes a portable <code>{noteFilePath(dateKey)}</code>.</p>
        </div>
        <div className="review-card muted-card">
          <p className="review-title">Next build slice</p>
          <p>Voice memo ingestion, review prompts, and a read-only work-log import—each kept as a separate, reviewable agent.</p>
        </div>
      </aside>
    </main>
  )
}
