import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGithubLoginMutation } from '../app/api';

export default function GithubCallbackPage() {
  const [searchParams] = useSearchParams();
  const [githubLogin] = useGithubLoginMutation();
  const navigate = useNavigate();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const code = searchParams.get('code');
    if (!code) {
      navigate('/login');
      return;
    }

    githubLogin(code)
      .unwrap()
      .then((result) => {
        localStorage.setItem('access', result.access);
        localStorage.setItem('refresh', result.refresh);
        navigate('/dashboard');
      })
      .catch(() => {
        navigate('/login');
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <p>Signing you in with GitHub...</p>
    </div>
  );
}