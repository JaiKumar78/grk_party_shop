import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxhooks.js';
import { adminLogin, clearError } from '../../store/slices/adminAuthSlice';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, admin, loading, error } = useAppSelector((state) => state.adminAuth);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated && admin?.role === 'admin') {
      navigate('/admin');
    }
  }, [isAuthenticated, admin, navigate]);

  useEffect(() => {
    dispatch(clearError());
    window.scrollTo(0, 0);
  }, [dispatch]);

  const onSubmit = (data) => {
    dispatch(adminLogin(data));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 border border-gray-100">
          <div className="flex flex-col items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Admin Login</h1>
            <p className="text-gray-600 text-center text-sm md:text-base">
              Sign in to access the PartyShop admin dashboard
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 text-red-700 p-4 rounded-lg border border-red-100 w-full">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div className="w-full space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 ml-1">
                Email address
              </label>
              <div className="relative">
                <Mail 
                  size={20} 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" 
                />
                <input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  {...register('email')}
                  className={`w-full h-12 rounded-lg border bg-white pr-4 text-base placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  style={{ paddingLeft: '3.75rem' }}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600 ml-1 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="w-full space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock 
                  size={20} 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" 
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full h-12 rounded-lg border bg-white text-base placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  style={{ paddingLeft: '3.75rem', paddingRight: '3.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 flex items-center justify-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 ml-1 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`btn btn-primary w-full py-3.5 rounded-xl font-semibold shadow-lg shadow-pink-100 transition-all active:scale-[0.99] ${
                  loading ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-105'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-3"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm font-medium text-pink-600 hover:text-pink-700 transition-colors">
            ← Back to Store
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;