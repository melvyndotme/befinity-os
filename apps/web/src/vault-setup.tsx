import { useState } from 'react'
import { chooseFolder, initializeVault, type DirectoryHandle } from './file-system'
import { saveVaultFolder } from './folder-storage'
import { supabase } from './supabase'

interface VaultSetupProps {
  loadError: string | null
  userId: string
  onComplete(): void
}

export function VaultSetup({ loadError, userId, onComplete }: VaultSetupProps) {
  const [folder, setFolder] = useState<DirectoryHandle | null>(null)
  const [name, setName] = useState('My TACT Notes')
  const [gitRepository, setGitRepository] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function selectFolder() {
    try {
      const selected = await chooseFolder()
      await initializeVault(selected)
      await saveVaultFolder(userId, selected)
      setFolder(selected)
      setMessage(`Local vault prepared in “${selected.name}”.`)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setMessage(error instanceof Error ? error.message : 'Could not prepare the local vault.')
    }
  }

  async function saveSetup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!folder) {
      setMessage('Choose a local folder before saving your vault setup.')
      return
    }
    if (!supabase) {
      setMessage('TACT Notes account configuration is unavailable. Refresh the page and try again.')
      return
    }
    if (!name.trim()) {
      setMessage('Give your vault a name before saving.')
      return
    }
    try {
      const repositoryUrl = new URL(gitRepository)
      if (repositoryUrl.protocol !== 'https:' || repositoryUrl.hostname !== 'github.com') {
        setMessage('Enter the full HTTPS address of your private GitHub repository.')
        return
      }
    } catch {
      setMessage('Enter the full HTTPS address of your private GitHub repository.')
      return
    }
    setBusy(true)
    setMessage('')
    try {
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
      if (error) {
        setMessage(`Could not save the vault setup: ${error.message}`)
        return
      }
      setMessage('Vault saved. Opening your notes…')
      onComplete()
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Could not save the vault setup: ${error.message}`
          : 'Could not save the vault setup. Please try again.',
      )
    } finally {
      setBusy(false)
    }
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
        <form className="auth-form" noValidate onSubmit={(event) => void saveSetup(event)}>
          <label>
            Vault name
            <input onChange={(event) => setName(event.target.value)} value={name} />
          </label>
          <button className="button button-quiet" onClick={() => void selectFolder()} type="button">
            {folder ? `Local folder: ${folder.name}` : 'Choose a non-iCloud folder'}
          </button>
          <label>
            Private GitHub repository
            <input
              onChange={(event) => setGitRepository(event.target.value)}
              placeholder="https://github.com/you/tact-notes-vault"
              type="text"
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
          {!folder && <p className="field-hint">Choose a local folder to enable saving.</p>}
        </form>
        {(message || loadError) && (
          <p className="auth-message" role="status">
            {message || loadError}
          </p>
        )}
      </section>
    </main>
  )
}
