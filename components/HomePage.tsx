import React from 'react';
import { BookOpenIcon } from './Icons';

interface HomePageProps {
  isLoggedIn: boolean;
  username: string | null;
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
  onNavigateToStudy: () => void;
  onLogout: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ isLoggedIn, username, onNavigateToLogin, onNavigateToRegister, onNavigateToStudy, onLogout }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800 p-4">
      <div className="text-center max-w-2xl mx-auto">
        <BookOpenIcon className="h-20 w-20 text-blue-600 mx-auto mb-6" />
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Welcome to your Bible Study Companion</h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8 font-serif">
          A guided journey through the scriptures. Deepen your understanding with historical context, cross-references, and personal notes.
        </p>
        
        {isLoggedIn ? (
          <div className="space-y-4">
             <p className="text-lg text-gray-700">Welcome back, {username}!</p>
            <button
              onClick={onNavigateToStudy}
              className="w-full sm:w-auto px-10 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105"
            >
              Continue Studying
            </button>
            <button
              onClick={onLogout}
              className="w-full sm:w-auto mt-4 sm:mt-0 sm:ml-4 px-10 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onNavigateToLogin}
              className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
            >
              Login
            </button>
            <button
              onClick={onNavigateToRegister}
              className="w-full sm:w-auto px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Register
            </button>
          </div>
        )}
      </div>
       <footer className="absolute bottom-4 text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Bible Study Companion. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage;