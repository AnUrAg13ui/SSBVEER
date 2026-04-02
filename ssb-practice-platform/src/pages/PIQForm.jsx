import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Home, Users, GraduationCap, Trophy,
    ChevronRight, ChevronLeft, Save, CheckCircle2,
    Plus, Trash2, Shield, FileText, Loader2, AlertCircle
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// ─── Section Definitions ─────────────────────────────────────────────────────
const SECTIONS = [
    { id: 'personal', label: 'Personal Information', sub: 'Basic personal details and identification information', icon: User },
    { id: 'residence', label: 'Residence Information', sub: 'Details about your residential addresses', icon: Home },
    { id: 'family', label: 'Family Background', sub: 'Information about family members and their occupations', icon: Users },
    { id: 'education', label: 'Education & Physical', sub: 'Educational qualifications and physical measurements', icon: GraduationCap },
    { id: 'activities', label: 'Activities & Preferences', sub: 'Sports, hobbies, and service preferences', icon: Trophy },
];

// ─── Empty form state ─────────────────────────────────────────────────────────
const EMPTY_FORM = {
    // Personal
    full_name: '', fathers_name: '', mothers_name: '', date_of_birth: '',
    place_of_birth: '', nationality: 'Indian', religion: '', category: '',
    marital_status: 'Single', aadhar_number: '', mobile: '', email: '',
    visible_identification: '',
    // Residence
    permanent_address: '', permanent_city: '', permanent_state: '', permanent_pin: '',
    current_address: '', current_city: '', current_state: '', current_pin: '', years_at_current: '',
    // Family
    fathers_occupation: '', fathers_service: '', mothers_occupation: '',
    num_brothers: '', num_sisters: '', family_members_in_defence: [], family_background_extra: '',
    // Education & Physical
    education_records: [{ exam: '', board: '', school: '', year: '', percent: '', subjects: '' }],
    height_cm: '', weight_kg: '', chest_cm: '',
    vision_left: '', vision_right: '', colour_vision: 'Normal', hearing: 'Normal',
    // Activities
    sports_hobbies: '', extra_curricular: '', achievements: '',
    service_preference_1: '', service_preference_2: '', service_preference_3: '',
    why_join_army: '', self_description: '',
};

// ─── Shared Input Components ──────────────────────────────────────────────────
const Field = ({ label, required, children }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8a8a8a' }}>
            {label}{required && <span style={{ color: '#f5a623' }}> *</span>}
        </label>
        {children}
    </div>
);

const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(245,166,35,0.15)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#fff',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s',
};

const Input = ({ value, onChange, placeholder, type = 'text', onFocus, onBlur }) => (
    <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={inputStyle}
        onFocus={e => { e.target.style.borderColor = 'rgba(245,166,35,0.5)'; }}
        onBlur={e => { e.target.style.borderColor = 'rgba(245,166,35,0.15)'; }}
    />
);

const Select = ({ value, onChange, options }) => (
    <select
        value={value}
        onChange={onChange}
        style={{ ...inputStyle, cursor: 'pointer' }}
        onFocus={e => { e.target.style.borderColor = 'rgba(245,166,35,0.5)'; }}
        onBlur={e => { e.target.style.borderColor = 'rgba(245,166,35,0.15)'; }}
    >
        {options.map(o => (
            <option key={o.value} value={o.value} style={{ background: '#111' }}>{o.label}</option>
        ))}
    </select>
);

const Textarea = ({ value, onChange, placeholder, rows = 3 }) => (
    <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
        onFocus={e => { e.target.style.borderColor = 'rgba(245,166,35,0.5)'; }}
        onBlur={e => { e.target.style.borderColor = 'rgba(245,166,35,0.15)'; }}
    />
);

