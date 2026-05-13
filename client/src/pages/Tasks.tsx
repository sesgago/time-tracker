import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../lib/api';
import { Plus, Edit3, Trash2, ListTodo } from 'lucide-react';

interface Task {
  id: number;
  description: string;
  status: string;
  priority: string;
  client: { id: number; name: string };
  assigned: { id: number; name: string };
  createdAt: string;
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('pending');

  const load = useCallback(async () => {
    setTasks(await apiRequest<Task[]>('/tasks'));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setDescription(''); setPriority('medium'); setStatus('pending');
    setShowModal(true);
  };

  const openEdit = (t: Task) => {
    setEditing(t);
    setDescription(t.description); setPriority(t.priority); setStatus(t.status);
    setShowModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await apiRequest(`/tasks/${editing.id}`, { method: 'PUT', body: { description, priority, status } });
    } else {
      await apiRequest('/tasks', { method: 'POST', body: { description, priority, clientId: 1 } });
    }
    setShowModal(false);
    load();
  };

  const updateStatus = async (id: number, newStatus: string) => {
    await apiRequest(`/tasks/${id}`, { method: 'PUT', body: { status: newStatus } });
    load();
  };

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar tarea?')) return;
    await apiRequest(`/tasks/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Tareas</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> Nueva tarea
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {tasks.length === 0 ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
            <ListTodo className="w-8 h-8" />
            <p>Sin tareas</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Descripción</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Cliente</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Estado</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Prioridad</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{t.description}</td>
                  <td className="px-4 py-3 text-slate-600">{t.client?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value)} className="text-xs px-2 py-1 rounded-full border border-slate-300 outline-none">
                      <option value="pending">Pendiente</option>
                      <option value="in_progress">En progreso</option>
                      <option value="completed">Completada</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${t.priority === 'high' ? 'bg-red-100 text-red-700' : t.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(t)} className="p-1.5 text-slate-400 hover:text-blue-600 transition"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => remove(t.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Editar tarea' : 'Nueva tarea'}</h2>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prioridad</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>
              {editing && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En progreso</option>
                    <option value="completed">Completada</option>
                  </select>
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:text-slate-900 transition">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
