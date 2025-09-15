import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthService } from './authService';

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
  const navigate = useNavigate();

  const startRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
      await AuthService.verifyParentRegistration(email, otp);
      setPhase('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 border border-gray-100 space-y-5">
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
            <button disabled={isLoading} className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50">{isLoading ? 'Sending OTP...' : 'Register'}</button>
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
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold" onClick={() => navigate('/login')}>Go to Login</button>
          </div>
        )}
      </div>
    </div>
  );
}


