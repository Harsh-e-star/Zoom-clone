'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { forgotPassword, resetPassword } from '@/lib/api/auth';
import { useToast } from '@/components/ui/Toast';
import { Video, ArrowRight, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email) {
      setErrorMessage('Please enter your work email.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await forgotPassword(email);
      setInfoMessage(res.message);
      if (res.reset_token) {
        setToken(res.reset_token);
      }
      setStep('reset');
      addToast('Reset instructions sent!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error sending reset email';
      setErrorMessage(msg);
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!token || !newPassword) {
      setErrorMessage('Please provide both the token and your new password.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    setIsSubmitting(true);
    try {
      await resetPassword(token, newPassword);
      setStep('success');
      addToast('Password successfully updated!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reset failed. Invalid or expired token.';
      setErrorMessage(msg);
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fa] flex flex-col justify-between selection:bg-[#0b5cff]/20">
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-[#0b5cff] flex items-center justify-center text-white shadow-md shadow-[#0b5cff]/25 transition-transform group-hover:scale-105">
            <Video className="w-5 h-5 fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#0b5cff]">
            meet<span className="text-zinc-900 font-extrabold">space</span>
          </span>
        </Link>

        <Link
          href="/login"
          className="text-sm text-zinc-600 hover:text-zinc-900 flex items-center gap-1.5 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-zinc-200/80 p-8 sm:p-10">
          {step === 'request' && (
            <>
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0b5cff] flex items-center justify-center mx-auto mb-4 border border-blue-100">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                  Reset Password
                </h1>
                <p className="text-sm text-zinc-500 mt-2">
                  Enter your verified work email address to receive password reset instructions.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleRequestToken} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="harsh@meetspace.local"
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0b5cff] focus:border-transparent transition-all shadow-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3 px-4 bg-[#0b5cff] hover:bg-[#004be5] active:bg-[#003dc2] text-white text-sm font-semibold rounded-xl shadow-md shadow-[#0b5cff]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Sending Request...' : 'Send Reset Link'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          )}

          {step === 'reset' && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                  Enter New Password
                </h1>
                <p className="text-sm text-zinc-500 mt-2">
                  {infoMessage || 'A verification token was generated for your account.'}
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label
                    htmlFor="token"
                    className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5"
                  >
                    Reset Token
                  </label>
                  <input
                    id="token"
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Token"
                    required
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono text-zinc-800"
                  />
                </div>

                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5"
                  >
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0b5cff] focus:border-transparent transition-all shadow-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3 px-4 bg-[#0b5cff] hover:bg-[#004be5] text-white text-sm font-semibold rounded-xl shadow-md shadow-[#0b5cff]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Updating Password...' : 'Save New Password'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          )}

          {step === 'success' && (
            <div className="text-center py-4">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-zinc-900">
                Password Successfully Reset
              </h2>
              <p className="text-sm text-zinc-500 mt-2 mb-6">
                Your password has been securely updated. You can now sign in with your new credentials.
              </p>
              <Link
                href="/login"
                className="w-full inline-flex py-3 px-4 bg-[#0b5cff] hover:bg-[#004be5] text-white text-sm font-semibold rounded-xl items-center justify-center gap-2 shadow-md shadow-[#0b5cff]/20"
              >
                Sign In Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full max-w-7xl mx-auto px-6 py-6 text-center text-xs text-zinc-400">
        MeetSpace Technologies, Inc. © 2026. All rights reserved.
      </footer>
    </div>
  );
}
