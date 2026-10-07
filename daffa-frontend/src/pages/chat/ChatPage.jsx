import React, { useState, useEffect, useRef, useCallback } from 'react';
import { chatApi } from '../../api/chat';
import { IcSearch, IcChat, IcCheck, IcDoubleCheck, IcLock } from '../../utils/icons';

const C = {
  teal: '#1A6B7C', tealDark: '#14505E', tealLight: '#E8F4F6',
  orange: '#E8620A', green: '#16a34a',
  gray: '#6B7280', grayLight: '#F3F4F6', grayBorder: '#E5E7EB',
  white: '#FFFFFF', bg: '#F8FAFB',
};

const Avatar = ({ name = '?', size = 40, color = C.teal }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: color, color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: size * 0.4, flexShrink: 0,
  }}>
    {(name || '?')[0]}
  </div>
);

// ── قائمة المحادثات ────────────────────────────────────────────────────────
const ConversationList = ({ conversations, selectedId, onSelect, loading, role, onStart }) => {
  const [search, setSearch] = useState('');

  const filtered = conversations.filter(c =>
    !search || c.other_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: C.white }}>
      {/* Header */}
      <div style={{ padding: '16px 14px', borderBottom: `1px solid ${C.grayBorder}`, flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.tealDark, marginBottom: 10 }}>المحادثات</div>
        <div style={{ position: 'relative' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث..."
            style={{ width: '100%', padding: '7px 34px 7px 10px', borderRadius: 10, border: `1.5px solid ${C.grayBorder}`, fontSize: 12, fontFamily: "'Cairo', sans-serif", outline: 'none', boxSizing: 'border-box' }}
          />
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: C.gray, display: 'flex' }}><IcSearch width={14} height={14}/></span>
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {loading ? (
          <div style={{ padding: 30, textAlign: 'center', color: C.gray, fontSize: 13 }}>جارٍ التحميل…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center' }}>
            <div style={{ marginBottom: 8, color: C.gray }}><IcChat width={32} height={32}/></div>
            <div style={{ fontSize: 13, color: C.gray, marginBottom: 16 }}>
              {conversations.length === 0
                ? (role === 'consultant' ? 'لا توجد محادثات مع عملائك بعد' : 'لا توجد محادثة مع مستشارك بعد')
                : 'لا نتائج'}
            </div>
            {conversations.length === 0 && role !== 'consultant' && role !== 'admin' && (
              <button
                onClick={onStart}
                style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: C.teal, color: 'white', fontSize: 13, fontFamily: "'Cairo', sans-serif", cursor: 'pointer', fontWeight: 600 }}
              >
                بدء محادثة مع مستشارك
              </button>
            )}
          </div>
        ) : (
          filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => onSelect(c)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', cursor: 'pointer',
                background: selectedId === c.id ? `${C.teal}0D` : 'transparent',
                borderLeft: selectedId === c.id ? `3px solid ${C.teal}` : '3px solid transparent',
                borderBottom: `1px solid ${C.grayLight}`,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (selectedId !== c.id) e.currentTarget.style.background = C.grayLight; }}
              onMouseLeave={e => { if (selectedId !== c.id) e.currentTarget.style.background = 'transparent'; }}
            >
              <Avatar name={c.other_name} size={42} color={C.teal} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.tealDark }}>{c.other_name}</span>
                  <span style={{ fontSize: 10, color: C.gray, flexShrink: 0 }}>{c.last_at}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                  <span style={{ fontSize: 11, color: C.gray, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {c.last_message || 'لا توجد رسائل بعد'}
                  </span>
                  {c.unread > 0 && (
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: C.orange, color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 6 }}>
                      {c.unread}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 10, color: C.teal, opacity: 0.7 }}>{c.other_role}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ── منطقة المحادثة ─────────────────────────────────────────────────────────
