// Displays connected collaborators as colored avatars.
// Shows each user's name/color from the Yjs awareness protocol.
// The local user's avatar is shown with a click-to-edit name feature.
import { useEffect, useRef, useState } from "react"
import type { WebsocketProvider } from "y-websocket"

interface UserPresence {
  clientId: number
  name: string
  color: string
}

const LOCALSTORAGE_NAME_KEY = "referencer-user-name"

// Predefined colors for collaborators
const PRESENCE_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
]

function getPresenceColor(clientId: number): string {
  return PRESENCE_COLORS[clientId % PRESENCE_COLORS.length]
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function getLocalUserName(clientId: number): string {
  const saved = localStorage.getItem(LOCALSTORAGE_NAME_KEY)
  if (saved && saved.trim()) return saved
  return `User ${clientId % 100}`
}

export function CollaborationPresence({
  provider,
  className = "",
}: {
  provider: WebsocketProvider | null
  className?: string
}) {
  const [users, setUsers] = useState<UserPresence[]>([])
  const [localUser, setLocalUser] = useState<UserPresence | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editValue, setEditValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!provider) return

    const awareness = provider.awareness
    const localName = getLocalUserName(awareness.clientID)
    const localColor = getPresenceColor(awareness.clientID)

    awareness.setLocalStateField("user", {
      name: localName,
      color: localColor,
    })

    setLocalUser({
      clientId: awareness.clientID,
      name: localName,
      color: localColor,
    })

    const update = () => {
      const states = awareness.getStates()
      const remoteUsers: UserPresence[] = []
      states.forEach((state, clientId) => {
        if (clientId === awareness.clientID) return
        const user = state.user as { name: string; color: string } | undefined
        if (user) {
          remoteUsers.push({
            clientId,
            name: user.name,
            color: user.color || getPresenceColor(clientId),
          })
        }
      })
      setUsers(remoteUsers)
    }

    awareness.on("change", update)
    update()

    return () => {
      awareness.off("change", update)
    }
  }, [provider])

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingName])

  const startEditingName = () => {
    if (!localUser) return
    setEditValue(localUser.name)
    setIsEditingName(true)
  }

  const commitName = () => {
    if (!provider) return
    const trimmed = editValue.trim()
    if (!trimmed) {
      setIsEditingName(false)
      return
    }

    localStorage.setItem(LOCALSTORAGE_NAME_KEY, trimmed)
    provider.awareness.setLocalStateField("user", {
      name: trimmed,
      color: localUser?.color ?? getPresenceColor(provider.awareness.clientID),
    })
    setLocalUser((prev) =>
      prev ? { ...prev, name: trimmed } : prev
    )
    setIsEditingName(false)
  }

  const totalCount = users.length + (localUser ? 1 : 0)
  if (totalCount === 0) return null

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {totalCount > 1 && (
        <span className="text-xs text-muted-foreground mr-1">
          {totalCount} online
        </span>
      )}
      {users.map((user) => (
        <div
          key={user.clientId}
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium text-white shrink-0"
          style={{ backgroundColor: user.color }}
          title={user.name}
        >
          {getInitials(user.name)}
        </div>
      ))}
      {localUser && (
        <div className="relative">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium text-white shrink-0 cursor-pointer ring-1 ring-white/30"
            style={{ backgroundColor: localUser.color }}
            title="You"
            onClick={startEditingName}
          >
            {getInitials(localUser.name)}
          </div>
          {isEditingName && (
            <div className="absolute top-full right-0 mt-1 z-50">
              <input
                ref={inputRef}
                className="text-xs px-2 py-1 rounded border border-border bg-popover text-popover-foreground shadow-md w-32 outline-none focus:ring-1 focus:ring-ring"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    commitName()
                  }
                  if (e.key === "Escape") {
                    e.preventDefault()
                    setIsEditingName(false)
                  }
                }}
                placeholder="Your name"
                spellCheck={false}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
