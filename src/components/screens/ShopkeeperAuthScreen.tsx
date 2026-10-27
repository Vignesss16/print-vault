'use client';

import React, { useState } from 'react';
import { usePrintVault } from '@/context/PrintVaultContext';

export const ShopkeeperAuthScreen: React.FC = () => {
  const { shopkeeperSignIn, shopkeeperSignUp, setCurrentScreen, setAppRole } = usePrintVault();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Sign In & Sign Up Form Fields
  const [shopName, setShopName] = useState('QuickPrint Corner & Xerox');
  const [operatorName, setOperatorName] = useState('Mohan Kumar');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [printerModel, setPrinterModel] = useState('Canon imageRUNNER ADVANCE C5560i');
  const [location, setLocation] = useState('Station Road, MG Road, Bengaluru');
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
        const res = await shopkeeperSignUp({
          shopName,
          operatorName,
          email,
          password,
          printerModel,
          location,
        });
        if (!res.success) {
          setErrorMessage(res.error || 'Failed to register Xerox store.');
        }
      } else {
        const res = await shopkeeperSignIn(email, password);
        if (!res.success) {
          setErrorMessage(res.error || 'Invalid operator credentials.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const autofillDemoShopkeeper = () => {
    setEmail('mohan.quickprint@domain.in');
    setPassword('vault123');
    setErrorMessage(null);
  };

  return (
    <div className="flex flex-col w-full pb-8 pt-2">
      {/* Kiosk Gateway Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-3xl bg-[#07006c] flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-[#07006c]/20">
          <span className="material-symbols-outlined text-[30px]">storefront</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e1e0ff] text-[#07006c] font-sans text-[11px] font-medium mb-2">
          <span>Shopkeeper Portal</span>
        </div>
        <h2 className="font-heading font-semibold text-[22px] text-[#1b1c1a] tracking-tight">
          {mode === 'signin' ? 'Shopkeeper Sign In' : 'Register Your Shop'}
        </h2>
        <p className="font-sans text-[13px] text-[#6b6760] mt-1 max-w-[320px] mx-auto">
          {mode === 'signin'
            ? 'Sign in to receive print requests from nearby customers'
            : 'Register your Xerox shop to start receiving print orders'}
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
          className={`py-2 text-[13px] font-sans font-medium rounded-full transition-all cursor-pointer ${
            mode === 'signin'
              ? 'bg-white text-[#07006c] shadow-xs font-semibold'
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
          className={`py-2 text-[13px] font-sans font-medium rounded-full transition-all cursor-pointer ${
            mode === 'signup'
              ? 'bg-white text-[#07006c] shadow-xs font-semibold'
              : 'text-[#454556] hover:text-[#1b1c1a]'
          }`}
        >
          Register Shop
        </button>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-2xl bg-[#ffdad6]/70 border border-[#ba1a1a]/30 text-[#ba1a1a] text-[12px] flex items-center gap-2 animate-in fade-in duration-150">
          <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Operator Auth Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl p-6 shadow-sm border border-[#ece8e1] space-y-4"
      >
        {mode === 'signup' && (
          <>
            {/* Shop Name */}
            <div>
              <label className="block font-sans text-[12px] font-semibold text-[#1b1c1a] mb-1.5">
                Xerox / Print Store Name
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined text-[19px] text-[#767588] absolute left-3.5">
                  store
                </span>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. QuickPrint Corner & Xerox"
                  className="w-full h-[48px] pl-10 pr-4 bg-[#fbf9f5] border border-[#ece8e1] rounded-2xl font-sans text-[14px] text-[#1b1c1a] focus:outline-none focus:border-[#07006c] transition-all"
                />
              </div>
            </div>

            {/* Operator Full Name */}
            <div>
              <label className="block font-sans text-[12px] font-semibold text-[#1b1c1a] mb-1.5">
                Operator / Store Owner Name
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined text-[19px] text-[#767588] absolute left-3.5">
                  badge
                </span>
                <input
                  type="text"
                  required
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="e.g. Mohan Kumar"
                  className="w-full h-[48px] pl-10 pr-4 bg-[#fbf9f5] border border-[#ece8e1] rounded-2xl font-sans text-[14px] text-[#1b1c1a] focus:outline-none focus:border-[#07006c] transition-all"
                />
              </div>
            </div>

            {/* Hardware Model */}
            <div>
              <label className="block font-sans text-[12px] font-semibold text-[#1b1c1a] mb-1.5">
                Laser Printer / MFP Model
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined text-[19px] text-[#767588] absolute left-3.5">
                  print
                </span>
                <input
                  type="text"
                  required
                  value={printerModel}
                  onChange={(e) => setPrinterModel(e.target.value)}
                  placeholder="e.g. Canon imageRUNNER ADVANCE C5560i"
                  className="w-full h-[48px] pl-10 pr-4 bg-[#fbf9f5] border border-[#ece8e1] rounded-2xl font-sans text-[14px] text-[#1b1c1a] focus:outline-none focus:border-[#07006c] transition-all"
                />
              </div>
            </div>

            {/* Store Location */}
            <div>
              <label className="block font-sans text-[12px] font-semibold text-[#1b1c1a] mb-1.5">
                Shop Address / Landmark
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined text-[19px] text-[#767588] absolute left-3.5">
                  pin_drop
                </span>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Station Road, MG Road, Bengaluru"
                  className="w-full h-[48px] pl-10 pr-4 bg-[#fbf9f5] border border-[#ece8e1] rounded-2xl font-sans text-[14px] text-[#1b1c1a] focus:outline-none focus:border-[#07006c] transition-all"
                />
              </div>
            </div>
          </>
        )}

        {/* Business Email */}
        <div>
          <label className="block font-sans text-[12px] font-semibold text-[#1b1c1a] mb-1.5">
            Operator Business Email
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
              placeholder="operator@quickprint.in"
              className="w-full h-[48px] pl-10 pr-4 bg-[#fbf9f5] border border-[#ece8e1] rounded-2xl font-sans text-[14px] text-[#1b1c1a] focus:outline-none focus:border-[#07006c] transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block font-sans text-[12px] font-semibold text-[#1b1c1a] mb-1.5">
            Terminal Access Password
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
              className="w-full h-[48px] pl-10 pr-11 bg-[#fbf9f5] border border-[#ece8e1] rounded-2xl font-sans text-[14px] text-[#1b1c1a] focus:outline-none focus:border-[#07006c] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 text-[#767588] hover:text-[#1b1c1a] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[19px]">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-[52px] rounded-full bg-[#07006c] hover:bg-[#12009e] text-white font-sans text-[15px] font-semibold flex items-center justify-center gap-2 shadow-md shadow-[#07006c]/25 active:scale-[0.98] transition-all disabled:opacity-75 cursor-pointer mt-2"
        >
          {isLoading ? (
            <>
              <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
              <span>Authenticating Operator Terminal...</span>
            </>
          ) : mode === 'signin' ? (
            <>
              <span className="material-symbols-outlined text-[20px]">login</span>
              <span>Sign In</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[20px]">add_business</span>
              <span>Register Shop</span>
            </>
          )}
        </button>

        {/* Demo Autofill Helper */}
        {mode === 'signin' && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={autofillDemoShopkeeper}
              className="text-[#07006c] font-sans text-[12px] font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">bolt</span>
              <span>Autofill demo shopkeeper (Mohan Kumar • QuickPrint)</span>
            </button>
          </div>
        )}
      </form>

      {/* Switch to Customer Portal Link */}
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => {
            setAppRole('customer');
            setCurrentScreen('home');
          }}
          className="text-[#454556] hover:text-[#3d3bf3] font-sans text-[13px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[17px]">arrow_back</span>
          <span>Looking to print your documents? Switch to Customer Portal</span>
        </button>
      </div>
    </div>
  );
};
