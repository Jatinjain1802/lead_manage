import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { io } from 'socket.io-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);
    const [notification, setNotification] = useState(null);

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        if (socket) socket.disconnect();
        window.location.href = '/login';
    };

    const login = async (username, password) => {
        const { data } = await api.post('/auth/login', { username, password });
        localStorage.setItem('token', data.token);

        const normalizedUser = {
            ...data.user,
            canViewChat: !!data.user.canViewChat || !!data.user.can_view_chat
        };

        setUser(normalizedUser);
        initSocket(normalizedUser);
        return normalizedUser;
    };

    const initSocket = (userData) => {
        if (socket) socket.disconnect();

        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
            transports: ['websocket']
        });

        newSocket.on('connect', () => {
            newSocket.emit('authenticate', userData.id);
        });

        newSocket.on('permissions_updated', (updatedFields) => {
            setUser(prev => {
                const newUser = { ...prev, ...updatedFields };
                // Ensure canViewChat camelCase consistency
                if (updatedFields.can_view_chat !== undefined) {
                    newUser.canViewChat = !!updatedFields.can_view_chat;
                }
                return newUser;
            });

            if (updatedFields.can_view_chat !== undefined) {
                setNotification({
                    type: 'info',
                    message: updatedFields.can_view_chat
                        ? 'Your chat interaction is now ACTIVE!'
                        : 'Your chat interaction has been restricted.'
                });
            }
        });

        newSocket.on('account_deactivated', () => {
            setNotification({
                type: 'error',
                message: 'Your account has been deactivated. You will be logged out in 15 seconds.'
            });
            setTimeout(() => {
                logout();
            }, 15000);
        });

        setSocket(newSocket);
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            api.get('/auth/me')
                .then(({ data }) => {
                    const normalizedUser = {
                        ...data,
                        canViewChat: !!data.canViewChat || !!data.can_view_chat
                    };
                    setUser(normalizedUser);
                    initSocket(normalizedUser);
                })
                .catch(() => {
                    localStorage.removeItem('token');
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, logout, notification }}>
            {children}
            {notification && (
                <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-4 animate-bounce ${notification.type === 'error' ? 'bg-red-500 text-white border-red-600' : 'bg-blue-600 text-white border-blue-700'
                    }`}>
                    <div className="bg-white/20 p-2 rounded-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span className="font-bold text-sm uppercase tracking-wide text-white">{notification.message}</span>
                </div>
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
