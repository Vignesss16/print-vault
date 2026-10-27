'use client';

import React, { useState } from 'react';
import { usePrintVault } from '@/context/PrintVaultContext';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp } = usePrintVault();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Form Fields
  const [name, setName] = useState('');
  const [age, setAge] = useState<string>('24');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const numericAge = parseInt(age, 10);
        if (isNaN(numericAge) || numericAge < 1) {
          setErrorMessage('Please enter a valid age.');
          setIsLoading(false);
          return;
        }

        const res = await signUp(name, numericAge, email, password);
        if (!res.success) {
          setErrorMessage(res.error || 'Failed to sign up.');
        }
      } else {
        const res = await signIn(email, password);
        if (!res.success) {
          setErrorMessage(res.error || 'Invalid email or password.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const autofillDemo = () => {
    setEmail('tanishq.mudaliyar@domain.in');
    setPassword('vault123');
    setErrorMessage(null);
  };

  return (
    <div className="flex flex-col w-full pb-8 pt-2">
      {/* Vault Shield Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-3xl bg-[#3d3bf3] flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-[#3d3bf3]/25">
          <span className="material-symbols-outlined text-[30px]">shield_lock</span>
        </div>
        <h2 className="font-heading font-semibold text-[22px] text-[#1b1c1a] tracking-tight">
          {mode === 'signin' ? 'Welcome back' : 'Create an account'}
        </h2>
        <p className="font-sans text-[13px] text-[#6b6760] mt-1 max-w-[300px] mx-auto">
          {mode === 'signin'
            ? 'Sign in to send and manage your print jobs'
            : 'Sign up to print documents at local Xerox shops'}
        </p>
      </div>

      {/* Mode Switcher Pill */}
      <div className="grid grid-cols-2 p-1 bg-[#f5f3ef] rounded-full border border-[#ece8e1] mb-6">
        <button
          type="button"
          onClick={() => {
            setMode('signin');
            setErrorMessage(null);
          }}
          className={`py-2 text-[13px] font-sans font-semibold rounded-full transition-all ${
            mode === 'signin'
              ? 'bg-white text-[#3d3bf3] shadow-xs'
              : 'text-[#454556] hover:text-[#1b1c1a]'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('signup');
            setErrorMessage(null);
          }}
          className={`py-2 text-[13px] font-sans font-semibold rounded-full transition-all ${
            mode === 'signup'
              ? 'bg-white text-[#3d3bf3] shadow-xs'
              : 'text-[#454556] hover:text-[#1b1c1a]'
          }`}
        >
          Sign Up (New)
        </button>
      </div>

      {/* Error Feedback Banner */}
      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-2xl bg-[#ffdad6]/70 border border-[#ba1a1a]/30 text-[#ba1a1a] text-[12px] flex items-center gap-2 animate-in fade-in duration-150">
          <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Auth Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl p-6 shadow-sm border border-[#ece8e1] space-y-4"
      >
        {mode === 'signup' && (
          <>
            {/* Customer Name */}
            <div>
              <label className="block font-sans text-[12px] font-semibold text-[#1b1c1a] mb-1.5">
                Full Name
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined text-[19px] text-[#767588] absolute left-3.5">
                  person
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rohan Sharma"
                  className="w-full h-[48px] pl-10 pr-4 bg-[#fbf9f5] border border-[#ece8e1] rounded-2xl font-sans text-[14px] text-[#1b1c1a] focus:outline-none focus:border-[#3d3bf3] focus:ring-2 focus:ring-[#3d3bf3]/15 transition-all"
                />
              </div>
            </div>

            {/* Customer Age */}
            <div>
              <label className="block font-sans text-[12px] font-semibold text-[#1b1c1a] mb-1.5">
                Age
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined text-[19px] text-[#767588] absolute left-3.5">
                  calendar_today
                </span>
                <input
                  type="number"
                  required
                  min={1}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 24"
                  className="w-full h-[48px] pl-10 pr-4 bg-[#fbf9f5] border border-[#ece8e1] rounded-2xl font-sans text-[14px] text-[#1b1c1a] focus:outline-none focus:border-[#3d3bf3] focus:ring-2 focus:ring-[#3d3bf3]/15 transition-all"
                />
              </div>
            </div>
          </>
        )}

        {/* Email Field */}
        <div>
          <label className="block font-sans text-[12px] font-semibold text-[#1b1c1a] mb-1.5">
            Email Address
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined text-[19px] text-[#767588] absolute left-3.5">
              mail
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@domain.in"
              className="w-full h-[48px] pl-10 pr-4 bg-[#fbf9f5] border border-[#ece8e1] rounded-2xl font-sans text-[14px] text-[#1b1c1a] focus:outline-none focus:border-[#3d3bf3] focus:ring-2 focus:ring-[#3d3bf3]/15 transition-all"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="block font-sans text-[12px] font-semibold text-[#1b1c1a] mb-1.5">
            Password
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined text-[19px] text-[#767588] absolute left-3.5">
              lock
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-[48px] pl-10 pr-11 bg-[#fbf9f5] border border-[#ece8e1] rounded-2xl font-sans text-[14px] text-[#1b1c1a] focus:outline-none focus:border-[#3d3bf3] focus:ring-2 focus:ring-[#3d3bf3]/15 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 text-[#767588] hover:text-[#1b1c1a]"
            >
              <span className="material-symbols-outlined text-[19px]">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        {/* Submit CTA Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-[52px] rounded-full bg-[#3d3bf3] hover:bg-[#2e2cd4] text-white font-sans text-[15px] font-semibold flex items-center justify-center gap-2 shadow-md shadow-[#3d3bf3]/25 active:scale-[0.98] transition-all disabled:opacity-75 cursor-pointer mt-2"
        >
          {isLoading ? (
            <>
              <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
              <span>Authenticating...</span>
            </>
          ) : mode === 'signin' ? (
            <>
              <span className="material-symbols-outlined text-[20px]">login</span>
              <span>Sign In</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              <span>Create Account</span>
            </>
          )}
        </button>

        {/* Quick Demo Autofill Helper for Sign In */}
        {mode === 'signin' && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={autofillDemo}
              className="text-[#3d3bf3] font-sans text-[12px] font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">bolt</span>
              <span>Autofill demo (Tanishq Mudaliyar)</span>
            </button>
          </div>
        )}
      </form>

      {/* Security Footnote */}
      <div className="mt-6 p-3.5 rounded-2xl bg-[#ddf5e6]/60 border border-[#b2e5c5] flex items-start gap-2.5">
        <span className="material-symbols-outlined text-[17px] text-[#0a542a] shrink-0 mt-0.5">
          verified_user
        </span>
        <p className="font-sans text-[11px] text-[#0a542a] leading-relaxed">
          Your documents and credentials are encrypted. Files are automatically erased from printers after printing.
        </p>
      </div>
    </div>
  );
};
