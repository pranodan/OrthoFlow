import React, { useState, useEffect } from 'react';
import { loadConfig, saveConfig, clearConfig, AppConfig } from './services/storage';
import { hasHardcodedConfig } from './config';
import { 
  initFirebase, 
  subscribePatients, 
  subscribeVisits, 
  addPatientToDb, 
  updatePatientStatusInDb, 
  addVisitToDb,
  subscribeUsers,
  addUserToDb,
  deleteUserFromDb,
  seedDefaultUserIfNeeded
} from './services/firebase';
import { User, Patient, UserRole, ExamData } from './types';
import { Login } from './components/Auth';
import { ExamForm } from './components/ExamForm';
import { PrintView } from './components/PrintView';
import { LogOut, User as UserIcon, Calendar, Search, Plus, Database, Settings, Users } from 'lucide-react';

// --- Location Data for Nepal ---
const NEPAL_LOCATIONS: Record<string, Record<string, string[]>> = {
  "Koshi": {
    "Jhapa": ["Bhadrapur", "Birtamod", "Damak", "Mechinagar", "Arjundhara", "Kankai", "Shivasatakshi", "Gauradaha"],
    "Morang": ["Biratnagar", "Belbari", "Sundarharaincha", "Pathari Sanischare", "Rangeli", "Urlabari", "Ratuwamai", "Sunwirshi", "Letang"],
    "Sunsari": ["Dharan", "Itahari", "Inaruwa", "Duhabi", "Ramdhuni", "Barahachhetra"],
    "Ilam": ["Ilam", "Deumai", "Mai", "Suryodaya"],
    "Dhankuta": ["Dhankuta", "Pakhribas", "Mahalaxmi"],
    "Udayapur": ["Triyuga", "Katari", "Chaudandigadhi", "Belaka"]
  },
  "Madhesh": {
    "Saptari": ["Rajbiraj", "Kanchanrup", "Dakneshwari", "Bodebarsain", "Khadak", "Shambhunath", "Surunga", "Hanumannagar Kankalini", "Saptakoshi"],
    "Siraha": ["Lahan", "Siraha", "Golbazar", "Mirchaiya", "Karjanha", "Dhangadhimai", "Sukhipur", "Kalyanpur"],
    "Dhanusha": ["Janakpur", "Dhanusadham", "Chhireshwarnath", "Ganeshman Charnath", "Mithila", "Sabaila", "Nagarain", "Videha", "Hansapur", "Kamala", "Mithila Bihari", "Sahidnagar"],
    "Mahottari": ["Jaleshwar", "Bardibas", "Gaushala", "Loharpatti", "Ramgopalpur", "Manara Shiswa", "Matihani", "Bhangaha", "Balawa", "Aurahi"],
    "Sarlahi": ["Malangwa", "Harion", "Bagmati", "Barahathawa", "Godaita", "Balara", "Hariwan", "Ishwarpur", "Lalbandi"],
    "Bara": ["Kalaiya", "Jeetpur Simara", "Kolhabi", "Nijgadh", "Mahagadhimai", "Simraungadh", "Pacharauta"],
    "Parsa": ["Birgunj", "Pokhariya", "Parsagadhi", "Bahudarmai"],
    "Rautahat": ["Gaur", "Chandrapur", "Garuda", "Gujara", "Baudhimai", "Brindaban", "Dewahi Gonahi", "Gadhimai", "Ishanath", "Katahariya", "Madhav Narayan", "Maulapur", "Paroha", "Phatuwa Vijayapur", "Rajdevi", "Rajpur"]
  },
  "Bagmati": {
    "Kathmandu": ["Kathmandu", "Kirtipur", "Tokha", "Budhanilkantha", "Tarakeshwar", "Gokarneshwar", "Chandragiri", "Nagarjun", "Dakshinkali", "Shankharapur"],
    "Lalitpur": ["Lalitpur", "Mahalaxmi", "Godawari"],
    "Bhaktapur": ["Bhaktapur", "Madhyapur Thimi", "Suryabinayak", "Changunarayan"],
    "Chitwan": ["Bharatpur", "Ratnanagar", "Khairahani", "Rapti", "Kalika", "Madi"],
    "Makwanpur": ["Hetauda", "Thaha"],
    "Kavrepalanchok": ["Dhulikhel", "Banepa", "Panauti", "Panchkhal", "Namobuddha", "Mandandeupur"],
    "Sindhupalchok": ["Chautara Sangachokgadhi", "Barhabise", "Melamchi"],
    "Nuwakot": ["Bidur", "Belkotgadhi"],
    "Dhading": ["Nilkantha", "Dhunibeshi"]
  },
  "Gandaki": {
    "Kaski": ["Pokhara", "Annapurna", "Machhapuchhre", "Madi", "Rupa"],
    "Tanahu": ["Damauli (Vyas)", "Shuklagandaki", "Bhanu", "Bhimad"],
    "Syangja": ["Putalibazar", "Waling", "Galyang", "Chapakot", "Bheerkot"],
    "Gorkha": ["Gorkha", "Palungtar"],
    "Lamjung": ["Besishahar", "Sundarbazar", "Rainas", "Madhya Nepal"],
    "Baglung": ["Baglung", "Galkot", "Jaimini", "Dhorpatan"],
    "Nawalparasi (East)": ["Kawasoti", "Gaindakot", "Devchuli", "Madhyabindu"]
  },
  "Lumbini": {
    "Rupandehi": ["Butwal", "Siddharthanagar", "Tilottama", "Sainamaina", "Devdaha", "Lumbini Sanskritik"],
    "Dang": ["Ghorahi", "Tulsipur", "Lamahi"],
    "Banke": ["Nepalgunj", "Kohalpur"],
    "Bardiya": ["Gulariya", "Rajapur", "Madhuwan", "Thakurbaba", "Barbardiya", "Bansgadhi"],
    "Kapilvastu": ["Kapilvastu", "Banganga", "Buddhabhumi", "Shivaraj", "Krishnanagar", "Maharajgunj"],
    "Palpa": ["Tansen", "Rampur"],
    "Arghakhanchi": ["Sandhikharka", "Sitganga", "Bhumikasthan"],
    "Gulmi": ["Resunga", "Musikot"],
    "Nawalparasi (West)": ["Ramgram", "Sunwal", "Bardaghat"]
  },
  "Karnali": {
    "Surkhet": ["Birendranagar", "Gurbhakot", "Bheriganga", "Panchapuri", "Lekbeshi"],
    "Dailekh": ["Narayan", "Dullu", "Chamunda Bindrasaini", "Aathbis"],
    "Jumla": ["Chandannath"],
    "Salyan": ["Shaarda", "Bagchaur", "Bangad Kupinde"],
    "Rukum (West)": ["Musikot", "Chaurjahari", "Aathbiskot"]
  },
  "Sudurpashchim": {
    "Kailali": ["Dhangadhi", "Tikapur", "Ghodaghodi", "Lamki Chuha", "Bhajani", "Godawari", "Gauriganga"],
    "Kanchanpur": ["Bhimdatta", "Bedkot", "Shuklaphanta", "Krishnapur", "Punarbas", "Belauri", "Mahakali"],
    "Doti": ["Dipayal Silgadhi", "Shikhar"],
    "Dadeldhura": ["Amargadhi", "Parshuram"],
    "Achham": ["Mangalsen", "Sanphebagar", "Panchadewal Binayak", "Kamalbazar"]
  }
};

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
  const [data, setData] = useState({ 
    name: '', 
    age: '', 
    gender: 'Male', 
    mobile: '', 
    consultantId: consultants[0]?.id || '' 
  });
  
  // Address State
  const [country, setCountry] = useState('Nepal');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [manualAddress, setManualAddress] = useState('');

  // Dropdown Options
  const provinces = Object.keys(NEPAL_LOCATIONS);
  const districts = province ? Object.keys(NEPAL_LOCATIONS[province] || {}) : [];
  const municipalities = (province && district) ? NEPAL_LOCATIONS[province][district] || [] : [];

  // Construct final address when fields change
  useEffect(() => {
    if (country === 'Nepal') {
      if (province && district && municipality) {
        setManualAddress(`${municipality}, ${district}, ${province}`);
      }
    } else {
      if (!manualAddress) setManualAddress(country);
    }
  }, [country, province, district, municipality]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
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
               <option value="">Select Consultant</option>
               {consultants.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
             </select>
          </div>

          {/* Address Section */}
          <div className="col-span-2 border-t pt-4 mt-2">
            <h3 className="font-semibold text-gray-700 mb-2">Address Details</h3>
            <div className="grid grid-cols-2 gap-4 mb-3">
               <div>
                  <label className="block text-xs font-medium text-gray-600">Country</label>
                  <select 
                    className="w-full border p-2 rounded text-sm" 
                    value={country} 
                    onChange={e => {
                        setCountry(e.target.value);
                        setProvince('');
                        setDistrict('');
                        setMunicipality('');
                        if (e.target.value !== 'Nepal') setManualAddress(e.target.value);
                    }}
                  >
                    <option>Nepal</option>
                    <option>India</option>
                    <option>China</option>
                    <option>Other</option>
                  </select>
               </div>
               {country === 'Nepal' && (
                 <>
                   <div>
                      <label className="block text-xs font-medium text-gray-600">Province</label>
                      <select className="w-full border p-2 rounded text-sm" value={province} onChange={e => { setProvince(e.target.value); setDistrict(''); setMunicipality(''); }}>
                        <option value="">Select Province</option>
                        {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-medium text-gray-600">District</label>
                      <select className="w-full border p-2 rounded text-sm" value={district} onChange={e => { setDistrict(e.target.value); setMunicipality(''); }}>
                        <option value="">Select District</option>
                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-medium text-gray-600">Municipality</label>
                      <select className="w-full border p-2 rounded text-sm" value={municipality} onChange={e => setMunicipality(e.target.value)}>
                        <option value="">Select Municipality</option>
                        {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                   </div>
                 </>
               )}
            </div>
            
            <div className="col-span-2">
                <label className="block text-sm font-medium">Full Address (Auto-generated)</label>
                <textarea 
                  className="w-full border p-2 rounded h-16 bg-gray-50" 
                  value={manualAddress} 
                  onChange={e => setManualAddress(e.target.value)}
                  placeholder="Address will appear here..."
                ></textarea>
            </div>
          </div>

          <div className="col-span-2 text-sm text-gray-500 mt-2">
            Registration Date: {new Date().toLocaleDateString()}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
          <button onClick={() => {
            if(!data.name) return alert("Name required");
            if(!manualAddress) return alert("Address required");
            onRegister({ 
              ...data, 
              age: Number(data.age) || 0, 
              address: manualAddress,
              gender: data.gender as 'Male' | 'Female' | 'Other'
            });
          }} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Register Patient</button>
        </div>
      </div>
    </div>
  );
};

const UserManagementModal = ({ isOpen, onClose, users }: { isOpen: boolean, onClose: () => void, users: User[] }) => {
    const [newUser, setNewUser] = useState<Partial<User>>({ role: UserRole.CONSULTANT });
    
    const handleAdd = async () => {
        if (!newUser.username || !newUser.password || !newUser.fullName) {
            alert("All fields required");
            return;
        }
        try {
            await addUserToDb({
                ...newUser,
                id: crypto.randomUUID(),
            } as User);
            setNewUser({ role: UserRole.CONSULTANT, username: '', password: '', fullName: '' });
        } catch (e) {
            alert("Error adding user: " + e);
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure?")) {
            await deleteUserFromDb(id);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
                <h2 className="text-xl font-bold mb-4">Manage Users (Doctors & Staff)</h2>
                
                <div className="grid grid-cols-4 gap-2 mb-6 bg-gray-50 p-4 rounded border">
                    <input type="text" placeholder="Username" className="border p-2 rounded" value={newUser.username || ''} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                    <input type="text" placeholder="Password" className="border p-2 rounded" value={newUser.password || ''} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                    <input type="text" placeholder="Full Name" className="border p-2 rounded" value={newUser.fullName || ''} onChange={e => setNewUser({...newUser, fullName: e.target.value})} />
                    <div className="flex gap-2">
                        <select className="border p-2 rounded flex-1" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}>
                            <option value={UserRole.CONSULTANT}>Consultant</option>
                            <option value={UserRole.RECEPTIONIST}>Receptionist</option>
                        </select>
                        <button onClick={handleAdd} className="bg-blue-600 text-white p-2 rounded">Add</button>
                    </div>
                </div>

                <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2 text-left">Name</th>
                                <th className="p-2 text-left">Username</th>
                                <th className="p-2 text-left">Role</th>
                                <th className="p-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="border-b">
                                    <td className="p-2">{u.fullName}</td>
                                    <td className="p-2">{u.username}</td>
                                    <td className="p-2">{u.role}</td>
                                    <td className="p-2">
                                        <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:text-red-700">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300">Close</button>
                </div>
            </div>
        </div>
    )
}

// --- Setup Screen ---
const SetupScreen = ({ onSave }: { onSave: (config: any) => void }) => {
  const [configStr, setConfigStr] = useState('');
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex items-center gap-3 mb-6 text-blue-800">
           <Database size={32} />
           <h1 className="text-2xl font-bold">System Setup</h1>
        </div>
        <p className="text-gray-600 mb-4 text-sm">
           <strong>Host Mode:</strong> No 'config.ts' found.
           To enable real-time collaboration across devices, this app requires a 
           <strong> Firebase Firestore</strong> database.
        </p>
        <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-2 mb-6">
           <li>Go to <a href="https://console.firebase.google.com" target="_blank" className="text-blue-600 hover:underline">Firebase Console</a> and create a project.</li>
           <li>Create a <strong>Firestore Database</strong> (Start in Test Mode).</li>
           <li>Go to Project Settings &gt; General &gt; Your apps &gt; Add Web App.</li>
           <li>Copy the <code>firebaseConfig</code> object and paste it below.</li>
           <li className="font-semibold text-blue-700">Recommended: Paste this config into <code>config.ts</code> in your source code and redeploy to skip this screen.</li>
        </ol>

        <textarea 
           className="w-full h-40 border p-3 rounded font-mono text-xs bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
           placeholder='{ "apiKey": "...", "authDomain": "...", ... }'
           value={configStr}
           onChange={e => setConfigStr(e.target.value)}
        />
        
        <button 
           onClick={() => {
             try {
                // Allow user to paste just the object or the whole variable
                let cleanStr = configStr.trim();
                if (cleanStr.includes('const firebaseConfig =')) {
                    cleanStr = cleanStr.split('=')[1].trim();
                    if (cleanStr.endsWith(';')) cleanStr = cleanStr.slice(0, -1);
                }
                const config = JSON.parse(cleanStr);
                onSave(config);
             } catch(e) {
                alert("Invalid JSON format. Please paste the object strictly.");
             }
           }}
           className="w-full mt-4 bg-blue-700 text-white py-2 rounded hover:bg-blue-800 font-bold"
        >
            Initialize System
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [appConfig, setAppConfig] = useState<AppConfig>(loadConfig());
  const [dbReady, setDbReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Data State
  const [dbUsers, setDbUsers] = useState<User[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<ExamData[]>([]);

  // UI State
  const [view, setView] = useState<'LOGIN' | 'DASHBOARD' | 'EXAM' | 'PRINT'>('LOGIN');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [patientFilter, setPatientFilter] = useState<'ALL' | 'MY'>('MY');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
  // Modals
  const [isRegModalOpen, setRegModalOpen] = useState(false);
  const [isUserModalOpen, setUserModalOpen] = useState(false);
  
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [completedExamData, setCompletedExamData] = useState<ExamData | null>(null);

  // Initialize Firebase
  useEffect(() => {
    if (appConfig.firebaseConfig) {
      const success = initFirebase(appConfig.firebaseConfig);
      if (success) {
        setDbReady(true);
      } else {
        alert("Failed to connect to Database with provided config.");
        if (!hasHardcodedConfig) {
            clearConfig();
            setAppConfig({});
        }
      }
    }
  }, [appConfig]);

  // Subscribe to Data
  useEffect(() => {
    if (dbReady) {
      const unsubPatients = subscribePatients((data) => setPatients(data));
      const unsubVisits = subscribeVisits((data) => setVisits(data));
      const unsubUsers = subscribeUsers((data) => setDbUsers(data));
      
      // Seed default user if empty
      seedDefaultUserIfNeeded();

      return () => {
        unsubPatients();
        unsubVisits();
        unsubUsers();
      };
    }
  }, [dbReady]);

  const handleConfigSave = (config: any) => {
     const newConfig = { firebaseConfig: config };
     saveConfig(newConfig);
     setAppConfig(newConfig);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setView('DASHBOARD');
    setPatientFilter(user.role === UserRole.RECEPTIONIST ? 'ALL' : 'MY');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('LOGIN');
  };

  const registerPatient = async (pData: Partial<Patient>) => {
    if (!currentUser) return;
    const newPatient: Patient = {
      ...pData as any,
      id: `P-${Date.now().toString().slice(-6)}`,
      regDate: new Date().toISOString().split('T')[0],
      status: 'waiting'
    };
    try {
        await addPatientToDb(newPatient);
        setRegModalOpen(false);
    } catch (e) {
        alert("Error saving patient to database: " + e);
    }
  };

  const toggleStatus = async (pid: string, newStatus: 'received' | 'deferred') => {
    if (currentUser?.role !== UserRole.CONSULTANT) return;
    const p = patients.find(pt => pt.id === pid);
    if (!p) return;
    
    const statusToSet = p.status === newStatus ? 'waiting' : newStatus;
    await updatePatientStatusInDb(pid, statusToSet);
  };

  const proceedToExam = () => {
    if (!selectedPatientId) {
      alert("Please select a patient from the list.");
      return;
    }
    const p = patients.find(pt => pt.id === selectedPatientId);
    if (!p) return;
    setActivePatient(p);
    setView('EXAM');
  };

  const handleSaveExam = async (data: ExamData) => {
    try {
        await addVisitToDb(data);
        setCompletedExamData(data);
        setView('PRINT');
    } catch (e) {
        alert("Error saving exam data: " + e);
    }
  };

  // --- RENDER ---

  if (!appConfig.firebaseConfig) {
      return <SetupScreen onSave={handleConfigSave} />;
  }

  if (!dbReady) {
      return <div className="min-h-screen flex items-center justify-center">Connecting to Database...</div>;
  }

  // Use dbUsers for login instead of hardcoded
  if (view === 'LOGIN') return <Login users={dbUsers} onLogin={handleLogin} />;

  if (view === 'PRINT' && activePatient && completedExamData && currentUser) {
    return <PrintView 
              patient={activePatient} 
              data={completedExamData} 
              consultant={currentUser} 
              onClose={() => setView('DASHBOARD')} 
           />;
  }

  if (view === 'EXAM' && activePatient && currentUser) {
    const prevVisits = visits.filter(v => v.patientId === activePatient.id);
    return <ExamForm 
              patient={activePatient} 
              consultant={currentUser} 
              previousVisits={prevVisits} 
              onSave={handleSaveExam}
              onCancel={() => setView('DASHBOARD')}
           />;
  }

  // Filter Logic
  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.includes(searchQuery);
    const matchesDate = p.regDate >= dateFrom && p.regDate <= dateTo;
    
    let matchesRole = true;
    if (patientFilter === 'MY' && currentUser?.role === UserRole.CONSULTANT) {
      matchesRole = p.consultantId === currentUser.id;
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Navbar */}
      <nav className="bg-white shadow px-6 py-3 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">M</div>
           <span className="text-xl font-bold text-gray-800 tracking-tight">MediFlow</span>
           <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded ml-2">Online</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col text-right">
             <span className="text-sm font-bold text-gray-800">{currentUser?.fullName}</span>
             <span className="text-xs text-gray-500 uppercase">{currentUser?.role}</span>
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
           
           {/* Manage Users Button for Receptionists */}
           {currentUser?.role === UserRole.RECEPTIONIST && (
              <button 
                onClick={() => setUserModalOpen(true)}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 transition ml-2"
              >
                <Users size={18} /> Manage Doctors
              </button>
           )}
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
           
           {!hasHardcodedConfig && (
               <button onClick={() => { clearConfig(); window.location.reload(); }} className="text-gray-400 hover:text-gray-600" title="Reset DB Config">
                   <Settings size={16} />
               </button>
           )}
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
                        {dbUsers.find(u => u.id === p.consultantId)?.fullName || 'Unknown'}
                     </td>
                     <td className="p-4 flex justify-center gap-2">
                       {currentUser?.role === UserRole.CONSULTANT && p.status !== 'completed' && (
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
        consultants={dbUsers.filter(u => u.role === UserRole.CONSULTANT)}
        onRegister={registerPatient}
      />

      <UserManagementModal 
        isOpen={isUserModalOpen}
        onClose={() => setUserModalOpen(false)}
        users={dbUsers}
      />
    </div>
  );
}