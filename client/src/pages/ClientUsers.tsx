import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../lib/api';
import { Plus, Edit3, Trash2, Users } from 'lucide-react';

interface Client {
  id: number;
  name: string;
}

interface Sector {
  id: number;
  name: string;
}

interface ClientUser {
  id: number;
  name: string;
  email: string;
  role: string;
  clientId: number;
  sectorId?: number | null;
  sector?: { id: number; name: string } | null;
}

export default function ClientUsers() {
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ClientUser | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('basic');
  const [clientId, setClientId] = useState('');
  const [sectorId, setSectorId] = useState('');

  const loadClients = useCallback(async () => {
    setClients(await apiRequest<Client[]>('/clients'));
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);

  const loadUsers = useCallback(async (cid: string) => {
    if (!cid) { setUsers([]); return; }
    const [u, s] = await Promise.all([
      apiRequest<ClientUser[]>(`/client-users/${cid}`),
      apiRequest<Sector[]>(`/sectors/${cid}`),
    ]);
    setUsers(u);
    setSectors(s);
  }, []);

  useEffect(() => { loadUsers(selectedClient); }, [selectedClient, loadUsers]);

  const openCreate = () => {
    setEditing(null);
    setName(''); setEmail(''); setPassword(''); setRole('basic'); setSectorId('');
    setClientId(selectedClient);
    setShowModal(true);
  };

  const openEdit = (u: ClientUser) => {
    setEditing(u);
    setName(u.name); setEmail(u.email); setPassword(''); setRole(u.role);
    setClientId(String(u.clientId)); setSectorId(u.sectorId ? String(u.sectorId) : '');
    setShowModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: any = { name, email, role, clientId: Number(clientId), sectorId: sectorId ? Number(sectorId) : null };
    if (editing) {
      await apiRequest(`/client-users/${editing.id}`, { method: 'PUT', body });
    } else {
      body.password = password;
      await apiRequest('/client-users', { method: 'POST', body });
    }
    setShowModal(false);
    loadUsers(selectedClient);
  };

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar usuario?')) return;
    await apiRequest(`/client-users/${id}`, { method: 'DELETE' });
    loadUsers(selectedClient);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Usuarios de Cliente</h1>
        {selectedClient && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            <Plus className="w-4 h-4" /> Nuevo usuario
          </button>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Seleccionar cliente</label>
        <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">-- Seleccionar --</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {selectedClient && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {users.length === 0 ? (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
              <Users className="w-8 h-8" />
              <p>Sin usuarios para este cliente</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Nombre</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Rol</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Sector</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'sector_manager' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                        {u.role === 'admin' ? 'Admin' : u.role === 'sector_manager' ? 'Sector Manager' : 'Básico'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.sector?.name || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-slate-400 hover:text-blue-600 transition"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => remove(u.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Editar usuario' : 'Nuevo usuario'}</h2>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              {!editing && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required={!editing} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="basic">Básico</option>
                  <option value="sector_manager">Sector Manager</option>
                  <option value="admin">Admin Cliente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sector</label>
                <select value={sectorId} onChange={(e) => setSectorId(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Sin sector</option>
                  {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
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