const ChatWindow = ({ conversation, currentUserId, onMessageSent, canSend = true }) => {
  const [messages, setMessages]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [body,     setBody]       = useState('');
  const [sending,  setSending]    = useState(false);
  const bottomRef                 = useRef(null);
  const inputRef                  = useRef(null);
  const pollRef                   = useRef(null);
  const lastCountRef               = useRef(0);

  const loadMessages = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    chatApi.messages(conversation.id)
      .then(r => {
        const incoming = r.data;
        // Detect new message from the other party → refresh conversation list sidebar
        if (silent && incoming.length > lastCountRef.current) {
          const newest = incoming[incoming.length - 1];
          if (newest && !newest.is_mine) onMessageSent?.();
        }
        lastCountRef.current = incoming.length;
        setMessages(incoming);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [conversation.id, onMessageSent]);

  useEffect(() => {
    setMessages([]);
    setBody('');
    lastCountRef.current = 0;
    loadMessages(false);
    pollRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') loadMessages(true);
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [conversation.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = body.trim();
    if (!text || sending) return;

    // Optimistic update
    const optimistic = {
      id: Date.now(), sender_id: currentUserId, is_mine: true,
      body: text, time: new Date().toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit', hour12: false }),
      read_at: null,
    };
    setMessages(prev => [...prev, optimistic]);
    setBody('');
    setSending(true);

    try {
      const r = await chatApi.send(conversation.id, text);
      setMessages(prev => prev.map(m => m.id === optimistic.id ? r.data : m));
      onMessageSent?.();
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setBody(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: C.bg, borderRight: `1px solid ${C.grayBorder}` }}>
      {/* Header */}
      <div style={{ padding: '12px 18px', background: C.white, borderBottom: `1px solid ${C.grayBorder}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <Avatar name={conversation.other_name} size={38} color={C.teal} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.tealDark }}>{conversation.other_name}</div>
          <div style={{ fontSize: 11, color: C.green }}>● {conversation.other_role}</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.gray, fontSize: 13 }}>جارٍ التحميل…</div>
        ) : messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.gray }}>
            <div style={{ marginBottom: 8, color: C.gray }}><IcChat width={36} height={36}/></div>
            <div style={{ fontSize: 13 }}>ابدأ المحادثة الآن</div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} style={{ display: 'flex', justifyContent: m.is_mine ? 'flex-start' : 'flex-end' }}>
              <div style={{ maxWidth: '70%' }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: m.is_mine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: m.is_mine ? C.white : C.teal,
                  color: m.is_mine ? '#1F2937' : 'white',
                  fontSize: 13, lineHeight: 1.7,
                  boxShadow: m.is_mine ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                }}>
                  {m.body}
                </div>
                <div style={{ fontSize: 10, color: C.gray, marginTop: 3, textAlign: m.is_mine ? 'right' : 'left' }}>
                  {m.time}
                  {m.is_mine && m.read_at && <span style={{ marginRight: 4, color: C.teal, display: 'inline-flex' }}><IcDoubleCheck width={12} height={12}/></span>}
                  {m.is_mine && !m.read_at && <span style={{ marginRight: 4, color: C.gray, display: 'inline-flex' }}><IcCheck width={12} height={12}/></span>}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {canSend ? (
        <div style={{ padding: '12px 16px', background: C.white, borderTop: `1px solid ${C.grayBorder}`, display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
          <textarea
            ref={inputRef}
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب رسالتك..."
            rows={1}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 12,
              border: `1.5px solid ${C.grayBorder}`, fontSize: 13,
              fontFamily: "'Cairo', sans-serif", outline: 'none',
              resize: 'none', lineHeight: 1.5, maxHeight: 120, overflowY: 'auto',
              transition: 'border 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = C.teal}
            onBlur={e => e.target.style.borderColor = C.grayBorder}
          />
          <button
            onClick={handleSend}
            disabled={!body.trim() || sending}
            style={{
              width: 42, height: 42, borderRadius: 12, border: 'none',
              background: body.trim() ? C.orange : C.grayLight,
              color: body.trim() ? 'white' : C.gray,
              cursor: body.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      ) : (
        <div style={{ padding: '10px 16px', background: C.grayLight, borderTop: `1px solid ${C.grayBorder}`, textAlign: 'center', fontSize: 12, color: C.gray, flexShrink: 0 }}>
          ليس لديك صلاحية إرسال الرسائل
        </div>
      )}
    </div>
  );
};

// ── الصفحة الرئيسية ────────────────────────────────────────────────────────
export default function ChatPage({ role, userId, canSend = true, autoStart = false }) {
  const [conversations, setConversations] = useState([]);
  const [selected,      setSelected]      = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [starting,      setStarting]      = useState(false);
  const listPollRef                       = useRef(null);
  const autoStartedRef                    = useRef(false);

  const loadConversations = useCallback((silent = false, autoSelectId = null) => {
    if (!silent) setLoading(true);
    chatApi.conversations()
      .then(r => {
        setConversations(r.data);
        setLoading(false);
        if (autoSelectId) {
          const conv = r.data.find(c => c.id === autoSelectId);
          if (conv) setSelected(conv);
          else if (r.data.length > 0) setSelected(r.data[0]);
        } else if (autoStart && !autoStartedRef.current) {
          autoStartedRef.current = true;
          if (r.data.length > 0) {
            setSelected(r.data[0]);
          } else {
            setStarting(true);
            chatApi.startWith()
              .then(r2 => loadConversations(false, r2.data?.conversation_id))
              .catch(e => alert(e.response?.data?.message || 'تعذّر بدء المحادثة'))
              .finally(() => setStarting(false));
          }
        }
      })
      .catch(e => { setError(e.response?.data?.message || 'تعذّر التحميل'); setLoading(false); });
  }, [autoStart]);

  useEffect(() => {
    loadConversations(false);
    listPollRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') loadConversations(true);
    }, 8000);
    return () => clearInterval(listPollRef.current);
  }, [loadConversations]);

  const handleStart = () => {
    setStarting(true);
    chatApi.startWith()
      .then(r => loadConversations(false, r.data?.conversation_id))
      .catch(e => alert(e.response?.data?.message || 'تعذّر بدء المحادثة'))
      .finally(() => setStarting(false));
  };

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#dc2626', flexDirection: 'column', gap: 12 }}>
      <div>{error}</div>
      <button onClick={() => loadConversations(false)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: C.teal, color: 'white', cursor: 'pointer', fontFamily: "'Cairo', sans-serif" }}>إعادة المحاولة</button>
    </div>
  );

  return (
    <div className="animate-in" style={{
      display: 'grid',
      gridTemplateColumns: '280px 1fr',
      height: 'calc(100vh - 120px)',
      borderRadius: 14, overflow: 'hidden',
      border: `1px solid ${C.grayBorder}`,
      background: C.white,
    }}>
      <ConversationList
        conversations={conversations}
        selectedId={selected?.id}
        onSelect={(c) => setSelected(c)}
        loading={loading}
        role={role}
        onStart={handleStart}
      />

      {selected ? (
        <ChatWindow
          key={selected.id}
          conversation={selected}
          currentUserId={userId}
          onMessageSent={() => loadConversations(true)}
          canSend={canSend}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.gray, background: C.bg, borderRight: `1px solid ${C.grayBorder}` }}>
          <div style={{ marginBottom: 12, color: C.gray }}><IcChat width={48} height={48}/></div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.tealDark, marginBottom: 6 }}>اختر محادثة</div>
          <div style={{ fontSize: 12, color: C.gray }}>اختر محادثة من القائمة لعرضها</div>
        </div>
      )}
    </div>
  );
}
