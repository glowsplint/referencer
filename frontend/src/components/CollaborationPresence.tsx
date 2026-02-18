// Displays connected collaborators as colored avatars.
// Shows each user's name/color from the Yjs awareness protocol.
import { useEffect, useState } from "react"
import type { WebsocketProvider } from "y-websocket"

interface UserPresence {
  clientId: number
  name: string
  color: string
}

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

export function CollaborationPresence({
  provider,
  className = "",
}: {
  provider: WebsocketProvider | null
  className?: string
}) {
  const [users, setUsers] = useState<UserPresence[]>([])

  useEffect(() => {
    if (!provider) return

    const awareness = provider.awareness

    // Set local user info
    const localColor = getPresenceColor(awareness.clientID)
    awareness.setLocalStateField("user", {
      name: `User ${awareness.clientID % 100}`,
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

  if (users.length === 0) return null

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="text-xs text-muted-foreground mr-1">
        {users.length} online
      </span>
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
    </div>
  )
}
