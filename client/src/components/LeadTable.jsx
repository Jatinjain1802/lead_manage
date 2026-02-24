import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Phone, User as UserIcon, Calendar, CheckCircle2, Clock, MoreVertical, Search, Filter, ChevronDown, X, Eye, RefreshCcw, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG = {
    new: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Clock },
    contacted: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: Phone },
    qualified: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: UserIcon },
    converted: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: CheckCircle2 },
    not_interested: { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: Clock },
    callback: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: Calendar },
};

const StatusDropdown = ({ currentStatus, onUpdate }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${STATUS_CONFIG[currentStatus].bg} ${STATUS_CONFIG[currentStatus].color} ${STATUS_CONFIG[currentStatus].border} hover:brightness-125 focus:ring-2 focus:ring-slate-800`}
            >
                <span className="text-xs font-bold uppercase tracking-wider">{currentStatus}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute left-0 mt-2 w-52 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] p-2"
                        >
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-2 mb-1">Update Status</div>
                            {Object.keys(STATUS_CONFIG).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => {
                                        onUpdate(status);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all hover:bg-white/5 ${currentStatus === status ? 'text-blue-400 bg-blue-400/5' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${STATUS_CONFIG[status].color}`} />
                                        {status.replace('_', ' ')}
                                    </div>
                                    {currentStatus === status && <CheckCircle2 className="w-3.5 h-3.5" />}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

