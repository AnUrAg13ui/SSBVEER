import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, LogOut, Map, Image, FileText, Flag,
    Plus, Trash2, Upload, Check, AlertTriangle, X,
    Users, BarChart3, BookOpen, Layers, ChevronDown, ChevronUp, Eye,
    Image as ImageIcon, Zap, Cpu
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const BACKEND_BASE = API.replace('/api', '');

// ─── Hook: admin auth ─────────────────────────────────────────────────────────
function useAdminAuth() {
    const navigate = useNavigate();
    const token = sessionStorage.getItem('admin_token');
    useEffect(() => {
        if (!token) navigate('/admin');
    }, []);
    return token || '';
}

function adminHeaders() {
    const token = sessionStorage.getItem('admin_token') || '';
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl"
        style={{ background: type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, backdropFilter: 'blur(16px)' }}>
        {type === 'success'
            ? <Check className="w-4 h-4" style={{ color: '#22c55e' }} />
            : <AlertTriangle className="w-4 h-4" style={{ color: '#ef4444' }} />}
        <span className="text-sm font-bold" style={{ color: type === 'success' ? '#86efac' : '#fca5a5' }}>{msg}</span>
        <button onClick={onClose}><X className="w-4 h-4" style={{ color: '#5a5a5a' }} /></button>
    </motion.div>
);

