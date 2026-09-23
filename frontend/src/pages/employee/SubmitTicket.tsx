import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService, TicketSubmitPayload } from '../../services/tickets';
import {
  FilePlus2,
  Send,
  Lock,
  Paperclip,
  CheckCircle2,
  Shield,
  Sparkles,
  HelpCircle,
  Tag
} from 'lucide-react';

const HR_CATEGORIES = [
  { name: 'Payroll', desc: 'Salary delay, incorrect salary, tax deduction issue, bonus, payslip' },
  { name: 'Leave & Attendance', desc: 'Leave balance issue, attendance correction, work-from-home request, LOP' },
  { name: 'Benefits', desc: 'Insurance, cashless claim, medical reimbursement, wellness, PF, gratuity' },
  { name: 'Policy & Compliance', desc: 'Company policy clarification, workplace conduct, compliance concern' },
  { name: 'Employee Relations', desc: 'Workplace conflict, manager issue, harassment, unfair treatment' },
  { name: 'Recruitment & Onboarding', desc: 'Offer letter, joining documents, onboarding problem, BGV' },
  { name: 'Learning & Development', desc: 'Training request, certification, skill development, workshop' },
  { name: 'General HR Query', desc: 'Unclear or common HR question, letter request, experience certificate' },
  { name: 'Others', desc: 'Any other miscellaneous issue not listed above' },
];

