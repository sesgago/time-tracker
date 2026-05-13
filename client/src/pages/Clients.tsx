import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../lib/api';
import { Building2, Plus, Edit3, Trash2 } from 'lucide-react';

interface Client {
  id: number;
  name: string;
  phone?: string;
  notes?: string;
  _count: { sectors: number; users: number; tasks: number };
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    setClients(await apiRequest<Client[]>('/clients'));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setName(''); setPhone(''); setNotes('');
    setShowModal(true);
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setName(c.name); setPhone(c.phone || ''); setNotes(c.notes || '');
    setShowModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await apiRequest(`/clients/${editing.id}`, { method: 'PUT', body: { name, phone, notes } });
    } else {
      await apiRequest('/clients', { method: 'POST', body: { name, phone, notes } });
    }
    setShowModal(false);
    load();
  };

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar cliente?')) return;
    await apiRequest(`/clients/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> Nuevo cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((c) => (
          <div key={c.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-slate-900">{c.name}</h3>
                  {c.phone && <p className="text-sm text-slate-500">{c.phone}</p>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)} className="p-1.5 text-slate-400 hover:text-blue-600 transition"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => remove(c.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex gap-4 text-sm text-slate-500">
              <span>{c._count.sectors} sectores</span>
              <span>{c._count.users} usuarios</span>
              <span>{c._count.tasks} tareas</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Editar cliente' : 'Nuevo cliente'}</h2>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={3} />
              </div>
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
