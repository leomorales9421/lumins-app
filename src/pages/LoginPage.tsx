import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    try {
      await login(email, password);
      navigate('/app');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        err.message || 
        'Login failed. Please check your credentials.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="font-display bg-background-light dark:bg-background-dark min-h-screen flex flex-col overflow-hidden relative selection:bg-primary/30 selection:text-white">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Top Left Blob */}
        <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] bg-primary/20 rounded-full blur-[120px] animate-float opacity-60"></div>
        {/* Bottom Right Blob */}
        <div className="absolute -bottom-[10%] -right-[10%] w-[40vw] h-[40vw] bg-purple-500/10 rounded-full blur-[100px] animate-float-delayed opacity-50"></div>
      </div>

      <div className="layout-container flex h-full grow flex-col z-10 justify-center items-center p-4">
        {/* Main Card Container */}
        <div className="layout-content-container flex flex-col w-full max-w-[420px] bg-[#1c2327]/80 dark:bg-[#1c2327]/80 backdrop-blur-xl border border-white/5 shadow-2xl rounded-2xl overflow-hidden">
          {/* Header Section with Logo and Image */}
          <div className="flex flex-col items-center pt-8 pb-2 px-8">
            <div className="w-12 h-12 mb-4 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white text-2xl">grid_view</span>
            </div>
            <h2 className="text-white tracking-tight text-2xl font-bold leading-tight text-center">Board Manager</h2>
            <p className="text-[#9db0b9] text-sm font-normal text-center mt-2">Sign in to access your dashboard</p>
          </div>

          {/* Form Section */}
          <div className="flex flex-col px-8 py-6 w-full">
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Email Input */}
            <div className="flex flex-col gap-2 mb-5 group">
              <label className="text-white text-sm font-medium leading-normal">Email Address</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-[#9db0b9] group-focus-within:text-primary transition-colors duration-200">mail</span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#3b4b54] bg-[#111618] focus:border-primary h-11 placeholder:text-[#586872] pl-10 pr-4 text-sm font-normal leading-normal transition-all duration-200"
                  placeholder="user@example.com"
                  disabled={isSubmitting}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-2 mb-2 group">
              <label className="text-white text-sm font-medium leading-normal flex justify-between items-center">
                Password
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-[#9db0b9] group-focus-within:text-primary transition-colors duration-200">lock</span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#3b4b54] bg-[#111618] focus:border-primary h-11 placeholder:text-[#586872] pl-10 pr-10 text-sm font-normal leading-normal transition-all duration-200"
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 h-full px-3 flex items-center text-[#9db0b9] hover:text-white transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end mb-6">
              <button
                type="button"
                className="text-[#9db0b9] text-xs font-medium hover:text-primary transition-colors duration-200"
                onClick={() => alert('Forgot password functionality not implemented')}
                disabled={isSubmitting}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-4 bg-gradient-to-r from-primary to-blue-500 hover:to-blue-400 text-white text-sm font-bold leading-normal tracking-[0.015em] shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-200 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </span>
              ) : (
                <span className="truncate">Sign In</span>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#3b4b54]"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#1c2327] px-2 text-[#9db0b9]">Or continue with</span>
              </div>
            </div>

            {/* Social Login (Compact) - Placeholder */}
            <div className="flex gap-3 justify-center mb-4">
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border border-[#3b4b54] bg-[#111618] hover:bg-[#232d33] transition-colors duration-200 disabled:opacity-50"
                disabled={isSubmitting}
                onClick={() => alert('Google login not implemented')}
              >
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center p-1">
                  <svg height="16" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
                    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                      <path d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" fill="#4285F4"></path>
                      <path d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" fill="#34A853"></path>
                      <path d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.734 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.489 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.989 -25.464 56.619 L -21.484 53.529 Z" fill="#FBBC05"></path>
                      <path d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" fill="#EA4335"></path>
                    </g>
                  </svg>
                </div>
                <span className="text-[#f6f7f8] text-xs font-medium">Google</span>
              </button>
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border border-[#3b4b54] bg-[#111618] hover:bg-[#232d33] transition-colors duration-200 disabled:opacity-50"
                disabled={isSubmitting}
                onClick={() => alert('Apple login not implemented')}
              >
                <span className="material-symbols-outlined text-white text-[20px]">ios</span>
                <span className="text-[#f6f7f8] text-xs font-medium">Apple</span>
              </button>
            </div>
          </div>

          {/* Footer Section inside Card */}
          <div className="px-8 pb-8 pt-2 flex justify-center">
            <p className="text-[#9db0b9] text-sm">
              Don't have an account?{' '}
              <button
                type="button"
                className="text-primary font-medium hover:text-blue-400 transition-colors ml-1"
                onClick={() => alert('Sign up functionality not implemented')}
                disabled={isSubmitting}
              >
                Sign up
              </button>
            </p>
          </div>
        </div>

        {/* Bottom visual element */}
        <div className="absolute bottom-4 right-6 flex items-center gap-2 opacity-30 pointer-events-none hidden sm:flex">
          <span className="material-symbols-outlined text-[#9db0b9] text-sm">public</span>
          <span className="text-[#9db0b9] text-xs font-mono">Secure Connection • TLS 1.3</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
