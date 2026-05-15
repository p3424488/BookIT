import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/auth';
import { useAuthStore } from '../store/authStore';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    city: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await registerUser(formData);
      login(response.user, response.token);
      navigate('/');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || 'Registration failed');
      } else {
        setError('Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0a0f' }}>
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>

          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="text-2xl font-semibold text-primary">
              🎬 BookIt
            </Link>
            <h1 className="text-xl font-semibold text-white mt-4 mb-1">
              Create your account
            </h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Join millions booking their experiences
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5"
              style={{ color: 'rgba(255,255,255,0.6)' }}>
                Full name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Pavan Kumar"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all text-white"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5"
              style={{ color: 'rgba(255,255,255,0.6)' }}>
                Email address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all text-white"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5"
              style={{ color: 'rgba(255,255,255,0.6)' }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all text-white"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5"
              style={{ color: 'rgba(255,255,255,0.6)' }}>
                City <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Mumbai, Delhi, Chennai..."
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all text-white"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }}></div>
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }}></div>
          </div>

          {/* Login link */}
          <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary font-medium hover:underline"
            >
              Login
            </Link>
          </p>
        </div>

        {/* Back to home */}
        <p className="text-center mt-4">
          <Link to="/" className="text-xs text-gray-400 hover:text-gray-600">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;