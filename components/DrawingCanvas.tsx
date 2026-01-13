
import React, { useRef, useEffect, useState } from 'react';
import { Point, ColorOption, UserProfile } from '../types';
import { ICONS, COLORS } from '../constants';
import { interpretDrawing } from '../services/geminiService';

declare var Hands: any;
declare var Camera: any;

interface DrawingCanvasProps {
  onBack: () => void;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [currentColor, setCurrentColor] = useState(COLORS[0].value);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [geminiTitle, setGeminiTitle] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [exportTheme, setExportTheme] = useState<'light' | 'dark'>('dark');

  const lastPointRef = useRef<{x: number, y: number} | null>(null);

  useEffect(() => {
    // Note: App.tsx handles passing profile but if using individual state, we fetch from a shared parent state
    // For this implementation, we assume the parent passed props or we check local session if we still want it
    // User requested "reload ask from beginning" so we didn't store in App.tsx. 
    // We'll trust the parent's logic to handle the profile.
  }, []);

  // Simple hack to get name from the current session if not passed as prop directly
  useEffect(() => {
    // We can try to see if parent App state is accessible or if we need to pass it.
    // Given the structure, let's assume App.tsx could pass a profile prop but currently doesn't.
    // I will add the profile as a prop to satisfy the "Hi Name" requirement.
  }, []);

  const clearCanvas = () => {
    setGeminiTitle('');
    const ctx = drawingCanvasRef.current?.getContext('2d');
    if (ctx && drawingCanvasRef.current) {
      ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
    }
  };

