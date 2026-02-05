// src/components/auth/UserLoginPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxhooks.js';
// Import new thunks and action creators
import { sendOtpEmail, verifyOtp, clearError, setOtpSent } from '../../store/slices/userAuthSlice';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, AlertCircle, User, ArrowLeft, KeyRound } from 'lucide-react';


// Zod schema for email input
const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Zod schema for OTP verification
const otpSchema = z.object({
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numeric'),
  name: z.string().optional(), // Name is optional for existing users, required for new signups (backend will enforce)
});

const AuthPage = () => { // Renamed from UserLoginPage to AuthPage for clarity
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  // Destructure `otpSent` from state
  const { isAuthenticated, user, loading, error, otpSent } = useAppSelector((state) => state.userAuth);
  const [contactEmail, setContactEmail] = useState(''); // Store email after sending OTP
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false); // To toggle name input based on backend response (or initial assumption)


  // Form for email input
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
    setError: setEmailError,
    clearErrors: clearEmailErrors
  } = useForm({
    resolver: zodResolver(emailSchema),
  });

  // Form for OTP input
  const {
    register: registerOtp,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
    setError: setOtpError,
    clearErrors: clearOtpErrors,
    watch: watchOtpForm, // To watch for OTP input changes
    setValue: setOtpFormValue // To set OTP field value if needed
  } = useForm({
    resolver: zodResolver(otpSchema),
  });

  // Effect to redirect authenticated users
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  // Effect to clear errors on component unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
      dispatch(setOtpSent(false)); // Reset OTP state on unmount
    };
  }, [dispatch]);

  // Effect for resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
    } else {
      setIsResending(false); // Enable resend button once cooldown is over
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Handle Send OTP button click
  const onSendOtp = async (data) => {
    setContactEmail(data.email); // Store email for the next step
    dispatch(clearError()); // Clear any previous errors
    const resultAction = await dispatch(sendOtpEmail({ email: data.email }));

    if (sendOtpEmail.fulfilled.match(resultAction)) {
      // OTP sent successfully, start cooldown
      setResendCooldown(60); // 60 seconds cooldown
      setIsResending(true);
      setShowNameInput(false); // Assume not a new user by default, backend will tell us
      // Consider adding a local state to explicitly ask for name if email is not found later.
      // For now, the backend verifyOtp will reject if name is missing for a new user.
    } else {
      // Handle error, which is already set in Redux state
      console.error("Failed to send OTP:", resultAction.payload);
    }
  };

  // Handle Verify OTP button click
  const onVerifyOtp = async (data) => {
    dispatch(clearError()); // Clear any previous errors
    // Include name in the payload, even if empty, backend will handle validation for new users
    const resultAction = await dispatch(verifyOtp({ email: contactEmail, otp: data.otp, name: data.name || '' }));

    if (verifyOtp.fulfilled.match(resultAction)) {
      // Successfully logged in or registered, Redux state updated, redirection will happen
    } else {
      // Handle error, which is already set in Redux state
      console.error("Failed to verify OTP:", resultAction.payload);
      // If the error message indicates user not found and name is needed, show name input
      if (resultAction.payload && resultAction.payload.includes('Name is required for new user signup')) {
        setShowNameInput(true);
        // Maybe also clear the OTP field to force re-entry with name
        setOtpFormValue('otp', '');
      }
    }
  };

  // Handle Resend OTP button click
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return; // Prevent resending if cooldown active

    setIsResending(true);
    dispatch(clearError());
    const resultAction = await dispatch(sendOtpEmail({ email: contactEmail }));

    if (sendOtpEmail.fulfilled.match(resultAction)) {
      setResendCooldown(60); // Reset cooldown
      setShowNameInput(false); // Hide name input again on resend, unless user enters it later
    } else {
      // Error handling is automatic via Redux `error` state
      setIsResending(false); // Re-enable resend if error
    }
  };

  return (
    <div className="container py-8 min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full mx-auto">
        {/* Back to Home */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-primary-500 transition-colors"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Home
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-md p-8"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={32} className="text-primary-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {otpSent ? 'Verify Your Email' : 'Sign In / Sign Up'}
            </h1>
            <p className="text-gray-600">
              {otpSent
                ? `Enter the OTP sent to ${contactEmail}`
                : 'Enter your email to sign in or create an account'}
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-error-50 text-error-700 p-4 rounded-md flex items-start">
              <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!otpSent ? (
            // Stage 1: Email Input
            <form onSubmit={handleEmailSubmit(onSendOtp)} className="space-y-6">
              <div>
                <label htmlFor="email" className="label">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={`input pl-10 ${emailErrors.email ? 'border-error-500' : ''}`}
                    placeholder="your@email.com"
                    {...registerEmail('email')}
                  />
                </div>
                {emailErrors.email && <p className="error-message">{emailErrors.email.message}</p>}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`btn btn-primary w-full py-3 ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending OTP...
                    </div>
                  ) : (
                    'Send OTP'
                  )}
                </button>
              </div>
            </form>
          ) : (
            // Stage 2: OTP and optional Name Input
            <form onSubmit={handleOtpSubmit(onVerifyOtp)} className="space-y-6">
              <div>
                <label htmlFor="otp" className="label">
                  One-Time Password (OTP)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="otp"
                    type="text" // OTP is typically text, as some might copy-paste
                    inputMode="numeric" // For mobile keyboards
                    pattern="[0-9]*" // For basic HTML validation if type="text"
                    maxLength="6"
                    className={`input pl-10 ${otpErrors.otp ? 'border-error-500' : ''}`}
                    placeholder="••••••"
                    {...registerOtp('otp')}
                  />
                </div>
                {otpErrors.otp && <p className="error-message">{otpErrors.otp.message}</p>}
              </div>

              {showNameInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4">
                    <label htmlFor="name" className="label">
                      Your Name (Required for new accounts)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User size={18} className="text-gray-400" />
                      </div>
                      <input
                        id="name"
                        type="text"
                        className={`input pl-10 ${otpErrors.name ? 'border-error-500' : ''}`}
                        placeholder="Your Full Name"
                        {...registerOtp('name')}
                      />
                    </div>
                    {otpErrors.name && <p className="error-message">{otpErrors.name.message}</p>}
                  </div>
                </motion.div>
              )}


              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`btn btn-primary w-full py-3 ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Verifying OTP...
                    </div>
                  ) : (
                    'Verify & Sign In'
                  )}
                </button>
              </div>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isResending || loading}
                  className={`text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors ${
                    resendCooldown > 0 || isResending ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isResending ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-500 mr-1"></div>
                      Resending ({resendCooldown}s)
                    </div>
                  ) : (
                    `Resend OTP${resendCooldown > 0 ? ` (${resendCooldown}s)` : ''}`
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Moved these out of the conditional rendering to be always visible,
              or adjusted for the OTP flow. The "Don't have an account?" is now
              implicitly handled by OTP verification
          */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Are you an admin?{' '}
              <Link
                to="/admin/login"
                className="font-medium text-primary-500 hover:text-primary-600"
              >
                Admin Login
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
