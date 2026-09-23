import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Eye, Trash2, Database, AlertCircle, ArrowLeft } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 mb-6 font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
      </Link>

      <div className="glass-panel rounded-2xl p-8 border border-slate-800 space-y-8">
        <div className="border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30 text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4" /> Statutory Compliance Notice
          </div>
          <h1 className="text-3xl font-extrabold text-white font-['Plus_Jakarta_Sans']">
            India DPDP Act 2023 Compliance & Privacy Declaration
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            How HR AI Problem Classifier protects employee personal data, ensures purpose limitation, and honors rights.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card p-5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-teal-400 font-semibold text-sm mb-2">
              <Eye className="w-4 h-4" /> 1. Data Minimization
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              We collect strictly only required grievance details (title, description, channel). Sensitive fields are encrypted at rest using AES-256 / Fernet encryption.
            </p>
          </div>

          <div className="glass-card p-5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-teal-400 font-semibold text-sm mb-2">
              <Lock className="w-4 h-4" /> 2. Purpose Limitation
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your grievance submissions are processed solely for HR resolution, triage, and systemic pattern detection. Data is never used for training external ML models.
            </p>
          </div>

          <div className="glass-card p-5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-teal-400 font-semibold text-sm mb-2">
              <Database className="w-4 h-4" /> 3. Immutable Audit Trail
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every view, AI classification, manual override, and routing decision is logged immutably with timestamp and IP address to prevent tampering.
            </p>
          </div>

          <div className="glass-card p-5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-teal-400 font-semibold text-sm mb-2">
              <Trash2 className="w-4 h-4" /> 4. Right to Erasure & Forgotten
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Resolved grievance records are retained for a maximum of 2 years (730 days) and then permanently anonymized, retaining solely non-PII audit metrics.
            </p>
          </div>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-sky-400" /> Self-Hosted AI Architecture
          </h3>
          <p>
            The classification engine uses a self-hosted local Large Language Model (Ollama) operating entirely within enterprise perimeter servers. No employee personal data ever traverses cross-border boundaries or third-party cloud APIs.
          </p>
        </div>
      </div>
    </div>
  );
};
