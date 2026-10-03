import type { ReactElement, ReactNode } from 'react'
import { Folder, FolderPlus } from 'lucide-react'
import { InlineAlert } from '@/components/inline-alert.tsx'
import { Button } from '@/components/ui/button.tsx'
import { useGraphColors } from '@/hooks/use-graph-colors.ts'
import { graphColorCss } from '@/lib/graph-colors.ts'
import { cn } from '@/lib/utils.ts'
import { useGraph } from '@/providers/graph-provider.tsx'

/**
 * First-run / no-vault screen. TACT Notes is local-first: the person chooses
 * the folder and TACT Notes keeps Markdown files exactly there.
 */
export function GraphChooser(): ReactElement {
  const { recents, error, pickAndOpen, openRecent, forget } = useGraph()
  const { colorFor } = useGraphColors()

  return (
    <ChooserShell>
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-text">Welcome to TACT Notes</h1>
        <p className="text-sm text-text-secondary">
          Your notes are plain Markdown files. Choose a local folder outside iCloud to create or
          open your vault.
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-sm items-stretch gap-4">
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm">
          <CardHeader
            icon={<Folder aria-hidden className="size-4" strokeWidth={1.75} />}
            title="Your local TACT Notes vault"
          >
            Choose an existing folder or create a new one. TACT Notes keeps your Markdown files
            there and does not use iCloud.
          </CardHeader>
          <Button
            type="button"
            variant="default"
            className="mt-auto w-full"
            onClick={() => void pickAndOpen()}
          >
            <FolderPlus aria-hidden strokeWidth={1.75} />
            Choose or create a folder…
          </Button>
        </section>
      </div>

      {error ? (
        <InlineAlert tone="error" className="mx-auto w-full max-w-sm text-center">
          {error}
        </InlineAlert>
      ) : null}

      {recents.length > 0 ? (
        <div className="mx-auto w-full max-w-sm space-y-2">
          <p className="px-2 text-2xs font-medium tracking-wide text-text-muted">Recent</p>
          <ul className="space-y-px">
            {recents.map((recent) => {
              const color = colorFor(recent.root)
              return (
                <li
                  key={recent.root}
                  className="group flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-surface-hover"
                >
                  <button
                    type="button"
                    onClick={() => void openRecent(recent.root)}
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                  >
                    <Folder
                      aria-hidden
                      strokeWidth={1.75}
                      className={cn('size-4 shrink-0', color === undefined && 'text-text-muted')}
                      style={color === undefined ? undefined : { color: graphColorCss(color) }}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-text">
                        {recent.name}
                      </span>
                      <span className="block truncate text-xs text-text-muted">{recent.root}</span>
                    </span>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => void forget(recent.root)}
                    aria-label={`Forget ${recent.name}`}
                    className="shrink-0 text-text-muted opacity-0 transition-opacity duration-100 hover:text-text-secondary group-hover:opacity-100 focus-visible:opacity-100 group-focus-within:opacity-100"
                  >
                    Forget
                  </Button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </ChooserShell>
  )
}

function ChooserShell({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className="flex h-screen w-screen overflow-auto bg-surface-app p-8">
      {/* Auto margins (not items-center) so the content centers when it fits but
          scrolls from the top when the recents list outgrows the viewport —
          flex centering would clip the overflowing top edge. */}
      <div className="m-auto w-full max-w-2xl space-y-8">{children}</div>
    </div>
  )
}

/**
 * The icon-chip card header shared by both storage cards — the same visual
 * language as the mobile onboarding screen. A primary-tinted chip marks the
 * recommended path; the neutral chip is the default.
 */
function CardHeader({
  icon,
  title,
  badge,
  tinted = false,
  children,
}: {
  icon: ReactNode
  title: string
  badge?: ReactNode
  tinted?: boolean
  children: ReactNode
}): ReactElement {
  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg',
          tinted ? 'bg-primary/10 text-primary' : 'bg-muted text-text-secondary',
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-text">{title}</h2>
          {badge}
        </div>
        <p className="text-sm text-text-secondary">{children}</p>
      </div>
    </div>
  )
}
