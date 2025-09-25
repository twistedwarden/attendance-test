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
  const [otp, setOtp] = useState('');
  const [phase, setPhase] = useState<'form' | 'otp' | 'done'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const navigate = useNavigate();
  const { hydrateFromStoredSession } = useAuth();

  const startRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!termsAccepted) {
      setError('You must accept the Terms and Conditions to continue.');
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
            <input className="w-full px-3 py-2 border rounded-lg" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            
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


