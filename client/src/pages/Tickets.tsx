import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../lib/api';
import { Plus, Ticket } from 'lucide-react';

interface TicketData {
  id: number;
  subject: string;
  description: string;
  status: string;
  client: { id: number; name: string };
  sector?: { id: number; name: string } | null;
  creator: { id: number; name: string };
  technician?: { id: number; name: string } | null;
  createdAt: string;
}

export default function Tickets() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const load = useCallback(async () => {
    setTickets(await apiRequest<TicketData[]>('/tickets'));
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiRequest('/tickets', { method: 'POST', body: { subject, description, clientId: 1 } });
    setShowModal(false);
    setSubject(''); setDescription('');
    load();
  };

  const updateStatus = async (id: number, status: string) => {
    await apiRequest(`/tickets/${id}`, { method: 'PUT', body: { status } });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Tickets</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> Nuevo ticket
        </button>
      </div>

      <div className="space-y-4">
        {tickets.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-400 flex flex-col items-center gap-2 shadow-sm border border-slate-200">
            <Ticket className="w-8 h-8" />
            <p>Sin tickets</p>
          </div>
        ) : tickets.map((t) => (
          <div key={t.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-slate-900">{t.subject}</h3>
                <p className="text-sm text-slate-500">{t.client.name} {t.sector ? `- ${t.sector.name}` : ''}</p>
              </div>
              <select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value)} className="text-xs px-2 py-1 rounded-full border border-slate-300 outline-none">
                <option value="open">Abierto</option>
                <option value="in_progress">En progreso</option>
                <option value="resolved">Resuelto</option>
                <option value="closed">Cerrado</option>
              </select>
            </div>
            <p className="text-sm text-slate-600 mb-2">{t.description}</p>
            <div className="flex gap-4 text-xs text-slate-400">
              <span>Creado por: {t.creator.name}</span>
              <span>{new Date(t.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Nuevo ticket</h2>
            <form onSubmit={create} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Asunto</label>
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={4} />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:text-slate-900 transition">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
