import { useState } from 'react'
import { chooseFolder, initializeVault, type DirectoryHandle } from './file-system'
import { supabase } from './supabase'

interface VaultSetupProps {
  userId: string
  onComplete(): void
}

export function VaultSetup({ userId, onComplete }: VaultSetupProps) {
  const [folder, setFolder] = useState<DirectoryHandle | null>(null)
  const [name, setName] = useState('My TACT Notes')
  const [gitRepository, setGitRepository] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function selectFolder() {
    try {
      const selected = await chooseFolder()
      await initializeVault(selected)
      setFolder(selected)
      setMessage(`Local vault prepared in “${selected.name}”.`)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setMessage(error instanceof Error ? error.message : 'Could not prepare the local vault.')
    }
  }

  async function saveSetup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !folder) return
    setBusy(true)
    setMessage('')
    const { error } = await supabase.from('tact_notes_vaults').upsert(
      {
        user_id: userId,
        name: name.trim(),
        local_folder_label: folder.name,
        git_provider: 'github',
        git_repository: gitRepository.trim(),
        encryption_mode: 'pending',
      },
      { onConflict: 'user_id' },
    )
    setBusy(false)
    if (error) {
      setMessage(error.message)
      return
    }
    onComplete()
  }

  return (
    <main className="auth-page">
      <section className="auth-card setup-card">
        <div className="brand">
          <span className="brand-mark" /> TACT Notes
        </div>
        <p className="eyebrow">Step 1 of 3</p>
        <h1>Create your vault.</h1>
        <p className="auth-intro">
          Choose a folder outside iCloud. TACT Notes creates the Markdown structure there; it never
          uploads note contents to Supabase.
        </p>
        <form className="auth-form" onSubmit={(event) => void saveSetup(event)}>
          <label>
            Vault name
            <input onChange={(event) => setName(event.target.value)} required value={name} />
          </label>
          <button className="button button-quiet" onClick={() => void selectFolder()} type="button">
            {folder ? `Local folder: ${folder.name}` : 'Choose a non-iCloud folder'}
          </button>
          <label>
            Private GitHub repository
            <input
              onChange={(event) => setGitRepository(event.target.value)}
              placeholder="https://github.com/you/tact-notes-vault"
              required
              type="url"
              value={gitRepository}
            />
          </label>
          <p className="field-hint">
            Create or select a private repository first. Automatic encrypted Git sync is the next
            setup step; we do not assume an existing repository.
          </p>
          <button className="button button-primary" disabled={!folder || busy} type="submit">
            {busy ? 'Saving…' : 'Save vault setup'}
          </button>
        </form>
        {message && (
          <p className="auth-message" role="status">
            {message}
          </p>
        )}
      </section>
    </main>
  )
}
