'use client';

import { CSSProperties, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  ScrollText,
  Sparkles,
  Download,
  Trash2,
  Loader2,
  ShieldCheck,
  CircleCheck,
} from 'lucide-react';
import { toast } from 'react-toastify';
import Header from '@/components/Header';
import { examPaperAPI, ExamPaperGenerateRequest, ExamQuestionInput } from '@/lib/api';

type PartDraft = { bt: string; marks: number };
type QuestionDraft = {
  unit: string;
  co: string;
  subparts: boolean;
  or_choice: boolean;
  parts: PartDraft[];
  or_parts: PartDraft[];
};

const makePart = (): PartDraft => ({ bt: 'L2', marks: 5 });
const makeQuestion = (): QuestionDraft => ({
  unit: 'Unit-1',
  co: 'CO1',
  subparts: true,
  or_choice: false,
  parts: [makePart(), makePart()],
  or_parts: [makePart(), makePart()],
});

export default function ExamPaperPage() {
  const [semester, setSemester] = useState('5');
  const [subject, setSubject] = useState('');
  const [examType, setExamType] = useState('CAE');
  const [questions, setQuestions] = useState<QuestionDraft[]>([makeQuestion()]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  const totalMarks = useMemo(
    () => questions.reduce((sum, q) => sum + q.parts.reduce((acc, p) => acc + Number(p.marks || 0), 0), 0),
    [questions]
  );

  const updateQuestion = (index: number, patch: Partial<QuestionDraft>) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  };

  const updatePart = (
    qIndex: number,
    type: 'parts' | 'or_parts',
    partIndex: number,
    patch: Partial<PartDraft>
  ) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const updated = q[type].map((part, pIdx) => (pIdx === partIndex ? { ...part, ...patch } : part));
        return { ...q, [type]: updated };
      })
    );
  };

  const addQuestion = () => setQuestions((prev) => [...prev, makeQuestion()]);

  const removeQuestion = (index: number) => {
    if (questions.length === 1) {
      toast.info('At least one question pattern is required');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    if (!semester.trim() || !subject.trim() || !examType.trim()) {
      toast.error('Semester, subject, and exam type are required');
      return false;
    }

    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      if (!q.unit.trim() || !q.co.trim()) {
        toast.error(`Question ${i + 1}: Unit and CO are required`);
        return false;
      }
      if (!q.parts.length) {
        toast.error(`Question ${i + 1}: Add at least one part`);
        return false;
      }
      if (q.parts.some((part) => !part.bt.trim() || Number(part.marks) <= 0)) {
        toast.error(`Question ${i + 1}: Each part needs valid BT level and marks`);
        return false;
      }
      if (q.or_choice && q.or_parts.some((part) => !part.bt.trim() || Number(part.marks) <= 0)) {
        toast.error(`Question ${i + 1}: OR parts must have valid BT and marks`);
        return false;
      }
    }

    return true;
  };

  const buildPayload = (): ExamPaperGenerateRequest => {
    const mappedQuestions: ExamQuestionInput[] = questions.map((q) => ({
      unit: q.unit.trim(),
      co: q.co.trim(),
      subparts: q.subparts,
      or_choice: q.or_choice,
      parts: q.parts.map((p) => ({ bt: p.bt.trim(), marks: Number(p.marks) })),
      or_parts: q.or_choice ? q.or_parts.map((p) => ({ bt: p.bt.trim(), marks: Number(p.marks) })) : [],
    }));

    return {
      semester: semester.trim(),
      subject: subject.trim(),
      exam_type: examType.trim(),
      questions: mappedQuestions,
    };
  };

  const handleGenerate = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await examPaperAPI.generatePaper(buildPayload());
      setLastGenerated(new Date());
      toast.success('Exam paper generated successfully');
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message?: string }).message)
          : 'Failed to generate exam paper';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await examPaperAPI.downloadPaper();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Exam_Paper_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch {
      toast.error('No generated paper available to download yet');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <Header
        title="Exam Paper Generator"
        subtitle="Faculty/Admin secured workflow for creating styled exam papers"
      />

      <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{
            padding: '18px',
            borderRadius: '14px',
            border: '1px solid rgba(83, 221, 252, 0.2)',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '11px',
                background: 'rgba(83,221,252,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={20} color="#53ddfc" />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f0f4ff' }}>
                Secure Role Access
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                This module is protected for faculty/admin through backend guard routes.
              </div>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
            Total Marks: <strong style={{ color: '#53ddfc' }}>{totalMarks}</strong>
          </div>
        </motion.div>

        <div className="glass-card" style={{ padding: '18px', borderRadius: '14px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
            }}
          >
            <Input label="Semester" value={semester} onChange={setSemester} placeholder="e.g. 5" />
            <Input label="Subject" value={subject} onChange={setSubject} placeholder="e.g. Computer Networks" />
            <Input label="Exam Type" value={examType} onChange={setExamType} placeholder="CAE / SEE" />
          </div>
        </div>

        {questions.map((q, idx) => (
          <motion.div
            key={`q-${idx}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{
              padding: '16px',
              borderRadius: '14px',
              border: '1px solid rgba(139,92,246,0.18)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ScrollText size={16} color="#a78bfa" />
                <div style={{ color: '#f0f4ff', fontWeight: 700, fontSize: '14px' }}>Question Pattern {idx + 1}</div>
              </div>
              <button
                onClick={() => removeQuestion(idx)}
                style={iconButtonStyle('#ef4444', 'rgba(239,68,68,0.14)')}
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '10px' }}>
              <Input label="Unit" value={q.unit} onChange={(v) => updateQuestion(idx, { unit: v })} />
              <Input label="CO" value={q.co} onChange={(v) => updateQuestion(idx, { co: v })} />
              <Toggle
                label="Subparts"
                value={q.subparts}
                onChange={(value) => updateQuestion(idx, { subparts: value })}
              />
              <Toggle
                label="OR Choice"
                value={q.or_choice}
                onChange={(value) => updateQuestion(idx, { or_choice: value })}
              />
            </div>

            <PartEditor
              title="Main Parts"
              parts={q.parts}
              onChange={(partIndex, patch) => updatePart(idx, 'parts', partIndex, patch)}
            />

            {q.or_choice && (
              <PartEditor
                title="OR Parts"
                parts={q.or_parts}
                onChange={(partIndex, patch) => updatePart(idx, 'or_parts', partIndex, patch)}
              />
            )}
          </motion.div>
        ))}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={addQuestion} style={actionButtonStyle('#a78bfa', 'rgba(167,139,250,0.14)')}>
            <Plus size={14} />
            Add Question Pattern
          </button>
          <button onClick={handleGenerate} disabled={loading} style={actionButtonStyle('#22d3ee', 'rgba(34,211,238,0.14)')}>
            {loading ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
            {loading ? 'Generating...' : 'Generate Paper'}
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={actionButtonStyle('#34d399', 'rgba(52,211,153,0.14)')}
          >
            {downloading ? <Loader2 size={14} className="spin" /> : <Download size={14} />}
            {downloading ? 'Preparing...' : 'Download PDF'}
          </button>
        </div>

        {lastGenerated && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(52,211,153,0.2)',
              background: 'rgba(52,211,153,0.06)',
              color: '#cbd5e1',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CircleCheck size={14} color="#34d399" />
            Last generated at {lastGenerated.toLocaleTimeString()}.
          </div>
        )}
      </div>

      <style>{`
        .spin { animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '10px 12px',
          borderRadius: '10px',
          border: '1px solid rgba(139,92,246,0.22)',
          background: 'rgba(12,17,32,0.8)',
          color: '#f0f4ff',
          fontSize: '13px',
        }}
      />
    </label>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        style={{
          borderRadius: '10px',
          border: '1px solid rgba(139,92,246,0.22)',
          background: value ? 'rgba(34,211,238,0.18)' : 'rgba(12,17,32,0.8)',
          color: value ? '#22d3ee' : '#94a3b8',
          fontSize: '13px',
          fontWeight: 700,
          padding: '10px 12px',
          cursor: 'pointer',
        }}
      >
        {value ? 'Enabled' : 'Disabled'}
      </button>
    </label>
  );
}

function PartEditor({
  title,
  parts,
  onChange,
}: {
  title: string;
  parts: PartDraft[];
  onChange: (partIndex: number, patch: Partial<PartDraft>) => void;
}) {
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px' }}>
      <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '10px', fontWeight: 700 }}>{title}</div>
      <div style={{ display: 'grid', gap: '10px' }}>
        {parts.map((part, partIndex) => (
          <div key={`${title}-${partIndex}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Input label={`Part ${partIndex + 1} BT`} value={part.bt} onChange={(v) => onChange(partIndex, { bt: v })} />
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Part {partIndex + 1} Marks</span>
              <input
                type="number"
                min={1}
                value={part.marks}
                onChange={(e) => onChange(partIndex, { marks: Number(e.target.value || 0) })}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(139,92,246,0.22)',
                  background: 'rgba(12,17,32,0.8)',
                  color: '#f0f4ff',
                  fontSize: '13px',
                }}
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function actionButtonStyle(color: string, background: string): CSSProperties {
  return {
    border: 'none',
    borderRadius: '10px',
    padding: '10px 14px',
    background,
    color,
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };
}

function iconButtonStyle(color: string, background: string): CSSProperties {
  return {
    width: '32px',
    height: '32px',
    border: 'none',
    borderRadius: '8px',
    background,
    color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  };
}
