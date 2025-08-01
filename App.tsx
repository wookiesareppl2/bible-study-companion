import React, { useState, useEffect, useCallback } from 'react';
import HomePage from './components/HomePage.tsx';
import LoginPage from './components/LoginPage.tsx';
import RegisterPage from './components/RegisterPage.tsx';
import StudyApp from './components/StudyApp.tsx';
import { UserData } from './types.ts';
import * as authService from './services/authService.ts';
import { supabase } from './services/supabaseClient.ts';
import { SpinnerIcon } from './components/Icons.tsx';

type View = 'home' | 'login' | 'register' | 'study';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [view, setView] = useState<View>('home');
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [profileRecoveryError, setProfileRecoveryError] = useState<string | null>(null);

  // This function is now stable and doesn't depend on `view` state, breaking the re-render loop.
  const handleAuthUser = useCallback(async (user: any) => {
    console.log('[handleAuthUser] START', { user });
    try {
      // First try to get the user's profile
      console.log('[handleAuthUser] Before getUserData');
      let profile = await authService.getUserData(user.id);
      console.log('[handleAuthUser] After getUserData:', profile);
      
      // If profile doesn't exist, try to create it
      if (!profile) {
        console.log('[handleAuthUser] No profile found, attempting to create one...');
        profile = await authService.createProfileForUser(user.id, user.email?.split('@')[0] || undefined);
        console.log('[handleAuthUser] After createProfileForUser:', profile);
        if (!profile) {
          console.error('[handleAuthUser] Failed to create user profile after login');
          setProfileRecoveryError('Failed to create your profile. Please try again or contact support.');
          await authService.logoutUser();
          return;
        }
      }
      
      // If we have a profile (either existing or newly created), set the user and view
      if (profile) {
        console.log('[handleAuthUser] User authenticated with profile:', profile);
        setCurrentUser(profile);
        setView('study');
        setIsLoadingSession(false);
        console.log('[handleAuthUser] profile set, loading session set to false');
      } else {
        // This should theoretically never happen due to the checks above
        console.error('[handleAuthUser] Unexpected error: No profile after creation attempt');
        setProfileRecoveryError('An unexpected error occurred. Please try again.');
        await authService.logoutUser();
        setIsLoadingSession(false);
        console.log('[handleAuthUser] unexpected error, loading session set to false');
      }
    } catch (e) {
      console.error('[handleAuthUser] Error:', e);
      setProfileRecoveryError('An error occurred during login. Please try again.');
      await authService.logoutUser();
      setIsLoadingSession(false);
      console.log('[handleAuthUser] error during login, loading session set to false');
    }
  }, []); // Empty dependency array makes this function stable.

  useEffect(() => {
    let didTimeout = false;
    let timeoutId: number | undefined = undefined;

    // Check initial session on app load.
    const checkSession = async () => {
      console.log("[App] checkSession started");
      try {
        console.log('[App] About to call supabase.auth.getSession. localStorage:', Object.keys(window.localStorage));
        timeoutId = window.setTimeout(() => {
          didTimeout = true;
          console.warn('[App] supabase.auth.getSession appears stuck or taking too long (>3s).');
          setDebugInfo((d) => d + ' | WARNING: getSession timeout');
        }, 3000);
        const { data: { session }, error } = await supabase.auth.getSession();
        if (timeoutId) clearTimeout(timeoutId);
        console.log("[App] supabase.auth.getSession result:", session, 'error:', error);
        if (session?.user) {
          console.log('[App] checkSession found user:', session.user);
          await handleAuthUser(session.user);
        } else {
          console.log('[App] checkSession found NO user, setting view to home');
          setView('home');
        }
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        console.error("[App] Error during initial session check:", error);
        // Fallback: clear any possibly corrupted session/localStorage
        try {
          await supabase.auth.signOut();
        } catch (logoutError) {
          console.error('[App] Error during fallback signOut:', logoutError);
        }
        setView('home');
      } finally {
        setIsLoadingSession(false);
      }
    };
    
    checkSession();

    // Listen for all auth events.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[App] onAuthStateChange event:', event, session);
        if (session?.user) {
          let didTimeout = false;
          const timeout = setTimeout(() => {
            didTimeout = true;
            setIsLoadingSession(false);
            setCurrentUser(null);
            setView('home');
            console.error('[App] handleAuthUser timeout: took too long, resetting state.');
          }, 4000);
          try {
            await handleAuthUser(session.user);
            if (!didTimeout) {
              setIsLoadingSession(false);
              console.log('[App] Auth state change: user signed in, loading session set to false');
            }
          } catch (e) {
            setIsLoadingSession(false);
            setCurrentUser(null);
            setView('home');
            console.error('[App] handleAuthUser threw error in onAuthStateChange:', e);
          } finally {
            clearTimeout(timeout);
          }
        } else {
          setCurrentUser(null);
          setView('home');
          setIsLoadingSession(false);
          console.log('[App] Auth state change: user signed out, loading session set to false');
        }
      }
    );

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, [handleAuthUser]);

  const handleLogout = useCallback(() => {
    authService.logoutUser();
    // onAuthStateChange will handle setting the user and view.
  }, []);
  
  const handleUpdateUserData = useCallback(async (data: Partial<UserData>) => {
    if (currentUser?.id) {
      await authService.updateUserData(currentUser.id, data);
      const updatedUser = await authService.getUserData(currentUser.id);
      if (updatedUser) {
        setCurrentUser(updatedUser);
      }
    }
  }, [currentUser]);

  // DEBUG: Track and display session/user/view state
  const [debugInfo, setDebugInfo] = useState<string>("");
  useEffect(() => {
    setDebugInfo(`view: ${view}, isLoadingSession: ${isLoadingSession}, currentUser: ${currentUser ? currentUser.username : 'null'}`);
    console.log('[App DEBUG] State:', { view, isLoadingSession, currentUser });
  }, [view, isLoadingSession, currentUser]);

  if (isLoadingSession) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-50 border-b border-blue-400 text-blue-800 py-1 px-2 text-xs text-center font-mono shadow">DEBUG: {debugInfo}</div>
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <SpinnerIcon />
        </div>
      </>
    );
  }

  const renderView = () => {
    switch(view) {
      case 'login':
        return <LoginPage 
                  onNavigateToRegister={() => setView('register')}
                  onNavigateHome={() => setView('home')} 
               />;
      case 'register':
        return <RegisterPage 
                  onRegisterSuccess={() => setView('login')}
                  onNavigateToLogin={() => setView('login')} 
               />;
      case 'study':
        // The StudyApp component now handles the case where userData might be null (e.g., during logout transition).
        return <StudyApp 
                  userData={currentUser} 
                  onUpdateUserData={handleUpdateUserData} 
                  onLogout={handleLogout}
                  onNavigateHome={() => setView('home')}
                />;
      case 'home':
      default:
        return <HomePage 
                  isLoggedIn={!!currentUser} 
                  username={currentUser?.username || null}
                  onNavigateToLogin={() => setView('login')}
                  onNavigateToRegister={() => setView('register')}
                  onNavigateToStudy={() => setView('study')}
                  onLogout={handleLogout}
               />;
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-blue-50 border-b border-blue-400 text-blue-800 py-1 px-2 text-xs text-center font-mono shadow">DEBUG: {debugInfo}</div>
      {profileRecoveryError && (
        <div className="fixed top-6 left-0 right-0 z-50 bg-red-100 border-b border-red-400 text-red-800 py-2 px-4 text-center font-semibold shadow">
          {profileRecoveryError}
        </div>
      )}
      {renderView()}
    </>
  );
}