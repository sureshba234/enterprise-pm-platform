import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { DndContext, type DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetTasksQuery, useCreateTaskMutation, useMoveTaskMutation, useGetOrgMembersQuery, useGenerateTaskSummaryMutation } from '../app/api';
import type { RootState } from '../app/store';
import NotificationBell from './NotificationBell';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useGenerateSprintReportMutation } from '../app/api';

const COLUMNS = [
  { id: 'TODO', label: 'To Do' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'REVIEW', label: 'Review' },
  { id: 'DONE', label: 'Done' },
];

function TaskCard({ task }: { task: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(task.id),
  });
  const [generateSummary, { data: summaryData, isLoading: summaryLoading }] =
    useGenerateTaskSummaryMutation();
  const [showSummary, setShowSummary] = useState(false);

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 }
    : undefined;

  const handleSummarize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSummary(true);
    await generateSummary(task.id);
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`bg-slate-700 p-3 rounded-lg mb-2 cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex justify-between items-start">
        <p className="text-sm font-medium">{task.title}</p>
        <button
          onClick={handleSummarize}
          onPointerDown={(e) => e.stopPropagation()}
          className="text-xs text-purple-400 hover:text-purple-300 flex-shrink-0 ml-2"
        >
          ✨
        </button>
      </div>
      <p className="text-xs text-slate-400 mt-1">{task.priority}</p>

      {showSummary && (
        <div className="mt-2 pt-2 border-t border-slate-600 text-xs text-slate-300">
          {summaryLoading && <p className="text-slate-500">Thinking...</p>}
          {summaryData && <p className="whitespace-pre-wrap">{summaryData.summary}</p>}
        </div>
      )}
{task.description && (
  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
)}
    </div>
  );
}
function Column({ id, label, tasks }: { id: string; label: string; tasks: any[] }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`bg-slate-800 rounded-lg p-3 w-64 flex-shrink-0 ${
        isOver ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <h3 className="text-sm font-semibold text-slate-300 mb-3">
        {label} <span className="text-slate-500">({tasks.length})</span>
      </h3>
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}

export default function ProjectPage() {
  const { projectId } = useParams();
  const id = Number(projectId);
  const { data: tasks, isLoading } = useGetTasksQuery(id);
  const [createTask] = useCreateTaskMutation();
  const [moveTask] = useMoveTaskMutation();
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const selectedOrgId = useSelector((state: RootState) => state.org.selectedOrgId);
  const { data: members } = useGetOrgMembersQuery(selectedOrgId!, { skip: !selectedOrgId });
  const [assigneeId, setAssigneeId] = useState<string>('');

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await createTask({
      projectId: id,
      title: newTitle,
      description: newDescription,
      assignee: assigneeId ? Number(assigneeId) : null,
    });
    setNewTitle('');
    setNewDescription('');
    setAssigneeId('');
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = Number(active.id);
    const newStatus = String(over.id);
    const task = tasks?.find((t: any) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    moveTask({ taskId, status: newStatus, order: 0 });
  };
  const [generateSprintReport, { data: reportData, isLoading: reportLoading, error: reportError }] =
  useGenerateSprintReportMutation();
const [showReport, setShowReport] = useState(false);

const handleGenerateReport = async () => {
  setShowReport(true);
  await generateSprintReport(id);
};

  if (isLoading) {
    return <div className="min-h-screen bg-slate-900 text-white p-8">Loading tasks...</div>;
  }

  return (
     <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="flex gap-4 mb-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          <Link to="/dashboard" className="text-sm text-blue-400 hover:underline">Dashboard</Link>
          <Link to="/chat" className="text-sm text-blue-400 hover:underline">Chat</Link>
          <Link to={`/projects/${id}`} className="text-sm text-blue-400 hover:underline">Kanban</Link>
          <Link to={`/projects/${id}/notes`} className="text-sm text-blue-400 hover:underline">Notes</Link>
        </div>
        <NotificationBell />
      </div>
      <h1 className="text-2xl font-bold mb-6">Kanban Board</h1>
      <button
  onClick={handleGenerateReport}
  className="mb-6 px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-sm"
>
  ✨ Generate AI Sprint Report
</button>

{showReport && (
  <div className="mb-6 bg-slate-800 rounded-lg p-4 relative">
    <button
      onClick={() => setShowReport(false)}
      className="absolute top-3 right-3 text-slate-500 hover:text-white text-sm"
    >
      ✕
    </button>
    <h2 className="text-lg font-semibold mb-3">Sprint Report</h2>
    {reportLoading && <p className="text-slate-400 text-sm">Generating report...</p>}
    {reportError && <p className="text-red-400 text-sm">Failed to generate report. Try again.</p>}
    {reportData && (
      <div className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{reportData.report}</ReactMarkdown>
      </div>
    )}
  </div>
)}

      <form onSubmit={handleCreateTask} className="flex flex-col gap-2 mb-6">
        <div className="flex gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New task title"
            className="flex-1 px-3 py-2 rounded bg-slate-800 border border-slate-600 text-sm focus:outline-none focus:border-blue-500"
          />
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="px-3 py-2 rounded bg-slate-800 border border-slate-600 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Unassigned</option>
            {members?.map((m: any) => (
              <option key={m.user} value={m.user}>{m.user_email}</option>
            ))}
          </select>
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-sm">
            Add
          </button>
        </div>
        <textarea
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="px-3 py-2 rounded bg-slate-800 border border-slate-600 text-sm focus:outline-none focus:border-blue-500 resize-none"
        />
      </form>
      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              id={col.id}
              label={col.label}
              tasks={tasks?.filter((t: any) => t.status === col.id) || []}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}