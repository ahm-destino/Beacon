import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Onboarding, isLoggedIn } from '../../services/api';

/**
 * OnboardingGuard - Protects onboarding routes and redirects based on completion status
 * 
 * - If onboarding is complete → redirects to dashboard
 * - If onboarding incomplete → redirects to appropriate onboarding step
 * - If loading → shows loading state
 */
export default function OnboardingGuard({ children, requireIncomplete = false }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkStatus = async () => {
      if (!isLoggedIn()) {
        setLoading(false);
        return;
      }
      try {
        const response = await Onboarding.getStatus();
        if (response?.data) {
          setStatus(response.data);
        } else {
          // Fallback for unexpected empty response
          setStatus({ onboarding_completed: false, onboarding_step: 1 });
        }
      } catch (err) {
        // If it's a 401, handleResponse in api.js will redirect to /auth/signin.
        // We set loading back to true (or keep it true) and don't set a fallback status
        // to prevent the guard from navigating elsewhere while the page redirects.
        if (err?.status === 401) {
          return; // Do nothing, wait for window.location.href in handleResponse
        }
        
        // Only set fallback if it's NOT a 401 (e.g. network error)
        setStatus({ onboarding_completed: false, onboarding_step: 1 });
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, []);

  if (!isLoggedIn()) {
    return <Navigate to="/auth/signin" state={{ from: location }} replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
          <p className="text-sky-600 dark:text-sky-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const { onboarding_completed, onboarding_step } = status || {};
  const currentPath = location.pathname;
  const fromWelcome = location.state?.fromWelcome;
  const fromExam = location.state?.fromExam;
  const fromSubjects = location.state?.fromSubjects;
  const fromSchool = location.state?.fromSchool;
  const fromHabits = location.state?.fromHabits;

  // If user just came from previous step, allow them to proceed
  // This prevents the race condition where status hasn't updated yet
  if (fromWelcome && currentPath === '/onboarding/exam') {
    return children;
  }
  if (fromExam && currentPath === '/onboarding/subjects') {
    return children;
  }
  if (fromSubjects && currentPath === '/onboarding/school') {
    return children;
  }
  if (fromSchool && currentPath === '/onboarding/habits') {
    return children;
  }
  if (fromHabits && currentPath === '/onboarding/diagnostic-intro') {
    return children;
  }

  // If user has completed onboarding and tries to access onboarding pages
  // Redirect them to dashboard
  if (onboarding_completed) {
    // Allow access to results page if just completed
    if (currentPath === '/onboarding/results') {
      return children;
    }
    // Allow access to dashboard when completed
    if (currentPath === '/dashboard') {
      return children;
    }
    // Otherwise redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // If onboarding is incomplete and we require it to be incomplete (onboarding pages)
  // Check if they're on the right step
  if (requireIncomplete && !onboarding_completed) {
    const stepRoutes = {
      1: '/onboarding',
      2: '/onboarding/exam',
      3: '/onboarding/subjects',
      4: '/onboarding/school',
      5: '/onboarding/habits',
      6: '/onboarding/diagnostic-intro',
    };

    const expectedPath = stepRoutes[onboarding_step] || '/onboarding';
    
    // Only redirect if they're on the wrong onboarding page
    // This allows navigation forward but prevents skipping ahead
    const currentStepNum = Object.entries(stepRoutes).find(([_, path]) => path === currentPath)?.[0];
    if (currentStepNum && parseInt(currentStepNum) > onboarding_step) {
      return <Navigate to={expectedPath} replace />;
    }

    return children;
  }

  // For protected routes (dashboard, etc) that require completed onboarding
  if (!requireIncomplete && !onboarding_completed) {
    const stepRoutes = {
      1: '/onboarding',
      2: '/onboarding/exam',
      3: '/onboarding/subjects',
      4: '/onboarding/school',
      5: '/onboarding/habits',
      6: '/onboarding/diagnostic-intro',
    };
    return <Navigate to={stepRoutes[onboarding_step] || '/onboarding'} replace />;
  }

  return children;
}
