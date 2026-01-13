
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Logo } from '../constants';

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
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center p-3 p-md-5">
      <div className="bg-white p-4 p-md-5 rounded-[3.5rem] shadow-2xl w-100 border-t-8 border-[#7D3E98] animate-in fade-in slide-in-from-bottom-20 duration-1000" style={{ maxWidth: '500px' }}>
        <div className="mb-4 floating text-center">
           <Logo className="w-24 h-24 mx-auto" showText={false} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight text-center">Practice Pad</h2>
        <p className="text-lg text-slate-500 mb-8 font-bold leading-relaxed text-center">Let's practice your name and family number so you always know them!</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-left">
            <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-widest ml-4">My Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-6 py-4 rounded-[2rem] bg-slate-50 border-4 border-transparent focus:border-[#50C2F7] outline-none transition-all text-xl font-bold text-black shadow-inner"
              placeholder="Type your name..."
            />
          </div>
          
          <div className="text-left">
            <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-widest ml-4">My Family Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="w-full px-6 py-4 rounded-[2rem] bg-slate-50 border-4 border-transparent focus:border-[#7D3E98] outline-none transition-all text-xl font-bold text-black shadow-inner tracking-[0.2em]"
              placeholder="10 Magic Numbers"
            />
          </div>

          {error && <p className="text-rose-500 text-base font-black animate-bounce text-center">{error}</p>}

          <button
            type="submit"
            className="w-full py-5 bg-gradient-to-r from-[#50C2F7] to-[#7D3E98] hover:opacity-90 text-white rounded-[2rem] font-black text-xl shadow-xl hover:shadow-2xl transform transition hover:-translate-y-1 active:scale-95"
          >
            Start Practice Studio
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileForm;
