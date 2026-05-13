import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Users, FileText, ClipboardCheck, Plus, Trash2, ChevronRight, ArrowLeft, Check, X, Eye, Star, Sparkles, RefreshCw } from 'lucide-react';
import api from '../../api';

const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'tests', label: 'Tests', icon: FileText },
    { id: 'review', label: 'Review & Grade', icon: ClipboardCheck },
];

const Card = ({ children, className = '', style = {}, ...props }) => (
    <div className={`p-4 rounded-2xl ${className}`} style={{ background: '#0d0d0d', border: '1px solid rgba(139,92,246,0.12)', ...style }} {...props}>{children}</div>
);

const Btn = ({ children, onClick, disabled, color = '#8b5cf6', outline, small, ...rest }) => (
    <button onClick={onClick} disabled={disabled} className={`flex items-center gap-2 ${small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'} rounded-xl font-bold transition-all disabled:opacity-50`}
        style={outline ? { background: 'transparent', border: `1px solid ${color}33`, color } : { background: `${color}18`, border: `1px solid ${color}30`, color }} {...rest}>{children}</button>
);

const Input = ({ label, value, onChange, placeholder, type = 'text', textarea }) => (
    <div className="mb-3">
        <label className="block text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: '#5a5a5a' }}>{label}</label>
        {textarea ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', color: '#e5e5e5' }} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', color: '#e5e5e5' }} />}
    </div>
);

// ─── Dashboard Tab ───────────────────────────────────────────────────────────
const DashboardTab = ({ stats }) => {
    const cards = [
        { label: 'Students', value: stats.total_students || 0, color: '#22c55e' },
        { label: 'Tests Created', value: stats.total_tests || 0, color: '#3b82f6' },
        { label: 'Submissions', value: stats.total_submissions || 0, color: '#f5a623' },
        { label: 'Pending Reviews', value: stats.pending_reviews || 0, color: '#ef4444' },
        { label: 'Avg Score', value: stats.average_score || 0, color: '#8b5cf6' },
    ];
    return (
        <div>
            {stats.institute_name && <p className="text-lg font-black text-white mb-1">{stats.institute_name} <span className="text-xs font-bold ml-2 px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>Code: {stats.institute_code}</span></p>}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                {cards.map(c => (
                    <Card key={c.label}><p className="text-2xl font-black" style={{ color: c.color }}>{c.value}</p><p className="text-xs mt-1" style={{ color: '#5a5a5a' }}>{c.label}</p></Card>
                ))}
            </div>
            {stats.category_scores && Object.keys(stats.category_scores).length > 0 && (
                <Card className="mb-4">
                    <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#8b5cf6' }}>Category Averages</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Object.entries(stats.category_scores).map(([cat, avg]) => (
                            <div key={cat} className="text-center p-3 rounded-xl" style={{ background: '#111' }}>
                                <p className="text-xs font-bold" style={{ color: '#5a5a5a' }}>{cat}</p>
                                <p className="text-lg font-black text-white">{avg}%</p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
            {stats.recent_activity?.length > 0 && (
                <Card>
                    <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#8b5cf6' }}>Recent Activity</p>
                    <div className="space-y-2">
                        {stats.recent_activity.map(a => (
                            <div key={a.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#111' }}>
                                <div><p className="text-sm font-bold text-white">{a.student_name}</p><p className="text-xs" style={{ color: '#5a5a5a' }}>{a.test_title} · {a.category}</p></div>
                                <div className="text-right">
                                    <p className="text-sm font-black" style={{ color: a.graded ? '#22c55e' : '#f5a623' }}>{a.graded ? (a.admin_score ?? a.score) : a.score}</p>
                                    <p className="text-[10px]" style={{ color: '#5a5a5a' }}>{a.graded ? 'Graded' : 'Pending'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};

// ─── Students Tab ────────────────────────────────────────────────────────────
const StudentsTab = () => {
    const [students, setStudents] = useState([]);
    const [selected, setSelected] = useState(null);
    const [history, setHistory] = useState(null);

    useEffect(() => { api.get('/institute-admin/users').then(r => setStudents(r.data)).catch(() => {}); }, []);

    const viewHistory = async (u) => {
        setSelected(u);
        try { const r = await api.get(`/institute-admin/users/${u.id}/history`); setHistory(r.data); } catch { setHistory({ history: [] }); }
    };

    if (selected && history) return (
        <div>
            <Btn onClick={() => { setSelected(null); setHistory(null); }} outline small><ArrowLeft className="w-3 h-3" /> Back</Btn>
            <p className="text-lg font-black text-white mt-4 mb-1">{selected.full_name || selected.username}</p>
            <p className="text-xs mb-4" style={{ color: '#5a5a5a' }}>{selected.email} · {selected.tests_taken} tests · Avg: {selected.average_score}%</p>
            <div className="space-y-2">
                {history.history?.length === 0 && <p className="text-sm py-8 text-center" style={{ color: '#3a3a3a' }}>No test history</p>}
                {history.history?.map(h => (
                    <Card key={h.id}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-white">{h.title}</p>
                                <p className="text-xs" style={{ color: '#5a5a5a' }}>{h.category} · {h.completed_at ? new Date(h.completed_at).toLocaleDateString() : ''}</p>
                            </div>
                            <div className="text-right">
                                <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#5a5a5a' }}>System: {h.score}</p>
                                        {h.admin_score != null && (
                                            <p className="text-sm font-black px-2 py-0.5 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                                                Mentor: {h.admin_score}
                                            </p>
                                        )}
                                    </div>
                                    {h.graded && <span className="text-[10px] font-black uppercase tracking-tighter text-green-500 opacity-60">✓ Graded</span>}
                                </div>
                            </div>
                        </div>
                        {h.admin_feedback && (
                            <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#5a5a5a' }}>Mentor Feedback</p>
                                <p className="text-xs text-gray-400 italic">"{h.admin_feedback}"</p>
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );

    return (
        <div>
            <p className="text-xs mb-3" style={{ color: '#5a5a5a' }}>{students.length} student(s)</p>
            <div className="space-y-2">
                {students.length === 0 && <p className="text-sm py-8 text-center" style={{ color: '#3a3a3a' }}>No students enrolled yet</p>}
                {students.map(s => (
                    <Card key={s.id} className="cursor-pointer hover:border-purple-500/30 transition-all" onClick={() => viewHistory(s)}>
                        <div className="flex items-center justify-between">
                            <div><p className="text-sm font-bold text-white">{s.full_name || s.username}</p><p className="text-xs" style={{ color: '#5a5a5a' }}>{s.email || 'No email'} · Joined {s.created_at ? new Date(s.created_at).toLocaleDateString() : ''}</p></div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-sm font-bold text-white">{s.tests_taken} tests</p>
                                    <p className="text-xs" style={{ color: '#f5a623' }}>Avg: {s.average_score}%</p>
                                </div>
                                {s.pending_grading > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{s.pending_grading} pending</span>}
                                <ChevronRight className="w-4 h-4" style={{ color: '#3a3a3a' }} />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

// ─── Tests Tab ───────────────────────────────────────────────────────────────
const TestsTab = () => {
    const [tests, setTests] = useState([]);
    const [creating, setCreating] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ title: '', category: 'OIR', description: '', duration_seconds: 900, questionsText: '' });

    const load = () => { api.get('/institute-admin/tests').then(r => setTests(r.data)).catch(() => {}); };
    useEffect(() => { load(); }, []);

    const createTest = async () => {
        const lines = form.questionsText.split('\n').filter(l => l.trim());
        if (!form.title || lines.length === 0) return alert('Title and questions required');
        setLoading(true);
        const questions = lines.map(line => {
            const parts = line.split('|');
            return { text: parts[0]?.trim() || '', options: parts[1]?.trim() || '[]', correct_answer: parts[2]?.trim() || '' };
        });
        try {
            await api.post('/institute-admin/tests', { title: form.title, category: form.category, description: form.description, duration_seconds: parseInt(form.duration_seconds) || 900, questions });
            setCreating(false); setForm({ title: '', category: 'OIR', description: '', duration_seconds: 900, questionsText: '' }); load();
        } catch (e) { alert(e?.response?.data?.detail || 'Failed'); }
        setLoading(false);
    };

    const aiGenerate = async (cat) => {
        setGenerating(true);
        try { await api.post('/institute-admin/tests/generate', { category: cat }); load(); } catch (e) { alert(e?.response?.data?.detail || 'AI generation failed'); }
        setGenerating(false);
    };

    const deleteTest = async (id) => {
        if (!confirm('Delete this test?')) return;
        try { await api.delete(`/institute-admin/tests/${id}`); load(); } catch { alert('Failed'); }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <span className="text-xs" style={{ color: '#5a5a5a' }}>{tests.length} test(s)</span>
                <div className="flex gap-2 flex-wrap">
                    <Btn onClick={() => setCreating(c => !c)} small><Plus className="w-3 h-3" /> Create Test</Btn>
                    {['OIR','WAT','SRT','PPDT'].map(cat => (
                        <Btn key={cat} onClick={() => aiGenerate(cat)} disabled={generating} small color="#f5a623"><Sparkles className="w-3 h-3" /> AI {cat}</Btn>
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {creating && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <Card className="mb-4">
                            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#8b5cf6' }}>Create Test</p>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <Input label="Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="Test title" />
                                <div className="mb-3">
                                    <label className="block text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: '#5a5a5a' }}>Category</label>
                                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', color: '#e5e5e5' }}>
                                        {['OIR','WAT','SRT','PPDT','GTO'].map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <Input label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Optional description" />
                            <Input label="Duration (seconds)" value={form.duration_seconds} onChange={v => setForm(f => ({ ...f, duration_seconds: v }))} type="number" />
                            <Input label="Questions (one per line: text | options_json | correct_answer)" value={form.questionsText} onChange={v => setForm(f => ({ ...f, questionsText: v }))} placeholder={'What is 2+2? | ["3","4","5","6"] | 4\nDescribe courage | [] |'} textarea />
                            <div className="flex gap-2">
                                <Btn onClick={createTest} disabled={loading}><Check className="w-3 h-3" /> {loading ? 'Creating...' : 'Create'}</Btn>
                                <Btn onClick={() => setCreating(false)} outline><X className="w-3 h-3" /> Cancel</Btn>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-2">
                {tests.length === 0 && <p className="text-sm py-8 text-center" style={{ color: '#3a3a3a' }}>No tests yet. Create one above.</p>}
                {tests.map(t => (
                    <Card key={t.id}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-white">{t.title}</p>
                                <p className="text-xs" style={{ color: '#5a5a5a' }}>{t.category} · {t.question_count} Q · {Math.round((t.duration_seconds || 0) / 60)}min · {t.submission_count || 0} submissions</p>
                            </div>
                            <button onClick={() => deleteTest(t.id)} className="p-2 rounded-lg hover:bg-red-500/10 transition-all"><Trash2 className="w-4 h-4" style={{ color: '#ef4444' }} /></button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

// ─── Review & Grade Tab ──────────────────────────────────────────────────────
const ReviewTab = () => {
    const [pending, setPending] = useState([]);
    const [detail, setDetail] = useState(null);
    const [gradeForm, setGradeForm] = useState({ admin_score: '', admin_feedback: '' });
    const [grading, setGrading] = useState(false);
    const [expandedUser, setExpandedUser] = useState(null);

    const load = () => { api.get('/institute-admin/pending-reviews').then(r => setPending(r.data)).catch(() => {}); };
    useEffect(() => { load(); }, []);

    const viewDetail = async (sub) => {
        try { 
            const r = await api.get(`/institute-admin/users/${sub.user_id}/submission/${sub.id}`); 
            setDetail(r.data); 
            setGradeForm({ 
                admin_score: r.data.admin_score || '', 
                admin_feedback: r.data.admin_feedback || '' 
            }); 
        } catch { alert('Failed to load'); }
    };

    const submitGrade = async () => {
        if (!gradeForm.admin_score) return alert('Score required');
        setGrading(true);
        try {
            await api.post(`/institute-admin/grade/${detail.id}`, { admin_score: parseInt(gradeForm.admin_score), admin_feedback: gradeForm.admin_feedback });
            setDetail(null); load();
        } catch (e) { alert(e?.response?.data?.detail || 'Failed'); }
        setGrading(false);
    };

    // Group pending by student
    const grouped = pending.reduce((acc, curr) => {
        const name = curr.student_name;
        if (!acc[name]) acc[name] = [];
        acc[name].push(curr);
        return acc;
    }, {});

    if (detail) {
        const cat = detail.test?.category?.toUpperCase();
        return (
            <div>
                <Btn onClick={() => setDetail(null)} outline small><ArrowLeft className="w-3 h-3" /> Back to Reviews</Btn>
                <div className="mt-6 mb-6 flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Cinzel, serif' }}>{detail.test?.title}</h2>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-md" style={{ background: 'rgba(245,166,35,0.15)', color: '#f5a623' }}>{detail.test?.category}</span>
                            <span className="text-xs" style={{ color: '#5a5a5a' }}>Student: <span className="text-white font-bold">{detail.user?.full_name || detail.user?.username}</span></span>
                            <span className="text-xs" style={{ color: '#5a5a5a' }}>Completed: {detail.completed_at ? new Date(detail.completed_at).toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#5a5a5a' }}>System Score</p>
                        <p className="text-2xl font-black text-white">{detail.score}</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <Card>
                            <p className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: '#8b5cf6' }}>
                                <FileText className="w-3 h-3" /> Student Responses
                            </p>
                            <div className="space-y-4">
                                {detail.questions?.map((q, i) => {
                                    let opts = [];
                                    try { opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options; } catch {}
                                    const isPPDTImage = cat === 'PPDT' && Array.isArray(opts) && opts.length > 0 && typeof opts[0] === 'string';
                                    
                                    return (
                                        <div key={q.id || i} className="p-4 rounded-xl" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.03)' }}>
                                            <p className="text-xs font-black mb-2" style={{ color: '#5a5a5a' }}>QUESTION {i + 1}</p>
                                            <p className="text-sm font-bold text-white mb-3 leading-relaxed">{q.text}</p>
                                            
                                            {isPPDTImage && (
                                                <div className="mb-4 rounded-xl overflow-hidden border border-white/10 max-w-sm">
                                                    <img src={opts[0]} alt="PPDT Scenario" className="w-full h-auto" />
                                                </div>
                                            )}

                                            <div className="p-4 rounded-xl" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)' }}>
                                                <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: '#8b5cf6' }}>Student Answer</p>
                                                <p className="text-sm text-white leading-relaxed">
                                                    {q.student_answer ? q.student_answer : <span className="italic opacity-30">No answer provided</span>}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <Card className="sticky top-24">
                            <p className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: '#f5a623' }}>
                                <Star className="w-3 h-3" /> Evaluation & Grading
                            </p>
                            
                            <div className="mb-6">
                                <Input 
                                    label="Manual Score (0-100)" 
                                    value={gradeForm.admin_score} 
                                    onChange={v => setGradeForm(f => ({ ...f, admin_score: v }))} 
                                    type="number" 
                                    placeholder="Enter marks..." 
                                />
                                <Input 
                                    label="Feedback to Student" 
                                    value={gradeForm.admin_feedback} 
                                    onChange={v => setGradeForm(f => ({ ...f, admin_feedback: v }))} 
                                    placeholder="Write your observation here..." 
                                    textarea 
                                />
                            </div>

                            <Btn onClick={submitGrade} disabled={grading} color="#22c55e" className="w-full justify-center py-3">
                                <Check className="w-4 h-4" /> {grading ? 'Saving...' : 'Finalize Grade'}
                            </Btn>
                            
                            <p className="text-[10px] text-center mt-4" style={{ color: '#3a3a3a' }}>
                                Once finalized, the student will be able to see these marks and feedback on their dashboard.
                            </p>
                        </Card>

                        {detail.evaluation && (
                            <Card style={{ border: '1px solid rgba(245,166,35,0.1)' }}>
                                <p className="text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: '#f5a623' }}>
                                    <Sparkles className="w-3 h-3" /> AI Insights
                                </p>
                                <div className="text-xs leading-relaxed text-gray-400" style={{ whiteSpace: 'pre-wrap' }}>
                                    {detail.evaluation.overall_feedback || detail.evaluation}
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-black text-white" style={{ fontFamily: 'Cinzel, serif' }}>Review Queue</h3>
                    <p className="text-xs" style={{ color: '#5a5a5a' }}>{pending.length} pending submissions grouped by student</p>
                </div>
                <Btn onClick={load} small outline><RefreshCw className="w-3 h-3" /> Refresh</Btn>
            </div>

            {pending.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-dashed border-white/5">
                    <ClipboardCheck className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p className="text-sm font-bold" style={{ color: '#3a3a3a' }}>All clear! No pending reviews at the moment.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {Object.entries(grouped).map(([studentName, subs]) => (
                        <div key={studentName} className="space-y-2">
                            <div 
                                onClick={() => setExpandedUser(expandedUser === studentName ? null : studentName)}
                                className="p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between group"
                                style={{ 
                                    background: expandedUser === studentName ? 'rgba(139,92,246,0.08)' : '#0d0d0d', 
                                    border: `1px solid ${expandedUser === studentName ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)'}` 
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm" style={{ background: 'rgba(139,92,246,0.2)', color: '#8b5cf6' }}>
                                        {studentName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white group-hover:text-purple-400 transition-colors">{studentName}</p>
                                        <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#5a5a5a' }}>{subs.length} submission(s) pending</p>
                                    </div>
                                </div>
                                <ChevronRight className={`w-4 h-4 transition-transform ${expandedUser === studentName ? 'rotate-90' : ''}`} style={{ color: '#3a3a3a' }} />
                            </div>

                            <AnimatePresence>
                                {expandedUser === studentName && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        exit={{ opacity: 0, y: -10 }}
                                        className="pl-6 space-y-2"
                                    >
                                        {subs.map(s => (
                                            <Card key={s.id} className="cursor-pointer hover:border-purple-500/30 transition-all" onClick={() => viewDetail(s)}>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-bold text-white">{s.test_title}</p>
                                                        <p className="text-[10px] mt-0.5" style={{ color: '#5a5a5a' }}>
                                                            {s.category} · {s.completed_at ? new Date(s.completed_at).toLocaleDateString() : ''} · Time: {Math.round((s.time_taken || 0) / 60)}m
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>Ungraded</span>
                                                        <Eye className="w-4 h-4" style={{ color: '#8b5cf6' }} />
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Main Dashboard ──────────────────────────────────────────────────────────
const InstituteAdminDashboard = () => {
    const { user } = useAuth();
    const [tab, setTab] = useState('dashboard');
    const [stats, setStats] = useState({});

    useEffect(() => { api.get('/institute-admin/dashboard/stats').then(r => setStats(r.data)).catch(() => {}); }, []);

    if (user?.role !== 'institute_admin' && user?.role !== 'super_admin') {
        return <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}><p className="text-red-500 font-bold">Access Denied — Institute Admin only</p></div>;
    }

    return (
        <div className="min-h-screen" style={{ background: '#000' }}>
            <div className="max-w-6xl mx-auto px-4 py-8 pt-24">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
                        <BarChart3 className="w-5 h-5" style={{ color: '#8b5cf6' }} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white">{stats.institute_name || 'Institute Dashboard'}</h1>
                        <p className="text-xs" style={{ color: '#5a5a5a' }}>{stats.institute_name ? `Command Centre · Code: ${stats.institute_code}` : 'Manage your students, tests, and grades'}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all"
                            style={tab === t.id ? { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#8b5cf6' } : { background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.05)', color: '#5a5a5a' }}>
                            <t.icon className="w-4 h-4" /> {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    {tab === 'dashboard' && <DashboardTab stats={stats} />}
                    {tab === 'students' && <StudentsTab />}
                    {tab === 'tests' && <TestsTab />}
                    {tab === 'review' && <ReviewTab />}
                </motion.div>
            </div>
        </div>
    );
};

export default InstituteAdminDashboard;
