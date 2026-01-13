
import React from 'react';

interface TutorialProps {
  onFinish: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ onFinish }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="bg-white rounded-[3rem] overflow-hidden shadow-2xl max-w-4xl w-full flex flex-col items-center p-8">
        <h2 className="text-4xl font-black text-blue-600 mb-6">How to Magic!</h2>
        
        <div className="relative w-full aspect-video bg-slate-100 rounded-3xl overflow-hidden mb-8 border-4 border-blue-200">
           <video 
             autoPlay 
             loop 
             muted 
             className="w-full h-full object-cover"
             src="https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-person-playing-with-light-34440-large.mp4"
           >
             Your browser does not support the video tag.
           </video>
           <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-white/50">
              <p className="text-lg font-bold text-slate-800 text-center">
                Pinch your Thumb and Index finger together to Draw! Release to Stop!
              </p>
           </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <button
            onClick={onFinish}
            className="px-12 py-5 bg-blue-500 text-white rounded-[2rem] font-black text-2xl hover:bg-blue-600 transition-all transform hover:scale-105 shadow-xl shadow-blue-200"
          >
            I'm Ready! Let's Go!
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
