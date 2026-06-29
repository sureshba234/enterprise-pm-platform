import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../app/api';
import { Link } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const navigate = useNavigate();
  const handleGoogleLogin = () => {
    const params = new URLSearchParams({
      client_id: '866308793335-3v40q955q5lo9ld4amievjhe28vqrmod.apps.googleusercontent.com',
      redirect_uri: 'http://localhost:5173/auth/callback/google',
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'online',
      prompt: 'select_account',
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };
  const handleGithubLogin = () => {
    const params = new URLSearchParams({
      client_id: 'Ov23lietmGfFWSa0dreN',
      redirect_uri: 'http://localhost:5173/auth/callback/github',
      scope: 'read:user user:emails',
    });
    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const result = await login({ email, password }).unwrap();
      localStorage.setItem('access', result.access);
      localStorage.setItem('refresh', result.refresh);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.data?.detail || 'Login failed. Check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-slate-800 p-8 rounded-lg w-full max-w-sm space-y-4"
      >
        <h1 className="text-2xl font-bold text-white mb-2">Log In</h1>

        {error && (
          <p className="text-red-400 text-sm bg-red-950 p-2 rounded">{error}</p>
        )}

        <div>
          <label className="text-sm text-slate-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full mt-1 p-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-sm text-slate-300">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full mt-1 p-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded font-medium disabled:opacity-50"
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full bg-white hover:bg-slate-100 text-slate-900 p-2 rounded font-medium"
        >
          Sign in with Google
        </button>
        <button
          type="button"
          onClick={handleGithubLogin}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white p-2 rounded font-medium"
        >
          Sign in with GitHub
        </button>
      </form>
      <Link to="/forgot-password" className="block text-center text-sm text-slate-400 hover:text-slate-300 mt-3">
          Forgot password?
        </Link>
    </div>
  );
}