export const SubmitTicket: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Payroll');
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [submissionType, setSubmissionType] = useState<TicketSubmitPayload['submission_type']>('form');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [dpdpConsent, setDpdpConsent] = useState(true);
  const [attachments, setAttachments] = useState<Array<{ filename: string; url: string; size: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const navigate = useNavigate();

  // Real-time suggested category calculation based on user typing
  useEffect(() => {
    const text = `${title} ${description}`.toLowerCase();
    if (!text.trim()) {
      setSuggestedCategory(null);
      return;
    }

    if (text.match(/salary|pay(roll)?|bonus|increment|arrears|deduction|tds|payslip|wages|tax/)) {
      setSuggestedCategory('Payroll');
      setSelectedCategory('Payroll');
    } else if (text.match(/leave|sick leave|earned leave|maternity|paternity|attendance|swipe|biometric|lop|wfh|work from home/)) {
      setSuggestedCategory('Leave & Attendance');
      setSelectedCategory('Leave & Attendance');
    } else if (text.match(/insurance|mediclaim|health policy|pension|provident fund|pf|gratuity|reimbursement|wellness|cashless/)) {
      setSuggestedCategory('Benefits');
      setSelectedCategory('Benefits');
    } else if (text.match(/policy|procedure|code of conduct|dress code|office hours|guideline|compliance|rules/)) {
      setSuggestedCategory('Policy & Compliance');
      setSelectedCategory('Policy & Compliance');
    } else if (text.match(/manager|colleague|peer|conflict|rude|disrespect|harass|posh|bullying|intimidation|discrimination|caste|retaliat/)) {
      setSuggestedCategory('Employee Relations');
      setSelectedCategory('Employee Relations');
    } else if (text.match(/offer letter|joining|onboarding|bgv|background verification|interview|probation|appointment/)) {
      setSuggestedCategory('Recruitment & Onboarding');
      setSelectedCategory('Recruitment & Onboarding');
    } else if (text.match(/training|certification|skill development|l&d|workshop|course|upskilling|learning/)) {
      setSuggestedCategory('Learning & Development');
      setSelectedCategory('Learning & Development');
    } else if (text.match(/experience letter|relieving letter|helpdesk|general query|employment verification|certificate/)) {
      setSuggestedCategory('General HR Query');
      setSelectedCategory('General HR Query');
    } else {
      setSuggestedCategory('Others');
      setSelectedCategory('Others');
    }
  }, [title, description]);

  const handleTemplate = (
    tTitle: string,
    tDesc: string,
    tCategory: string,
    tType: TicketSubmitPayload['submission_type'] = 'form',
    tAnon = false
  ) => {
    setTitle(tTitle);
    setDescription(tDesc);
    setSelectedCategory(tCategory);
    setSubmissionType(tType);
    setIsAnonymous(tAnon);
  };

  const handleAddSampleAttachment = () => {
    setAttachments((prev) => [
      ...prev,
      {
        filename: `proof_document_${prev.length + 1}.pdf`,
        url: 'https://storage.enterprise.local/grievance/docs/proof.pdf',
        size: 1024 * 280,
      },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dpdpConsent) {
      setError('You must accept the DPDP Act 2023 Consent to proceed.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await ticketService.submit({
        title,
        description,
        submission_type: submissionType,
        is_anonymous: isAnonymous,
        attachments: attachments,
        dpdp_consent: dpdpConsent,
      });
      setResult(res);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit grievance.');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-mono font-semibold uppercase text-teal-400 bg-teal-950/50 px-3 py-1 rounded-full border border-teal-500/20">
              Ticket #{result.ticket_id.slice(0, 8)} Submitted
            </span>
            <h2 className="text-2xl font-bold text-white mt-3">HR Problem Ingested & AI Classified</h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed max-w-md mx-auto">
              {result.confirmation_message}
            </p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-left text-xs space-y-2 max-w-md mx-auto">
            <div className="flex justify-between">
              <span className="text-slate-400">AI Assigned Category:</span>
              <span className="font-semibold text-teal-300">{result.primary_category || 'Identified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Assigned Risk Level:</span>
              <span className="font-semibold uppercase text-amber-300">{result.risk_level}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current Status:</span>
              <span className="text-indigo-300 font-bold uppercase">{result.status}</span>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => navigate(`/employee/tickets/${result.ticket_id}`)}
              className="px-5 py-2.5 rounded-xl gradient-btn text-white text-xs font-semibold shadow-md"
            >
              Track Case Status →
            </button>
            <button
              onClick={() => {
                setResult(null);
                setTitle('');
                setDescription('');
                setAttachments([]);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white font-['Plus_Jakarta_Sans'] flex items-center gap-2">
          <FilePlus2 className="w-6 h-6 text-teal-400" />
          Submit Employee HR Problem
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Provide your issue details below. Suggested HR categories auto-populate in real-time as you write.
        </p>
      </div>

      {/* Suggested Scenario Templates */}
      <div className="glass-card p-4 rounded-xl border border-slate-800">
        <span className="text-xs font-semibold text-teal-400 flex items-center gap-1 mb-2">
          <Sparkles className="w-3.5 h-3.5" /> Quick Suggested HR Categories & Issue Examples:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <button
            type="button"
            onClick={() =>
              handleTemplate(
                'Salary not credited for this month',
                'My salary for this month has not been credited to my bank account yet. Please check with the payroll team.',
                'Payroll',
                'form'
              )
            }
            className="p-2.5 bg-slate-900/60 rounded-lg text-left border border-slate-800 hover:border-teal-500/40 text-slate-300 hover:text-white transition-colors"
          >
            <span className="font-semibold text-teal-300 block">Payroll</span>
            <span className="text-[11px] text-slate-400 line-clamp-1">Salary not credited yet</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleTemplate(
                'Leave balance incorrect in portal after approved sick leave',
                'Applied for 2 days sick leave with doctor certificate, but the portal deducted 5 days of earned leave.',
                'Leave & Attendance',
                'form'
              )
            }
            className="p-2.5 bg-slate-900/60 rounded-lg text-left border border-slate-800 hover:border-teal-500/40 text-slate-300 hover:text-white transition-colors"
          >
            <span className="font-semibold text-sky-300 block">Leave & Attendance</span>
            <span className="text-[11px] text-slate-400 line-clamp-1">Leave balance mismatch</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleTemplate(
                'Emergency hospitalization insurance card cashless denial',
                'Hospital claims desk rejected the cashless card. Need immediate reimbursement pre-auth approval.',
                'Benefits',
                'form'
              )
            }
            className="p-2.5 bg-slate-900/60 rounded-lg text-left border border-slate-800 hover:border-teal-500/40 text-slate-300 hover:text-white transition-colors"
          >
            <span className="font-semibold text-emerald-300 block">Benefits</span>
            <span className="text-[11px] text-slate-400 line-clamp-1">Cashless medical insurance card</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Main Intake Form */}
      <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Submission Channel
            </label>
            <select
              value={submissionType}
              onChange={(e) => setSubmissionType(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-teal-500"
            >
              <option value="form">Web Form</option>
              <option value="email">Email</option>
              <option value="chat">Chat</option>
              <option value="support_ticket">Support Ticket</option>
            </select>
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-200 select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-slate-700 text-teal-500 focus:ring-teal-500 bg-slate-900"
              />
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                Submit Anonymously (Hide name from manager)
              </span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Problem Title / Short Summary *
          </label>
          <input
            type="text"
            required
            minLength={3}
            maxLength={255}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            placeholder="E.g., Salary not credited"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Detailed Explanation / Problem Description *
          </label>
          <textarea
            required
            rows={5}
            minLength={10}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 leading-relaxed font-sans"
            placeholder="My salary for this month has not been credited yet..."
          />
        </div>

        {/* Suggested HR Category - Auto Populates with 'Others' as last option */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-teal-400" /> Suggested HR Category
            </label>
            {suggestedCategory && (
              <span className="text-[11px] font-medium text-teal-300 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-teal-400" /> Auto-Detected: {suggestedCategory}
              </span>
            )}
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-teal-200 font-medium focus:outline-none focus:border-teal-500"
          >
            {HR_CATEGORIES.map((cat) => (
              <option key={cat.name} value={cat.name} className="bg-slate-900 text-slate-200">
                {cat.name} — ({cat.desc})
              </option>
            ))}
          </select>
          <span className="text-[10px] text-slate-400 block">
            The category auto-populates as you type your issue description. If nothing matches, it selects <strong>Others</strong>.
          </span>
        </div>

        {/* Attachments */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" /> Optional Attachment
            </label>
            <button
              type="button"
              onClick={handleAddSampleAttachment}
              className="text-[11px] text-teal-400 hover:text-teal-300 font-medium"
            >
              + Attach Sample File
            </button>
          </div>

          {attachments.length > 0 ? (
            <div className="space-y-1.5">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-800 text-xs text-slate-300"
                >
                  <span className="font-mono text-slate-200">{att.filename}</span>
                  <span className="text-[10px] text-slate-500">{(att.size / 1024).toFixed(1)} KB</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-slate-800 rounded-lg p-3 text-center text-xs text-slate-500">
              No files attached (Optional).
            </div>
          )}
        </div>

        {/* DPDP Consent */}
        <div className="p-3.5 rounded-xl bg-teal-950/20 border border-teal-500/20 text-xs">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={dpdpConsent}
              onChange={(e) => setDpdpConsent(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 text-teal-500 focus:ring-teal-500 bg-slate-900"
            />
            <span className="text-slate-300 text-[11px] leading-relaxed">
              <strong>DPDP Act 2023 Statutory Consent:</strong> I confirm this request is submitted for confidential HR triage and resolution.
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/employee/dashboard')}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl gradient-btn text-white text-xs font-semibold shadow-lg shadow-teal-500/20 flex items-center gap-2 hover:opacity-95"
          >
            {loading ? (
              <span>Submitting & Classifying...</span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Submit HR Problem</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
