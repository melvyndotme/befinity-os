export interface WritableFileHandle {
  createWritable(): Promise<{
    write(contents: string): Promise<void>
    close(): Promise<void>
  }>
}

export interface DirectoryHandle {
  name: string
  getDirectoryHandle(name: string, options: { create: boolean }): Promise<DirectoryHandle>
  getFileHandle(name: string, options: { create: boolean }): Promise<WritableFileHandle>
}

type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: (options: { mode: 'readwrite' }) => Promise<DirectoryHandle>
}

export function supportsFolderWriting(): boolean {
  return typeof (window as DirectoryPickerWindow).showDirectoryPicker === 'function'
}

export async function chooseFolder(): Promise<DirectoryHandle> {
  const picker = (window as DirectoryPickerWindow).showDirectoryPicker
  if (!picker) {
    throw new Error('This browser does not support choosing a local folder yet.')
  }
  return await picker({ mode: 'readwrite' })
}

async function writeTextFile(
  folder: DirectoryHandle,
  name: string,
  contents: string,
): Promise<void> {
  const file = await folder.getFileHandle(name, { create: true })
  const writer = await file.createWritable()
  await writer.write(contents)
  await writer.close()
}

export async function initializeVault(folder: DirectoryHandle): Promise<void> {
  await Promise.all(
    ['daily', 'notes', 'reviews', 'assets'].map((name) =>
      folder.getDirectoryHandle(name, { create: true }),
    ),
  )
  const metadata = await folder.getDirectoryHandle('.tact-notes', { create: true })
  await writeTextFile(
    metadata,
    'vault.json',
    JSON.stringify({ version: 1, createdAt: new Date().toISOString() }, null, 2),
  )
}

export async function writeDailyNote(
  folder: DirectoryHandle,
  dateKey: string,
  markdown: string,
): Promise<void> {
  const dailyFolder = await folder.getDirectoryHandle('daily', { create: true })
  const file = await dailyFolder.getFileHandle(`${dateKey}.md`, { create: true })
  const writer = await file.createWritable()
  await writer.write(markdown)
  await writer.close()
}
