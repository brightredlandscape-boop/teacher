import React, { useState } from 'react';
import { X, Calendar, CreditCard, Shield, Clock, Lock } from 'lucide-react';

export default function BookingModal({ 
  isOpen, 
  onClose, 
  teacher, 
  selectedCurrency, 
  walletBalance, 
  onBook, 
  formatCurrency, 
  convertMinor,
  bookedSessions = []
}) {
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [isProcessing, setIsProcessing] = useState(false);

  // Credit Card Gateway States
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  
  // OTP Verification States
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [paymentStatusText, setPaymentStatusText] = useState('');

  const trialRateNgnMinor = 350000; // ₦3,500
  const activeRateMinor = trialRateNgnMinor; // ₦3,500 across board
  const convertedRateMinor = convertMinor(activeRateMinor, selectedCurrency);
  const formattedRate = formatCurrency(convertedRateMinor, selectedCurrency);

  const numSelected = selectedSlots.length > 0 ? selectedSlots.length : 1;
  const totalRateMinor = activeRateMinor * numSelected;
  const formattedTotalRate = formatCurrency(convertMinor(totalRateMinor, selectedCurrency), selectedCurrency);

  // Generate slots based on teacher availability
  const slots = [];
  let slotId = 1;
  if (teacher && teacher.availability && Object.keys(teacher.availability).length > 0) {
    Object.entries(teacher.availability).forEach(([day, times]) => {
      if (Array.isArray(times)) {
        times.forEach(time => {
          slots.push({ id: slotId++, day, time });
        });
      }
    });
  }
  // Fallback slots if none defined
  if (slots.length === 0) {
    slots.push({ id: 1, day: "Today", time: "3:30 PM" });
    slots.push({ id: 2, day: "Tomorrow", time: "10:00 AM" });
    slots.push({ id: 3, day: "Wednesday", time: "4:00 PM" });
    slots.push({ id: 4, day: "Thursday", time: "11:30 AM" });
  }

  const isSlotBooked = (slot) => {
    return (bookedSessions || []).some(session => 
      (session.teacherId === teacher.id || session.teacherId === teacher.uid) &&
      session.slot &&
      session.slot.day === slot.day &&
      session.slot.time === slot.time
    );
  };

  // Format Card Number (adds spaces every 4 digits)
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const matches = value.match(/\d{1,4}/g);
    const matchString = matches ? matches.join(' ') : '';
    setCardNumber(matchString);
  };

  // Format Card Expiry (adds slash after 2 digits)
  const handleCardExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 3) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setCardExpiry(value);
  };

  // Format CVV (max 3 digits)
  const handleCardCvvChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 3) value = value.slice(0, 3);
    setCardCvv(value);
  };

  const handlePay = () => {
    if (selectedSlots.length === 0) return;
    
    if (paymentMethod === 'card') {
      setShowCardForm(true);
    } else {
      // Wallet payment
      setIsProcessing(true);
      setTimeout(() => {
        const slotsData = selectedSlots.map(id => slots.find(s => s.id === id));
        onBook(totalRateMinor, slotsData, paymentMethod);
        setIsProcessing(false);
        resetStates();
        onClose();
      }, 1500);
    }
  };

  // Simulated Card Payment Gateway Checkout Submit
  const handleCardPaymentSubmit = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentStatusText("Contacting Paystack checkout server...");
    
    setTimeout(() => {
      setPaymentStatusText("Authorizing transaction with the bank...");
      setTimeout(() => {
        setPaymentStatusText("Verifying 3D Secure verification protocol...");
        setShowOtpForm(true);
        setIsProcessing(false);
      }, 1200);
    }, 1200);
  };

  // OTP Verification Submit
  const handleOtpVerifySubmit = (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      alert("Please enter a valid verification code.");
      return;
    }

    setIsProcessing(true);
    setPaymentStatusText("Validating OTP code...");

    setTimeout(() => {
      setPaymentStatusText("Securing escrow booking deposit...");
      setTimeout(() => {
        // Successful payment booking release
        const slotsData = selectedSlots.map(id => slots.find(s => s.id === id));
        onBook(totalRateMinor, slotsData, 'card');
        setIsProcessing(false);
        resetStates();
        onClose();
      }, 1000);
    }, 1200);
  };

  const resetStates = () => {
    setShowCardForm(false);
    setShowOtpForm(false);
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardName('');
    setOtpCode('');
    setPaymentStatusText('');
  };

  const isWalletInsufficient = paymentMethod === 'wallet' && walletBalance < totalRateMinor;

  if (!isOpen || !teacher) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-brand-charcoal/60 backdrop-blur-sm" onClick={() => { resetStates(); onClose(); }} />
      
      {/* Modal Container */}
      <div className="relative bg-brand-cream border border-brand-moss/20 rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button onClick={() => { resetStates(); onClose(); }} className="absolute top-6 right-6 text-brand-moss/60 hover:text-brand-moss">
          <X className="w-5 h-5" />
        </button>

        {/* SCREEN 1: OTP Verification Screen */}
        {showOtpForm ? (
          <div className="space-y-6">
            <div className="mb-4">
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block mb-1">3D Secure Validation</span>
              <h3 className="font-heading font-bold text-2xl text-brand-moss">Verification Code Required</h3>
              <p className="font-sans text-xs text-brand-charcoal/70 mt-1">
                A verification code was sent to the phone number associated with this card. Please enter it below to complete authorization.
              </p>
            </div>

            {paymentStatusText && (
              <div className="bg-brand-moss/5 border border-brand-moss/10 rounded-xl p-3.5 text-center text-xs font-mono text-brand-moss animate-pulse">
                {paymentStatusText}
              </div>
            )}

            <form onSubmit={handleOtpVerifySubmit} className="space-y-4">
              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Enter OTP / Verification Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 123456"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-white border border-brand-moss/10 rounded-xl px-4 py-3 text-center tracking-widest font-mono text-lg text-brand-charcoal focus:outline-none focus:border-brand-clay"
                  disabled={isProcessing}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing || !otpCode}
                  className="btn-magnetic w-full py-4 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
                >
                  {isProcessing ? 'Verifying...' : 'Submit Verification Code'}
                </button>
              </div>
            </form>
          </div>
        ) : showCardForm ? (
          /* SCREEN 2: Card Credentials Form Screen */
          <div className="space-y-6">
            <div className="mb-4">
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block mb-1">Paystack Integration</span>
              <h3 className="font-heading font-bold text-2xl text-brand-moss">Credit / Debit Card Checkout</h3>
              <p className="font-sans text-xs text-brand-charcoal/70 mt-1">
                Enter your card credentials below. Payments are held in a secure local timed escrow.
              </p>
            </div>

            {/* Virtual Card Preview */}
            <div className="bg-brand-moss text-brand-cream p-6 rounded-2xl shadow-md space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-clay/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex justify-between items-center">
                <span className="font-heading font-bold text-xs uppercase tracking-widest opacity-60">EduBridge Secure Card</span>
                <Lock className="w-4 h-4 text-brand-clay" />
              </div>
              <div className="space-y-1">
                <span className="font-mono text-base tracking-widest block min-h-[24px]">
                  {cardNumber || '•••• •••• •••• ••••'}
                </span>
                <div className="flex justify-between text-2xs uppercase tracking-wider opacity-60">
                  <span>Cardholder Name</span>
                  <span>Expires</span>
                </div>
                <div className="flex justify-between font-sans font-bold text-xs">
                  <span className="truncate max-w-[70%]">{cardName || 'YOUR FULL NAME'}</span>
                  <span>{cardExpiry || 'MM/YY'}</span>
                </div>
              </div>
            </div>

            {paymentStatusText && (
              <div className="bg-brand-moss/5 border border-brand-moss/10 rounded-xl p-3.5 text-center text-xs font-mono text-brand-moss animate-pulse">
                {paymentStatusText}
              </div>
            )}

            <form onSubmit={handleCardPaymentSubmit} className="space-y-4 font-sans text-xs">
              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Cardholder Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ngozi Adeleke"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-brand-moss/10 rounded-xl px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                  disabled={isProcessing}
                />
              </div>

              <div>
                <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Card Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4000 1234 5678 9010"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  className="w-full bg-white border border-brand-moss/10 rounded-xl px-4 py-3 font-mono text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm"
                  disabled={isProcessing}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">Expiration Date</label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={handleCardExpiryChange}
                    className="w-full bg-white border border-brand-moss/10 rounded-xl px-4 py-3 font-mono text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm text-center"
                    disabled={isProcessing}
                  />
                </div>
                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-2">CVV / Security Code</label>
                  <input
                    type="password"
                    required
                    placeholder="e.g. 123"
                    value={cardCvv}
                    onChange={handleCardCvvChange}
                    className="w-full bg-white border border-brand-moss/10 rounded-xl px-4 py-3 font-mono text-brand-charcoal focus:outline-none focus:border-brand-clay text-sm text-center"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCardForm(false)}
                  className="w-1/3 py-4 rounded-full border border-brand-moss/20 hover:bg-brand-moss/5 text-brand-moss font-bold text-xs uppercase tracking-wider transition-colors"
                  disabled={isProcessing}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-2/3 py-4 rounded-full bg-brand-clay hover:bg-brand-clay/90 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
                >
                  {isProcessing ? 'Authorizing...' : `Pay ${formattedRate}`}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* SCREEN 3: Standard Lesson Booking & Method Selection Screen */
          <>
            {/* Header */}
            <div className="mb-6">
              <span className="font-mono text-2xs uppercase tracking-widest text-brand-clay font-bold block mb-1">Secure Check-out</span>
              <h3 className="font-heading font-bold text-2xl text-brand-moss">Book a Trial Class</h3>
              <p className="font-sans text-xs text-brand-charcoal/70 mt-1">
                with <span className="font-semibold">{teacher.name}</span>
              </p>
            </div>

            {/* Lesson Info */}
            <div className="bg-brand-moss/5 border border-brand-moss/10 rounded-2xl p-4 mb-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-brand-moss/10">
                  <img src={teacher.avatar} alt={teacher.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="font-heading font-bold text-sm text-brand-moss">1-on-1 Trial Class</span>
                  <span className="font-sans text-xs text-brand-charcoal/60 block">60 minutes · WAEC/Cambridge</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-heading font-bold text-base text-brand-moss block">{formattedRate}</span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-brand-clay block font-bold">100% Refundable</span>
              </div>
            </div>

            {/* Select Slots */}
            <div className="mb-6">
              <span className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-brand-clay" /> 1. Select Availability Slot</span>
                <span className="font-mono text-[9px] bg-brand-moss/10 px-2 py-0.5 rounded-full text-brand-charcoal/70">
                  {teacher?.timezone || 'WAT (GMT+1)'}
                </span>
              </span>
              <div className="grid grid-cols-2 gap-3">
                {slots.map(slot => {
                  const isSelected = selectedSlots.includes(slot.id);
                  const booked = isSlotBooked(slot);
                  return (
                    <button
                      key={slot.id}
                      disabled={booked}
                      onClick={() => {
                        setSelectedSlots(prev => 
                          prev.includes(slot.id) 
                            ? prev.filter(id => id !== slot.id) 
                            : [...prev, slot.id]
                        );
                      }}
                      className={`py-3 px-4 rounded-xl border text-left font-sans transition-all duration-300 ${
                        booked
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                          : isSelected
                            ? 'border-brand-clay bg-brand-clay/5 text-brand-charcoal ring-1 ring-brand-clay'
                            : 'border-brand-moss/10 bg-white hover:border-brand-moss/40 text-brand-charcoal/80'
                      }`}
                    >
                      <span className="text-xs font-bold block flex justify-between items-center font-heading">
                        <span>{slot.day}</span>
                        {booked && <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-mono uppercase font-bold">Booked</span>}
                      </span>
                      <span className="text-[10px] text-brand-charcoal/60 mt-0.5 block flex items-center gap-1">
                        <Clock className="w-3 h-3 text-brand-moss/40" /> {slot.time}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Processor */}
            <div className="mb-8">
              <span className="font-heading font-bold text-xs uppercase tracking-wider text-brand-moss block mb-3 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-brand-clay" /> 2. Choose Payment Method
              </span>
              <div className="space-y-2">
                {/* Wallet Payment Option */}
                <button
                  onClick={() => setPaymentMethod('wallet')}
                  className={`w-full py-3.5 px-4 rounded-xl border text-left font-sans transition-all duration-300 flex items-center justify-between ${
                    paymentMethod === 'wallet'
                      ? 'border-brand-moss bg-brand-moss/5 ring-1 ring-brand-moss'
                      : 'border-brand-moss/10 bg-white hover:border-brand-moss/30'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block text-brand-charcoal">EduBridge Balance Wallet</span>
                    <span className="text-[10px] text-brand-charcoal/60 mt-0.5 block">
                      Available: {formatCurrency(convertMinor(walletBalance, selectedCurrency), selectedCurrency)}
                    </span>
                  </div>
                  {isWalletInsufficient && (
                    <span className="font-mono text-[9px] uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-bold">
                      Low Balance
                    </span>
                  )}
                </button>
                {isWalletInsufficient && (
                  <div className="text-[11px] text-red-600 mt-1.5 px-3 py-2 font-sans flex justify-between items-center bg-rose-50/50 border border-rose-100 rounded-xl">
                    <span>Insufficient funds in balance wallet.</span>
                    <a
                      href="/#topup"
                      onClick={(e) => {
                        e.preventDefault();
                        onClose();
                        window.history.pushState(null, '', '/#topup');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      className="font-heading font-extrabold text-[10px] uppercase tracking-wider text-brand-clay hover:underline cursor-pointer"
                    >
                      Top Up Wallet →
                    </a>
                  </div>
                )}

                {/* Credit Card Option (Paystack simulation) */}
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`w-full py-3.5 px-4 rounded-xl border text-left font-sans transition-all duration-300 flex items-center justify-between ${
                    paymentMethod === 'card'
                      ? 'border-brand-moss bg-brand-moss/5 ring-1 ring-brand-moss'
                      : 'border-brand-moss/10 bg-white hover:border-brand-moss/30'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block text-brand-charcoal">
                      Credit / Debit Card (Paystack)
                    </span>
                    <span className="text-[10px] text-brand-charcoal/60 mt-0.5 block">
                      Supports local cards, Apple Pay, Google Pay, Mobile Money
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Footer actions */}
            <div className="space-y-3">
              <button
                onClick={handlePay}
                disabled={selectedSlots.length === 0 || isWalletInsufficient || isProcessing}
                className={`btn-magnetic w-full py-4 rounded-full font-sans font-bold text-xs uppercase tracking-wider text-white shadow-lg ${
                  selectedSlots.length === 0 || isWalletInsufficient 
                    ? 'bg-brand-moss/40 cursor-not-allowed shadow-none'
                    : 'bg-brand-clay hover:bg-brand-clay/90 shadow-brand-clay/20'
                }`}
              >
                {isProcessing 
                  ? "Securing Escrow..." 
                  : selectedSlots.length > 0
                    ? paymentMethod === 'card' 
                      ? "Enter Card Details" 
                      : `Pay ${formattedTotalRate} & Lock Escrow`
                    : "Select at least one slot"
                }
              </button>
              
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-brand-charcoal/50">
                <Shield className="w-3.5 h-3.5 text-brand-moss/40" />
                <span>Escrow lock: funds released 24h post-lesson validation.</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
