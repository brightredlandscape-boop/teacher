import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, AlertTriangle, CheckCircle, Video, MessageSquare, Edit3, Trash2, Send, Star } from 'lucide-react';

export default function SessionEngine({ 
  bookedSessions, 
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
  const [chatMessages, setChatMessages] = useState([
    { sender: 'teacher', text: 'Hello! Welcome to today\'s algebra session. We will focus on quadratic formulas.' },
    { sender: 'student', text: 'Hi Mr. Adebayo, ready to learn!' }
  ]);
  const [inputText, setInputText] = useState('');
  
  // Whiteboard drawing canvas refs
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

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

  // Whiteboard drawing canvas configuration
  useEffect(() => {
    if (activeSession && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#CC5833'; // Accent color: Clay
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      
      // Draw grid lines background
      ctx.strokeStyle = 'rgba(46, 64, 54, 0.05)';
      ctx.lineWidth = 1;
      const step = 20;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Reset style for drawing
      ctx.strokeStyle = '#CC5833';
      ctx.lineWidth = 3.5;
    }
  }, [activeSession]);

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
    ctx.strokeStyle = '#CC5833';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
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
    // Redraw grid
    ctx.strokeStyle = 'rgba(46, 64, 54, 0.05)';
    ctx.lineWidth = 1;
    const step = 20;
    for (let x = 0; x < canvas.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    ctx.strokeStyle = '#CC5833';
    ctx.lineWidth = 3.5;
  };

  // Chat message submission
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const newMsg = { sender: 'student', text: inputText };
    setChatMessages(prev => [...prev, newMsg]);
    setInputText('');

    // Simulated Teacher auto-replies based on query keywords
    setTimeout(() => {
      let replyText = "Interesting question, let's write that formula on the whiteboard!";
      if (inputText.toLowerCase().includes('hello') || inputText.toLowerCase().includes('hi')) {
        replyText = "Hello! Let's solve the equations. Let me know if you have any questions.";
      } else if (inputText.toLowerCase().includes('equation') || inputText.toLowerCase().includes('algebra')) {
        replyText = "Remember that for ax² + bx + c = 0, the solutions are x = (-b ± √(b² - 4ac)) / 2a.";
      } else if (inputText.toLowerCase().includes('difficult') || inputText.toLowerCase().includes('hard')) {
        replyText = "Don't worry! We will take it step-by-step. Try drawing the root values on the board.";
      }
      setChatMessages(prev => [...prev, { sender: 'teacher', text: replyText }]);
    }, 1200);
  };

  const logClockEvent = async (sessionId, eventType) => {
    try {
      const token = localStorage.getItem('edubridge_token');
      await fetch('http://localhost:5000/api/sessions/clock', {
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
    onEndSession(activeSession, rating, comment);
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

  return (
    <section id="session-engine" className="py-24 px-6 md:px-16 lg:px-24 bg-brand-charcoal text-brand-cream border-t border-brand-cream/10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="font-mono text-xs uppercase tracking-widest text-brand-clay font-bold block mb-3">Core Product #2</span>
          <h2 className="font-heading font-bold text-3xl sm:text-5xl tracking-tight text-white">
            Live Session Engine Sandbox
          </h2>
          <p className="font-sans text-brand-cream/70 mt-3 max-w-xl mx-auto text-sm">
            Experience our time-clocked, recorded virtual classroom room. Connects teachers, captures telemetry, and controls payments.
          </p>
        </div>

        {/* If no session is active */}
        {!activeSession ? (
          <div className="bg-brand-moss/10 border border-brand-cream/10 rounded-[3rem] p-8 md:p-16 max-w-4xl mx-auto text-center space-y-6">
            <Video className="w-12 h-12 text-brand-clay mx-auto animate-pulse" />
            <h3 className="font-heading font-bold text-2xl text-white">Active Class Schedule</h3>
            
            {bookedSessions.length === 0 ? (
              <div className="space-y-4">
                <p className="font-sans text-brand-cream/60 max-w-md mx-auto text-sm">
                  You currently have no scheduled classes in escrow. Go to the teacher marketplace and book a trial class to unlock the live session sandbox.
                </p>
                <a 
                  href="#marketplace"
                  className="btn-magnetic bg-brand-clay text-white py-3 px-8 rounded-full font-bold uppercase tracking-wider text-xs inline-block"
                >
                  Find a Teacher
                </a>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="font-sans text-brand-cream/70 text-sm max-w-md mx-auto">
                  You have booked a lesson! Launch the simulated class room to test the live clock, interactive whiteboard, and auto-release escrow mechanics.
                </p>
                <div className="space-y-3 max-w-md mx-auto">
                  {bookedSessions.map((session, i) => (
                    <div 
                      key={i} 
                      className="bg-brand-charcoal/50 border border-brand-cream/10 rounded-2xl p-4 flex justify-between items-center text-left"
                    >
                      <div>
                        <span className="font-heading font-bold text-sm text-white block">Class with {session.teacherName}</span>
                        <span className="font-sans text-xs text-brand-cream/50">{session.subject} · {session.slot.day} at {session.slot.time}</span>
                      </div>
                      <button
                        onClick={() => handleStartSession(session)}
                        className="btn-magnetic bg-brand-moss text-brand-cream hover:bg-brand-clay hover:text-white font-bold py-2.5 px-5 rounded-full text-xs uppercase tracking-wider"
                      >
                        Start Class
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Live Class Workspace */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-7xl mx-auto">
            
            {/* Left/Middle Column: Video stream + Whiteboard */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Header Panel */}
              <div className="bg-brand-moss/10 border border-brand-cream/10 rounded-[2rem] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="font-mono text-2xs text-brand-clay tracking-widest block uppercase">SESSION IN PROGRESS</span>
                  <h3 className="font-heading font-bold text-xl text-white">Mathematics Prep · WAEC Syllabus</h3>
                  <span className="font-sans text-xs text-brand-cream/60">Instructor: {activeSession.teacherName}</span>
                </div>
                
                {/* Live Clock Timer */}
                <div className="flex items-center gap-3 bg-brand-charcoal border border-brand-cream/20 py-2 px-5 rounded-full shadow-inner">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="font-mono text-sm font-bold text-white tracking-widest">
                    LIVE · {formatTime(seconds)}
                  </span>
                </div>
              </div>

              {/* Classroom Video and Whiteboard Feed */}
              <div className="bg-brand-charcoal border border-brand-cream/10 rounded-[2.5rem] overflow-hidden relative min-h-[420px] flex flex-col md:flex-row">
                
                {/* Webcam Mock Frame (Daily.co Simulation) */}
                <div className="w-full md:w-1/3 bg-[#121A20] border-r border-brand-cream/5 flex flex-col justify-between h-[180px] md:h-auto relative overflow-hidden group">
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-white bg-black/40 px-2 py-1 rounded backdrop-blur-md flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                      REC
                    </span>
                    <span className="bg-blue-600 text-white font-mono text-[8px] px-1.5 py-1 rounded shadow-md flex items-center gap-1">
                      <Video className="w-2.5 h-2.5" /> daily.co
                    </span>
                  </div>
                  
                  {/* Video simulation using a placeholder video loop or image */}
                  <div className="absolute inset-0 w-full h-full">
                    <img 
                      src={activeSession.avatar} 
                      alt={activeSession.teacherName} 
                      className="w-full h-full object-cover opacity-90 mix-blend-luminosity hover:mix-blend-normal transition-all duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121A20]/90 via-transparent to-transparent"></div>
                  </div>
                  
                  {/* Floating Daily.co Controls */}
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div>
                      <span className="font-sans font-bold text-xs text-white drop-shadow-md block">{activeSession.teacherName}</span>
                      <span className="font-mono text-[8px] text-white/70">192 kbps • 32ms</span>
                    </div>
                  </div>
                </div>

                {/* Interactive Whiteboard Canvas */}
                <div className="flex-1 bg-[#FAF9F5] p-4 flex flex-col justify-between h-[300px] md:h-auto relative">
                  <div className="flex justify-between items-center text-brand-charcoal mb-2 z-10">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-brand-moss/60 font-bold">Whiteboard (Click & Drag to Draw)</span>
                    <button 
                      onClick={clearCanvas} 
                      className="font-mono text-[9px] uppercase tracking-widest text-brand-clay font-bold hover:underline"
                    >
                      Clear Board
                    </button>
                  </div>
                  
                  {/* Drawing Area */}
                  <div className="flex-1 bg-white border border-brand-moss/10 rounded-2xl overflow-hidden relative cursor-crosshair">
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={260}
                      onMouseDown={handleStartDraw}
                      onMouseMove={handleDrawing}
                      onMouseUp={handleStopDrawing}
                      onMouseLeave={handleStopDrawing}
                      className="w-full h-full block bg-white"
                    />
                    <div className="absolute bottom-4 left-4 font-mono text-[9px] text-brand-moss/45 pointer-events-none select-none">
                      x + y = 10 <br />
                      {"2x = 8 => x = 4"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Classroom Control Panel */}
              <div className="bg-brand-moss/5 border border-brand-cream/10 rounded-[2rem] p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Recording Consent Checklist */}
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-brand-cream/40 block mb-2">Recording Consent</span>
                  <div className="space-y-1.5 font-sans text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-brand-cream/80">Instructor Consent: Active</span>
                    </div>
                    <button 
                      onClick={() => setRecordConsent(prev => ({ ...prev, student: !prev.student }))}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left"
                    >
                      <span className={`w-2.5 h-2.5 rounded-full border ${recordConsent.student ? 'bg-brand-clay border-brand-clay' : 'bg-transparent border-brand-cream/35'}`} />
                      <span className="text-brand-cream/80">Student Consent: {recordConsent.student ? "Active" : "Click to Grant"}</span>
                    </button>
                  </div>
                </div>

                {/* Escrow Tracker */}
                <div className="text-center border-y md:border-y-0 md:border-x border-brand-cream/10 py-4 md:py-0">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-brand-cream/40 block mb-1">Escrow Protection</span>
                  <span className="font-heading font-bold text-lg text-white block">
                    {formatCurrency(convertMinor(activeSession.cost, selectedCurrency), selectedCurrency)} Locked
                  </span>
                  <span className="font-sans text-[10px] text-brand-cream/50 block">Protected by EduBridge Escrow Guard</span>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={togglePause}
                    className="btn-magnetic p-3 rounded-full border border-brand-cream/20 text-brand-cream hover:bg-brand-cream/5"
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => alert("Dispute lodged. A support specialist is joining within 5 minutes. Escrow funds locked.")}
                    className="btn-magnetic p-3 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10"
                    title="Raise Dispute"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleEndClick}
                    className="btn-magnetic bg-brand-clay hover:bg-brand-clay/90 text-white font-bold py-3 px-6 rounded-full text-xs uppercase tracking-wider"
                  >
                    End Class
                  </button>
                </div>
              </div>

            </div>

            {/* Right Column: Chat integration */}
            <div className="bg-brand-charcoal border border-brand-cream/10 rounded-[2.5rem] p-6 flex flex-col justify-between h-[560px] shadow-lg">
              <div className="flex flex-col h-full justify-between">
                
                {/* Chat Header */}
                <div className="flex items-center gap-3 border-b border-brand-cream/10 pb-4">
                  <MessageSquare className="w-5 h-5 text-brand-clay" />
                  <div>
                    <h4 className="font-heading font-bold text-sm text-white">In-Session Chat</h4>
                    <span className="font-sans text-[10px] text-brand-cream/40">Secure Peer-to-Peer Link</span>
                  </div>
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
                        {msg.sender === 'student' ? 'Student' : 'Instructor'}
                      </span>
                      <div className={`p-3 rounded-2xl text-xs font-sans leading-normal ${
                        msg.sender === 'student' 
                          ? 'bg-brand-clay text-white rounded-tr-none' 
                          : 'bg-brand-moss/20 border border-brand-cream/10 text-brand-cream rounded-tl-none'
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
                    placeholder="Type lesson notes..."
                    className="flex-1 bg-brand-cream/5 border border-brand-cream/10 rounded-full px-4 py-2.5 text-xs text-brand-cream focus:outline-none focus:border-brand-moss focus:ring-1 focus:ring-brand-moss"
                  />
                  <button 
                    type="submit"
                    className="btn-magnetic bg-brand-moss hover:bg-brand-moss/80 text-brand-cream p-3 rounded-full flex items-center justify-center"
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
            <div className="absolute inset-0 bg-brand-charcoal/85 backdrop-blur-sm" />
            <div className="relative bg-brand-cream border border-brand-moss/20 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl z-10 text-brand-charcoal">
              
              <div className="text-center mb-6">
                <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block mb-1">Lesson Completed</span>
                <h3 className="font-heading font-bold text-2xl text-brand-moss">Rate Your Session</h3>
                <p className="font-sans text-xs text-brand-charcoal/70 mt-1">
                  Secure payout has been sent to <span className="font-semibold">{activeSession.teacherName}</span>.
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
                        className="p-1 hover:scale-110 transition-transform text-brand-clay"
                      >
                        <Star className={`w-8 h-8 ${rating >= starVal ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment area */}
                <div>
                  <span className="font-sans text-xs font-semibold text-brand-charcoal/60 block mb-2">Review (Minimum 20 characters)</span>
                  <textarea
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write a feedback note for the teacher..."
                    className="w-full border border-brand-moss/15 rounded-2xl p-4 text-xs font-sans bg-white focus:outline-none focus:border-brand-moss h-24 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={comment.length < 20}
                  className={`btn-magnetic w-full py-4 rounded-full font-sans font-bold text-xs uppercase tracking-wider text-white shadow-lg ${
                    comment.length < 20
                      ? 'bg-brand-moss/40 cursor-not-allowed shadow-none'
                      : 'bg-brand-clay hover:bg-brand-clay/90 shadow-brand-clay/20'
                  }`}
                >
                  Submit Review & Release Payout
                </button>
              </form>

            </div>
          </div>
        )}

      </div>
    </section>
  );
}