// ─── Section 1: Personal ──────────────────────────────────────────────────────
const PersonalSection = ({ form, set }) => (
    <div className="grid md:grid-cols-2 gap-5">
        <Field label="Full Name" required>
            <Input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="As in matriculation certificate" />
        </Field>
        <Field label="Father's Name" required>
            <Input value={form.fathers_name} onChange={e => set('fathers_name', e.target.value)} placeholder="Enter father's name" />
        </Field>
        <Field label="Mother's Name">
            <Input value={form.mothers_name} onChange={e => set('mothers_name', e.target.value)} placeholder="Enter mother's name" />
        </Field>
        <Field label="Date of Birth" required>
            <Input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
        </Field>
        <Field label="Place of Birth" required>
            <Input value={form.place_of_birth} onChange={e => set('place_of_birth', e.target.value)} placeholder="City, State" />
        </Field>
        <Field label="Nationality">
            <Select value={form.nationality} onChange={e => set('nationality', e.target.value)}
                options={[{ value: 'Indian', label: 'Indian' }, { value: 'Other', label: 'Other' }]} />
        </Field>
        <Field label="Religion">
            <Select value={form.religion} onChange={e => set('religion', e.target.value)}
                options={[
                    { value: '', label: 'Select Religion' },
                    { value: 'Hindu', label: 'Hindu' }, { value: 'Muslim', label: 'Muslim' },
                    { value: 'Christian', label: 'Christian' }, { value: 'Sikh', label: 'Sikh' },
                    { value: 'Buddhist', label: 'Buddhist' }, { value: 'Jain', label: 'Jain' },
                    { value: 'Other', label: 'Other' },
                ]} />
        </Field>
        <Field label="Category" required>
            <Select value={form.category} onChange={e => set('category', e.target.value)}
                options={[
                    { value: '', label: 'Select Category' },
                    { value: 'GEN', label: 'General (GEN)' }, { value: 'OBC', label: 'OBC' },
                    { value: 'SC', label: 'SC' }, { value: 'ST', label: 'ST' },
                    { value: 'EWS', label: 'EWS' },
                ]} />
        </Field>
        <Field label="Marital Status">
            <Select value={form.marital_status} onChange={e => set('marital_status', e.target.value)}
                options={[{ value: 'Single', label: 'Single' }, { value: 'Married', label: 'Married' }, { value: 'Divorced', label: 'Divorced' }, { value: 'Widowed', label: 'Widowed' }]} />
        </Field>
        <Field label="Aadhar Number">
            <Input value={form.aadhar_number} onChange={e => set('aadhar_number', e.target.value)} placeholder="XXXX XXXX XXXX" />
        </Field>
        <Field label="Mobile Number" required>
            <Input type="tel" value={form.mobile} onChange={e => set('mobile', e.target.value)} placeholder="+91 XXXXX XXXXX" />
        </Field>
        <Field label="Email Address">
            <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="your@email.com" />
        </Field>
        <div className="md:col-span-2">
            <Field label="Visible Identification Marks">
                <Textarea value={form.visible_identification} onChange={e => set('visible_identification', e.target.value)} placeholder="e.g. Mole on left cheek, scar on right hand..." rows={2} />
            </Field>
        </div>
    </div>
);

// ─── Section 2: Residence ─────────────────────────────────────────────────────
const ResidenceSection = ({ form, set }) => (
    <div className="space-y-8">
        <div>
            <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#f5a623' }}>Permanent Address</p>
            <div className="grid md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                    <Field label="Street / Village / District" required>
                        <Textarea value={form.permanent_address} onChange={e => set('permanent_address', e.target.value)} placeholder="House No, Street, Village/Town" rows={2} />
                    </Field>
                </div>
                <Field label="City"><Input value={form.permanent_city} onChange={e => set('permanent_city', e.target.value)} placeholder="City" /></Field>
                <Field label="State"><Input value={form.permanent_state} onChange={e => set('permanent_state', e.target.value)} placeholder="State" /></Field>
                <Field label="PIN Code"><Input value={form.permanent_pin} onChange={e => set('permanent_pin', e.target.value)} placeholder="6-digit PIN" /></Field>
            </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(245,166,35,0.1)', paddingTop: '24px' }}>
            <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#f5a623' }}>Current Address</p>
            <div className="grid md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                    <Field label="Street / Colony">
                        <Textarea value={form.current_address} onChange={e => set('current_address', e.target.value)} placeholder="If same as permanent, repeat it" rows={2} />
                    </Field>
                </div>
                <Field label="City"><Input value={form.current_city} onChange={e => set('current_city', e.target.value)} placeholder="City" /></Field>
                <Field label="State"><Input value={form.current_state} onChange={e => set('current_state', e.target.value)} placeholder="State" /></Field>
                <Field label="PIN Code"><Input value={form.current_pin} onChange={e => set('current_pin', e.target.value)} placeholder="6-digit PIN" /></Field>
                <Field label="Years at Current Address">
                    <Input value={form.years_at_current} onChange={e => set('years_at_current', e.target.value)} placeholder="e.g. 5" />
                </Field>
            </div>
        </div>
    </div>
);

