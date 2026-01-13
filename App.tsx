
import React, { useState, useEffect } from 'react';
import { UserProfile, AppMode } from './types';
import ProfileForm from './components/ProfileForm';
import DrawingCanvas from './components/DrawingCanvas';
import Tutorial from './components/Tutorial';
import KidBackground from './components/KidBackground';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('intro');
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Purely state-based: resets on page reload
    const timer = setTimeout(() => {
      setMode('welcome');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleProfileComplete = (p: UserProfile) => {
    setProfile(p);
    setMode('choice');
  };

  const startInteraction = (withTutorial: boolean) => {
    if (withTutorial) {
      setMode('tutorial');
    } else {
      setMode('drawing');
    }
  };

  const resetSession = () => {
    setProfile(null);
    setMode('welcome');
  };

  return (
    <div className="min-h-screen relative">
      {mode !== 'drawing' && <KidBackground />}

      {mode === 'intro' && (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
          <div className="intro-animation">
             <h1 className="text-8xl font-black text-blue-600 mb-4 tracking-tighter">VayuLekha</h1>
             <p className="text-4xl text-slate-400 font-bold tracking-[0.3em] uppercase">Practice Pad</p>
          </div>
        </div>
      )}

      {mode === 'welcome' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center animate-in fade-in zoom-in duration-1000">
          <div className="mb-12 floating">
            <div className="w-48 h-48 bg-blue-500 rounded-[3rem] flex items-center justify-center shadow-3xl shadow-blue-200">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-28 w-28 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
               </svg>
            </div>
          </div>
          <h1 className="text-7xl font-black text-slate-800 mb-6 tracking-tight">VayuLekha</h1>
          <p className="text-3xl text-slate-500 max-w-xl mb-12 font-bold leading-relaxed">
            Practice your name and magic numbers in the air!
          </p>
          <button 
            onClick={() => setMode('profile')}
            className="px-16 py-7 bg-blue-600 text-white rounded-[2.5rem] text-3xl font-black shadow-2xl hover:shadow-blue-300 hover:bg-blue-700 transition-all transform hover:-translate-y-2 active:scale-95"
          >
            Start Practice
          </button>
        </div>
      )}

      {mode === 'profile' && <ProfileForm onComplete={handleProfileComplete} />}

      {mode === 'choice' && profile && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center animate-in fade-in duration-1000">
          <div className="floating mb-4">
             <span className="text-6xl text-yellow-500">✨</span>
          </div>
          <h2 className="text-5xl font-black text-slate-800 mb-4 tracking-tight">Hello, {profile.name}!</h2>
          <p className="text-2xl text-slate-600 mb-16 font-bold">Ready to practice and play?</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl w-full">
             <button 
               onClick={() => startInteraction(true)}
               className="p-12 bg-white/80 backdrop-blur-md rounded-[3.5rem] shadow-2xl border-4 border-transparent hover:border-blue-400 transition-all text-left group hover:-translate-y-2"
             >
                <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                </div>
                <h3 className="text-3xl font-black mb-3">Watch First</h3>
                <p className="text-xl text-slate-500 font-bold leading-relaxed">I'd like to see the tutorial video again.</p>
             </button>

             <button 
               onClick={() => startInteraction(false)}
               className="p-12 bg-white/80 backdrop-blur-md rounded-[3.5rem] shadow-2xl border-4 border-transparent hover:border-green-400 transition-all text-left group hover:-translate-y-2"
             >
                <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                   </svg>
                </div>
                <h3 className="text-3xl font-black mb-3">Jump In</h3>
                <p className="text-xl text-slate-500 font-bold leading-relaxed">I'm ready to write! Let's go to the canvas.</p>
             </button>
          </div>
          
          <button 
            onClick={resetSession}
            className="mt-20 text-slate-400 hover:text-slate-600 font-black text-xl tracking-tight transition-colors"
          >
            Clear and Restart Practice
          </button>
        </div>
      )}

      {mode === 'tutorial' && <Tutorial onFinish={() => setMode('drawing')} />}

      {mode === 'drawing' && <DrawingCanvas onBack={() => setMode('choice')} />}
    </div>
  );
};

export default App;
