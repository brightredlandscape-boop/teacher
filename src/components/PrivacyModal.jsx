import React from 'react';
import { X, Shield, Lock, Eye, FileText, Check } from 'lucide-react';

export default function PrivacyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-brand-charcoal/60 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div className="relative bg-brand-cream border border-brand-moss/20 rounded-[2.5rem] w-full max-w-2xl p-8 md:p-10 shadow-2xl z-10 max-h-[85vh] overflow-y-auto font-sans text-brand-charcoal leading-relaxed scrollbar-thin scrollbar-thumb-brand-moss/20 animate-fade-in">
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-brand-moss/60 hover:text-brand-moss transition-colors rounded-full p-1 bg-brand-moss/5 hover:bg-brand-moss/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6 border-b border-brand-moss/10 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-moss text-brand-cream flex items-center justify-center">
            <Shield className="w-6 h-6 text-brand-clay" />
          </div>
          <div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-brand-clay font-bold block mb-1">Compliance & Safety</span>
            <h2 className="font-heading font-bold text-2xl text-brand-moss">Data Protection & Privacy Policy</h2>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 text-xs text-brand-charcoal/85 pr-2">
          <p className="italic text-brand-charcoal/70">
            Last Updated: July 10, 2026. EduVista Africa is a product of **Zeerocodes Automation Limited**. We are committed to safeguarding your personal data in compliance with the General Data Protection Regulation (GDPR) and the Nigeria Data Protection Regulation (NDPR).
          </p>

          {/* Section 1 */}
          <div className="space-y-2">
            <h3 className="font-heading font-bold text-sm text-brand-moss uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand-clay shrink-0" />
              1. What Data We Collect
            </h3>
            <p>
              We collect information necessary to connect parents with background-checked tutors and secure payment escrows. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>For Parents & Students:</strong> Parent names, email addresses, phone numbers, children's names, dates of birth, academic subject interests, and curriculum goals (WAEC, JAMB, Cambridge IGCSE, etc.).</li>
              <li><strong>For Educators:</strong> Full legal name, professional credentials (university degrees, CVs), government-issued ID documents for background verification, WhatsApp numbers, hourly tuition rates, availability, and introduction videos.</li>
              <li><strong>Session Telemetry:</strong> Connection logs, server-side class attendance logs, active instruction timers, and optional classroom video lesson recordings.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h3 className="font-heading font-bold text-sm text-brand-moss uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4 text-brand-clay shrink-0" />
              2. How We Use Your Data
            </h3>
            <p>
              Your data is processed strictly to coordinate tutoring lessons and guarantee transaction protections:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Instruction Coordination:</strong> Organizing lessons, assignments, grading cards, and generating student progress digests.</li>
              <li><strong>Escrow Settlement:</strong> Managing billing top-ups, dispute arbitrations, and releases to localized bank accounts/mobile money wallets.</li>
              <li><strong>AI Telemetry Analytics:</strong> Using Google Gemini AI to analyze homework scores and attendance trends to compile plain-language progress reports for parents. AI models process anonymized parameters and do not use personal data for training.</li>
              <li><strong>Email Communications:</strong> Sending automatic lesson schedule updates, receipt audits, and system security alerts.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h3 className="font-heading font-bold text-sm text-brand-moss uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-clay shrink-0" />
              3. Data Sharing & Third-Parties
            </h3>
            <p>
              We never sell or rent your personal information to third parties. We share data only with verified subprocessors to run the platform:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Stripe & Paystack:</strong> Processing card transactions and securing wallet deposits.</li>
              <li><strong>Wise Platform:</strong> Processing direct local payouts to educator bank accounts.</li>
              <li><strong>Zoho Zeptomail:</strong> Processing transactional system emails.</li>
              <li><strong>Firebase (Google Cloud):</strong> Managing secured authentication databases and session storage.</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h3 className="font-heading font-bold text-sm text-brand-moss uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-clay shrink-0" />
              4. Security Measures & Retention
            </h3>
            <p>
              We store local database files under cryptographically secure encryption protocols (AES-256) at rest. All communication in transit is protected using SSL/TLS encryption.
            </p>
            <p>
              <strong>Classroom Video Recordings:</strong> To protect student privacy, optional classroom video recordings are stored for a maximum of 30 days for pedagogical audit and dispute resolution purposes, after which they are permanently deleted from our servers.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-2 font-semibold">
            <h3 className="font-heading font-bold text-sm text-brand-moss uppercase tracking-wider flex items-center gap-2">
              <Check className="w-4 h-4 text-brand-clay shrink-0" />
              5. Your Legal Rights (GDPR & NDPR)
            </h3>
            <p className="font-normal">
              Under GDPR and NDPR guidelines, you retain full rights over your data. You may request access to, correction of, or permanent deletion of your account and personal records at any time by contacting our support team at **privacy@eduvista.com**.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-brand-moss/10 pt-6 flex justify-between items-center text-[10px] text-brand-charcoal/50">
          <span>Zeerocodes Automation Limited © 2026</span>
          <button 
            onClick={onClose} 
            className="bg-brand-moss text-white font-heading font-bold uppercase tracking-wider px-6 py-2.5 rounded-full hover:bg-brand-clay transition-colors hover:scale-103 duration-300"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
}
