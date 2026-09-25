import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bot, Send, Trash2, Loader2, Sparkles, User, AlertTriangle } from 'lucide-react';
import { fetchChatHistory, clearChatHistory, sendChatMessage } from '../../store/slices/website/chatSlice';
import { notify } from '../../utils/notify';
import { confirmDialog } from '../../components/common/ConfirmDialog';
import useSeo from '../../hooks/useSeo';
import useShop from '../../hooks/useShop';
import AccountLayout from '../../components/website/account/AccountLayout';

const SUGGESTIONS = [
  'Where is my latest order?',
  'Which payment methods do you accept?',
  'What products do you have on offer?',
  'How do I download my invoice?',
];

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1" aria-label="Assistant is typing">
      {[0, 150, 300].map((d) => <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-rose-400" style={{ animationDelay: `${d}ms` }} />)}
    </span>
  );
}

function Bubble({ msg, initials }) {
  const mine = msg.role === 'user';
  return (
    <div className={`flex animate-fadeInUp items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow ${
        mine ? 'bg-gradient-to-br from-gray-600 to-gray-800' : 'bg-gradient-to-br from-orange-500 via-rose-500 to-fuchsia-600'
      }`}>
        {mine ? (initials || <User size={14} />) : <Bot size={16} />}
      </span>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm sm:max-w-[75%] ${
        mine
          ? 'rounded-br-md bg-gradient-to-br from-orange-500 to-rose-500 text-white'
          : msg.error
            ? 'rounded-bl-md bg-red-50 text-red-700 ring-1 ring-red-200'
            : 'rounded-bl-md bg-white text-gray-700 ring-1 ring-gray-100'
      }`}>
        {msg.error && <AlertTriangle size={14} className="mb-1 inline-block" />}{' '}
        {msg.content ? <span className="whitespace-pre-wrap break-words">{msg.content}</span> : <TypingDots />}
      </div>
    </div>
  );
}

export default function ChatAssistant() {
  useSeo({ title: 'AI Assistant', noindex: true });
  const user = useSelector((s) => s.auth.user);
  const shop = useShop();
  const dispatch = useDispatch();
  const { messages, busy } = useSelector((s) => s.chat); // messages: null = loading history
  const [input, setInput] = useState('');
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const initials = (user?.name || '').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  useEffect(() => {
    dispatch(fetchChatHistory());
  }, [dispatch]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages]);

  const send = async (text) => {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    setInput('');
    await dispatch(sendChatMessage(message)); // streams the reply into state.chat.messages
    inputRef.current?.focus();
  };

  const clearChat = async () => {
    const ok = await confirmDialog({
      title: 'Clear chat?',
      message: 'Your conversation with the assistant will be deleted.',
      confirmText: 'Yes, clear',
      doneText: 'Cleared!',
      onConfirm: () => dispatch(clearChatHistory()).unwrap(),
    });
    if (!ok) return;
    notify.deleted('Chat cleared');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <AccountLayout icon={Bot} title="AI Assistant" subtitle="Ask about your orders, products, payments or delivery">
      <div className="flex h-[calc(100vh-18rem)] min-h-[480px] animate-fadeInUp flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-orange-50 via-rose-50 to-fuchsia-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 via-rose-500 to-fuchsia-600 text-white shadow-md">
              <Bot size={20} />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900">{shop.shop_name} Assistant</p>
              <p className="text-xs text-gray-500">{busy ? 'Typing…' : 'Online · replies instantly'}</p>
            </div>
          </div>
          {messages?.length > 0 && (
            <button onClick={clearChat} disabled={busy} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-white hover:text-red-600 disabled:opacity-50">
              <Trash2 size={14} /> Clear
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-gray-50/60 to-white p-4" aria-live="polite">
          {messages === null ? (
            <div className="flex h-full items-center justify-center text-gray-400"><Loader2 className="animate-spin" size={26} /></div>
          ) : messages.length === 0 ? (
            <div className="flex h-full animate-scaleIn flex-col items-center justify-center text-center">
              <span className="flex h-16 w-16 animate-float items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-rose-500 to-fuchsia-600 text-white shadow-lg">
                <Sparkles size={30} />
              </span>
              <p className="mt-4 font-semibold text-gray-900">Hi{user?.name ? ` ${user.name.split(' ')[0]}` : ''}! How can I help?</p>
              <p className="mt-1 max-w-sm text-sm text-gray-500">I can check your orders, suggest products and answer questions about payments and delivery.</p>
              <div className="mt-5 flex max-w-lg flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <button key={s} onClick={() => send(s)}
                    className="animate-fadeInUp rounded-full bg-white px-3 py-1.5 text-xs font-medium text-rose-600 shadow-sm ring-1 ring-rose-200 transition-all hover:-translate-y-0.5 hover:bg-rose-50"
                    style={{ animationDelay: `${150 + i * 70}ms` }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => <Bubble key={m.id} msg={m} initials={initials} />)
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="border-t border-gray-100 p-3">
          <div className="flex items-end gap-2 rounded-2xl bg-gray-50 p-1.5 ring-1 ring-gray-200 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-rose-300">
            <textarea
              ref={inputRef} rows={1} value={input} maxLength={1000} disabled={busy}
              onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown}
              placeholder="Type your question…" aria-label="Message"
              className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none disabled:opacity-60"
            />
            <button disabled={busy || !input.trim()} aria-label="Send"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow transition-all hover:scale-105 disabled:scale-100 disabled:opacity-40">
              {busy ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
            </button>
          </div>
          <p className="mt-1.5 px-1 text-[11px] text-gray-400">
            AI answers can be wrong - for order changes, refunds or returns please use the Contact us page. Enter to send, Shift+Enter for a new line.
          </p>
        </form>
      </div>
    </AccountLayout>
  );
}
