import { useState } from 'react';
import { useGetCommentsQuery, useAddCommentMutation, useDeleteCommentMutation } from '../app/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  taskId: number;
  currentUserEmail: string;
}

export default function TaskComments({ taskId, currentUserEmail }: Props) {
  const { data: comments, isLoading } = useGetCommentsQuery(taskId);
  const [addComment] = useAddCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [body, setBody] = useState('');
  const [preview, setPreview] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    await addComment({ taskId, body });
    setBody('');
    setPreview(false);
  };

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">
        Comments {comments && `(${comments.length})`}
      </h3>

      {isLoading && <p className="text-slate-500 text-xs">Loading...</p>}

      {/* Comment list */}
      <div className="space-y-3 mb-4">
        {comments?.map((comment: any) => (
          <div key={comment.id} className="bg-slate-700 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-blue-400">{comment.author_email}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {new Date(comment.created_at).toLocaleString()}
                </span>
                {comment.author_email === currentUserEmail && (
                  <button
                    onClick={() => deleteComment(comment.id)}
                    className="text-xs text-slate-500 hover:text-red-400"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            <div className="prose prose-invert prose-xs max-w-none text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.body}</ReactMarkdown>
            </div>
          </div>
        ))}
        {comments?.length === 0 && (
          <p className="text-slate-500 text-xs">No comments yet. Be the first.</p>
        )}
      </div>

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex gap-2 mb-1">
          <button
            type="button"
            onClick={() => setPreview(false)}
            className={`text-xs px-2 py-1 rounded ${!preview ? 'bg-slate-600' : 'text-slate-400 hover:text-white'}`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setPreview(true)}
            className={`text-xs px-2 py-1 rounded ${preview ? 'bg-slate-600' : 'text-slate-400 hover:text-white'}`}
          >
            Preview
          </button>
        </div>

        {preview ? (
          <div className="min-h-[80px] bg-slate-900 rounded p-3 prose prose-invert prose-sm max-w-none border border-slate-700">
            {body ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
            ) : (
              <p className="text-slate-500 text-xs">Nothing to preview.</p>
            )}
          </div>
        ) : (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Leave a comment... (markdown supported)"
            rows={3}
            className="bg-slate-900 rounded p-3 text-sm font-mono resize-none focus:outline-none border border-slate-700 focus:border-blue-500"
          />
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!body.trim()}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-sm disabled:opacity-40"
          >
            Comment
          </button>
        </div>
      </form>
    </div>
  );
}