const ActivityTimelineModal = ({ lead, onClose }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const { data } = await api.get(`/leads/${lead.id}/activities`);
                setActivities(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchActivities();
    }, [lead.id]);

    const getActivityIcon = (type) => {
        switch (type) {
            case 'status_change': return <RefreshCcw className="w-4 h-4 text-purple-400" />;
            case 'call_log': return <Phone className="w-4 h-4 text-blue-400" />;
            case 'assignment': return <UserIcon className="w-4 h-4 text-green-400" />;
            case 'note': return <Calendar className="w-4 h-4 text-emerald-400" />;
            default: return <Clock className="w-4 h-4 text-slate-400" />;
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[110]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="relative bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col rounded-[3rem] shadow-[0_0_100px_rgba(37,99,235,0.15)]"
            >
                <div className="p-10 border-b border-slate-800/50 bg-slate-900/50">
                    <div className="flex items-center justify-between font-black">
                        <div>
                            <div className="flex items-center gap-2 text-blue-500 mb-2">
                                <ShieldCheck className="w-5 h-5" />
                                <span className="text-[10px] uppercase tracking-[0.3em] font-black">Admin Intelligence Protocol</span>
                            </div>
                            <h3 className="text-3xl font-black text-white tracking-tighter">Master History: {lead.name || lead.phone}</h3>
                        </div>
                        <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-500 hover:text-white transition-all"><X className="w-6 h-6" /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-slate-950/30">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <RefreshCcw className="w-10 h-10 text-blue-500 animate-spin" />
                            <span className="text-slate-500 font-black uppercase tracking-widest text-xs italic">Retrieving Encrypted Logs...</span>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-slate-600 font-bold uppercase tracking-widest text-sm">No recorded history for this operative.</p>
                        </div>
                    ) : (
                        <div className="relative space-y-8">
                            <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-blue-500/50 via-slate-800 to-transparent" />
                            {activities.map((activity, i) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                    key={activity.id} className="relative pl-12 group"
                                >
                                    <div className="absolute left-0 w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-xl group-hover:border-blue-500/50 transition-colors z-10">
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl group-hover:bg-slate-800/40 transition-all">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 italic bg-blue-500/5 px-2 py-0.5 rounded-md">
                                                {activity.type.replace('_', ' ')}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2 bg-slate-950 px-2 py-1 rounded-lg">
                                                <Clock className="w-3 h-3" />
                                                {new Date(activity.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-200 leading-relaxed font-medium">{activity.description}</p>
                                        <div className="mt-3 flex items-center gap-2 pt-3 border-t border-slate-800/50">
                                            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-[8px] font-black text-white">
                                                {activity.actor_name?.charAt(0) || 'S'}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">
                                                By {activity.actor_name || 'System Operator'}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const QuickNoteModal = ({ lead, onClose, onUpdate }) => {
    const [notes, setNotes] = useState(lead.notes || '');
    const [outcome, setOutcome] = useState(lead.lastCallOutcome || '');
    const [isSaving, setIsSaving] = useState(false);

    const outcomes = ['No Answer', 'Busy', 'Called - Interested', 'Called - Not Interested', 'Wrong Number', 'Callback Requested'];

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onUpdate(lead.id, { notes, lastCallOutcome: outcome, markCalled: true });
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[110]">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-slate-900 border border-slate-800 w-full max-w-lg p-8 rounded-[2.5rem] shadow-2xl"
            >
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">Log Interaction</h3>
                        <p className="text-sm text-slate-500 mt-1">Update outcome and notes for <span className="text-blue-400">{lead.name || lead.phone}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Call Outcome</label>
                        <div className="grid grid-cols-2 gap-2">
                            {outcomes.map(o => (
                                <button
                                    key={o}
                                    onClick={() => setOutcome(o)}
                                    className={`px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${outcome === o ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                                >
                                    {o}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Detailed Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Type call summary here..."
                            rows="4"
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 text-slate-200 text-sm focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-700 resize-none"
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {isSaving ? <Clock className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                        Save Activity Log
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const LeadTable = ({ onOpenChat }) => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeNoteLead, setActiveNoteLead] = useState(null);
    const [activeTimelineLead, setActiveTimelineLead] = useState(null);
    const { socket, user } = useAuth();

    const fetchLeads = async () => {
        try {
            const { data } = await api.get('/leads');
            setLeads(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();

        if (socket) {
            socket.on('new_lead', fetchLeads);
            socket.on('lead_updated', (updatedLead) => {
                setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
            });
        }

        return () => {
            if (socket) {
                socket.off('new_lead');
                socket.off('lead_updated');
            }
        };
    }, [socket]);

    const handleUpdate = async (leadId, data) => {
        try {
            await api.patch(`/leads/${leadId}`, data);
        } catch (err) {
            console.error(err);
            alert('Update failed');
        }
    };

    const filteredLeads = leads.filter(l =>
    (l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.phone.includes(searchTerm))
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-slate-500 font-medium">Synchronizing Lead Data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AnimatePresence>
                {activeNoteLead && (
                    <QuickNoteModal
                        lead={activeNoteLead}
                        onClose={() => setActiveNoteLead(null)}
                        onUpdate={handleUpdate}
                    />
                )}
                {activeTimelineLead && (
                    <ActivityTimelineModal
                        lead={activeTimelineLead}
                        onClose={() => setActiveTimelineLead(null)}
                    />
                )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by name or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                    />
                </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800/60 bg-slate-900/20 backdrop-blur-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-800/60 bg-slate-900/40">
                            <th className="p-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center w-16">#</th>
                            <th className="p-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Client Identity</th>
                            <th className="p-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status Matrix</th>
                            <th className="p-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Recent Activity</th>
                            <th className="p-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Interactions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence mode="popLayout">
                            {filteredLeads.map((lead, index) => (
                                <motion.tr
                                    key={lead.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group border-b border-slate-800/40 hover:bg-white/[0.02] transition-colors"
                                >
                                    <td className="p-6 text-center text-slate-600 font-mono text-xs">
                                        {String(index + 1).padStart(2, '0')}
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                                                <UserIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                                                    {lead.name || 'Anonymous User'}
                                                </div>
                                                <div className="text-xs text-slate-500 font-medium">{lead.phone}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        {user?.role === 'admin' ? (
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${STATUS_CONFIG[lead.status].bg} ${STATUS_CONFIG[lead.status].color} ${STATUS_CONFIG[lead.status].border}`}>
                                                <span className="text-xs font-bold uppercase tracking-wider">{lead.status}</span>
                                            </div>
                                        ) : (
                                            <StatusDropdown
                                                currentStatus={lead.status}
                                                onUpdate={(newStatus) => handleUpdate(lead.id, { status: newStatus })}
                                            />
                                        )}
                                    </td>
                                    <td className="p-6">
                                        <div className="max-w-xs space-y-2">
                                            {/* Last Call Outcome Badge */}
                                            {lead.lastCallOutcome && (
                                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[9px] font-bold text-slate-300 uppercase tracking-wider">
                                                    <Phone className="w-2.5 h-2.5 text-blue-500" />
                                                    {lead.lastCallOutcome}
                                                </div>
                                            )}

                                            <div className="text-sm text-slate-300 line-clamp-1 italic">
                                                "{lead.lastMessage || 'Initial connection...'}"
                                            </div>

                                            {/* Notes Snippet */}
                                            {lead.notes && (
                                                <div className="text-[10px] text-slate-500 line-clamp-1 italic opacity-70 border-l border-slate-800 pl-2">
                                                    Note: {lead.notes}
                                                </div>
                                            )}

                                            <div className="text-[10px] text-slate-500 font-semibold mt-1 flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" />
                                                {lead.lastMessageAt ? new Date(lead.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {user?.role === 'admin' && (
                                                <button
                                                    onClick={() => setActiveTimelineLead(lead)}
                                                    className="p-2.5 text-blue-400 hover:text-white hover:bg-blue-600/20 rounded-xl transition-all border border-blue-500/10"
                                                    title="Master History View (Boss Mode)"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            )}

                                            {user?.role !== 'admin' && (
                                                <button
                                                    onClick={() => setActiveNoteLead(lead)}
                                                    className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                                                    title="Log Call / Add Note"
                                                >
                                                    <Phone className="w-4 h-4" />
                                                </button>
                                            )}

                                            <button
                                                onClick={() => onOpenChat(lead)}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition-all duration-300"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                                {user?.role === 'admin' ? 'Observe Chat' : 'Chat'}
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeadTable;
