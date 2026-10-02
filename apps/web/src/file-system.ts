export interface WritableFileHandle {
  createWritable(): Promise<{
    write(contents: string): Promise<void>
    close(): Promise<void>
  }>
}

export interface DirectoryHandle {
  getDirectoryHandle(name: string, options: { create: boolean }): Promise<DirectoryHandle>
  getFileHandle(name: string, options: { create: boolean }): Promise<WritableFileHandle>
}

type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: () => Promise<DirectoryHandle>
}

export function supportsFolderWriting(): boolean {
  return typeof (window as DirectoryPickerWindow).showDirectoryPicker === 'function'
}

export async function chooseFolder(): Promise<DirectoryHandle> {
  const picker = (window as DirectoryPickerWindow).showDirectoryPicker
  if (!picker) {
    throw new Error('This browser does not support choosing a local folder yet.')
  }
  return picker()
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
