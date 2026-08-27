import React, { useState } from 'react';
import { API_URL } from '../lib/config';

interface AuthFormProps {
    onAuthSuccess: (user: any, sessionId: string) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = isLogin ? '/auth/login' : '/auth/register';
        const body = isLogin
            ? { email: username, password } // Backend expects email
            : { username, email, password };

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (response.ok) {
                onAuthSuccess(data.user, data.token);
            } else {
                setError(data.error || data.message || 'Authentication failed');
            }
        } catch (err) {
            console.error('Auth error:', err);
            setError('Could not connect to the server. Please check your internet connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md p-8 bg-[var(--wa-sidebar)] rounded-2xl shadow-xl border border-[var(--wa-border)]">
            <h2 className="text-3xl font-light text-center mb-8 text-[var(--wa-text-primary)]">
                {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>

            {error && (
                <div className="p-3 mb-6 text-sm text-rose-500 bg-rose-500/10 rounded-lg border border-rose-500/20 italic">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-[var(--wa-text-secondary)] mb-2">
                        {isLogin ? 'Username or Email' : 'Username'}
                    </label>
                    <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--wa-bg-default)] border border-[var(--wa-border)] text-[var(--wa-text-primary)] focus:ring-2 focus:ring-[#00a884] focus:border-transparent transition-all outline-none placeholder-[var(--wa-text-secondary)]"
                        placeholder="yourname"
                    />
                </div>

                {!isLogin && (
                    <div>
                        <label className="block text-sm font-medium text-[var(--wa-text-secondary)] mb-2">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-[var(--wa-bg-default)] border border-[var(--wa-border)] text-[var(--wa-text-primary)] focus:ring-2 focus:ring-[#00a884] focus:border-transparent transition-all outline-none placeholder-[var(--wa-text-secondary)]"
                            placeholder="you@example.com"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-[var(--wa-text-secondary)] mb-2">Password</label>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--wa-bg-default)] border border-[var(--wa-border)] text-[var(--wa-text-primary)] focus:ring-2 focus:ring-[#00a884] focus:border-transparent transition-all outline-none placeholder-[var(--wa-text-secondary)]"
                        placeholder="••••••••"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-[#00a884] text-white font-medium rounded-xl hover:bg-[#017561] shadow-md hover:shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                    {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                </button>
            </form>

            <div className="mt-8 text-center text-sm text-[var(--wa-text-secondary)]">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="ml-2 font-medium text-[#00a884] hover:text-[#017561] hover:underline"
                >
                    {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
            </div>
        </div>
    );
};

export default AuthForm;