// ─── Section 3: Family ────────────────────────────────────────────────────────
const FamilySection = ({ form, set }) => {
    const addMember = () => set('family_members_in_defence', [...(form.family_members_in_defence || []), { name: '', relation: '', service: '', rank: '' }]);
    const updateMember = (i, field, val) => {
        const arr = [...(form.family_members_in_defence || [])];
        arr[i] = { ...arr[i], [field]: val };
        set('family_members_in_defence', arr);
    };
    const removeMember = (i) => {
        const arr = [...(form.family_members_in_defence || [])];
        arr.splice(i, 1);
        set('family_members_in_defence', arr);
    };

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-5">
                <Field label="Father's Occupation">
                    <Input value={form.fathers_occupation} onChange={e => set('fathers_occupation', e.target.value)} placeholder="e.g. Army Officer, Farmer, Engineer" />
                </Field>
                <Field label="Father's Service (if defence)">
                    <Select value={form.fathers_service} onChange={e => set('fathers_service', e.target.value)}
                        options={[
                            { value: '', label: 'Not in Defence' },
                            { value: 'Army', label: 'Indian Army' }, { value: 'Navy', label: 'Indian Navy' },
                            { value: 'AirForce', label: 'Indian Air Force' }, { value: 'ParaMilitary', label: 'Para-Military' },
                            { value: 'CAPF', label: 'CAPF' }, { value: 'Retired', label: 'Retired' },
                        ]} />
                </Field>
                <Field label="Mother's Occupation">
                    <Input value={form.mothers_occupation} onChange={e => set('mothers_occupation', e.target.value)} placeholder="e.g. Homemaker, Teacher" />
                </Field>
                <div />
                <Field label="Number of Brothers">
                    <Input type="number" value={form.num_brothers} onChange={e => set('num_brothers', e.target.value)} placeholder="0" />
                </Field>
                <Field label="Number of Sisters">
                    <Input type="number" value={form.num_sisters} onChange={e => set('num_sisters', e.target.value)} placeholder="0" />
                </Field>
            </div>

            {/* Defence family members */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#f5a623' }}>
                        Family Members in Defence Service
                    </p>
                    <button onClick={addMember} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                        style={{ background: 'rgba(245,166,35,0.1)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.2)' }}>
                        <Plus className="w-3.5 h-3.5" /> Add Member
                    </button>
                </div>
                {(form.family_members_in_defence || []).length === 0 && (
                    <p className="text-sm text-center py-6" style={{ color: '#444' }}>No defence family members added</p>
                )}
                {(form.family_members_in_defence || []).map((m, i) => (
                    <div key={i} className="grid md:grid-cols-4 gap-3 mb-3 p-4 rounded-xl" style={{ background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.1)' }}>
                        <Input value={m.name} onChange={e => updateMember(i, 'name', e.target.value)} placeholder="Name" />
                        <Input value={m.relation} onChange={e => updateMember(i, 'relation', e.target.value)} placeholder="Relation" />
                        <Input value={m.service} onChange={e => updateMember(i, 'service', e.target.value)} placeholder="Service / Corps" />
                        <div className="flex gap-2">
                            <Input value={m.rank} onChange={e => updateMember(i, 'rank', e.target.value)} placeholder="Rank" />
                            <button onClick={() => removeMember(i)} className="p-2 rounded-lg flex-shrink-0" style={{ background: 'rgba(231,76,60,0.1)', color: '#e74c3c' }}>
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Field label="Additional Family Background Notes">
                <Textarea value={form.family_background_extra} onChange={e => set('family_background_extra', e.target.value)} placeholder="Any additional info about family background..." rows={3} />
            </Field>
        </div>
    );
};

// ─── Section 4: Education & Physical ─────────────────────────────────────────
const EXAMS = ['Matriculation (10th)', 'Intermediate (12th)', 'Graduation', 'Post Graduation', 'Other'];

const EducationSection = ({ form, set }) => {
    const addRecord = () => set('education_records', [...(form.education_records || []), { exam: '', board: '', school: '', year: '', percent: '', subjects: '' }]);
    const updateRecord = (i, field, val) => {
        const arr = [...(form.education_records || [])];
        arr[i] = { ...arr[i], [field]: val };
        set('education_records', arr);
    };
    const removeRecord = (i) => {
        const arr = [...(form.education_records || [])];
        arr.splice(i, 1);
        set('education_records', arr);
    };

    return (
        <div className="space-y-8">
            {/* Education Records */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#f5a623' }}>Academic Qualifications</p>
                    <button onClick={addRecord} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                        style={{ background: 'rgba(245,166,35,0.1)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.2)' }}>
                        <Plus className="w-3.5 h-3.5" /> Add Qualification
                    </button>
                </div>
                {(form.education_records || []).map((rec, i) => (
                    <div key={i} className="p-4 rounded-xl mb-3" style={{ background: 'rgba(245,166,35,0.03)', border: '1px solid rgba(245,166,35,0.1)' }}>
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-bold" style={{ color: '#f5a623' }}>Qualification {i + 1}</span>
                            {i > 0 && (
                                <button onClick={() => removeRecord(i)} className="p-1.5 rounded-lg" style={{ background: 'rgba(231,76,60,0.1)', color: '#e74c3c' }}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="grid md:grid-cols-3 gap-3">
                            <select value={rec.exam} onChange={e => updateRecord(i, 'exam', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                                <option value="" style={{ background: '#111' }}>Select Exam</option>
                                {EXAMS.map(ex => <option key={ex} value={ex} style={{ background: '#111' }}>{ex}</option>)}
                            </select>
                            <Input value={rec.board} onChange={e => updateRecord(i, 'board', e.target.value)} placeholder="Board / University" />
                            <Input value={rec.school} onChange={e => updateRecord(i, 'school', e.target.value)} placeholder="School / College" />
                            <Input value={rec.year} onChange={e => updateRecord(i, 'year', e.target.value)} placeholder="Year of Passing" />
                            <Input value={rec.percent} onChange={e => updateRecord(i, 'percent', e.target.value)} placeholder="% / CGPA" />
                            <Input value={rec.subjects} onChange={e => updateRecord(i, 'subjects', e.target.value)} placeholder="Main Subjects" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Physical Details */}
            <div style={{ borderTop: '1px solid rgba(245,166,35,0.1)', paddingTop: '24px' }}>
                <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#f5a623' }}>Physical Measurements</p>
                <div className="grid md:grid-cols-3 gap-5">
                    <Field label="Height (cm)" required>
                        <Input type="number" value={form.height_cm} onChange={e => set('height_cm', e.target.value)} placeholder="e.g. 172" />
                    </Field>
                    <Field label="Weight (kg)" required>
                        <Input type="number" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} placeholder="e.g. 68" />
                    </Field>
                    <Field label="Chest (cm) - Expanded">
                        <Input type="number" value={form.chest_cm} onChange={e => set('chest_cm', e.target.value)} placeholder="e.g. 82" />
                    </Field>
                    <Field label="Left Eye Vision">
                        <Input value={form.vision_left} onChange={e => set('vision_left', e.target.value)} placeholder="e.g. 6/6 or -1.5" />
                    </Field>
                    <Field label="Right Eye Vision">
                        <Input value={form.vision_right} onChange={e => set('vision_right', e.target.value)} placeholder="e.g. 6/6 or -1.0" />
                    </Field>
                    <Field label="Colour Vision">
                        <Select value={form.colour_vision} onChange={e => set('colour_vision', e.target.value)}
                            options={[{ value: 'Normal', label: 'Normal' }, { value: 'CP1', label: 'CP1' }, { value: 'CP2', label: 'CP2' }, { value: 'CP3', label: 'CP3' }]} />
                    </Field>
                    <Field label="Hearing">
                        <Select value={form.hearing} onChange={e => set('hearing', e.target.value)}
                            options={[{ value: 'Normal', label: 'Normal' }, { value: 'Impaired', label: 'Impaired' }]} />
                    </Field>
                </div>
            </div>
        </div>
    );
};

// ─── Section 5: Activities ────────────────────────────────────────────────────
const SERVICES = ['', 'Indian Army', 'Indian Navy', 'Indian Air Force', 'Coast Guard'];

const ActivitiesSection = ({ form, set }) => (
    <div className="space-y-6">
        <Field label="Sports & Hobbies" required>
            <Textarea value={form.sports_hobbies} onChange={e => set('sports_hobbies', e.target.value)}
                placeholder="List your sports, games, and hobbies with level of achievement (district, state, national)..." rows={3} />
        </Field>
        <Field label="Extra-Curricular Activities">
            <Textarea value={form.extra_curricular} onChange={e => set('extra_curricular', e.target.value)}
                placeholder="NCC, NSS, Cultural activities, Debates, Leadership roles..." rows={3} />
        </Field>
        <Field label="Honours, Awards & Achievements">
            <Textarea value={form.achievements} onChange={e => set('achievements', e.target.value)}
                placeholder="Medals, certificates, ranks in competitive exams..." rows={3} />
        </Field>

        <div style={{ borderTop: '1px solid rgba(245,166,35,0.1)', paddingTop: '24px' }}>
            <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#f5a623' }}>Service Preferences</p>
            <div className="grid md:grid-cols-3 gap-5">
                <Field label="1st Preference">
                    <Select value={form.service_preference_1} onChange={e => set('service_preference_1', e.target.value)}
                        options={SERVICES.map(s => ({ value: s, label: s || 'Select' }))} />
                </Field>
                <Field label="2nd Preference">
                    <Select value={form.service_preference_2} onChange={e => set('service_preference_2', e.target.value)}
                        options={SERVICES.map(s => ({ value: s, label: s || 'Select' }))} />
                </Field>
                <Field label="3rd Preference">
                    <Select value={form.service_preference_3} onChange={e => set('service_preference_3', e.target.value)}
                        options={SERVICES.map(s => ({ value: s, label: s || 'Select' }))} />
                </Field>
            </div>
        </div>

        <Field label="Why do you want to join the Defence Forces?" required>
            <Textarea value={form.why_join_army} onChange={e => set('why_join_army', e.target.value)}
                placeholder="Write your genuine motivation in 3–5 sentences..." rows={4} />
        </Field>
        <Field label="Describe yourself in your own words">
            <Textarea value={form.self_description} onChange={e => set('self_description', e.target.value)}
                placeholder="Your strengths, personality traits, and future aspirations..." rows={4} />
        </Field>
    </div>
);

// ─── Main PIQForm Component ───────────────────────────────────────────────────
const PIQForm = () => {
    const [activeSection, setActiveSection] = useState(0);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Load existing PIQ from backend
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { setLoading(false); return; }
        fetch(`${API}/api/piq/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                if (data.exists && data.data) {
                    setForm(prev => {
                        const merged = { ...prev };
                        Object.keys(data.data).forEach(k => {
                            if (data.data[k] !== null && data.data[k] !== undefined && k in prev) {
                                merged[k] = data.data[k] ?? prev[k];
                            }
                        });
                        return merged;
                    });
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const set = useCallback((field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setSaved(false);
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/api/piq/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error('Save failed');
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            setError('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const renderSection = () => {
        const props = { form, set };
        switch (activeSection) {
            case 0: return <PersonalSection {...props} />;
            case 1: return <ResidenceSection {...props} />;
            case 2: return <FamilySection {...props} />;
            case 3: return <EducationSection {...props} />;
            case 4: return <ActivitiesSection {...props} />;
            default: return null;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#f5a623' }} />
                    <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#5a5a5a' }}>Loading your PIQ...</p>
                </div>
            </div>
        );
    }

    const currentSec = SECTIONS[activeSection];
    const SectionIcon = currentSec.icon;

    return (
        <div className="min-h-screen pt-24 pb-16 px-4 md:px-6" style={{ background: '#000' }}>
            <div className="max-w-5xl mx-auto">

                {/* ── Header ─────────────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.25)' }}>
                            <FileText className="w-5 h-5" style={{ color: '#f5a623' }} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-white" style={{ fontFamily: 'Cinzel, serif' }}>
                                Personal Information <span style={{ color: '#f5a623' }}>Questionnaire</span>
                            </h1>
                            <p className="text-xs" style={{ color: '#5a5a5a' }}>Fill all sections carefully · Fields marked <span style={{ color: '#f5a623' }}>*</span> are required</p>
                        </div>
                    </div>
                </motion.div>

                {/* ── Section Tabs ──────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-8">
                    {SECTIONS.map((sec, i) => {
                        const Icon = sec.icon;
                        const isActive = i === activeSection;
                        return (
                            <button
                                key={sec.id}
                                onClick={() => setActiveSection(i)}
                                className="flex flex-col items-center gap-2 p-3 rounded-2xl text-center transition-all"
                                style={{
                                    background: isActive ? 'rgba(245,166,35,0.1)' : 'rgba(255,255,255,0.03)',
                                    border: isActive ? '1px solid rgba(245,166,35,0.4)' : '1px solid rgba(255,255,255,0.06)',
                                    boxShadow: isActive ? '0 0 20px rgba(245,166,35,0.08)' : 'none',
                                }}
                            >
                                <Icon className="w-5 h-5" style={{ color: isActive ? '#f5a623' : '#4a4a4a' }} />
                                <span className="text-xs font-bold leading-tight" style={{ color: isActive ? '#f5a623' : '#5a5a5a' }}>{sec.label}</span>
                                <p className="text-xs hidden md:block" style={{ color: '#3a3a3a', fontSize: '0.65rem' }}>{sec.sub}</p>
                            </button>
                        );
                    })}
                </div>

                {/* ── Form Card ─────────────────────────────────────────── */}
                <motion.div
                    className="rounded-3xl p-6 md:p-8"
                    style={{ background: '#0a0a0a', border: '1px solid rgba(245,166,35,0.12)' }}
                >
                    {/* Section header */}
                    <div className="flex items-center gap-3 mb-8 pb-6" style={{ borderBottom: '1px solid rgba(245,166,35,0.08)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.1)' }}>
                            <SectionIcon className="w-5 h-5" style={{ color: '#f5a623' }} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white">{currentSec.label}</h2>
                            <p className="text-xs" style={{ color: '#5a5a5a' }}>{currentSec.sub}</p>
                        </div>
                    </div>

                    {/* Form fields */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {renderSection()}
                        </motion.div>
                    </AnimatePresence>

                    {/* Error */}
                    {error && (
                        <div className="mt-5 flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)' }}>
                            <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#e74c3c' }} />
                            <p className="text-sm" style={{ color: '#e74c3c' }}>{error}</p>
                        </div>
                    )}

                    {/* Navigation + Save */}
                    <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: '1px solid rgba(245,166,35,0.08)' }}>
                        <button
                            onClick={() => setActiveSection(prev => Math.max(0, prev - 1))}
                            disabled={activeSection === 0}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-30"
                            style={{ background: 'rgba(255,255,255,0.05)', color: '#8a8a8a', border: '1px solid rgba(255,255,255,0.07)' }}
                        >
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </button>

                        <div className="flex items-center gap-3">
                            {/* Progress dots */}
                            <div className="hidden sm:flex items-center gap-1.5">
                                {SECTIONS.map((_, i) => (
                                    <div key={i} onClick={() => setActiveSection(i)} className="cursor-pointer rounded-full transition-all"
                                        style={{ width: i === activeSection ? '20px' : '6px', height: '6px', background: i === activeSection ? '#f5a623' : i < activeSection ? 'rgba(245,166,35,0.4)' : 'rgba(255,255,255,0.1)' }} />
                                ))}
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm text-black transition-all"
                                style={{ background: saved ? '#2ecc71' : '#f5a623', minWidth: '130px', justifyContent: 'center' }}
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Progress'}
                            </button>

                            {activeSection < SECTIONS.length - 1 && (
                                <button
                                    onClick={() => setActiveSection(prev => Math.min(SECTIONS.length - 1, prev + 1))}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
                                    style={{ background: 'rgba(245,166,35,0.1)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.2)' }}
                                >
                                    Next <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Completion summary */}
                {activeSection === SECTIONS.length - 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-5 p-5 rounded-2xl flex items-center gap-4"
                        style={{ background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.15)' }}
                    >
                        <Shield className="w-6 h-6 flex-shrink-0" style={{ color: '#f5a623' }} />
                        <div>
                            <p className="text-sm font-bold text-white">Your PIQ data is used for AI Interview preparation</p>
                            <p className="text-xs mt-0.5" style={{ color: '#5a5a5a' }}>
                                All saved information is securely stored and used to personalize your mock PI questions.
                            </p>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default PIQForm;
