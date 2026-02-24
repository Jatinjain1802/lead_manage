import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { UserPlus, Shield, User as UserIcon, Lock, Check, X, ShieldAlert, ShieldCheck, Mail, Activity, Settings2, Power } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '', name: '', role: 'agent', canViewChat: false });

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/admin/users');
            setUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/users', formData);
            setShowAdd(false);
            setFormData({ username: '', password: '', name: '', role: 'agent', canViewChat: false });
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to add user');
        }
    };

    const toggleChatPermission = async (user) => {
        try {
            await api.patch(`/admin/users/${user.id}`, { canViewChat: !user.can_view_chat });
            fetchUsers();
        } catch (err) {
            console.error(err);
        }
    };

    const toggleUserStatus = async (user) => {
        try {
            await api.patch(`/admin/users/${user.id}`, { isActive: !user.is_active });
            fetchUsers();
        } catch (err) {
            console.error(err);
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Activity className="w-10 h-10 text-blue-500 animate-pulse" />
                <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Accessing Team Vault</span>
            </div>
        );
    }

    return (
        <div className="space-y-10 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Team Intelligence</h2>
                    <p className="text-slate-400 mt-1">Direct and oversee your specialized call agents.</p>
                </div>
                <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                    <UserPlus className="w-5 h-5" />
                    Add New Agent
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                    {users.map((u, idx) => (
                        <motion.div
                            key={u.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`group bg-slate-900/40 border ${u.is_active ? 'border-slate-800' : 'border-red-900/30'} hover:border-blue-500/30 p-6 rounded-[2rem] transition-all relative overflow-hidden`}
                        >
                            {/* Background Glow */}
                            <div className={`absolute -top-10 -right-10 w-24 h-24 ${u.is_active ? 'bg-blue-500/5' : 'bg-red-500/5'} blur-3xl group-hover:bg-blue-500/10 transition-colors`} />

                            <div className="flex items-start justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className={`w-16 h-16 rounded-2xl bg-slate-950 flex items-center justify-center ${u.is_active ? 'text-slate-400' : 'text-red-500/50'} border border-slate-800 group-hover:border-blue-500/50 transition-colors shadow-inner`}>
                                        <UserIcon className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <div className={`font-bold text-lg text-white group-hover:text-blue-400 transition-colors ${!u.is_active && 'opacity-50'}`}>
                                            {u.name}
                                            {!u.is_active && <span className="ml-2 text-[10px] text-red-500 uppercase">Inactive</span>}
                                        </div>
                                        <div className="text-sm text-slate-500 flex items-center gap-1.5 px-0.5 mt-1">
                                            <Mail className="w-3 h-3" />
                                            {u.username}
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                    {u.role}
                                </div>
                            </div>

                            <div className="mt-8 space-y-4 relative z-10">
                                <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800 group-hover:border-slate-700 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${u.can_view_chat || u.role === 'admin' ? 'bg-green-500/10 text-green-500' : 'bg-slate-800 text-slate-500'}`}>
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-300 uppercase tracking-wide">Communication</div>
                                            <div className="text-[10px] text-slate-500 font-medium">Chat UI Access</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleChatPermission(u)}
                                        className={`relative inline-flex h-6 w-12 items-center rounded-full transition-all focus:outline-none ${u.can_view_chat || u.role === 'admin' ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'bg-slate-800'}`}
                                        disabled={u.role === 'admin'}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${u.can_view_chat || u.role === 'admin' ? 'translate-x-7' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">{u.is_active ? 'Operational' : 'Suspended'}</span>
                                    </div>
                                    {u.role !== 'admin' && (
                                        <button
                                            onClick={() => toggleUserStatus(u)}
                                            className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${u.is_active ? 'text-red-500 hover:text-red-400' : 'text-green-500 hover:text-green-400'} transition-colors`}
                                        >
                                            <Power className="w-3 h-3" />
                                            {u.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Action Overlay */}
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-all">
                                    <Settings2 className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {showAdd && (
                    <div className="fixed inset-0 flex items-center justify-center p-4 z-[100]">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAdd(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-slate-900 border border-slate-800 w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-2xl font-bold text-white tracking-tight">Enlist Agent</h3>
                                    <p className="text-sm text-slate-500 mt-1">Configure credentials for a new team member.</p>
                                </div>
                                <button onClick={() => setShowAdd(false)} className="p-2 text-slate-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                            </div>

                            <form onSubmit={handleAddUser} className="space-y-5">
                                <div className="space-y-4">
                                    <div className="relative">
                                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                        <input
                                            placeholder="Public Display Name"
                                            className="w-full bg-slate-950 border border-slate-800 py-3.5 pl-12 pr-4 rounded-xl text-white text-sm focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-700"
                                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                        <input
                                            placeholder="Username (Login ID)"
                                            className="w-full bg-slate-950 border border-slate-800 py-3.5 pl-12 pr-4 rounded-xl text-white text-sm focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-700"
                                            value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                        <input
                                            type="password"
                                            placeholder="Security Password"
                                            className="w-full bg-slate-950 border border-slate-800 py-3.5 pl-12 pr-4 rounded-xl text-white text-sm focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-700"
                                            value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Shield className="w-4 h-4 text-blue-500" />
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Permission: Chat UI</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, canViewChat: !formData.canViewChat })}
                                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all focus:outline-none ${formData.canViewChat ? 'bg-blue-600' : 'bg-slate-800'}`}
                                    >
                                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${formData.canViewChat ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] mt-4">
                                    Finalize Account
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserManagement;
