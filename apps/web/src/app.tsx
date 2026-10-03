import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthScreen } from './auth-screen'
import {
  chooseFolder,
  type DirectoryHandle,
  supportsFolderWriting,
  writeDailyNote,
} from './file-system'
import {
  appendCapture,
  countOpenTasks,
  dailyNoteTemplate,
  localDateKey,
  noteFilePath,
} from './model'
import { loadVaultFolder, saveVaultFolder } from './folder-storage'
import {
  clearCaptureDraft,
  downloadMarkdown,
  loadCaptureDraft,
  loadDailyNote,
  saveCaptureDraft,
  saveDailyNote,
} from './storage'
import { supabase } from './supabase'
import { VaultSetup } from './vault-setup'

const dateKey = localDateKey()
interface VaultRecord {
  id: string
  name: string
  local_folder_label: string
  git_repository: string | null
  encryption_mode: 'pending' | 'device_encrypted'
}

export function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [vault, setVault] = useState<VaultRecord | null | undefined>(undefined)
  const [vaultLoadError, setVaultLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) =>
      setSession(nextSession),
    )
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !session) {
      queueMicrotask(() => {
        setVault(undefined)
        setVaultLoadError(null)
      })
      return
    }
    queueMicrotask(() => {
      setVault(undefined)
      setVaultLoadError(null)
    })
    void supabase
      .from('tact_notes_vaults')
      .select('id, name, local_folder_label, git_repository, encryption_mode')
      .maybeSingle()
      .then(({ data, error }) => {
        setVaultLoadError(
          error
            ? `Your vault was saved, but TACT Notes could not reopen it: ${error.message}`
            : null,
        )
        setVault(error ? null : (data as VaultRecord | null))
      })
  }, [session])

  if (!supabase) return <ConfigurationRequired />
  if (session === undefined) return <Loading message="Loading TACT Notes…" />
  if (!session) return <AuthScreen />
  if (vault === undefined) return <Loading message="Checking your vault…" />
  if (!vault) {
    return (
      <VaultSetup
        loadError={vaultLoadError}
        userId={session.user.id}
        onComplete={() => setVault(undefined)}
      />
    )
  }
  return (
    <NotesWorkspace
      email={session.user.email ?? 'Signed-in user'}
      userId={session.user.id}
      vault={vault}
    />
  )
}

function Loading({ message }: { message: string }) {
  return (
    <main className="auth-page">
      <p className="loading">{message}</p>
    </main>
  )
}

function ConfigurationRequired() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand">
          <span className="brand-mark" /> TACT Notes
        </div>
        <h1>Account setup is in progress.</h1>
        <p className="auth-intro">
          TACT Notes needs its secured account configuration before it can open a personal vault.
        </p>
      </section>
    </main>
  )
}

function NotesWorkspace({
  email,
  userId,
  vault,
}: {
  email: string
  userId: string
  vault: VaultRecord
}) {
  const [markdown, setMarkdown] = useState(
    () => loadDailyNote(dateKey) ?? dailyNoteTemplate(dateKey),
  )
  const [capture, setCapture] = useState(() => loadCaptureDraft(dateKey))
  const [folder, setFolder] = useState<DirectoryHandle | null>(null)
  const [status, setStatus] = useState(`Connected to ${vault.name}`)
  const captureRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    saveDailyNote(dateKey, markdown)
  }, [markdown])
  useEffect(() => {
    saveCaptureDraft(dateKey, capture)
  }, [capture])
  useEffect(() => {
    if (!folder) return
    void writeDailyNote(folder, dateKey, markdown).catch(() => {
      setStatus('Reconnect your private vault before TACT Notes can save to the folder.')
    })
  }, [folder, markdown])
  useEffect(() => {
    let active = true
    void loadVaultFolder(userId)
      .then((savedFolder) => {
        if (active && savedFolder) {
          setFolder(savedFolder)
          setStatus(`Private vault ready: ${savedFolder.name}`)
        }
      })
      .catch(() => {
        // The browser may require the user to reconnect a folder after a permission reset.
      })
    return () => {
      active = false
    }
  }, [userId])
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
    clearCaptureDraft(dateKey)
    setStatus('Capture added to today’s note')
  }

  async function connectFolder() {
    try {
      const selected = await chooseFolder()
      await saveVaultFolder(userId, selected)
      setFolder(selected)
      setStatus(`Local folder connected: ${selected.name}`)
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError'))
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
  async function signOut() {
    if (supabase) await supabase.auth.signOut()
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" /> TACT Notes
        </div>
        <p className="quiet-label">A local-first working memory for the work behind TACT.</p>
        <nav aria-label="Workspace">
          <a className="nav-item nav-item-active" href="#today">
            Today <span>⌘J</span>
          </a>
          <a className="nav-item" href="#review">
            Founder review
          </a>
        </nav>
        <section className="mhag">
          <p className="eyebrow">Vault</p>
          <strong>{vault.name}</strong>
          <p>
            {vault.git_repository
              ? 'Private Git repository recorded.'
              : 'Git setup still required.'}
          </p>
        </section>
        <button className="auth-switch sidebar-signout" onClick={() => void signOut()}>
          {email} · Sign out
        </button>
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
            <button
              className="button button-quiet"
              onClick={() => downloadMarkdown(`${dateKey}.md`, markdown)}
            >
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
            <p className="eyebrow" id="capture-heading">
              Interstitial capture
            </p>
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
          <p className="hint">
            No category required. Daily review and suggested links come after capture.
          </p>
        </section>
        <section className="editor-card">
          <label className="editor-label" htmlFor="daily-markdown">
            Today’s Markdown
          </label>
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
          <p className="review-title">Calendar</p>
          <p>Google Calendar will be read-only and will let you turn an event into a local note.</p>
          <button className="button button-quiet" disabled>
            Calendar connection coming next
          </button>
        </div>
        <div className="review-card muted-card">
          <p className="review-title">Daily review agent</p>
          <p>
            It will propose categories, links, tasks, and a short learning summary. You decide what
            becomes permanent.
          </p>
        </div>
      </aside>
    </main>
  )
}
