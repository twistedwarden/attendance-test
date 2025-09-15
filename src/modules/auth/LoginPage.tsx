import { useState } from 'react';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';

export default function LoginPage() {
  const { isLoading, startOtpLogin, verifyOtp, otpPhase, otpUserId, resetOtpPhase } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  // Use DOM-injected toast to avoid losing message on re-render
  const showGlobalToast = (message: string) => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '16px';
    container.style.right = '16px';
    container.style.zIndex = '99999';
    container.style.pointerEvents = 'none';

    const toastEl = document.createElement('div');
    toastEl.textContent = message;
    toastEl.className = 'bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium';
    container.appendChild(toastEl);
    document.body.appendChild(container);
    window.setTimeout(() => {
      container.remove();
    }, 3000);
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    

    try {
      if (!otpPhase) {
        const result = await startOtpLogin?.(email, password);
        if (!result) {
          showGlobalToast('Invalid email or password. Please double-check and try again.');
        }
      } else {
        if (!otpUserId || !verifyOtp) {
          showGlobalToast('Missing OTP session. Please try signing in again.');
          return;
        }
        const user = await verifyOtp(otpUserId, otp);
        if (!user) {
          showGlobalToast('Invalid or expired OTP.');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in right now. Please try again.';
      showGlobalToast(message);
    }
  };


  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
            <img src="/fcsv3.png" alt="Foothills Christian School" className="h-32 mx-auto" />
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Welcome Back</h2>
          <p className="text-base text-gray-700 font-medium">Foothills Christian School</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-5">


            {!otpPhase && (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {otpPhase && (
              <div>
                <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-800 mb-2 font-medium">
                    We've sent a verification code to <strong className="text-blue-900">{email}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      resetOtpPhase?.();
                      setOtp('');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 flex items-center gap-1"
                  >
                    ← Back to login
                  </button>
                </div>
                <div>
                  <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 mb-2">
                    Enter OTP sent to your email
                  </label>
                  <div className="relative">
                    <input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-center text-lg font-mono tracking-widest"
                      placeholder="Enter OTP"
                      required
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-6 rounded-xl font-semibold text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {otpPhase ? 'Verifying...' : 'Sending OTP...'}
                </div>
              ) : (
                otpPhase ? 'Verify OTP' : 'Sign In'
              )}
            </button>
          </form>

        </div>


        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Don't have an account?
            {' '}
            <Link to="/parent-register" className="font-semibold text-blue-600 hover:text-blue-700">
              Register as Parent
            </Link>
          </p>
          <p className="text-xs text-gray-500">© 2024 Foothills Christian School. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
} 