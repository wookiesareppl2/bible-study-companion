import React, { useState } from 'react';
import { registerUser } from '../services/authService.ts';
import { SpinnerIcon, BookOpenIcon } from './Icons.tsx';

interface RegisterPageProps {
  onRegisterSuccess: () => void;
  onNavigateToLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onRegisterSuccess, onNavigateToLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (typeof username !== 'string' || String(username).trim().length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (typeof password !== 'string' || String(password).length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
        const result = await registerUser(username, email, password);
        if (result.success) {
            setSuccess(result.message);
            // Don't redirect immediately, let the user read the email confirmation message.
        } else {
            setError(result.message);
        }
    } catch (err) {
        setError('An unexpected error occurred. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-col items-center">
            <BookOpenIcon className="h-12 w-12 text-blue-600" />
            <h1 className="text-3xl font-bold text-center text-gray-900 mt-4">Create Account</h1>
        </div>
        {error && <p className="text-red-500 text-center text-sm">{error}</p>}
        {success && <p className="text-green-600 text-center bg-green-50 p-3 rounded-md text-sm">{success}</p>}
        
        {!success && (
          <form className="space-y-6" onSubmit={handleRegister}>
            <div>
              <label htmlFor="username"  className="text-sm font-bold text-gray-600 block">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 mt-1 text-gray-800 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="email"  className="text-sm font-bold text-gray-600 block">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                className="w-full p-3 mt-1 text-gray-800 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isLoading}
              />
            </div>
            <div>
               <label htmlFor="confirmPassword"  className="text-sm font-bold text-gray-600 block">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 mt-1 text-gray-800 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <button 
                type="submit" 
                className="w-full flex justify-center items-center py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                disabled={isLoading || !!success}
              >
                {isLoading ? <SpinnerIcon /> : 'Register'}
              </button>
            </div>
          </form>
        )}

         <p className="text-center text-sm text-gray-600">
          {success ? 'Once confirmed, you can ' : 'Already have an account? '}
          <button onClick={onNavigateToLogin} className="font-medium text-blue-600 hover:underline disabled:text-gray-400" disabled={isLoading}>
             log in here.
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;