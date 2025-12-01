import React, { useState } from 'react';
import { User } from '../types';
import { Stethoscope } from 'lucide-react';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ users, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white mb-4 shadow-lg">
            <Stethoscope size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">MediFlow EHR</h1>
          <p className="text-gray-500 mt-2 text-center">Secure Access for Medical Professionals</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm text-center">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input 
              type="text" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow transition transform hover:scale-[1.02]"
          >
            Login
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100">
           <p className="text-xs text-center text-gray-400">Default Logins:</p>
           <div className="flex justify-center gap-4 mt-2 text-xs text-gray-500">
             <span>recep / 123</span>
             <span>doc1 / 123</span>
             <span>doc2 / 123</span>
           </div>
        </div>
      </div>
    </div>
  );
};