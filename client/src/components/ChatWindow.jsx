import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Send, X, User, ShieldCheck, Loader2, Phone, Video, Info, CheckCheck, Paperclip, FileText, Play, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ChatBubble = ({ msg, isCustomer }) => {
    const renderMedia = () => {
        if (!msg.metadata) return null;
        try {
            const meta = typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : msg.metadata;
            if (!meta.url) return null;

            if (msg.message_type === 'image') {
                return (
                    <div className="mt-2 rounded-lg overflow-hidden border border-white/10 group-hover:scale-105 transition-transform cursor-pointer">
                        <img src={meta.url} alt="Shared" className="max-w-full h-auto object-cover max-h-60" onClick={() => window.open(meta.url, '_blank')} />
                    </div>
                );
            }

            if (msg.message_type === 'video') {
                return (
                    <div className="mt-2 rounded-lg overflow-hidden border border-white/10 relative p-2 bg-black/20">
                        <video src={meta.url} className="max-w-full h-auto" controls />
                    </div>
                );
            }

            return (
                <div
                    onClick={() => window.open(meta.url, '_blank')}
                    className="mt-2 p-3 rounded-xl bg-black/10 flex items-center gap-3 cursor-pointer hover:bg-black/20 transition-colors border border-white/5"
                >
                    <FileText className="w-5 h-5 text-blue-400" />
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate text-slate-200">{meta.filename || 'Document'}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-tighter">Click to view</div>
                    </div>
                </div>
            );
        } catch (e) {
            return null;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex w-full mb-4 ${isCustomer ? 'justify-start' : 'justify-end'}`}
        >
            <div className={`max-w-[75%] relative group`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${isCustomer
                    ? 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/50'
                    : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-none shadow-blue-500/20'
                    }`}>
                    {!isCustomer && msg.agent_name && (
                        <div className="text-[9px] font-bold uppercase tracking-wider mb-1 text-blue-200 flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5" /> {msg.agent_name}
                        </div>
                    )}

                    <div className="whitespace-pre-wrap font-medium">{msg.message_text}</div>
                    {renderMedia()}

                    <div className={`text-[10px] mt-2 flex items-center gap-1 justify-end opacity-60 ${isCustomer ? 'text-slate-400' : 'text-blue-100'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {!isCustomer && <CheckCheck className="w-3 h-3 transition-all" />}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const ChatWindow = ({ lead, onClose, canSend = true }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);

    const fetchMessages = async () => {
        try {
            const { data } = await api.get(`/messages/lead/${lead.id}`);
            setMessages(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [lead.id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        const content = newMessage.trim();
        if (!content || isSending) return;

        const optimisticMsg = {
            sender_type: 'agent',
            message_text: content,
            created_at: new Date().toISOString(),
            agent_name: 'You'
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setIsSending(true);
        setNewMessage('');

        try {
            await api.post(`/messages/lead/${lead.id}`, { messageText: content });
            fetchMessages();
        } catch (err) {
            console.error(err);
            alert('Failed to send text message');
        } finally {
            setIsSending(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 16 * 1024 * 1024) {
            alert("File too large (Max 16MB)");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        let mediaType = 'document';
        if (file.type.startsWith('image/')) mediaType = 'image';
        else if (file.type.startsWith('video/')) mediaType = 'video';

        formData.append('mediaType', mediaType);
        formData.append('caption', file.name);

        setIsSending(true);
        try {
            await api.post(`/messages/lead/${lead.id}/media`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchMessages();
        } catch (err) {
            console.error(err);
            alert('Media upload failed');
        } finally {
            setIsSending(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-[#0f172a] shadow-[0_0_50px_rgba(0,0,0,0.5)] border-l border-slate-800 flex flex-col z-50 overflow-hidden"
        >
            {/* Header */}
            <div className="h-20 px-6 border-b border-white/[0.05] bg-slate-900/60 backdrop-blur-xl flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {lead.name ? lead.name.charAt(0) : <User className="w-6 h-6" />}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-slate-900 rounded-full" />
                    </div>
                    <div>
                        <div className="font-bold text-slate-100 leading-tight truncate max-w-[180px]">
                            {lead.name || 'WhatsApp Contact'}
                        </div>
                        <div className="text-[10px] font-bold text-green-500 tracking-wider uppercase flex items-center gap-1 mt-0.5">
                            <span className="w-1 h-1 rounded-full bg-green-500" /> WhatsApp Active
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                        <Phone className="w-5 h-5" />
                    </button>
                    <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all ml-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] scroll-smooth"
            >
                <div className="flex justify-center mb-8">
                    <div className="px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest backdrop-blur-sm">
                        End-to-end encrypted
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500/50" />
                        <span className="text-xs text-slate-600 font-bold uppercase tracking-widest">Loading History</span>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <ChatBubble
                            key={msg.id || idx}
                            msg={msg}
                            isCustomer={msg.sender_type === 'customer'}
                        />
                    ))
                )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-slate-900/80 backdrop-blur-xl border-t border-white/[0.05]">
                <AnimatePresence>
                    {isSending && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mb-4 flex items-center gap-2 text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-500/5 p-2 rounded-lg border border-blue-500/10"
                        >
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Processing WhatsApp Delivery...
                        </motion.div>
                    )}
                </AnimatePresence>

                {canSend ? (
                    <div className="flex flex-col gap-4">
                        <form onSubmit={handleSend} className="relative flex items-center gap-3">
                            <input
                                type="file"
                                hidden
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*,video/*,.pdf,.doc,.docx"
                            />

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700/30"
                                title="Attach Media"
                            >
                                <Paperclip className="w-5 h-5" />
                            </button>

                            <div className="relative flex-1">
                                <textarea
                                    rows="1"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend(e);
                                        }
                                    }}
                                    placeholder="Type your message..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-5 pr-14 text-slate-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all resize-none placeholder:text-slate-600 shadow-inner"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || isSending}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg disabled:opacity-50 transition-all active:scale-95"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500/80">
                        <ShieldCheck className="w-5 h-5 shrink-0" />
                        <p className="text-xs font-bold uppercase tracking-tight">Observation Mode Active</p>
                    </div>
                )}
                <div className="mt-4 flex items-center justify-center gap-2">
                    <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Live Sync Active</span>
                </div>
            </div>
        </motion.aside>
    );
};

export default ChatWindow;
