import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Send, MessageCircle, Loader2, LockKeyhole,
  ArrowLeft, BadgeCheck, ShoppingBag, Search,
} from 'lucide-react'
import { fetchConversations, fetchMessages, sendMessage } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import type { ConversationDTO, MessageDTO } from '@/lib/types'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
function formatRelative(iso: string) {
  const d   = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return formatTime(iso)
  const diff = Math.round((now.getTime() - d.getTime()) / 86_400_000)
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
function formatDateLabel(iso: string) {
  const d   = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'Today'
  const diff = Math.round((now.getTime() - d.getTime()) / 86_400_000)
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
}

export function MessagesPage() {
  const [searchParams] = useSearchParams()
  const navigate        = useNavigate()
  const { user, isLoggedIn } = useAuthStore()
  const qc              = useQueryClient()
  const [activeId, setActiveId]   = useState<string | null>(searchParams.get('conversation'))
  const [draft, setDraft]         = useState('')
  const [convSearch, setConvSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Must be before any conditional return
  const { data: conversations = [], isLoading: loadingConvs } = useQuery({
    queryKey: ['conversations'],
    queryFn:  fetchConversations,
    refetchInterval: 8_000,
    enabled: isLoggedIn(),
  })

  const activeConv = conversations.find((c) => c.id === activeId)

  const { data: messages = [], isLoading: loadingMsgs } = useQuery({
    queryKey: ['messages', activeId],
    queryFn:  () => fetchMessages(activeId!),
    enabled:  Boolean(activeId),
    refetchInterval: 4_000,
  })

  const sendMutation = useMutation({
    mutationFn: (content: string) => sendMessage(activeId!, content),
    onSuccess: () => {
      setDraft('')
      qc.invalidateQueries({ queryKey: ['messages', activeId] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Close conversation on mobile when navigating away
  useEffect(() => {
    const id = searchParams.get('conversation')
    if (id) setActiveId(id)
  }, [searchParams])

  if (!isLoggedIn()) {
    navigate('/login')
    return null
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed || !activeId || sendMutation.isPending) return
    sendMutation.mutate(trimmed)
  }

  const filteredConvs = convSearch.trim()
    ? conversations.filter((c) =>
        c.otherParty?.name.toLowerCase().includes(convSearch.toLowerCase()) ||
        c.listingTitle?.toLowerCase().includes(convSearch.toLowerCase()),
      )
    : conversations

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0)

  return (
    <div className="container py-6 pb-2">
      <div className="flex h-[calc(100vh-8rem)] rounded-2xl border border-border overflow-hidden bg-white shadow-sm">

        {/* ═══════════════ SIDEBAR ═══════════════ */}
        <aside className={cn(
          'w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-border flex flex-col bg-white',
          activeId && 'hidden md:flex',
        )}>
          {/* Header */}
          <div className="px-5 pt-5 pb-3 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-serif text-xl font-bold text-primary leading-none">Messages</h2>
                {totalUnread > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">{totalUnread} unread</p>
                )}
              </div>
              <Link to="/catalog" className="text-xs text-primary hover:underline">Browse listings</Link>
            </div>
            {/* Search conversations */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={convSearch}
                onChange={(e) => setConvSearch(e.target.value)}
                placeholder="Search conversations…"
                className="pl-8 h-8 text-xs bg-muted/30 border-muted"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="space-y-0">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-border/40">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-8 gap-3 h-full">
                <MessageCircle size={40} className="text-muted-foreground/20" />
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {convSearch ? 'No matches' : 'No conversations yet'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {convSearch
                      ? 'Try a different name or listing.'
                      : 'Find something you like and message the seller.'}
                  </p>
                </div>
                {!convSearch && (
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/catalog">Browse listings</Link>
                  </Button>
                )}
              </div>
            ) : (
              filteredConvs.map((conv) => (
                <ConvItem
                  key={conv.id}
                  conv={conv}
                  isActive={conv.id === activeId}
                  currentUserId={user!.id}
                  onClick={() => setActiveId(conv.id)}
                />
              ))
            )}
          </div>
        </aside>

        {/* ═══════════════ CHAT PANEL ═══════════════ */}
        <section className={cn(
          'flex-1 flex flex-col min-w-0',
          !activeId && 'hidden md:flex',
        )}>
          {!activeId ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <MessageCircle size={36} className="text-primary" />
              </div>
              <div>
                <p className="font-serif text-xl font-bold text-primary mb-1">Select a conversation</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Choose a conversation from the left, or find a listing and message the seller.
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/catalog" className="gap-2">
                  <ShoppingBag size={15} /> Browse listings
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* ── Chat header ── */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-white">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden shrink-0 -ml-1"
                  onClick={() => setActiveId(null)}
                >
                  <ArrowLeft size={18} />
                </Button>

                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={activeConv?.otherParty?.avatar ?? undefined} />
                  <AvatarFallback className="text-xs font-bold">
                    {(activeConv?.otherParty?.name ?? 'U').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm flex items-center gap-1.5 truncate">
                    {activeConv?.otherParty?.name ?? 'Conversation'}
                    <BadgeCheck size={13} className="text-primary shrink-0" />
                  </p>
                  {activeConv?.listingId && (
                    <Link
                      to={`/listings/${activeConv.listingId}`}
                      className="text-xs text-primary hover:underline flex items-center gap-1 truncate"
                    >
                      <ShoppingBag size={10} className="shrink-0" />
                      {activeConv.listingTitle ?? 'View listing'}
                      {activeConv.listingPrice != null && (
                        <span className="text-muted-foreground ml-1">
                          · GH₵{(activeConv.listingPrice / 100).toFixed(2)}
                        </span>
                      )}
                    </Link>
                  )}
                </div>
              </div>

              {/* ── Messages area ── */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-muted/10">
                {/* Security notice */}
                <div className="flex items-center gap-2 justify-center py-2 mb-1">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 px-2 whitespace-nowrap">
                    <LockKeyhole size={9} /> Messages are only visible to participants
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Listing context card */}
                {activeConv?.listingId && activeConv.listingTitle && (
                  <Link
                    to={`/listings/${activeConv.listingId}`}
                    className="flex items-center gap-3 bg-white rounded-xl border border-border p-3 mb-3 hover:border-primary/30 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <ShoppingBag size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{activeConv.listingTitle}</p>
                      {activeConv.listingPrice != null && (
                        <p className="text-xs text-primary font-bold">
                          GH₵{(activeConv.listingPrice / 100).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">View →</span>
                  </Link>
                )}

                {loadingMsgs ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 size={18} className="animate-spin mr-2" /> Loading messages…
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">No messages yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Start the conversation — ask about the item, arrange a meet-up, or make an offer.
                    </p>
                  </div>
                ) : (
                  <MessageList messages={messages} currentUserId={user!.id} />
                )}
                <div ref={bottomRef} />
              </div>

              {/* ── Composer ── */}
              <form
                onSubmit={handleSend}
                className="flex items-center gap-2 px-4 py-3 border-t border-border bg-white"
              >
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) handleSend(e as unknown as React.FormEvent)
                  }}
                  placeholder="Type a message… (Enter to send)"
                  className="flex-1 bg-muted/30 focus:bg-white transition-colors"
                  disabled={sendMutation.isPending}
                  maxLength={2000}
                  autoFocus
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!draft.trim() || sendMutation.isPending}
                  aria-label="Send message"
                >
                  {sendMutation.isPending
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Send size={16} />}
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════

function ConvItem({
  conv, isActive, currentUserId, onClick,
}: {
  conv: ConversationDTO
  isActive: boolean
  currentUserId: string
  onClick: () => void
}) {
  const unread  = conv.unreadCount ?? 0
  const lastMsg = conv.lastMessage

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-border/40 transition-colors relative',
        isActive
          ? 'bg-primary/5 border-l-[3px] border-l-primary pl-[13px]'
          : 'hover:bg-muted/40',
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={conv.otherParty?.avatar ?? undefined} />
          <AvatarFallback className="text-xs font-bold bg-primary text-white">
            {(conv.otherParty?.name ?? 'U').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className={cn(
            'text-sm truncate',
            unread > 0 ? 'font-bold text-foreground' : 'font-semibold text-foreground',
          )}>
            {conv.otherParty?.name ?? 'Unknown'}
          </p>
          {lastMsg && (
            <span className="text-[10px] text-muted-foreground shrink-0">
              {formatRelative(lastMsg.createdAt)}
            </span>
          )}
        </div>

        {/* Listing title */}
        {conv.listingTitle && (
          <p className="text-[10px] text-primary truncate font-medium">
            {conv.listingTitle}
          </p>
        )}

        {/* Last message preview */}
        {lastMsg ? (
          <p className={cn(
            'text-xs truncate mt-0.5',
            unread > 0 && lastMsg.senderId !== currentUserId
              ? 'text-foreground font-medium'
              : 'text-muted-foreground',
          )}>
            {lastMsg.senderId === currentUserId ? 'You: ' : ''}
            {lastMsg.content}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/60 mt-0.5 italic">No messages yet</p>
        )}
      </div>
    </button>
  )
}

function MessageList({ messages, currentUserId }: { messages: MessageDTO[]; currentUserId: string }) {
  let lastDateLabel = ''

  return (
    <>
      {messages.map((msg) => {
        if (!msg?.id) return null   // skip malformed entries

        const dateLabel = formatDateLabel(msg.createdAt)
        const showDate  = dateLabel !== lastDateLabel
        lastDateLabel   = dateLabel
        const isMe      = msg.senderId === currentUserId
        // Safe name: handle both { name } and { fullName } from any backend version
        const senderName = (msg.sender as unknown as Record<string, unknown> | undefined)
          ? ((msg.sender as Record<string, unknown>)['name']
            ?? (msg.sender as Record<string, unknown>)['fullName']
            ?? 'Unknown') as string
          : 'Unknown'
        const senderAvatar = (msg.sender as unknown as Record<string, unknown> | undefined)
          ? ((msg.sender as Record<string, unknown>)['avatar']
            ?? (msg.sender as Record<string, unknown>)['avatarUrl']
            ?? null) as string | null
          : null

        return (
          <div key={msg.id}>
            {showDate && (
              <div className="flex items-center gap-3 my-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] text-muted-foreground bg-muted/60 px-3 py-0.5 rounded-full font-medium">
                  {dateLabel}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
            )}

            <div className={cn('flex items-end gap-2 mb-1', isMe ? 'justify-end' : 'justify-start')}>
              {!isMe && (
                <Avatar className="h-6 w-6 shrink-0 mb-0.5">
                  <AvatarImage src={senderAvatar ?? undefined} />
                  <AvatarFallback className="text-[9px] font-bold bg-muted text-muted-foreground">
                    {senderName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}

              <div className={cn('flex flex-col gap-0.5', isMe ? 'items-end' : 'items-start')}>
                {!isMe && (
                  <span className="text-[10px] text-muted-foreground font-medium px-1">
                    {senderName}
                  </span>
                )}

                <div className={cn(
                  'max-w-xs sm:max-w-sm lg:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                  isMe
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-white text-foreground rounded-bl-sm border border-border shadow-sm',
                )}>
                  {msg.content}
                  <div className={cn(
                    'text-[10px] mt-1 flex items-center gap-1',
                    isMe ? 'text-white/60 justify-end' : 'text-muted-foreground',
                  )}>
                    {formatTime(msg.createdAt)}
                    {isMe && msg.readAt && <span title="Read">✓✓</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}
