import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../lib/api';
import { Play, Square, Clock, ListTodo, TrendingUp } from 'lucide-react';

interface Client {
  id: number;
  name: string;
}

interface Task {
  id: number;
  description: string;
  status: string;
  priority: string;
  client: { id: number; name: string };
}

interface TimeEntry {
  id: number;
  startTime: string;
  endTime?: string;
  duration?: number;
  description?: string;
  client: { id: number; name: string };
}

interface DashboardData {
  todayEntries: TimeEntry[];
  todayDuration: number;
  weekDuration: number;
  activeEntry: TimeEntry | null;
  pendingTasks: Task[];
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [elapsed, setElapsed] = useState(0);

  const load = useCallback(async () => {
    const [d, c] = await Promise.all([
      apiRequest<DashboardData>('/dashboard'),
      apiRequest<Client[]>('/clients'),
    ]);
    setData(d);
    setClients(c);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (data?.activeEntry) {
      const start = new Date(data.activeEntry.startTime).getTime();
      const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
      tick();
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsed(0);
    }
  }, [data?.activeEntry]);

  const startTimer = async () => {
    if (!selectedClient) return;
    await apiRequest('/time-entries/start', {
      method: 'POST',
      body: { clientId: Number(selectedClient), description: taskDesc },
    });
    setTaskDesc('');
    load();
  };

  const stopTimer = async () => {
    await apiRequest('/time-entries/stop', { method: 'POST' });
    load();
  };

  if (!data) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 text-blue-600 mb-2">
            <Clock className="w-5 h-5" />
            <h2 className="font-semibold text-slate-900">Hoy</h2>
          </div>
          <p className="text-3xl font-bold">{formatDuration(data.todayDuration)}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 text-green-600 mb-2">
            <TrendingUp className="w-5 h-5" />
            <h2 className="font-semibold text-slate-900">Semana</h2>
          </div>
          <p className="text-3xl font-bold">{formatDuration(data.weekDuration)}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 text-purple-600 mb-2">
            <ListTodo className="w-5 h-5" />
            <h2 className="font-semibold text-slate-900">Pendientes</h2>
          </div>
          <p className="text-3xl font-bold">{data.pendingTasks.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Timer</h2>
        {data.activeEntry ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">{data.activeEntry.client.name}</p>
                <p className="text-sm text-slate-500">{data.activeEntry.description || 'Sin descripción'}</p>
              </div>
              <div className="text-2xl font-mono font-bold text-blue-600">{formatDuration(elapsed)}</div>
            </div>
            <button onClick={stopTimer} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">
              <Square className="w-4 h-4" /> Detener
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Seleccionar cliente</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="text" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder="Descripción de la tarea (opcional)" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            <button onClick={startTimer} disabled={!selectedClient} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
              <Play className="w-4 h-4" /> Iniciar
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Entradas de hoy</h2>
          {data.todayEntries.length === 0 ? (
            <p className="text-slate-400 text-sm">Sin registros hoy</p>
          ) : (
            <div className="space-y-3">
              {data.todayEntries.map((e) => (
                <div key={e.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{e.client.name}</p>
                    <p className="text-sm text-slate-500">{e.description || 'Sin descripción'}</p>
                  </div>
                  <p className="text-sm font-mono text-slate-600">
                    {new Date(e.startTime).toLocaleTimeString()} {e.duration ? `(${formatDuration(e.duration)})` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Tareas pendientes</h2>
          {data.pendingTasks.length === 0 ? (
            <p className="text-slate-400 text-sm">Sin tareas pendientes</p>
          ) : (
            <div className="space-y-3">
              {data.pendingTasks.map((t) => (
                <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{t.description}</p>
                    <p className="text-sm text-slate-500">{t.client.name}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${t.priority === 'high' ? 'bg-red-100 text-red-700' : t.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {t.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
