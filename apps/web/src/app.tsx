import { useEffect, useRef, useState } from 'react'
import { chooseFolder, type DirectoryHandle, supportsFolderWriting, writeDailyNote } from './file-system'
import { appendCapture, countOpenTasks, dailyNoteTemplate, localDateKey, noteFilePath } from './model'
import { downloadMarkdown, loadDailyNote, saveDailyNote } from './storage'

const dateKey = localDateKey()
const initialNote = loadDailyNote(dateKey) ?? dailyNoteTemplate(dateKey)

export function App() {
  const [markdown, setMarkdown] = useState(initialNote)
  const [capture, setCapture] = useState('')
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
    setMarkdown((current) => appendCapture(current, capture))
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
          <p>Capture the work first. Your daily review will make sense of it later.</p>
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
                Save to private vault
              </button>
            ) : supportsFolderWriting() ? (
              <button className="button button-primary" onClick={() => void connectFolder()}>
                Choose private vault
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
            <button className="button button-primary" onClick={addCapture}>
              Add to today <kbd>⌘↵</kbd>
            </button>
          </div>
          <p className="hint">No category required. Voice memos, daily review, and suggested links come after capture.</p>
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
          <p>Browser-local by default. Choose a cloned private vault to write <code>{noteFilePath(dateKey)}</code>.</p>
        </div>
        <div className="review-card muted-card">
          <p className="review-title">Daily review agent</p>
          <p>It will propose categories, links, tasks, and a short learning summary. You decide what becomes permanent.</p>
        </div>
      </aside>
    </main>
  )
}
