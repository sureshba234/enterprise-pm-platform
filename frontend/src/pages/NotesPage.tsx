import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  useGetNotesQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} from '../app/api';
import NotificationBell from './NotificationBell';

interface NoteItem {
  id: number;
  title: string;
  content: string;
  updated_at: string;
}

export default function NotesPage() {
  const { projectId } = useParams();
  const id = Number(projectId);

  const { data: notes, isLoading } = useGetNotesQuery(id);
  const [createNote] = useCreateNoteMutation();
  const [updateNote] = useUpdateNoteMutation();
  const [deleteNote] = useDeleteNoteMutation();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [saving, setSaving] = useState(false);

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (notes && notes.length > 0 && selectedId === null) {
      setSelectedId(notes[0].id);
    }
  }, [notes, selectedId]);

  useEffect(() => {
    const note = notes?.find((n: NoteItem) => n.id === selectedId);
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [selectedId, notes]);

  const scheduleSave = (nextTitle: string, nextContent: string) => {
    if (!selectedId) return;
    setSaving(true);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      await updateNote({ noteId: selectedId, title: nextTitle, content: nextContent });
      setSaving(false);
    }, 800);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    scheduleSave(e.target.value, content);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    scheduleSave(title, e.target.value);
  };

  const handleNewNote = async () => {
    const result = await createNote({ projectId: id, title: 'Untitled', content: '' }).unwrap();
    setSelectedId(result.id);
  };

  const handleDelete = async (noteId: number) => {
    await deleteNote(noteId);
    if (selectedId === noteId) setSelectedId(null);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-900 text-white p-8">Loading notes...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="flex gap-4 mb-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          <Link to="/dashboard" className="text-sm text-blue-400 hover:underline">Dashboard</Link>
          <Link to="/chat" className="text-sm text-blue-400 hover:underline">Chat</Link>
          <Link to={`/projects/${id}`} className="text-sm text-blue-400 hover:underline">Kanban</Link>
        </div>
        <NotificationBell />
      </div>

      <h1 className="text-2xl font-bold mb-6">Notes</h1>

      <div className="flex gap-4 h-[70vh]">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 bg-slate-800 rounded-lg p-3 overflow-y-auto">
          <button
            onClick={handleNewNote}
            className="w-full mb-3 px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-sm"
          >
            + New note
          </button>
          {notes?.length === 0 && (
            <p className="text-slate-500 text-sm">No notes yet.</p>
          )}
          {notes?.map((note: NoteItem) => (
            <div
              key={note.id}
              onClick={() => setSelectedId(note.id)}
              className={`group flex items-center justify-between px-3 py-2 rounded cursor-pointer mb-1 ${
                selectedId === note.id ? 'bg-slate-700' : 'hover:bg-slate-700/50'
              }`}
            >
              <span className="text-sm truncate">{note.title || 'Untitled'}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(note.id);
                }}
                className="text-slate-500 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Editor / Preview */}
        <div className="flex-1 bg-slate-800 rounded-lg p-4 flex flex-col">
          {!selectedId ? (
            <p className="text-slate-500 text-sm">Select or create a note to get started.</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <input
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="Untitled"
                  className="text-xl font-bold bg-transparent focus:outline-none flex-1"
                />
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{saving ? 'Saving...' : 'Saved'}</span>
                  <button
                    onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
                    className="text-xs px-3 py-1 rounded bg-slate-700 hover:bg-slate-600"
                  >
                    {mode === 'edit' ? 'Preview' : 'Edit'}
                  </button>
                </div>
              </div>

              {mode === 'edit' ? (
                <textarea
                  value={content}
                  onChange={handleContentChange}
                  placeholder="Write markdown here..."
                  className="flex-1 bg-slate-900 rounded p-3 text-sm font-mono resize-none focus:outline-none border border-slate-700 focus:border-blue-500"
                />
              ) : (
                <div className="flex-1 bg-slate-900 rounded p-3 overflow-y-auto prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}