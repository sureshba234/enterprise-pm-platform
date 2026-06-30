import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetMessagesQuery } from '../app/api';
import type { RootState } from '../app/store';

interface ChatMessage {
  id: number;
  content: string;
  sender_email: string;
  sender_name: string;
  created_at: string;
}

export default function ChatPage() {
  const selectedOrgId = useSelector((state: RootState) => state.org.selectedOrgId);
  const { data: history } = useGetMessagesQuery(selectedOrgId!, { skip: !selectedOrgId });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Load history into local state once it arrives
  useEffect(() => {
    if (history) {
      setMessages(history);
    }
  }, [history]);

  // Open the WebSocket connection whenever the selected org changes
  useEffect(() => {
    if (!selectedOrgId) return;

    const token = localStorage.getItem('access');
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${selectedOrgId}/?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };

    return () => {
      ws.close();
    };
  }, [selectedOrgId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({ message: input }));
    setInput('');
  };

  if (!selectedOrgId) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8">
        <div className="flex gap-4 mb-4">
        <Link to="/dashboard" className="text-sm text-blue-400 hover:underline">Dashboard</Link>
        <Link to="/chat" className="text-sm text-blue-400 hover:underline">Chat</Link>
      </div>
        Select an organization from the Dashboard first.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Team Chat</h1>
        <span className={`text-xs px-2 py-1 rounded ${connected ? 'bg-green-700' : 'bg-red-700'}`}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <div className="flex-1 bg-slate-800 rounded-lg p-4 overflow-y-auto mb-4 max-h-[60vh]">
        {messages.length === 0 && (
          <p className="text-slate-500 text-sm">No messages yet. Say something!</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="mb-3">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-sm">{msg.sender_name}</span>
              <span className="text-xs text-slate-500">
                {new Date(msg.created_at).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-slate-200">{msg.content}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 rounded bg-slate-800 border border-slate-600 focus:outline-none focus:border-blue-500"
        />
        <button type="submit" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700">
          Send
        </button>
      </form>
    </div>
  );
}