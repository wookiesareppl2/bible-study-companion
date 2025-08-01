import React, { useState } from 'react';
import { loginUser, registerUser } from '../services/authService.ts';
import { SpinnerIcon, BookOpenIcon } from './Icons.tsx';

interface LoginPageProps {
  onNavigateToRegister: () => void;
  onNavigateHome: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToRegister, onNavigateHome }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginAction, setLoginAction] = useState<'manual' | 'demo' | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    setLoginAction('manual');
    try {
      const result = await loginUser(email, password);
      if (!result.success) {
        setError(result.message);
      }
      // On success, the onAuthStateChange listener in App.tsx will handle navigation.
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
      setLoginAction(null);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);
    setLoginAction('demo');

    const demoEmail = 'demo@example.com';
    const demoPassword = 'password123';
    
    try {
      // First, try to log in.
      const loginResult = await loginUser(demoEmail, demoPassword);

      // If login failed, it's likely the user doesn't exist.
      if (!loginResult.success && loginResult.message.toLowerCase().includes('invalid login credentials')) {
        
        // Let's try to create the account.
        setSuccess('Demo account not found. Attempting to create it...');
        const regResult = await registerUser('Demo User', demoEmail, demoPassword);

        if (regResult.success) {
            // The registration was accepted by Supabase.
            // Now, we handle the possibility of email confirmation.
            if (regResult.message.includes('check your email')) {
                // Email confirmation is required. We can't log in yet.
                setError(regResult.message + " Please confirm and then try logging in.");
                setSuccess('');
            } else {
                // No email confirmation needed. Let's try logging in again.
                setSuccess('Demo account created! Logging in...');
                const secondLoginResult = await loginUser(demoEmail, demoPassword);
                if (!secondLoginResult.success) {
                    // This is an edge case. Maybe a small delay is needed.
                    setError('Account created, but automatic login failed. Please try again.');
                    setSuccess('');
                }
                // If the second login succeeds, the auth listener in App.tsx will navigate.
            }
        } else {
          // Registration failed. The user might exist with a different password, etc.
          setError(`Failed to create demo user: ${regResult.message}`);
          setSuccess('');
        }
      } else if (!loginResult.success) {
        // The login failed for a reason other than invalid credentials.
        setError(loginResult.message);
      }

      // If the initial login was successful, the auth listener will do its job.
    } catch (err) {
      setError('An unexpected error occurred during the demo login process.');
      console.error(err);
    } finally {
      setIsLoading(false);
      setLoginAction(null);
    }
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
       <button onClick={onNavigateHome} className="absolute top-4 left-4 text-gray-600 hover:text-blue-600 transition-colors">
            &larr; Back to Home
       </button>
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-col items-center">
            <BookOpenIcon className="h-12 w-12 text-blue-600" />
            <h1 className="text-3xl font-bold text-center text-gray-900 mt-4">Login</h1>
        </div>
        
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-center text-sm rounded-md">{error}</div>}
        {success && <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-center text-sm rounded-md">{success}</div>}

        <p className="text-center text-sm text-gray-500">Welcome back! Please enter your credentials.</p>
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="text-sm font-bold text-gray-600 block">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full p-3 mt-1 text-gray-800 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="password"  className="text-sm font-bold text-gray-600 block">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 mt-1 text-gray-800 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <button 
                type="submit" 
                className="w-full flex justify-center items-center py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                disabled={isLoading}
            >
              {isLoading && loginAction === 'manual' ? <SpinnerIcon /> : 'Login'}
            </button>
          </div>
        </form>

        <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <div>
            <button 
                type="button" 
                onClick={handleDemoLogin}
                className="w-full flex justify-center items-center py-3 px-4 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-bold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={isLoading}
            >
              {isLoading && loginAction === 'demo' ? <SpinnerIcon /> : 'Continue as Demo User'}
            </button>
        </div>
        
        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <button onClick={onNavigateToRegister} className="font-medium text-blue-600 hover:underline disabled:text-gray-400" disabled={isLoading}>
            Register here
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;