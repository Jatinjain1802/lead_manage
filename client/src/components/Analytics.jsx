import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Users, UserCheck, TrendingUp, PieChart as PieIcon, Activity, ArrowUpRight, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b'];

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="bg-slate-900/40 border border-slate-800 p-6 rounded-[2rem] relative overflow-hidden group transition-all hover:border-blue-500/30"
    >
        <div className={`absolute -top-10 -right-10 w-32 h-32 ${color} opacity-5 blur-3xl group-hover:opacity-10 transition-opacity`} />
        <div className="flex items-start justify-between relative z-10">
            <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-4xl font-black text-white tracking-tighter">{value}</h3>
                {trend && (
                    <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full w-fit">
                        <ArrowUpRight className="w-3 h-3" />
                        {trend}
                    </div>
                )}
            </div>
            <div className={`p-4 rounded-2xl bg-slate-950 border border-slate-800 text-white ${color.replace('bg-', 'text-')}`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    </motion.div>
);

const Analytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const { data: analyticsData } = await api.get('/admin/analytics');
                setData(analyticsData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading || !data) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Activity className="w-10 h-10 text-blue-500 animate-pulse" />
                <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Generating Intelligence Report</span>
            </div>
        );
    }

    const pieData = Object.entries(data.statusBreakdown).map(([name, value]) => ({
        name: name.replace('_', ' ').toUpperCase(),
        value
    }));

    const barData = data.agentPerformance.map(a => ({
        name: a.name,
        leads: a.totalAssigned,
        conversions: a.convertedCount || 0
    }));

    return (
        <div className="space-y-12 pb-20">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Executive Summary</h2>
                <p className="text-slate-400 mt-1">Real-time performance metrics across your entire lead funnel.</p>
            </div>

            {/* Primary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Leads" value={data.summary.totalLeads} icon={Users} color="bg-blue-500" trend="+12.5% this week" />
                <StatCard title="Active Agents" value={data.summary.totalAgents} icon={UserCheck} color="bg-purple-500" />
                <StatCard title="Total Conversions" value={data.summary.conversions} icon={Target} color="bg-green-500" trend="+5.2% rate" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Status Breakdown Pie */}
                <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-8">
                        <h4 className="text-lg font-bold text-white flex items-center gap-2">
                            <PieIcon className="w-5 h-5 text-blue-500" /> Lead Pipeline Distribution
                        </h4>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }}
                                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            {pieData.map((d, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{d.name}: {d.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Lead Inbound Trend */}
                <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-8">
                        <h4 className="text-lg font-bold text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-purple-500" /> WhatsApp Traffic Trend
                        </h4>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.trend}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="date" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => new Date(val).toLocaleDateString([], { weekday: 'short' })} />
                                <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Agent Performance Bar */}
            <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[3rem] relative overflow-hidden group">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h4 className="text-xl font-bold text-white flex items-center gap-2">
                            <Activity className="w-6 h-6 text-green-500" /> Talent Efficiency Report
                        </h4>
                        <p className="text-slate-500 text-xs font-medium mt-1">Comparing total leads assigned vs successful conversions by agent.</p>
                    </div>
                </div>
                <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="name" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                            <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                            />
                            <Bar dataKey="leads" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                            <Bar dataKey="conversions" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex gap-6 mt-6 justify-center">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-blue-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Leads Handled</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-green-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Successful Conversions</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
