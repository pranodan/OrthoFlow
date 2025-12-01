import React, { useState, useEffect } from 'react';
import { loadState, saveState } from './services/storage';
import { AppState, User, Patient, UserRole, ExamData } from './types';
import { Login } from './components/Auth';
import { ExamForm } from './components/ExamForm';
import { PrintView } from './components/PrintView';
import { LogOut, User as UserIcon, Calendar, Search, Plus } from 'lucide-react';

// --- Subcomponents within App for file constraint management ---

const RegistrationModal = ({ 
  isOpen, 
  onClose, 
  consultants, 
  onRegister 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  consultants: User[]; 
  onRegister: (p: Partial<Patient>) => void; 
}) => {
  const [data, setData] = useState({ name: '', age: '', gender: 'Male', mobile: '', address: '', consultantId: consultants[0]?.id || '' });
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">New Patient Registration</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium">Full Name</label>
            <input type="text" className="w-full border p-2 rounded" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium">Age</label>
            <input type="number" className="w-full border p-2 rounded" value={data.age} onChange={e => setData({...data, age: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium">Gender</label>
            <select className="w-full border p-2 rounded" value={data.gender} onChange={e => setData({...data, gender: e.target.value})}>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Mobile</label>
            <input type="text" className="w-full border p-2 rounded" value={data.mobile} onChange={e => setData({...data, mobile: e.target.value})} />
          </div>
          <div>
             <label className="block text-sm font-medium">Consultant</label>
             <select className="w-full border p-2 rounded" value={data.consultantId} onChange={e => setData({...data, consultantId: e.target.value})}>
               {consultants.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
             </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium">Address</label>
            <textarea className="w-full border p-2 rounded h-20" value={data.address} onChange={e => setData({...data, address: e.target.value})}></textarea>
          </div>
          <div className="col-span-2 text-sm text-gray-500">
            Date: {new Date().toLocaleDateString()} (Today)
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
          <button onClick={() => {
            if(!data.name) return alert("Name required");
            onRegister(data as any);
          }} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Register Patient</button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [state, setState] = useState<AppState>(loadState());
  const [view, setView] = useState<'LOGIN' | 'DASHBOARD' | 'EXAM' | 'PRINT'>('LOGIN');
  
  // Dashboard UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [patientFilter, setPatientFilter] = useState<'ALL' | 'MY'>('MY');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isRegModalOpen, setRegModalOpen] = useState(false);
  
  // Exam/Print State
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [completedExamData, setCompletedExamData] = useState<ExamData | null>(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const handleLogin = (user: User) => {
    setState(prev => ({ ...prev, currentUser: user }));
    setView('DASHBOARD');
    // Default filter logic: Receptionist sees all, Consultant sees theirs
    setPatientFilter(user.role === UserRole.RECEPTIONIST ? 'ALL' : 'MY');
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
    setView('LOGIN');
  };

  const registerPatient = (pData: Partial<Patient>) => {
    const newPatient: Patient = {
      ...pData as any,
      id: `P-${Date.now().toString().slice(-6)}`,
      regDate: new Date().toISOString().split('T')[0],
      status: 'waiting'
    };
    setState(prev => ({ ...prev, patients: [newPatient, ...prev.patients] }));
    setRegModalOpen(false);
  };

  const toggleStatus = (pid: string, newStatus: 'received' | 'deferred') => {
    if (state.currentUser?.role !== UserRole.CONSULTANT) return;
    setState(prev => ({
      ...prev,
      patients: prev.patients.map(p => p.id === pid ? { ...p, status: p.status === newStatus ? 'waiting' : newStatus } : p)
    }));
  };

  const proceedToExam = () => {
    if (!selectedPatientId) {
      alert("Please select a patient from the list.");
      return;
    }
    const p = state.patients.find(pt => pt.id === selectedPatientId);
    if (!p) return;
    setActivePatient(p);
    setView('EXAM');
  };

  const handleSaveExam = (data: ExamData) => {
    setState(prev => ({
      ...prev,
      visits: [...prev.visits, data],
      patients: prev.patients.map(p => p.id === data.patientId ? { ...p, status: 'completed' } : p)
    }));
    setCompletedExamData(data);
    setView('PRINT');
  };

  // Filter Logic
  const filteredPatients = state.patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.includes(searchQuery);
    const matchesDate = p.regDate >= dateFrom && p.regDate <= dateTo;
    
    let matchesRole = true;
    if (patientFilter === 'MY' && state.currentUser?.role === UserRole.CONSULTANT) {
      matchesRole = p.consultantId === state.currentUser.id;
    }

    return matchesSearch && matchesDate && matchesRole;
  });

  const getRowColor = (status: string, isSelected: boolean) => {
    if (isSelected) return 'bg-blue-100 border-blue-500';
    if (status === 'received') return 'bg-green-100';
    if (status === 'deferred') return 'bg-yellow-100';
    if (status === 'completed') return 'bg-gray-200 text-gray-500';
    return 'bg-white hover:bg-gray-50';
  };

  if (view === 'LOGIN') return <Login users={state.users} onLogin={handleLogin} />;

  if (view === 'PRINT' && activePatient && completedExamData && state.currentUser) {
    return <PrintView 
              patient={activePatient} 
              data={completedExamData} 
              consultant={state.currentUser} 
              onClose={() => setView('DASHBOARD')} 
           />;
  }

  if (view === 'EXAM' && activePatient && state.currentUser) {
    const prevVisits = state.visits.filter(v => v.patientId === activePatient.id);
    return <ExamForm 
              patient={activePatient} 
              consultant={state.currentUser} 
              previousVisits={prevVisits} 
              onSave={handleSaveExam}
              onCancel={() => setView('DASHBOARD')}
           />;
  }

  // DASHBOARD VIEW
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Navbar */}
      <nav className="bg-white shadow px-6 py-3 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">M</div>
           <span className="text-xl font-bold text-gray-800 tracking-tight">MediFlow</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col text-right">
             <span className="text-sm font-bold text-gray-800">{state.currentUser?.fullName}</span>
             <span className="text-xs text-gray-500 uppercase">{state.currentUser?.role}</span>
          </div>
          <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-full text-gray-600" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* Toolbar */}
      <div className="bg-white border-b px-6 py-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setRegModalOpen(true)}
             className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
           >
             <Plus size={18} /> New Patient
           </button>
           <button 
             onClick={proceedToExam}
             className={`flex items-center gap-2 px-4 py-2 rounded shadow transition border ${selectedPatientId ? 'bg-emerald-600 text-white hover:bg-emerald-700 border-transparent' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}`}
           >
             Proceed to Exam
           </button>
        </div>

        <div className="flex items-center gap-4 flex-1 justify-end">
           <div className="relative">
             <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
             <input 
               type="text" 
               placeholder="Search Name or ID..." 
               className="pl-9 pr-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none w-64"
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
             />
           </div>
           <div className="flex items-center gap-2 bg-white border rounded p-1">
             <Calendar size={16} className="text-gray-500 ml-2" />
             <input type="date" className="text-sm outline-none" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
             <span className="text-gray-400">-</span>
             <input type="date" className="text-sm outline-none" value={dateTo} onChange={e => setDateTo(e.target.value)} />
           </div>
           
           <div className="flex bg-gray-200 p-1 rounded">
             <button 
                onClick={() => setPatientFilter('ALL')}
                className={`px-3 py-1 text-sm rounded ${patientFilter === 'ALL' ? 'bg-white shadow text-blue-600 font-medium' : 'text-gray-600'}`}
             >
               All Patients
             </button>
             <button 
                onClick={() => setPatientFilter('MY')}
                className={`px-3 py-1 text-sm rounded ${patientFilter === 'MY' ? 'bg-white shadow text-blue-600 font-medium' : 'text-gray-600'}`}
             >
               My Patients
             </button>
           </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded shadow border overflow-hidden">
           <table className="w-full text-left border-collapse">
             <thead className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
               <tr>
                 <th className="p-4 font-semibold border-b">ID</th>
                 <th className="p-4 font-semibold border-b">Name</th>
                 <th className="p-4 font-semibold border-b">Age/Sex</th>
                 <th className="p-4 font-semibold border-b">Date</th>
                 <th className="p-4 font-semibold border-b">Mobile</th>
                 <th className="p-4 font-semibold border-b">Consultant</th>
                 <th className="p-4 font-semibold border-b text-center">Action</th>
               </tr>
             </thead>
             <tbody className="text-sm text-gray-700">
               {filteredPatients.length === 0 ? (
                 <tr>
                   <td colSpan={7} className="p-8 text-center text-gray-400">No patients found for selected criteria.</td>
                 </tr>
               ) : (
                 filteredPatients.map(p => (
                   <tr 
                     key={p.id} 
                     onClick={() => setSelectedPatientId(p.id)}
                     className={`cursor-pointer border-b last:border-0 transition-colors ${getRowColor(p.status, selectedPatientId === p.id)}`}
                   >
                     <td className="p-4 font-mono">{p.id}</td>
                     <td className="p-4 font-medium">{p.name}</td>
                     <td className="p-4">{p.age} / {p.gender}</td>
                     <td className="p-4">{p.regDate}</td>
                     <td className="p-4">{p.mobile}</td>
                     <td className="p-4">
                        {state.users.find(u => u.id === p.consultantId)?.fullName || 'Unknown'}
                     </td>
                     <td className="p-4 flex justify-center gap-2">
                       {state.currentUser?.role === UserRole.CONSULTANT && p.status !== 'completed' && (
                         <>
                           <button 
                             onClick={(e) => { e.stopPropagation(); toggleStatus(p.id, 'received'); }}
                             className={`px-3 py-1 rounded text-xs border font-medium ${p.status === 'received' ? 'bg-green-600 text-white' : 'border-green-600 text-green-600 hover:bg-green-50'}`}
                           >
                             Receive
                           </button>
                           <button 
                             onClick={(e) => { e.stopPropagation(); toggleStatus(p.id, 'deferred'); }}
                             className={`px-3 py-1 rounded text-xs border font-medium ${p.status === 'deferred' ? 'bg-yellow-500 text-white' : 'border-yellow-600 text-yellow-600 hover:bg-yellow-50'}`}
                           >
                             Defer
                           </button>
                         </>
                       )}
                       {p.status === 'completed' && <span className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded">Completed</span>}
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
        </div>
      </div>

      <RegistrationModal 
        isOpen={isRegModalOpen} 
        onClose={() => setRegModalOpen(false)} 
        consultants={state.users.filter(u => u.role === UserRole.CONSULTANT)}
        onRegister={registerPatient}
      />
    </div>
  );
}