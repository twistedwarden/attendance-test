import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthService } from './authService';
import { useAuth } from './AuthContext';
import TermsAndConditions from './TermsAndConditions';

type Relationship = 'Father' | 'Mother' | 'Guardian';

export default function ParentRegister() {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [relationship, setRelationship] = useState<Relationship>('Father');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [phase, setPhase] = useState<'form' | 'otp' | 'done'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const navigate = useNavigate();
  const { hydrateFromStoredSession } = useAuth();

  // Password strength validation (not too strict)
  const validatePassword = (password: string) => {
    const minLength = 6;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    if (password.length < minLength) {
      return { isValid: false, message: 'Password must be at least 6 characters long' };
    }
    if (!hasLetter) {
      return { isValid: false, message: 'Password must contain at least one letter' };
    }
    if (!hasNumber) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }
    return { isValid: true, message: '' };
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[a-zA-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    
    if (score <= 2) return { strength: score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { strength: score, label: 'Fair', color: 'bg-yellow-500' };
    return { strength: score, label: 'Strong', color: 'bg-green-500' };
  };

  const startRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!termsAccepted) {
      setError('You must accept the Terms and Conditions to continue.');
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message);
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setIsLoading(true);
    try {
      await AuthService.startParentRegistration({ firstName, middleName, lastName, relationship, contactNumber, email, password });
      setPhase('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start registration');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const ok = await AuthService.verifyParentRegistration(email, otp);
      if (ok) {
        // Hydrate auth state from stored token, then navigate
        await hydrateFromStoredSession?.();
        navigate('/');
        return;
      }
      setPhase('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Large Circle - Top Left */}
        <div className="absolute -top-20 -left-20 w-32 h-32 md:w-40 md:h-40 bg-blue-200/30 rounded-full blur-sm"></div>
        
        {/* Medium Circle - Top Right */}
        <div className="absolute top-32 -right-16 w-24 h-24 md:w-32 md:h-32 bg-indigo-200/40 rounded-full blur-sm"></div>
        
        {/* Small Circle - Bottom Left */}
        <div className="absolute bottom-20 left-10 w-20 h-20 md:w-24 md:h-24 bg-blue-300/25 rounded-full blur-sm"></div>
        
        {/* Rectangle - Center Right */}
        <div className="absolute top-1/2 right-0 w-16 h-24 md:w-20 md:h-32 bg-indigo-100/50 rounded-l-2xl blur-sm transform -translate-y-1/2"></div>
        
        {/* Triangle-like shape - Bottom Right */}
        <div className="absolute bottom-0 right-20 w-0 h-0 border-l-[20px] border-r-[20px] border-b-[35px] md:border-l-[30px] md:border-r-[30px] md:border-b-[50px] border-l-transparent border-r-transparent border-b-blue-200/30 blur-sm"></div>
        
        {/* Small Rectangle - Center Left */}
        <div className="absolute top-1/3 left-0 w-12 h-16 md:w-16 md:h-20 bg-blue-100/40 rounded-r-2xl blur-sm"></div>
        
        {/* Additional floating shapes - Hidden on mobile for cleaner look */}
        <div className="hidden md:block absolute top-1/4 left-1/4 w-12 h-12 bg-indigo-200/20 rounded-full blur-sm"></div>
        <div className="hidden md:block absolute bottom-1/3 right-1/3 w-16 h-16 bg-blue-300/20 rounded-full blur-sm"></div>
        <div className="hidden md:block absolute top-2/3 left-1/3 w-8 h-8 bg-indigo-100/30 rounded-full blur-sm"></div>
      </div>
      
      <div className="w-full max-w-2xl bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100 space-y-5 relative z-10">
        <div className="text-center space-y-1">
          <img src="/fcsv3.png" alt="Foothills Christian School" className="h-20 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">Parent Registration</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">{error}</div>
        )}

        {phase === 'form' && (
          <form onSubmit={startRegistration} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <input className="col-span-1 w-full px-3 py-2 border rounded-lg" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} required />
              <input className="col-span-1 w-full px-3 py-2 border rounded-lg" placeholder="Middle name" value={middleName} onChange={e => setMiddleName(e.target.value)} />
              <input className="col-span-1 w-full px-3 py-2 border rounded-lg" placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Relationship</label>
              <select className="w-full px-3 py-2 border rounded-lg" value={relationship} onChange={e => setRelationship(e.target.value as Relationship)}>
                <option>Father</option>
                <option>Mother</option>
                <option>Guardian</option>
              </select>
            </div>
            <input className="w-full px-3 py-2 border rounded-lg" placeholder="Contact number" value={contactNumber} onChange={e => setContactNumber(e.target.value)} />
            <input className="w-full px-3 py-2 border rounded-lg" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            
            {/* Password Field with Visibility Toggle */}
            <div className="relative">
              <input 
                className="w-full px-3 py-2 pr-10 border rounded-lg" 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrength(password).color}`}
                      style={{ width: `${(getPasswordStrength(password).strength / 5) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{getPasswordStrength(password).label}</span>
                </div>
              </div>
            )}

            {/* Confirm Password Field with Visibility Toggle */}
            <div className="relative">
              <input 
                className="w-full px-3 py-2 pr-10 border rounded-lg" 
                type={showConfirmPassword ? "text" : "password"} 
                placeholder="Confirm Password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required 
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Password Match Indicator */}
            {confirmPassword && (
              <div className="flex items-center space-x-2">
                {password === confirmPassword ? (
                  <>
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-green-600">Passwords match</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-sm text-red-600">Passwords do not match</span>
                  </>
                )}
              </div>
            )}
            
            <TermsAndConditions 
              onAccept={setTermsAccepted} 
              accepted={termsAccepted} 
            />
            
            <button disabled={isLoading || !termsAccepted} className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? 'Sending OTP...' : 'Register'}
            </button>
            <p className="text-sm text-center">Already have an account? <Link to="/login" className="text-blue-600 font-semibold">Sign in</Link></p>
          </form>
        )}

        {phase === 'otp' && (
          <form onSubmit={verifyRegistration} className="space-y-4">
            <p className="text-sm text-gray-700">We sent a verification code to <span className="font-semibold">{email}</span>.</p>
            <input className="w-full px-3 py-2 border rounded-lg text-center tracking-widest" maxLength={6} placeholder="Enter OTP" value={otp} onChange={e => setOtp(e.target.value)} required />
            <button disabled={isLoading} className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50">{isLoading ? 'Verifying...' : 'Verify OTP'}</button>
            <button type="button" className="w-full py-2 rounded-lg border" onClick={() => setPhase('form')}>← Back</button>
          </form>
        )}

        {phase === 'done' && (
          <div className="space-y-3 text-center">
            <div className="text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">Registration complete.</div>
            <p className="text-sm text-gray-700">No student is linked to this account yet. Please proceed to enroll a student.</p>
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold" onClick={() => navigate('/')}>Go to Dashboard</button>
          </div>
        )}
      </div>
    </div>
  );
}