// ─── Section Wrapper ──────────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, color = '#f5a623', children, defaultOpen = false }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="rounded-2xl overflow-hidden mb-4" style={{ border: `1px solid rgba(255,255,255,0.06)`, background: '#0a0a0a' }}>
            <button onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-6 py-5 transition-colors"
                style={{ background: open ? `${color}08` : 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.background = `${color}06`}
                onMouseLeave={e => e.currentTarget.style.background = open ? `${color}08` : 'transparent'}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                        <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <span className="font-black text-white" style={{ fontFamily: 'Cinzel, serif' }}>{title}</span>
                </div>
                {open ? <ChevronUp className="w-4 h-4" style={{ color: '#5a5a5a' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#5a5a5a' }} />}
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                        style={{ overflow: 'hidden' }}>
                        <div className="px-6 pb-6 pt-2">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Input helper ─────────────────────────────────────────────────────────────
const Input = ({ label, value, onChange, placeholder, type = 'text', rows }) => (
    <div className="mb-4">
        {label && <label className="block text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: '#5a5a5a' }}>{label}</label>}
        {rows ? (
            <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
                style={{ background: '#111', border: '1.5px solid rgba(255,255,255,0.07)', color: '#e5e5e5' }}
                onFocus={e => e.target.style.borderColor = '#f5a623'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'} />
        ) : (
            <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: '#111', border: '1.5px solid rgba(255,255,255,0.07)', color: '#e5e5e5' }}
                onFocus={e => e.target.style.borderColor = '#f5a623'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'} />
        )}
    </div>
);

const GoldBtn = ({ onClick, children, disabled, color = '#f5a623', outline = false }) => (
    <button onClick={onClick} disabled={disabled}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all disabled:opacity-40"
        style={outline
            ? { background: 'transparent', border: `1.5px solid ${color}`, color }
            : { background: color, color: '#000' }}
        onMouseEnter={e => !disabled && (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
        {children}
    </button>
);

// ──────────────────────────────────────────────────────────────────────────────
// ─── GPE Section ─────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────────────
const GPESection = ({ toast }) => {
    const [tasks, setTasks] = useState([]);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [form, setForm] = useState({
        title: '', description: '', situation: '', resources: '',
        problems: '', model_answer: '', map_image_url: ''
    });
    const [adding, setAdding] = useState(false);
    const [showImagePicker, setShowImagePicker] = useState(false);
    const imageFileRef = useRef(null);

    const loadTasks = async () => {
        const r = await fetch(`${API}/admin/gpe`);
        if (r.ok) setTasks(await r.json());
    };

    const loadImages = async () => {
        const r = await fetch(`${API}/admin/gpe/images`);
        if (r.ok) setImages(await r.json());
    };

    useEffect(() => { loadTasks(); loadImages(); }, []);

    const uploadImage = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        const token = sessionStorage.getItem('admin_token') || '';
        const r = await fetch(`${API}/admin/gpe/upload-image`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: fd
        });
        if (r.ok) {
            const data = await r.json();
            toast('Map image uploaded!', 'success');
            await loadImages();
            setForm(f => ({ ...f, map_image_url: data.url }));
            setShowImagePicker(false);
        } else toast('Upload failed', 'error');
        setUploading(false);
        e.target.value = '';
    };

    const deleteImage = async (filename) => {
        if (!confirm(`Delete ${filename}?`)) return;
        const r = await fetch(`${API}/admin/gpe/images/${filename}`, { method: 'DELETE', headers: adminHeaders() });
        if (r.ok) { toast('Deleted', 'success'); loadImages(); }
        else toast('Delete failed', 'error');
    };

    const submit = async () => {
        if (!form.title || !form.situation) return toast('Title and situation are required', 'error');
        setLoading(true);
        const body = {
            title: form.title,
            description: form.description,
            situation: form.situation,
            resources: form.resources.split('\n').filter(Boolean),
            problems: form.problems.split('\n').filter(Boolean).map((p, i) => ({ id: `P${i + 1}`, label: p.trim() })),
            model_answer: form.model_answer,
            map_image_url: form.map_image_url,
        };
        const r = await fetch(`${API}/admin/gpe`, { method: 'POST', headers: adminHeaders(), body: JSON.stringify(body) });
        if (r.ok) {
            toast('GPE Task created!', 'success');
            setForm({ title: '', description: '', situation: '', resources: '', problems: '', model_answer: '', map_image_url: '' });
            setAdding(false);
            loadTasks();
        } else toast('Failed to create GPE Task', 'error');
        setLoading(false);
    };

    const del = async (id) => {
        if (!confirm('Delete this GPE task?')) return;
        const r = await fetch(`${API}/admin/gpe/${id}`, { method: 'DELETE', headers: adminHeaders() });
        if (r.ok) { toast('Deleted', 'success'); loadTasks(); }
        else toast('Delete failed', 'error');
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs" style={{ color: '#5a5a5a' }}>{tasks.length} task(s) in database</span>
                <GoldBtn onClick={() => setAdding(a => !a)}><Plus className="w-4 h-4" /> Add GPE Task</GoldBtn>
            </div>

            <AnimatePresence>
                {adding && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="mb-5 p-5 rounded-2xl" style={{ background: '#111', border: '1px solid rgba(245,166,35,0.15)' }}>
                        <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#f5a623' }}>New GPE Task</p>
                        <Input label="Task Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="e.g. The Riverside Crisis" />
                        <Input label="Short Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Brief summary of the scenario" />
                        <Input label="Full Situation / Story" value={form.situation} onChange={v => setForm(f => ({ ...f, situation: v }))} placeholder="Paste the full GPE scenario here..." rows={8} />
                        <Input label="Resources (one per line)" value={form.resources} onChange={v => setForm(f => ({ ...f, resources: v }))} placeholder={"Jeep (1)\nMotor Boat — 10 km/hr\nPCO in Vill Lion"} rows={4} />
                        <Input label="Problems / Situations (one per line)" value={form.problems} onChange={v => setForm(f => ({ ...f, problems: v }))} placeholder={"Missing fish plate on railway\nTerrorist road mine\nGirls mauled by tigress"} rows={4} />
                        <Input label="Model Answer (optional)" value={form.model_answer} onChange={v => setForm(f => ({ ...f, model_answer: v }))} placeholder="Ideal solution for reference..." rows={6} />

                        {/* ── Map Image Picker ── */}
                        <div className="mb-4">
                            <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#5a5a5a' }}>
                                Map / Layout Image (optional)
                            </label>

                            {form.map_image_url ? (
                                <div className="flex items-center gap-3 mb-2">
                                    <img src={`${BACKEND_BASE}${form.map_image_url}`} alt="Selected map"
                                        className="w-24 h-16 object-cover rounded-xl" style={{ border: '1px solid rgba(245,166,35,0.3)' }} />
                                    <div>
                                        <p className="text-xs font-bold" style={{ color: '#f5a623' }}>Map image selected ✓</p>
                                        <button onClick={() => setForm(f => ({ ...f, map_image_url: '' }))}
                                            className="text-xs mt-1" style={{ color: '#ef4444' }}>Remove</button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs mb-2" style={{ color: '#3a3a3a' }}>No image selected — users will not see a map layout.</p>
                            )}

                            <div className="flex gap-2">
                                <GoldBtn onClick={() => setShowImagePicker(v => !v)} outline>
                                    <ImageIcon className="w-4 h-4" /> {showImagePicker ? 'Hide' : 'Pick from Gallery'}
                                </GoldBtn>
                                <GoldBtn onClick={() => imageFileRef.current?.click()} disabled={uploading} outline>
                                    <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload New'}
                                </GoldBtn>
                                <input type="file" ref={imageFileRef} accept="image/*" className="hidden" onChange={uploadImage} />
                            </div>
                        </div>

                        {/* Image gallery picker */}
                        <AnimatePresence>
                            {showImagePicker && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                    className="mb-4 p-4 rounded-xl" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#5a5a5a' }}>
                                        GPE Map Gallery — click to select
                                    </p>
                                    {images.length === 0 ? (
                                        <p className="text-xs text-center py-4" style={{ color: '#2a2a2a' }}>No images uploaded yet. Use "Upload New" above.</p>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2">
                                            {images.map(img => (
                                                <div key={img.filename} className="relative group cursor-pointer rounded-xl overflow-hidden"
                                                    style={{
                                                        border: form.map_image_url === img.url
                                                            ? '2px solid #f5a623'
                                                            : '1px solid rgba(255,255,255,0.06)',
                                                        aspectRatio: '4/3',
                                                    }}
                                                    onClick={() => { setForm(f => ({ ...f, map_image_url: img.url })); setShowImagePicker(false); }}>
                                                    <img src={`${BACKEND_BASE}${img.url}`} alt={img.filename}
                                                        className="w-full h-full object-cover" />
                                                    {/* Selected tick */}
                                                    {form.map_image_url === img.url && (
                                                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                                                            style={{ background: '#f5a623' }}>
                                                            <Check className="w-3 h-3 text-black" />
                                                        </div>
                                                    )}
                                                    {/* Delete btn */}
                                                    <button
                                                        onClick={e => { e.stopPropagation(); deleteImage(img.filename); }}
                                                        className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                        style={{ background: 'rgba(239,68,68,0.8)' }}>
                                                        <Trash2 className="w-2.5 h-2.5 text-white" />
                                                    </button>
                                                    <p className="absolute bottom-0 left-0 right-0 px-1.5 py-1 text-[10px] truncate"
                                                        style={{ background: 'rgba(0,0,0,0.75)', color: '#888' }}>
                                                        {img.filename}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex gap-3 mt-2">
                            <GoldBtn onClick={submit} disabled={loading}><Check className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Task'}</GoldBtn>
                            <GoldBtn onClick={() => setAdding(false)} outline><X className="w-4 h-4" /> Cancel</GoldBtn>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Task list */}
            <div className="space-y-3">
                {tasks.length === 0 && <p className="text-sm text-center py-6" style={{ color: '#3a3a3a' }}>No GPE tasks yet. Add your first one.</p>}
                {tasks.map(t => (
                    <div key={t.id} className="flex items-start justify-between p-4 rounded-xl" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Show thumbnail if task has image */}
                            {(() => {
                                try {
                                    const payload = JSON.parse(t.questions?.[0]?.options || '{}');
                                    return payload.map_image_url ? (
                                        <img src={`${BACKEND_BASE}${payload.map_image_url}`} alt="map"
                                            className="w-12 h-9 object-cover rounded-lg flex-shrink-0"
                                            style={{ border: '1px solid rgba(245,166,35,0.2)' }} />
                                    ) : (
                                        <div className="w-12 h-9 rounded-lg flex-shrink-0 flex items-center justify-center"
                                            style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <Map className="w-4 h-4" style={{ color: '#2a2a2a' }} />
                                        </div>
                                    );
                                } catch { return null; }
                            })()}
                            <div className="min-w-0">
                                <p className="text-sm font-black text-white">{t.title}</p>
                                <p className="text-xs mt-0.5 truncate" style={{ color: '#5a5a5a' }}>{t.description}</p>
                            </div>
                        </div>
                        <button onClick={() => del(t.id)} className="p-2 rounded-lg transition-colors ml-3 flex-shrink-0" style={{ color: '#4a4a4a' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={e => e.currentTarget.style.color = '#4a4a4a'}>
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};



// ──────────────────────────────────────────────────────────────────────────────
// ─── PPDT Section ─────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────────────
const PPDTSection = ({ toast }) => {
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(null);
    const fileRef = useRef(null);

    const load = async () => {
        const r = await fetch(`${API}/admin/ppdt/images`);
        if (r.ok) setImages(await r.json());
    };
    useEffect(() => { load(); }, []);

    const upload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        const token = sessionStorage.getItem('admin_token') || '';
        const r = await fetch(`${API}/admin/ppdt/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
        if (r.ok) { toast('Image uploaded!', 'success'); load(); }
        else toast('Upload failed', 'error');
        setUploading(false);
        e.target.value = '';
    };

    const del = async (filename) => {
        if (!confirm(`Delete ${filename}?`)) return;
        const r = await fetch(`${API}/admin/ppdt/${filename}`, { method: 'DELETE', headers: adminHeaders() });
        if (r.ok) { toast('Deleted', 'success'); load(); }
        else toast('Delete failed', 'error');
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs" style={{ color: '#5a5a5a' }}>{images.length} image(s) uploaded</span>
                <GoldBtn onClick={() => fileRef.current?.click()} disabled={uploading}>
                    <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload Image'}
                </GoldBtn>
            </div>
            <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={upload} />

            <p className="text-xs mb-4" style={{ color: '#4a4a4a' }}>
                Upload PPDT images (JPG/PNG/WEBP). They will be served at <code style={{ color: '#f5a623' }}>/uploads/ppdt/filename</code> and available in PPDT tests.
            </p>

            {images.length === 0 && <p className="text-sm text-center py-6" style={{ color: '#3a3a3a' }}>No PPDT images uploaded yet.</p>}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map(img => (
                    <div key={img.filename} className="relative group rounded-xl overflow-hidden"
                        style={{ border: '1px solid rgba(255,255,255,0.07)', background: '#111', aspectRatio: '4/3' }}>
                        <img src={`${BACKEND_BASE}${img.url}`} alt={img.filename}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => setPreview(`${BACKEND_BASE}${img.url}`)} />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button onClick={() => setPreview(`${BACKEND_BASE}${img.url}`)}
                                className="p-2 rounded-lg" style={{ background: 'rgba(245,166,35,0.2)', color: '#f5a623' }}>
                                <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => del(img.filename)}
                                className="p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="absolute bottom-0 left-0 right-0 px-2 py-1 text-xs truncate"
                            style={{ background: 'rgba(0,0,0,0.7)', color: '#888' }}>{img.filename}</p>
                    </div>
                ))}
            </div>

            {/* Preview modal */}
            <AnimatePresence>
                {preview && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6"
                        style={{ background: 'rgba(0,0,0,0.9)' }} onClick={() => setPreview(null)}>
                        <motion.img src={preview} alt="preview" initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                            className="max-w-2xl w-full max-h-[80vh] object-contain rounded-2xl"
                            onClick={e => e.stopPropagation()} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ──────────────────────────────────────────────────────────────────────────────
// ─── WAT / SRT Bundles Section ────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────────────
const BundleSection = ({ toast, category, label, itemLabel, placeholder }) => {
    const [bundles, setBundles] = useState([]);
    const [adding, setAdding] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', items: '' });

    const load = async () => {
        const r = await fetch(`${API}/admin/bundles/${category}`);
        if (r.ok) setBundles(await r.json());
    };
    useEffect(() => { load(); }, []);

    const submit = async () => {
        const items = form.items.split('\n').map(s => s.trim()).filter(Boolean);
        if (!form.title || items.length === 0) return toast('Title and at least one item required', 'error');
        setLoading(true);
        const r = await fetch(`${API}/admin/bundles`, {
            method: 'POST', headers: adminHeaders(),
            body: JSON.stringify({ category, title: form.title, description: form.description, items })
        });
        if (r.ok) { toast(`${label} bundle added!`, 'success'); setForm({ title: '', description: '', items: '' }); setAdding(false); load(); }
        else toast('Failed', 'error');
        setLoading(false);
    };

    const del = async (id) => {
        if (!confirm('Delete this bundle?')) return;
        const r = await fetch(`${API}/admin/bundles/${id}`, { method: 'DELETE', headers: adminHeaders() });
        if (r.ok) { toast('Deleted', 'success'); load(); }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs" style={{ color: '#5a5a5a' }}>{bundles.length} bundle(s)</span>
                <GoldBtn onClick={() => setAdding(a => !a)}><Plus className="w-4 h-4" /> New Bundle</GoldBtn>
            </div>
            <AnimatePresence>
                {adding && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="mb-5 p-5 rounded-2xl" style={{ background: '#111', border: '1px solid rgba(245,166,35,0.15)' }}>
                        <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#f5a623' }}>New {label} Bundle</p>
                        <Input label="Bundle Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder={`e.g. ${label} Set 3`} />
                        <Input label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Brief description..." />
                        <Input label={`${itemLabel} (one per line)`} value={form.items} onChange={v => setForm(f => ({ ...f, items: v }))} placeholder={placeholder} rows={10} />
                        <p className="text-xs mb-4" style={{ color: '#4a4a4a' }}>
                            {form.items.split('\n').filter(s => s.trim()).length} {itemLabel.toLowerCase()} entered
                        </p>
                        <div className="flex gap-3">
                            <GoldBtn onClick={submit} disabled={loading}><Check className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Bundle'}</GoldBtn>
                            <GoldBtn onClick={() => setAdding(false)} outline><X className="w-4 h-4" /> Cancel</GoldBtn>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-3">
                {bundles.length === 0 && <p className="text-sm text-center py-6" style={{ color: '#3a3a3a' }}>No {label} bundles yet.</p>}
                {bundles.map(b => (
                    <div key={b.id} className="p-4 rounded-xl" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-black text-white">{b.title}</p>
                                <p className="text-xs mt-0.5" style={{ color: '#5a5a5a' }}>{b.description}</p>
                                <span className="text-xs mt-1 inline-block px-2.5 py-0.5 rounded-full font-bold"
                                    style={{ background: 'rgba(245,166,35,0.1)', color: '#f5a623' }}>
                                    {b.count} {itemLabel.toLowerCase()}
                                </span>
                            </div>
                            <button onClick={() => del(b.id)} className="p-2 rounded-lg" style={{ color: '#4a4a4a' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                onMouseLeave={e => e.currentTarget.style.color = '#4a4a4a'}>
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        {b.items?.slice(0, 5).map((item, i) => (
                            <p key={i} className="text-xs mt-1" style={{ color: '#3a3a3a' }}>• {item}</p>
                        ))}
                        {b.count > 5 && <p className="text-xs mt-1" style={{ color: '#3a3a3a' }}>...and {b.count - 5} more</p>}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ──────────────────────────────────────────────────────────────────────────────
// ─── Command Task Models Section ──────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────────────
const CommandSection = ({ toast }) => {
    const [models, setModels] = useState([]);
    const [adding, setAdding] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '', difficulty: 'Medium', diffColor: '#f5a623',
        description: '', rules: '', resources: '', optimalPlan: '', sketchfabId: ''
    });

    const load = async () => {
        const r = await fetch(`${API}/admin/command-models`);
        if (r.ok) setModels(await r.json());
    };
    useEffect(() => { load(); }, []);

    const submit = async () => {
        if (!form.name || !form.description) return toast('Name and description required', 'error');
        setLoading(true);
        const body = {
            ...auth,
            name: form.name,
            difficulty: form.difficulty,
            diffColor: form.diffColor,
            description: form.description,
            rules: form.rules.split('\n').filter(Boolean),
            resources: form.resources.split('\n').filter(Boolean),
            optimalPlan: form.optimalPlan,
            sketchfabId: form.sketchfabId,
        };
        const r = await fetch(`${API}/admin/command-models`, { method: 'POST', headers: adminHeaders(), body: JSON.stringify(body) });
        if (r.ok) { toast('Model added!', 'success'); setForm({ name: '', difficulty: 'Medium', diffColor: '#f5a623', description: '', rules: '', resources: '', optimalPlan: '', sketchfabId: '' }); setAdding(false); load(); }
        else toast('Failed', 'error');
        setLoading(false);
    };

    const del = async (id) => {
        if (!confirm('Delete this model?')) return;
        const r = await fetch(`${API}/admin/command-models/${id}`, { method: 'DELETE', headers: adminHeaders() });
        if (r.ok) { toast('Deleted', 'success'); load(); }
    };

    const diffColors = { Easy: '#22c55e', Medium: '#f5a623', Hard: '#ef4444', Expert: '#8b5cf6' };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs" style={{ color: '#5a5a5a' }}>{models.length} model(s) in database</span>
                <GoldBtn onClick={() => setAdding(a => !a)}><Plus className="w-4 h-4" /> Add Model</GoldBtn>
            </div>

            <AnimatePresence>
                {adding && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="mb-5 p-5 rounded-2xl" style={{ background: '#111', border: '1px solid rgba(245,166,35,0.15)' }}>
                        <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#f5a623' }}>New Command Task Model</p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Input label="Obstacle Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. River of Death" />
                            <div className="mb-4">
                                <label className="block text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: '#5a5a5a' }}>Difficulty</label>
                                <select value={form.difficulty}
                                    onChange={e => setForm(f => ({ ...f, difficulty: e.target.value, diffColor: diffColors[e.target.value] || '#f5a623' }))}
                                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                    style={{ background: '#111', border: '1.5px solid rgba(255,255,255,0.07)', color: '#e5e5e5' }}>
                                    <option>Easy</option><option>Medium</option><option>Hard</option><option>Expert</option>
                                </select>
                            </div>
                        </div>
                        <Input label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Full obstacle description..." rows={3} />
                        <Input label="Rules (one per line)" value={form.rules} onChange={v => setForm(f => ({ ...f, rules: v }))} placeholder={"No touching the red zone\nAll members must cross\nLoad must reach far side first"} rows={4} />
                        <Input label="Resources (one per line)" value={form.resources} onChange={v => setForm(f => ({ ...f, resources: v }))} placeholder={"Plank (10 ft)\nRope (15 ft)\nLog (6 ft)"} rows={3} />
                        <Input label="Optimal Plan" value={form.optimalPlan} onChange={v => setForm(f => ({ ...f, optimalPlan: v }))} placeholder="The ideal solution..." rows={3} />
                        <Input label="Sketchfab Model ID (optional, for 3D)" value={form.sketchfabId} onChange={v => setForm(f => ({ ...f, sketchfabId: v }))} placeholder="e.g. fbf17f62d7054f8eaf049e475895829c" />
                        <div className="flex gap-3">
                            <GoldBtn onClick={submit} disabled={loading}><Check className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Model'}</GoldBtn>
                            <GoldBtn onClick={() => setAdding(false)} outline><X className="w-4 h-4" /> Cancel</GoldBtn>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-3">
                {models.length === 0 && <p className="text-sm text-center py-6" style={{ color: '#3a3a3a' }}>No models yet. Add your first obstacle.</p>}
                {models.map(m => (
                    <div key={m.id} className="flex items-start justify-between p-4 rounded-xl" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-black text-white">{m.name}</p>
                                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: `${m.diffColor}18`, color: m.diffColor }}>{m.difficulty}</span>
                                {m.is3D && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>3D</span>}
                            </div>
                            <p className="text-xs" style={{ color: '#5a5a5a' }}>{m.description?.slice(0, 100)}...</p>
                        </div>
                        <button onClick={() => del(m.id)} className="p-2 rounded-lg ml-4" style={{ color: '#4a4a4a' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={e => e.currentTarget.style.color = '#4a4a4a'}>
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ──────────────────────────────────────────────────────────────────────────────
// ─── AI Generation Section ────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────────────
const AIGenerationSection = ({ toast }) => {
    const [generating, setGenerating] = useState(null);

    const generate = async (category) => {
        if (!confirm(`Generate a new ${category} test using AI? This may take ~10-30 seconds.`)) return;
        setGenerating(category);
        const r = await fetch(`${API}/tests/generate`, {
            method: 'POST',
            headers: adminHeaders(),
            body: JSON.stringify({ category })
        });
        if (r.ok) {
            toast(`${category} Test generated successfully!`, 'success');
        } else {
            toast(`Failed to generate ${category} test. Is Gemini configured?`, 'error');
        }
        setGenerating(null);
    };

    return (
        <div>
            <p className="text-sm mb-4" style={{ color: '#5a5a5a' }}>
                Use Google Gemini to instantly generate full tests (OIR, SRT, WAT, PPDT, GTO). Ensure the backend has GEMINI_API_KEY.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {['OIR', 'SRT', 'WAT', 'PPDT', 'GTO'].map(cat => (
                    <GoldBtn key={cat} onClick={() => generate(cat)} disabled={generating !== null} outline>
                        <Cpu className="w-4 h-4 mr-1" /> {generating === cat ? 'Working...' : `Gen ${cat}`}
                    </GoldBtn>
                ))}
            </div>
        </div>
    );
};

// ──────────────────────────────────────────────────────────────────────────────
// ─── Main Admin Panel ─────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────────────
const AdminPanel = () => {
    const auth = useAdminAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const logout = () => {
        sessionStorage.removeItem('admin_token');
        navigate('/admin');
    };

    useEffect(() => {
        fetch(`${API}/admin/stats`).then(r => r.json()).then(setStats).catch(() => { });
    }, []);

    return (
        <div className="min-h-screen" style={{ background: '#000' }}>
            {/* Topbar */}
            <div className="sticky top-0 z-40 h-14 flex items-center justify-between px-6"
                style={{ background: 'rgba(0,0,0,0.95)', borderBottom: '1px solid rgba(245,166,35,0.12)', backdropFilter: 'blur(16px)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.2)' }}>
                        <Shield className="w-4 h-4" style={{ color: '#f5a623' }} />
                    </div>
                    <div>
                        <p className="text-sm font-black text-white" style={{ fontFamily: 'Cinzel, serif' }}>Admin Panel</p>
                        <p className="text-xs" style={{ color: '#4a4a4a' }}>Logged in as {auth ? 'Administrator' : '...'}</p>
                    </div>
                </div>
                <button onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}>
                    <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
            </div>

            <div className="max-w-4xl mx-auto px-4 pt-8 pb-20">
                {/* Stats row */}
                {stats && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                        {[
                            { label: 'Users', value: stats.users, icon: Users, color: '#f5a623' },
                            { label: 'Tests', value: stats.tests, icon: BookOpen, color: '#22c55e' },
                            { label: 'Results', value: stats.results, icon: BarChart3, color: '#8b5cf6' },
                            { label: 'Interviews', value: stats.interviews, icon: Layers, color: '#06b6d4' },
                        ].map(s => (
                            <div key={s.label} className="p-4 rounded-2xl flex items-center gap-3"
                                style={{ background: `${s.color}08`, border: `1px solid ${s.color}18` }}>
                                <s.icon className="w-5 h-5" style={{ color: s.color }} />
                                <div>
                                    <p className="text-xl font-black text-white">{s.value}</p>
                                    <p className="text-xs" style={{ color: '#5a5a5a' }}>{s.label}</p>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* Section heading */}
                <div className="mb-6">
                    <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#f5a623' }}>Content Management</p>
                    <h2 className="text-2xl font-black text-white mt-1" style={{ fontFamily: 'Cinzel, serif' }}>Platform Content</h2>
                </div>

                <Section title="AI Content Generation" icon={Cpu} color="#a855f7" defaultOpen>
                    <AIGenerationSection toast={showToast} />
                </Section>

                <Section title="GPE Tasks" icon={Map} color="#f5a623">
                    <GPESection toast={showToast} />
                </Section>

                <Section title="PPDT Images" icon={Image} color="#22c55e">
                    <PPDTSection toast={showToast} />
                </Section>

                <Section title="WAT Word Bundles" icon={FileText} color="#8b5cf6">
                    <BundleSection
                        toast={showToast} category="WAT" label="WAT" itemLabel="Words"
                        placeholder={"COURAGE\nFAILURE\nLEADER\nJUSTICE\nHONESTY\nSACRIFICE"} />
                </Section>

                <Section title="SRT Situation Bundles" icon={BookOpen} color="#06b6d4">
                    <BundleSection
                        toast={showToast} category="SRT" label="SRT" itemLabel="Situations"
                        placeholder={"He was on his way to the exam hall and saw an accident using his bike.\nHe was appointed as the captain of a losing team.\nHe saw his friend cheating in the exam."} />
                </Section>

                <Section title="Command Task Models" icon={Flag} color="#ef4444">
                    <CommandSection toast={showToast} />
                </Section>
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
            </AnimatePresence>
        </div>
    );
};

export default AdminPanel;
