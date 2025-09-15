import { Link } from 'react-router-dom';

export default function RegisterInfo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 space-y-4 text-center">
        <img src="/fcsv3.png" alt="Foothills Christian School" className="h-20 mx-auto" />
        <h1 className="text-2xl font-bold text-gray-900">Account Registration</h1>
        <p className="text-gray-600">
          Online self-registration is not open to the public. To create an account, please contact the school
          registrar or administrator. Parent accounts are usually created by the school and linked to your student(s).
        </p>
        <div className="text-sm text-gray-700 space-y-1">
          <p><span className="font-semibold">Email</span>: registrar@foothills.example</p>
          <p><span className="font-semibold">Phone</span>: (000) 000-0000</p>
        </div>
        <div className="pt-2">
          <Link to="/login" className="inline-block px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}


