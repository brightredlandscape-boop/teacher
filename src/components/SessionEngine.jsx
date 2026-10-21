import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  AlertTriangle, 
  CheckCircle, 
  Video, 
  MessageSquare, 
  Edit3, 
  Trash2, 
  Send, 
  Star,
  Monitor,
  Download,
  Eraser,
  Palette,
  Maximize2,
  Minimize2,
  RefreshCw,
  Layout,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { getTeacherAvatar, handleAvatarError } from '../utils/avatar';

export default function SessionEngine({ 
  bookedSessions = [], 
  onEndSession, 
  escrowBalance, 
  formatCurrency, 
  selectedCurrency,
  convertMinor
}) {
  const [activeSession, setActiveSession] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [recordConsent, setRecordConsent] = useState({ teacher: true, student: false });
  const [classroomMode, setClassroomMode] = useState('split'); // 'split' | 'video' | 'whiteboard'
  const [videoFeedType, setVideoFeedType] = useState('webrtc'); // 'webrtc' | 'simulated'
  
  // In-session chat
  const [chatMessages, setChatMessages] = useState([
    { sender: 'teacher', text: 'Hello! Welcome to today\'s live lesson. We will focus on syllabus past questions and step-by-step problem solving.' },
    { sender: 'student', text: 'Hi! Ready to begin.' }
  ]);
  const [inputText, setInputText] = useState('');
  
  // Whiteboard drawing canvas refs & tools
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#CC5833'); // Brand clay
  const [brushSize, setBrushSize] = useState(3.5);
  const [isEraser, setIsEraser] = useState(false);
  const [paperStyle, setPaperStyle] = useState('grid'); // 'grid' | 'lined' | 'plain'

  // Review state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // Ticking session clock
  useEffect(() => {
    let timer;
    if (activeSession && !isPaused) {
      timer = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeSession, isPaused]);

  // Redraw background paper lines / grid
  const drawBackground = (ctx, width, height, style) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    if (style === 'grid') {
      ctx.strokeStyle = 'rgba(46, 64, 54, 0.06)';
      ctx.lineWidth = 1;
      const step = 20;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    } else if (style === 'lined') {
      ctx.strokeStyle = 'rgba(46, 64, 54, 0.08)';
      ctx.lineWidth = 1;
      const step = 28;
      for (let y = 28; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      // Margin line
      ctx.strokeStyle = 'rgba(204, 88, 51, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(40, 0);
      ctx.lineTo(40, height);
      ctx.stroke();
    }
  };

  // Initialize canvas
  useEffect(() => {
    if (activeSession && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      drawBackground(ctx, canvas.width, canvas.height, paperStyle);
    }
  }, [activeSession, paperStyle]);

  const handleStartDraw = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    ctx.beginPath();
    ctx.strokeStyle = isEraser ? '#FFFFFF' : currentColor;
    ctx.lineWidth = isEraser ? brushSize * 4 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleDrawing = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleStopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(ctx, canvas.width, canvas.height, paperStyle);
  };

  const downloadWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `eduvista-whiteboard-${activeSession?.id || 'lesson'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const insertCoordinateAxes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.strokeStyle = '#2E4036';
    ctx.lineWidth = 1.5;
    
    const midX = canvas.width / 2;
    const midY = canvas.height / 2;
    
    // X Axis
    ctx.beginPath();
    ctx.moveTo(20, midY);
    ctx.lineTo(canvas.width - 20, midY);
    ctx.stroke();
    
    // Y Axis
    ctx.beginPath();
    ctx.moveTo(midX, 20);
    ctx.lineTo(midX, canvas.height - 20);
    ctx.stroke();
    
    ctx.font = '10px monospace';
    ctx.fillStyle = '#2E4036';
    ctx.fillText('x', canvas.width - 15, midY + 12);
    ctx.fillText('y', midX + 6, 20);
    ctx.fillText('(0,0)', midX + 4, midY - 4);
    ctx.restore();
  };

  // Chat message submission
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const newMsg = { sender: 'student', text: inputText };
    setChatMessages(prev => [...prev, newMsg]);
    setInputText('');

    // Teacher pedagogical responses based on keywords
    setTimeout(() => {
      let replyText = "Great observation! Let's solve this problem on the whiteboard step-by-step.";
      const lower = inputText.toLowerCase();
      if (lower.includes('hello') || lower.includes('hi')) {
        replyText = "Hello! I am ready. Let me share my screen or write the formula on the board.";
      } else if (lower.includes('formula') || lower.includes('equation')) {
        replyText = "For quadratic roots: x = (-b ± √(b² - 4ac)) / (2a). Let's calculate the discriminant.";
      } else if (lower.includes('screen') || lower.includes('question') || lower.includes('paper')) {
        replyText = "I've shared the past paper worksheet. Look at question 3(b) on the screen.";
      } else if (lower.includes('understand') || lower.includes('clear')) {
        replyText = "Excellent! You've mastered this concept. Let's practice one more timed past question.";
      }
      setChatMessages(prev => [...prev, { sender: 'teacher', text: replyText }]);
    }, 1200);
  };

  const handleQuickChatTemplate = (text) => {
    setInputText(text);
  };

  const logClockEvent = async (sessionId, eventType) => {
    try {
      const token = localStorage.getItem('eduvista_token');
      await fetch('/api/sessions/clock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ sessionId, eventType })
      });
    } catch (err) {
      console.warn("Failed to log clock event:", err);
    }
  };

  // Complete session flow
  const handleStartSession = (session) => {
    setActiveSession(session);
    setSeconds(0);
    setIsPaused(false);
    setClassroomMode('split');
    setRecordConsent({ teacher: true, student: false });
    logClockEvent(session.id, 'start');
  };

  const togglePause = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    if (activeSession) {
      logClockEvent(activeSession.id, newPausedState ? 'pause' : 'resume');
    }
  };

  const handleEndClick = () => {
    if (activeSession) {
      logClockEvent(activeSession.id, 'end');
    }
    setIsPaused(true);
    setShowReviewForm(true);
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (onEndSession && activeSession) {
      onEndSession(activeSession, rating, comment);
    }
    setActiveSession(null);
    setShowReviewForm(false);
    setComment('');
  };

  // Formatting clock time
  const formatTime = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  // Construct secure room ID
  const roomCleanId = activeSession 
    ? `eduvista-${String(activeSession.id || activeSession.sessionId || 'classroom').replace(/[^a-zA-Z0-9]/g, '-')}`
    : 'eduvista-live-room';

  return (
    <section id="session-engine" className="py-24 px-6 md:px-16 lg:px-24 bg-brand-charcoal text-brand-cream border-t border-brand-cream/10">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block mb-1">
            VIRTUAL CLASSROOM & PEER-TO-PEER ENGINE
          </span>
          <h2 className="font-heading font-bold text-3xl sm:text-5xl tracking-tight text-white">
            Live WebRTC Learning Room
          </h2>
          <p className="font-sans text-brand-cream/70 mt-3 max-w-xl mx-auto text-sm">
            Interactive, time-clocked classroom with real-time video, screen sharing for past papers, synchronized whiteboard, and automated escrow protection.
          </p>
        </div>

        {/* If no session is active */}
        {!activeSession ? (
          <div className="bg-brand-moss/10 border border-brand-cream/10 rounded-[3rem] p-8 md:p-16 max-w-4xl mx-auto text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-brand-clay/10 border border-brand-clay/20 flex items-center justify-center mx-auto text-brand-clay">
              <Video className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="font-heading font-bold text-2xl text-white">Active Class Schedule</h3>
            
            {bookedSessions.length === 0 ? (
              <div className="space-y-4">
                <p className="font-sans text-brand-cream/60 max-w-md mx-auto text-sm">
                  You currently have no scheduled classes in escrow. Go to the teacher marketplace and book a trial class to unlock the live session sandbox.
                </p>
                <a 
                  href="#marketplace"
                  className="btn-magnetic bg-brand-clay text-white py-3 px-8 rounded-full font-bold uppercase tracking-wider text-xs inline-block shadow-lg hover:bg-brand-clay/90 transition-all"
                >
                  Find a Teacher on Marketplace →
                </a>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="font-sans text-brand-cream/70 text-sm max-w-md mx-auto">
                  You have booked a lesson! Launch the live classroom to experience peer-to-peer WebRTC video, native screen sharing, and the math whiteboard.
                </p>
                <div className="space-y-3 max-w-md mx-auto">
                  {bookedSessions.map((session, i) => (
                    <div 
                      key={session.id || i} 
                      className="bg-brand-charcoal/80 border border-brand-cream/15 rounded-2xl p-4 flex justify-between items-center text-left hover:border-brand-clay/40 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={getTeacherAvatar(session.avatar, session.teacherName)}
                          alt={session.teacherName || 'Tutor'}
                          className="w-10 h-10 rounded-full object-cover border border-brand-cream/20"
                          onError={handleAvatarError(session.teacherName)}
                        />
                        <div>
                          <span className="font-heading font-bold text-sm text-white block">{session.teacherName}</span>
                          <span className="font-sans text-xs text-brand-cream/60 block">
                            {session.subject} · {session.slot?.day || 'Today'} at {session.slot?.time || 'Scheduled'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartSession(session)}
                        className="btn-magnetic bg-brand-clay hover:bg-brand-clay/90 text-white font-bold py-2.5 px-5 rounded-full text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Join Class
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Live Class Workspace */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto">
            
            {/* Left/Middle Column: Video stream + Whiteboard */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Header Panel */}
              <div className="bg-brand-moss/10 border border-brand-cream/10 rounded-[2rem] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xs text-brand-clay tracking-widest block uppercase font-bold">
                      CLASS IN PROGRESS
                    </span>
                    <span className="font-mono text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      Peer-to-Peer Encrypted
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-xl text-white mt-1">
                    {activeSession.subject || 'Academics Prep'} · {activeSession.curriculum || 'Standard Syllabus'}
                  </h3>
                  <span className="font-sans text-xs text-brand-cream/70">
                    Lead Educator: <b className="text-white">{activeSession.teacherName}</b>
                  </span>
                </div>
                
                {/* Live Clock & Mode Switcher */}
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                  {/* Mode switcher pills */}
                  <div className="flex items-center bg-black/40 border border-brand-cream/15 rounded-full p-1">
                    <button
                      onClick={() => setClassroomMode('split')}
                      className={`py-1 px-3 rounded-full font-mono text-[9px] uppercase font-bold transition-all ${
                        classroomMode === 'split' ? 'bg-brand-clay text-white shadow' : 'text-brand-cream/60 hover:text-white'
                      }`}
                      title="Split Video & Board"
                    >
                      Split
                    </button>
                    <button
                      onClick={() => setClassroomMode('video')}
                      className={`py-1 px-3 rounded-full font-mono text-[9px] uppercase font-bold transition-all ${
                        classroomMode === 'video' ? 'bg-brand-clay text-white shadow' : 'text-brand-cream/60 hover:text-white'
                      }`}
                      title="Focus Video & Screen Share"
                    >
                      Video & Screen
                    </button>
                    <button
                      onClick={() => setClassroomMode('whiteboard')}
                      className={`py-1 px-3 rounded-full font-mono text-[9px] uppercase font-bold transition-all ${
                        classroomMode === 'whiteboard' ? 'bg-brand-clay text-white shadow' : 'text-brand-cream/60 hover:text-white'
                      }`}
                      title="Focus Whiteboard"
                    >
                      Whiteboard
                    </button>
                  </div>

                  {/* Live Clock Timer */}
                  <div className="flex items-center gap-2.5 bg-black/60 border border-brand-cream/20 py-1.5 px-4 rounded-full shadow-inner">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="font-mono text-xs font-bold text-white tracking-widest">
                      {formatTime(seconds)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Classroom Video and Whiteboard Feed */}
              <div className="bg-[#0D1318] border border-brand-cream/10 rounded-[2.5rem] overflow-hidden relative min-h-[460px] flex flex-col md:flex-row shadow-2xl">
                
                {/* 1. WebRTC LIVE VIDEO & SCREEN SHARING ROOM */}
                {(classroomMode === 'split' || classroomMode === 'video') && (
                  <div className={`${
                    classroomMode === 'video' ? 'w-full h-[520px]' : 'w-full md:w-1/2 h-[340px] md:h-auto'
                  } bg-[#111920] border-r border-brand-cream/5 flex flex-col justify-between relative overflow-hidden group`}>
                    
                    {/* Top Room Header Bar */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-white bg-black/60 px-2 py-1 rounded backdrop-blur-md flex items-center gap-1.5 pointer-events-auto">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                        REC ON (NDPR)
                      </span>

                      <div className="flex items-center gap-1 pointer-events-auto">
                        <button
                          onClick={() => setVideoFeedType(prev => prev === 'webrtc' ? 'simulated' : 'webrtc')}
                          className="bg-black/60 hover:bg-black/80 text-white font-mono text-[8px] px-2 py-1 rounded border border-white/10 transition-colors"
                          title="Switch video source"
                        >
                          {videoFeedType === 'webrtc' ? 'Live WebRTC' : 'Preview Cam'}
                        </button>
                        <span className="bg-blue-600 text-white font-mono text-[8px] px-2 py-1 rounded shadow-md flex items-center gap-1">
                          <Monitor className="w-2.5 h-2.5" /> 1080p HD
                        </span>
                      </div>
                    </div>

                    {/* VIDEO CONTAINER */}
                    {videoFeedType === 'webrtc' ? (
                      /* Live WebRTC / Jitsi / Screen Share Embed */
                      <div className="absolute inset-0 w-full h-full bg-[#0B0F14]">
                        <iframe
                          src={`https://meet.jit.si/${roomCleanId}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.disableDeepLinking=true`}
                          title="EduVista WebRTC Video Classroom"
                          className="w-full h-full border-0"
                          allow="camera; microphone; fullscreen; display-capture; autoplay"
                        />
                      </div>
                    ) : (
                      /* Fallback Simulated Frame with real teacher avatar & telemetry */
                      <div className="absolute inset-0 w-full h-full flex flex-col justify-end p-6">
                        <img 
                          src={getTeacherAvatar(activeSession.avatar, activeSession.teacherName)} 
                          alt={activeSession.teacherName || 'Tutor'} 
                          className="absolute inset-0 w-full h-full object-cover opacity-80" 
                          onError={handleAvatarError(activeSession.teacherName)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                        <div className="relative z-10 flex justify-between items-end">
                          <div>
                            <span className="font-heading font-bold text-sm text-white drop-shadow block">{activeSession.teacherName}</span>
                            <span className="font-mono text-[9px] text-emerald-400">Camera Connected • 32ms Latency</span>
                          </div>
                          <span className="font-mono text-[9px] bg-brand-clay text-white px-2 py-0.5 rounded">
                            Tutor Feed
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Bottom overlay bar with Screen Share tip */}
                    <div className="absolute bottom-2 left-3 right-3 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="font-mono text-[9px] text-white/80 bg-black/70 px-2 py-1 rounded backdrop-blur-sm">
                        Tip: Click the screen icon in the video bar to share past question papers with student.
                      </span>
                    </div>
                  </div>
                )}

                {/* 2. INTERACTIVE WHITEBOARD */}
                {(classroomMode === 'split' || classroomMode === 'whiteboard') && (
                  <div className={`flex-1 bg-[#FAF9F5] p-4 flex flex-col justify-between ${
                    classroomMode === 'whiteboard' ? 'h-[520px]' : 'h-[360px] md:h-auto'
                  } relative`}>
                    
                    {/* Whiteboard Toolbar */}
                    <div className="flex flex-wrap justify-between items-center text-brand-charcoal mb-2.5 z-10 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-brand-moss font-bold flex items-center gap-1">
                          <Edit3 className="w-3 h-3 text-brand-clay" /> Whiteboard
                        </span>

                        {/* Paper style switch */}
                        <div className="flex items-center gap-1 font-mono text-[8px] bg-brand-moss/5 rounded-lg p-0.5">
                          <button
                            onClick={() => setPaperStyle('grid')}
                            className={`px-1.5 py-0.5 rounded ${paperStyle === 'grid' ? 'bg-white font-bold shadow-xs' : 'text-brand-charcoal/60'}`}
                          >
                            Grid
                          </button>
                          <button
                            onClick={() => setPaperStyle('lined')}
                            className={`px-1.5 py-0.5 rounded ${paperStyle === 'lined' ? 'bg-white font-bold shadow-xs' : 'text-brand-charcoal/60'}`}
                          >
                            Lined
                          </button>
                          <button
                            onClick={() => setPaperStyle('plain')}
                            className={`px-1.5 py-0.5 rounded ${paperStyle === 'plain' ? 'bg-white font-bold shadow-xs' : 'text-brand-charcoal/60'}`}
                          >
                            Plain
                          </button>
                        </div>
                      </div>

                      {/* Tool Palette Controls */}
                      <div className="flex items-center gap-2">
                        {/* Color options */}
                        <div className="flex items-center gap-1">
                          {[
                            { color: '#CC5833', name: 'Clay' },
                            { color: '#2E4036', name: 'Moss' },
                            { color: '#2563EB', name: 'Blue' },
                            { color: '#121A20', name: 'Dark' }
                          ].map(c => (
                            <button
                              key={c.color}
                              onClick={() => { setCurrentColor(c.color); setIsEraser(false); }}
                              className={`w-4 h-4 rounded-full border transition-all ${
                                currentColor === c.color && !isEraser ? 'scale-125 border-brand-charcoal shadow-sm' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: c.color }}
                              title={c.name}
                            />
                          ))}
                        </div>

                        {/* Eraser */}
                        <button
                          onClick={() => setIsEraser(prev => !prev)}
                          className={`p-1 rounded text-xs transition-colors ${
                            isEraser ? 'bg-brand-clay text-white' : 'text-brand-charcoal/60 hover:bg-brand-moss/10'
                          }`}
                          title="Eraser tool"
                        >
                          <Eraser className="w-3.5 h-3.5" />
                        </button>

                        {/* Coordinate axes preset */}
                        <button
                          onClick={insertCoordinateAxes}
                          className="p-1 rounded text-xs text-brand-charcoal/60 hover:bg-brand-moss/10 font-mono font-bold"
                          title="Insert Cartesian Axes (x, y)"
                        >
                          +Axes
                        </button>

                        {/* Download Board */}
                        <button
                          onClick={downloadWhiteboard}
                          className="p-1 rounded text-xs text-brand-charcoal/60 hover:bg-brand-moss/10"
                          title="Download Whiteboard snapshot as PNG"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Clear board */}
                        <button 
                          onClick={clearCanvas} 
                          className="font-mono text-[9px] uppercase tracking-wider text-brand-clay font-bold hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    
                    {/* Drawing Area Canvas */}
                    <div className="flex-1 bg-white border border-brand-moss/15 rounded-2xl overflow-hidden relative cursor-crosshair shadow-inner">
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={400}
                        onMouseDown={handleStartDraw}
                        onMouseMove={handleDrawing}
                        onMouseUp={handleStopDrawing}
                        onMouseLeave={handleStopDrawing}
                        className="w-full h-full block bg-white"
                      />
                      <div className="absolute bottom-3 left-3 font-mono text-[8px] text-brand-moss/40 pointer-events-none select-none">
                        EduVista Virtual Workspace • Click & drag to write
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Classroom Control Panel */}
              <div className="bg-brand-moss/5 border border-brand-cream/10 rounded-[2rem] p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Recording Consent Checklist */}
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-brand-cream/40 block mb-2">NDPR Compliance & Consent</span>
                  <div className="space-y-1.5 font-sans text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-brand-cream/90 font-medium">Instructor Consent: Active</span>
                    </div>
                    <button 
                      onClick={() => setRecordConsent(prev => ({ ...prev, student: !prev.student }))}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left"
                    >
                      <span className={`w-2.5 h-2.5 rounded-full border ${recordConsent.student ? 'bg-brand-clay border-brand-clay' : 'bg-transparent border-brand-cream/35'}`} />
                      <span className="text-brand-cream/90">Student Consent: {recordConsent.student ? "Active" : "Click to Grant"}</span>
                    </button>
                  </div>
                </div>

                {/* Escrow Tracker */}
                <div className="text-center border-y md:border-y-0 md:border-x border-brand-cream/10 py-4 md:py-0">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-brand-cream/40 block mb-1">Escrow Protection</span>
                  <span className="font-heading font-bold text-lg text-white block">
                    {formatCurrency(convertMinor(activeSession.cost, selectedCurrency), selectedCurrency)} Locked
                  </span>
                  <span className="font-sans text-[10px] text-emerald-400 block mt-0.5">✓ Protected by Escrow Auto-Release</span>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={togglePause}
                    className="btn-magnetic p-3 rounded-full border border-brand-cream/20 text-brand-cream hover:bg-brand-cream/5"
                    title={isPaused ? "Resume Lesson Clock" : "Pause Lesson Clock"}
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => alert("Dispute lodged with EduVista Compliance. Funds are frozen in escrow until admin resolution.")}
                    className="btn-magnetic p-3 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10"
                    title="Raise Dispute"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleEndClick}
                    className="btn-magnetic bg-brand-clay hover:bg-brand-clay/90 text-white font-bold py-3 px-6 rounded-full text-xs uppercase tracking-wider shadow-lg transition-all"
                  >
                    End Class & Settle
                  </button>
                </div>
              </div>

            </div>

            {/* Right Column: Chat integration */}
            <div className="lg:col-span-4 bg-brand-charcoal border border-brand-cream/10 rounded-[2.5rem] p-6 flex flex-col justify-between h-[640px] shadow-lg">
              <div className="flex flex-col h-full justify-between">
                
                {/* Chat Header */}
                <div className="flex items-center justify-between border-b border-brand-cream/10 pb-4">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-brand-clay" />
                    <div>
                      <h4 className="font-heading font-bold text-sm text-white">In-Session Chat</h4>
                      <span className="font-sans text-[10px] text-brand-cream/40">Real-Time Lesson Discussion</span>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Connected" />
                </div>

                {/* Quick Educational Template Pills */}
                <div className="py-2 flex flex-wrap gap-1 border-b border-brand-cream/5">
                  <button
                    onClick={() => handleQuickChatTemplate("I have uploaded the past question paper 📎")}
                    className="font-mono text-[8px] bg-brand-cream/5 hover:bg-brand-cream/10 text-brand-cream/70 px-2 py-1 rounded-full border border-brand-cream/10 transition-colors"
                  >
                    📎 Past Question
                  </button>
                  <button
                    onClick={() => handleQuickChatTemplate("Could you please re-explain the last step?")}
                    className="font-mono text-[8px] bg-brand-cream/5 hover:bg-brand-cream/10 text-brand-cream/70 px-2 py-1 rounded-full border border-brand-cream/10 transition-colors"
                  >
                    ❓ Re-explain
                  </button>
                  <button
                    onClick={() => handleQuickChatTemplate("Ready for practice question.")}
                    className="font-mono text-[8px] bg-brand-cream/5 hover:bg-brand-cream/10 text-brand-cream/70 px-2 py-1 rounded-full border border-brand-cream/10 transition-colors"
                  >
                    ✍️ Practice
                  </button>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2 scroll-smooth">
                  {chatMessages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`flex flex-col max-w-[85%] ${
                        msg.sender === 'student' ? 'ml-auto items-end' : 'items-start'
                      }`}
                    >
                      <span className="font-mono text-[8px] text-brand-cream/40 uppercase mb-1">
                        {msg.sender === 'student' ? 'Student' : (activeSession.teacherName || 'Instructor')}
                      </span>
                      <div className={`p-3 rounded-2xl text-xs font-sans leading-normal ${
                        msg.sender === 'student' 
                          ? 'bg-brand-clay text-white rounded-tr-none' 
                          : 'bg-brand-moss/30 border border-brand-cream/10 text-brand-cream rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input Box */}
                <form onSubmit={handleSendMessage} className="border-t border-brand-cream/10 pt-4 flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type lesson notes or question..."
                    className="flex-1 bg-brand-cream/5 border border-brand-cream/10 rounded-full px-4 py-2.5 text-xs text-brand-cream focus:outline-none focus:border-brand-clay focus:ring-1 focus:ring-brand-clay"
                  />
                  <button 
                    type="submit"
                    className="btn-magnetic bg-brand-clay hover:bg-brand-clay/90 text-white p-3 rounded-full flex items-center justify-center transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

              </div>
            </div>

          </div>
        )}

        {/* Post-Session Review Modal overlay */}
        {showReviewForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-brand-charcoal/85 backdrop-blur-sm" onClick={() => setShowReviewForm(false)} />
            <div className="relative bg-brand-cream border border-brand-moss/20 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl z-10 text-brand-charcoal">
              
              <div className="text-center mb-6">
                <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block mb-1">Lesson Completed</span>
                <h3 className="font-heading font-bold text-2xl text-brand-moss">Rate Your Session</h3>
                <p className="font-sans text-xs text-brand-charcoal/70 mt-1">
                  Lesson duration: <b className="font-mono">{formatTime(seconds)}</b>. Secure payout is released to <span className="font-semibold">{activeSession?.teacherName}</span>.
                </p>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-6">
                {/* Rating selection */}
                <div className="text-center">
                  <span className="font-sans text-xs font-semibold text-brand-charcoal/60 block mb-2">Classroom Rating</span>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => setRating(starVal)}
                        className="p-1 hover:scale-110 transition-transform text-amber-500"
                      >
                        <Star className={`w-8 h-8 ${rating >= starVal ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment area */}
                <div>
                  <span className="font-sans text-xs font-semibold text-brand-charcoal/60 block mb-2">Review (Minimum 15 characters)</span>
                  <textarea
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write feedback about the tutor's teaching pace, syllabus coverage, and homework clarity..."
                    className="w-full border border-brand-moss/15 rounded-2xl p-4 text-xs font-sans bg-white focus:outline-none focus:border-brand-clay h-24 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={comment.length < 15}
                    className={`btn-magnetic flex-1 py-3.5 rounded-full font-sans font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-all ${
                      comment.length < 15
                        ? 'bg-brand-moss/40 cursor-not-allowed shadow-none'
                        : 'bg-brand-clay hover:bg-brand-clay/90 shadow-brand-clay/20'
                    }`}
                  >
                    Submit Review & Settle
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="py-3.5 px-5 rounded-full border border-brand-moss/20 hover:bg-brand-moss/5 text-brand-moss font-sans font-bold text-xs uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </section>
  );
}
