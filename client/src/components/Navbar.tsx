import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Navbar = () => {
  const { isLoggedIn, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        background: 'rgba(10,10,15,0.95)',
        borderColor: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold text-primary">
          🎬 BookIt
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {['/', '/?category=Movie', '/?category=Concert', '/?category=Sports'].map((path, i) => (
            <Link
              key={i}
              to={path}
              className="text-sm transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
            >
              {['Home', 'Movies', 'Concerts', 'Sports'][i]}
            </Link>
          ))}
          {isLoggedIn && (
            <Link
              to="/my-bookings"
              className="text-sm transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
            >
              My Tickets
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm hidden md:block" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {user?.name?.split(' ')[0]}
              </span>
              <button
                onClick={handleLogout}
                className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                style={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.1)' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm px-3 py-1.5 rounded-lg border transition-colors"
                style={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.1)' }}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm text-white bg-primary hover:bg-red-600 transition-colors px-4 py-1.5 rounded-lg font-medium"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;