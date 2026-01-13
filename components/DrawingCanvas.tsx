
import React, { useRef, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { ICONS, COLORS, Logo } from '../constants';
import { interpretDrawing } from '../services/geminiService';

declare var Hands: any;
declare var Camera: any;

interface DrawingCanvasProps {
  onBack: () => void;
  profile: UserProfile | null;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onBack, profile }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [currentColor, setCurrentColor] = useState(COLORS[0].value);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [geminiTitle, setGeminiTitle] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [exportTheme, setExportTheme] = useState<'light' | 'dark'>('dark');

  const lastPointRef = useRef<{x: number, y: number} | null>(null);

  const clearCanvas = () => {
    setGeminiTitle('');
    const ctx = drawingCanvasRef.current?.getContext('2d');
    if (ctx && drawingCanvasRef.current) {
      ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
    }
  };

  const saveCanvas = () => {
    if (!drawingCanvasRef.current) return;
    
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = drawingCanvasRef.current.width;
    exportCanvas.height = drawingCanvasRef.current.height;
    const exportCtx = exportCanvas.getContext('2d')!;
    
    exportCtx.fillStyle = exportTheme === 'dark' ? '#1E293B' : '#FFFFFF';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    
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
        canvasCtx.arc(ix, iy, currentlyPinching ? 8 : 16, 0, Math.PI * 2);
        canvasCtx.fill();
        canvasCtx.strokeStyle = 'white';
        canvasCtx.lineWidth = 2;
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
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden font-['Quicksand']">
      {/* Reduced Canvas status indicator size */}
      <div className="absolute top-3 right-3 z-50 flex items-center gap-2 bg-white/60 backdrop-blur-sm px-2 py-1 rounded-xl shadow-lg border border-white/20">
        <div className={`w-2.5 h-2.5 rounded-full shadow-inner ${isDrawing ? (isErasing ? 'bg-red-500 animate-pulse' : 'bg-green-500 animate-pulse') : 'bg-slate-300'}`}></div>
        <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
          {isErasing ? 'Erase' : 'Write'}
        </span>
      </div>

      {/* Top Left Navigation - Simplified */}
      <div className="absolute top-3 left-3 z-50">
        <button 
          onClick={onBack}
          className="p-2 bg-white/40 backdrop-blur-md rounded-xl text-slate-800 shadow-md hover:scale-105 active:scale-95 transition-all border border-white/20"
        >
          <ICONS.Back />
        </button>
      </div>

      {/* Minimized Palette with significantly reduced transparency/background visibility */}
      <div className="absolute left-3 top-[50%] -translate-y-1/2 z-50 flex flex-col gap-1.5 bg-white/5 backdrop-blur-[2px] p-1.5 rounded-2xl border border-white/10 max-h-[90vh] overflow-y-auto scrollbar-hide">
        {COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => { setCurrentColor(color.value); setIsErasing(false); }}
            className={`w-7 h-7 rounded-lg transition-all transform hover:scale-110 flex items-center justify-center relative flex-shrink-0 ${
              !isErasing && currentColor === color.value ? 'scale-110 shadow-md border-2 border-white' : 'opacity-80 hover:opacity-100'
            }`}
            style={{ backgroundColor: color.value }}
          >
            {!isErasing && currentColor === color.value && (
              <div className="absolute -inset-1 border border-white/40 rounded-lg pointer-events-none"></div>
            )}
          </button>
        ))}
        
        <div className="w-full h-px bg-white/10 my-1 rounded-full"></div>
        
        <button
          onClick={() => setIsErasing(!isErasing)}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all transform hover:scale-110 flex-shrink-0 ${
            isErasing ? 'bg-red-500 text-white shadow-md border border-white' : 'bg-white/20 text-white border border-white/10'
          }`}
        >
          <ICONS.Eraser />
        </button>

        <button
          onClick={clearCanvas}
          className="w-7 h-7 rounded-lg bg-white/20 text-white border border-white/10 flex items-center justify-center transition-all transform hover:scale-110 hover:bg-red-500 flex-shrink-0"
        >
          <ICONS.Trash />
        </button>
      </div>

      {/* Action Buttons & Theme Toggle below Download as Sun/Moon icons */}
      <div className="absolute bottom-4 right-4 z-50 flex flex-col items-center gap-3">
         <button 
            onClick={handleGeminiMagic}
            disabled={isProcessing}
            className={`w-12 h-12 rounded-xl backdrop-blur-md flex items-center justify-center transition-all shadow-xl border border-white/20 ${isProcessing ? 'bg-gray-400' : 'bg-purple-500 hover:bg-purple-600'} text-white`}
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <ICONS.Sparkles />
            )}
          </button>
          
          <button 
            onClick={saveCanvas}
            className="w-12 h-12 bg-[#50C2F7] hover:opacity-90 text-white rounded-xl shadow-xl transition-all flex items-center justify-center border border-white/20"
          >
            <ICONS.Download />
          </button>

          {/* Theme selection as Icons (Sun/Moon) below Download */}
          <div className="flex flex-col gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
            <button 
              onClick={() => setExportTheme('light')}
              className={`p-1.5 rounded-lg transition-all ${exportTheme === 'light' ? 'bg-[#50C2F7] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              title="Light theme"
            >
              <ICONS.Sun />
            </button>
            <button 
              onClick={() => setExportTheme('dark')}
              className={`p-1.5 rounded-lg transition-all ${exportTheme === 'dark' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              title="Dark theme"
            >
              <ICONS.Moon />
            </button>
          </div>
      </div>

      {/* Main View Area - Enhanced for full visibility */}
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {!isCameraReady && (
            <div className="text-white text-center z-50 p-4">
                <Logo className="w-20 h-20 mx-auto mb-4 animate-pulse" showText={false} />
                <p className="text-sm fw-bold text-uppercase tracking-[0.2em] animate-pulse">Waking up Magic Studio...</p>
            </div>
        )}
        
        <video ref={videoRef} className="hidden" playsInline muted></video>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover z-10 opacity-30 pointer-events-none grayscale-[0.3]"></canvas>
        <canvas ref={drawingCanvasRef} className="absolute inset-0 w-full h-full object-cover z-20"></canvas>
        
        {geminiTitle && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xl">
                <div className="bg-white/95 p-5 rounded-3xl shadow-2xl border-b-4 border-purple-500 animate-in slide-in-from-top-4 duration-500 text-center">
                    <p className="text-black fw-bold fst-italic text-lg mb-0">"{geminiTitle}"</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default DrawingCanvas;
