import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { DndContext, type DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { useGetTasksQuery, useCreateTaskMutation, useMoveTaskMutation } from '../app/api';

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

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 }
    : undefined;

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
      <p className="text-sm font-medium">{task.title}</p>
      <p className="text-xs text-slate-400 mt-1">{task.priority}</p>
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

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await createTask({ projectId: id, title: newTitle });
    setNewTitle('');
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

  if (isLoading) {
    return <div className="min-h-screen bg-slate-900 text-white p-8">Loading tasks...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Kanban Board</h1>

      <form onSubmit={handleCreateTask} className="flex gap-2 mb-6">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New task title"
          className="px-3 py-2 rounded bg-slate-800 border border-slate-600 text-sm flex-1 max-w-sm focus:outline-none focus:border-blue-500"
        />
        <button type="submit" className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-sm">
          + Add Task
        </button>
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