
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface ProfileFormProps {
  onComplete: (profile: UserProfile) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please type your name to practice!');
      return;
    }
    if (phone.length !== 10) {
      setError('Enter 10 numbers for your family contact!');
      return;
    }
    onComplete({ name, phone });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl max-w-lg w-full text-center border-t-8 border-blue-400 animate-in fade-in slide-in-from-bottom-20 duration-1000">
        <div className="w-24 h-24 bg-blue-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 floating">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
           </svg>
        </div>
        <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tight">Practice Pad</h2>
        <p className="text-xl text-slate-500 mb-10 font-bold leading-relaxed">Let's practice your name and family number so you always know them!</p>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="text-left">
            <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-widest ml-4">My Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-8 py-5 rounded-[2rem] bg-slate-50 border-4 border-transparent focus:border-blue-300 outline-none transition-all text-2xl font-bold shadow-inner"
              placeholder="Type your name..."
            />
          </div>
          
          <div className="text-left">
            <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-widest ml-4">Family Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="w-full px-8 py-5 rounded-[2rem] bg-slate-50 border-4 border-transparent focus:border-blue-300 outline-none transition-all text-2xl font-bold shadow-inner tracking-[0.2em]"
              placeholder="10 Magic Numbers"
            />
          </div>

          {error && <p className="text-rose-500 text-lg font-black animate-bounce">{error}</p>}

          <button
            type="submit"
            className="w-full py-6 bg-blue-500 hover:bg-blue-600 text-white rounded-[2rem] font-black text-2xl shadow-xl hover:shadow-2xl transform transition hover:-translate-y-2 active:scale-95"
          >
            Start Practice Studio
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileForm;
