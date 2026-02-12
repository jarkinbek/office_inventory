import { useState } from 'react';
import { authApi } from '../services/api';

/**
 * useAuth hook - handles authentication state and login/logout
 */
export const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(
        localStorage.getItem('site_auth') === 'true'
    );

    const [appMode, setAppMode] = useState('public');

    const login = async (username, password) => {
        try {
            await authApi.login(username, password);
            localStorage.setItem('site_auth', 'true');
            setIsAuthenticated(true);
            return { success: true };
        } catch (error) {
            return { success: false, error };
        }
    };

    const logout = () => {
        localStorage.removeItem('site_auth');
        setIsAuthenticated(false);
        setAppMode('public');
    };

    const enterAdminMode = () => {
        setAppMode('admin');
    };

    const exitAdminMode = () => {
        setAppMode('public');
    };

    return {
        isAuthenticated,
        appMode,
        login,
        logout,
        enterAdminMode,
        exitAdminMode,
    };
};