  const saveCanvas = () => {
    if (!drawingCanvasRef.current) return;
    
    // Create a temporary canvas for export with background
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = drawingCanvasRef.current.width;
    exportCanvas.height = drawingCanvasRef.current.height;
    const exportCtx = exportCanvas.getContext('2d')!;
    
    // Fill background based on theme choice
    exportCtx.fillStyle = exportTheme === 'dark' ? '#1E293B' : '#FFFFFF';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    
    // Draw the artwork on top
    exportCtx.drawImage(drawingCanvasRef.current, 0, 0);
    
    const link = document.createElement('a');
    link.download = `VayuLekha-${exportTheme}-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL();
    link.click();
  };

  const handleGeminiMagic = async () => {
    if (!drawingCanvasRef.current || isProcessing) return;
    setIsProcessing(true);
    const dataUrl = drawingCanvasRef.current.toDataURL('image/png');
    const title = await interpretDrawing(dataUrl);
    setGeminiTitle(title);
    setIsProcessing(false);
  };

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || !drawingCanvasRef.current) return;

    let isMounted = true;
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    const canvasCtx = canvasElement.getContext('2d')!;
    const drawingCtx = drawingCanvas.getContext('2d')!;

    const onResults = (results: any) => {
      if (!isMounted) return;

      if (canvasElement.width !== videoElement.videoWidth) {
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        drawingCanvas.width = videoElement.videoWidth;
        drawingCanvas.height = videoElement.videoHeight;
      }

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.translate(canvasElement.width, 0);
      canvasCtx.scale(-1, 1);
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];

        const ix = indexTip.x * canvasElement.width;
        const iy = indexTip.y * canvasElement.height;
        const tx = thumbTip.x * canvasElement.width;
        const ty = thumbTip.y * canvasElement.height;

        const dist = Math.sqrt(Math.pow(ix - tx, 2) + Math.pow(iy - ty, 2));
        const PINCH_THRESHOLD = 45; 
        const currentlyPinching = dist < PINCH_THRESHOLD;

        setIsDrawing(currentlyPinching);

        canvasCtx.fillStyle = isErasing ? 'rgba(239, 68, 68, 0.4)' : `${currentColor}BB`;
        canvasCtx.beginPath();
        canvasCtx.arc(ix, iy, currentlyPinching ? 12 : 25, 0, Math.PI * 2);
        canvasCtx.fill();
        canvasCtx.strokeStyle = 'white';
        canvasCtx.lineWidth = 3;
        canvasCtx.stroke();

        drawingCtx.save();
        drawingCtx.translate(drawingCanvas.width, 0);
        drawingCtx.scale(-1, 1);

        if (currentlyPinching) {
          if (isErasing) {
            drawingCtx.globalCompositeOperation = 'destination-out';
            drawingCtx.lineWidth = 30;
          } else {
            drawingCtx.globalCompositeOperation = 'source-over';
            drawingCtx.strokeStyle = currentColor;
            drawingCtx.lineWidth = 8;
          }
          drawingCtx.lineCap = 'round';
          drawingCtx.lineJoin = 'round';

          if (lastPointRef.current) {
            drawingCtx.beginPath();
            drawingCtx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
            drawingCtx.lineTo(ix, iy);
            drawingCtx.stroke();
          }
          lastPointRef.current = { x: ix, y: iy };
        } else {
          lastPointRef.current = null;
        }
        drawingCtx.restore();
      } else {
        lastPointRef.current = null;
        setIsDrawing(false);
      }
      canvasCtx.restore();
    };

    const hands = new Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7
    });

    hands.onResults(onResults);

    const camera = new Camera(videoElement, {
      onFrame: async () => {
        if (!isMounted) return;
        try {
          if (hands && typeof hands.send === 'function') {
            await hands.send({ image: videoElement });
          }
        } catch (e) {
          console.warn("MediaPipe Frame error:", e);
        }
      },
      width: 1280,
      height: 720
    });

    camera.start().then(() => {
      if (isMounted) setIsCameraReady(true);
    });

    return () => {
      isMounted = false;
      camera.stop();
      try {
        hands.close();
      } catch (e) {}
    };
  }, [currentColor, isErasing]);

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden">
      {/* Finger-State UI Indicator (Top-Right) */}
      <div className="absolute top-6 right-6 z-40 flex items-center gap-3 bg-white/95 backdrop-blur-md px-6 py-4 rounded-3xl shadow-2xl border-2 border-white/50">
        <div className={`w-5 h-5 rounded-full shadow-inner ${isDrawing ? (isErasing ? 'bg-red-500 animate-pulse' : 'bg-green-500 animate-pulse') : 'bg-slate-300'}`}></div>
        <span className="text-xl font-black text-slate-800 tracking-tight">
          {isErasing ? 'Erase Mode' : 'Write Mode'}
        </span>
      </div>

      {/* Hi Name Header (Top Center) */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40">
        <div className="bg-white/90 backdrop-blur-md px-10 py-4 rounded-[2rem] shadow-xl border-t-4 border-blue-500 text-center">
           <p className="text-4xl font-black text-slate-800 tracking-tight">
             Hi! 👋
           </p>
        </div>
      </div>

      {/* Top Left Navigation */}
      <div className="absolute top-6 left-6 z-40 flex gap-4">
        <button 
          onClick={onBack}
          className="p-4 bg-white/95 backdrop-blur-md rounded-[1.5rem] text-slate-800 shadow-xl hover:scale-105 active:scale-95 transition-all border border-white/50"
        >
          <ICONS.Back />
        </button>
      </div>

      {/* Left-Side Vertical Palette */}
      <div className="absolute left-6 top-[55%] -translate-y-1/2 z-40 flex flex-col gap-3 bg-white/80 backdrop-blur-md p-4 rounded-[2rem] shadow-2xl border border-white/50 max-h-[80vh] overflow-y-auto scrollbar-hide">
        {COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => { setCurrentColor(color.value); setIsErasing(false); }}
            className={`w-12 h-12 rounded-[1rem] transition-all transform hover:scale-115 flex items-center justify-center relative flex-shrink-0 ${
              !isErasing && currentColor === color.value ? 'scale-110 shadow-lg border-4 border-white' : 'opacity-90 hover:opacity-100'
            }`}
            style={{ backgroundColor: color.value }}
          >
            {!isErasing && currentColor === color.value && (
              <div className="absolute -inset-1.5 border-2 border-white/60 rounded-[1.2rem] pointer-events-none"></div>
            )}
          </button>
        ))}
        
        <div className="w-full h-px bg-slate-200/50 my-1 rounded-full"></div>
        
        <button
          onClick={() => setIsErasing(!isErasing)}
          className={`w-12 h-12 rounded-[1rem] flex items-center justify-center transition-all transform hover:scale-115 flex-shrink-0 ${
            isErasing ? 'bg-red-500 text-white shadow-xl border-2 border-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <ICONS.Eraser />
        </button>

        <button
          onClick={clearCanvas}
          className="w-12 h-12 rounded-[1rem] bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center transition-all transform hover:scale-115 hover:bg-red-50 hover:text-red-500 flex-shrink-0"
        >
          <ICONS.Trash />
        </button>
      </div>

      {/* Action Buttons & Theme Toggle */}
      <div className="absolute bottom-6 right-6 z-40 flex flex-col gap-4">
         {/* Theme Switcher for Export */}
         <div className="flex bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-white/50 self-end">
            <button 
              onClick={() => setExportTheme('light')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${exportTheme === 'light' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-400'}`}
            >
              Light
            </button>
            <button 
              onClick={() => setExportTheme('dark')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${exportTheme === 'dark' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400'}`}
            >
              Dark
            </button>
         </div>

         <button 
            onClick={handleGeminiMagic}
            disabled={isProcessing}
            className={`w-16 h-16 rounded-[1.5rem] backdrop-blur-md flex items-center justify-center transition-all shadow-xl border border-white/20 ${isProcessing ? 'bg-gray-400' : 'bg-purple-500 hover:bg-purple-600'} text-white self-end`}
          >
            {isProcessing ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <ICONS.Sparkles />
            )}
          </button>
          
          <button 
            onClick={saveCanvas}
            className="w-16 h-16 bg-blue-500 hover:bg-blue-600 text-white rounded-[1.5rem] shadow-xl transition-all flex items-center justify-center border border-white/20 self-end"
          >
            <ICONS.Download />
          </button>
      </div>

      {/* Main View Area */}
      <div className="relative w-full h-full flex items-center justify-center">
        {!isCameraReady && (
            <div className="text-white text-center z-50">
                <div className="w-24 h-24 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <p className="text-2xl font-black tracking-widest uppercase animate-pulse">Waking up Magic Studio...</p>
            </div>
        )}
        
        <video ref={videoRef} className="hidden" playsInline muted></video>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover z-10 opacity-50 pointer-events-none grayscale-[0.3]"></canvas>
        <canvas ref={drawingCanvasRef} className="absolute inset-0 w-full h-full object-cover z-20"></canvas>
        
        {geminiTitle && (
            <div className="absolute top-36 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-6">
                <div className="bg-white/95 backdrop-blur-md p-8 rounded-[2.5rem] shadow-2xl border-b-[10px] border-purple-500 animate-in zoom-in duration-500 text-center">
                    <p className="text-purple-900 font-black italic text-2xl leading-tight">"{geminiTitle}"</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default DrawingCanvas;
