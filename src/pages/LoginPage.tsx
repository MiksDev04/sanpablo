import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [role, setRole] = useState<'business' | 'admin'>('business');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const loggedInUser = login(email, password);
    if (loggedInUser) {
      const targetRole = role === 'admin' ? 'admin' : 'business';
      if (loggedInUser.role !== targetRole) {
        setError(`Please select correct user type. This account is for ${loggedInUser.role === 'admin' ? 'Admin' : 'Business'}.`);
        return;
      }
      navigate(loggedInUser.role === 'admin' ? '/admin' : '/business');
    } else {
      setError('Invalid credentials or account not yet approved.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-gov-blue to-primary-700">
        <div className="text-white text-center max-w-md">
          <h1 className="text-3xl font-bold mb-2 text-blue-50">San Pablo City, Laguna</h1>
          <p className="text-lg text-blue-100">SA Mobile-based App Demographic Study and Data Gathering for Tourists</p>
          <p className="text-sm text-blue-200 mt-4">Collecting and analyzing tourist demographics from accommodation establishments</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-gov-blue mb-6">Sign In</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    checked={role === 'business'}
                    onChange={() => setRole('business')}
                  />
                  <span>Accommodation Business</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    checked={role === 'admin'}
                    onChange={() => setRole('admin')}
                  />
                  <span>Tourism Admin</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="email@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <Link to="#" className="block text-sm text-primary-600 hover:underline">Forgot Password?</Link>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full py-3 bg-gov-blue text-white rounded-lg font-medium hover:bg-gov-blue/90 transition-colors"
            >
              Sign In
            </button>
          </form>
          <p className="mt-6 text-center text-gray-600">
            Accommodation business?{' '}
            <Link to="/register" className="text-primary-600 font-medium hover:underline">
              Request Registration
            </Link>
          </p>

          <div className="mt-6 border-t border-gray-200 pt-5">
            <p className="text-xs text-gray-500 text-center mb-3">Quick Sign In — Demo Accounts</p>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Admin — Tourism Office', email: 'admin@sanpablo.gov.ph', role: 'admin' as const },
                { label: 'Business — Palm Spring Resort & Hotel', email: 'resort@palmspring.com', role: 'business' as const },
                { label: 'Business — Seven Lakes Hotel', email: 'hotel@sevenlakes.com', role: 'business' as const },
              ].map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword('password');
                    setRole(account.role);
                    setError('');
                  }}
                  className="w-full px-4 py-2 text-left text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gov-blue">{account.label}</span>
                  <span className="block text-xs text-gray-400">{account.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
