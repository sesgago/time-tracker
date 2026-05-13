import { NavLink } from 'react-router-dom';
import { Clock, LayoutDashboard, Building2, Users, Ticket, ListTodo, LogOut } from 'lucide-react';
import { useAuth } from '../../lib/auth';

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Clock className="w-6 h-6" />
          TimeTracker
        </h1>
        <p className="text-slate-400 text-sm mt-1">{user?.name}</p>
      </div>
      <nav className="flex-1 space-y-1">
        <NavLink to="/" end className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
          <LayoutDashboard className="w-5 h-5" /> Dashboard
        </NavLink>
        {user?.role === 'admin' && (
          <>
            <NavLink to="/clients" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              <Building2 className="w-5 h-5" /> Clientes
            </NavLink>
            <NavLink to="/client-users" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              <Users className="w-5 h-5" /> Usuarios Cliente
            </NavLink>
          </>
        )}
        <NavLink to="/tasks" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
          <ListTodo className="w-5 h-5" /> Tareas
        </NavLink>
        <NavLink to="/tickets" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
          <Ticket className="w-5 h-5" /> Tickets
        </NavLink>
      </nav>
      <button onClick={logout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition mt-auto">
        <LogOut className="w-5 h-5" /> Cerrar sesión
      </button>
    </aside>
  );
}
