import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Shield, Check, Loader2 } from 'lucide-react';
import Image from 'next/image';

// --- Types ---
type FormStatus = 'idle' | 'submitting' | 'success';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- Particle System Component (Canvas) ---
const ParticleCanvas: React.FC<{ trigger: number }> = ({ trigger }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (trigger === 0) return; // Don't run on initial load

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match parent
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // Particle Logic
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      color: string;
      size: number;
    }> = [];

    const createExplosion = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2 + 50; // Approximate button location

      for (let i = 0; i < 60; i++) {
        particles.push({
          x: centerX,
          y: centerY,
          vx: (Math.random() - 0.5) * 15,
          vy: (Math.random() - 0.5) * 15,
          life: 1,
          color: `hsl(${Math.random() * 60 + 260}, 100%, 70%)`, // Purples and Blues
          size: Math.random() * 4 + 1,
        });
      }
    };

    createExplosion();

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // Gravity
        p.life -= 0.02;
        p.vx *= 0.95; // Friction

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }

      if (particles.length > 0) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [trigger]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-20" />;
};

// --- Main Modal Component ---
const WaitlistModal: React.FC<WaitlistModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [explosionTrigger, setExplosionTrigger] = useState(0);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || data?.detail || 'Failed to join waitlist');
      }

      setStatus('success');
      setExplosionTrigger(prev => prev + 1); // Trigger particles
    } catch (error) {
      setStatus('idle');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to join waitlist');
    }
  };

  // Reset state when modal closes
  const handleClose = () => {
    onClose();
    // Delay reset slightly so it doesn't flash while fading out
    setTimeout(() => {
      setStatus('idle');
      setEmail('');
      setErrorMessage('');
    }, 300);
  };

  return (
    <>
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        @keyframes shimmer-fast {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer-fast 2.5s linear infinite;
        }
      `}</style>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 no-auth-intercept">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Card Wrapper */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-[95vw] sm:max-w-lg group"
            >
              {/* Animated gradient shadow background */}
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-[32px] blur opacity-30 animate-pulse-slow" />

              {/* Rotating gradient border effect */}
              <div className="absolute -inset-[1px] rounded-[32px] overflow-hidden">
                <motion.div
                  className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0_340deg,#00d4ff_360deg)]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
              </div>

              {/* Glass modal card */}
              <div
                className="relative w-full overflow-hidden rounded-3xl"
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(30px)',
                  WebkitBackdropFilter: 'blur(30px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {/* Inner glow */}
                <div className="absolute inset-0 rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] pointer-events-none" />

                {/* Floating orbs */}
                <motion.div
                  className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-32 -mt-32"
                  style={{ background: 'rgba(0, 212, 255, 0.15)' }}
                  animate={{
                    y: [0, -20, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <motion.div
                  className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl -ml-32 -mb-32"
                  style={{ background: 'rgba(0, 102, 255, 0.15)' }}
                  animate={{
                    y: [0, 20, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 3
                  }}
                />

                {/* Particle Layer */}
                <ParticleCanvas trigger={explosionTrigger} />

                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="absolute right-4 top-4 z-40 rounded-full p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X size={20} />
                </button>

                <div className="relative z-10 p-6 sm:p-8 md:p-10">
                  <div className="mb-6 flex items-center justify-center">
                    <Image
                      src="/images/logo2.png"
                      alt="AI2me Logo"
                      width={110}
                      height={40}
                      className="object-contain"
                      priority
                    />
                  </div>
                  <AnimatePresence mode="wait">
                    {status === 'success' ? (
                      <SuccessView key="success" onClose={handleClose} />
                    ) : (
                      <FormView
                        key="form"
                        email={email}
                        setEmail={setEmail}
                        status={status}
                        errorMessage={errorMessage}
                        handleSubmit={handleSubmit}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

// --- Sub-Components ---

const FormView: React.FC<{
  email: string;
  setEmail: (val: string) => void;
  status: FormStatus;
  errorMessage: string;
  handleSubmit: (e: React.FormEvent) => void;
}> = ({ email, setEmail, status, errorMessage, handleSubmit }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center text-center"
    >
      {/* Badge */}
      <div className="mb-6 relative inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 overflow-hidden group/badge">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-white/70 relative">
          Pre-Launch Waitlist
        </span>
      </div>

      {/* Heading */}
      <h2 className="mb-2 font-sans text-2xl sm:text-3xl font-bold text-white md:text-4xl">
        Join Our Pre-Launch
      </h2>
      <p className="mb-8 max-w-xs text-sm leading-relaxed text-white/50">
        Early access to 10 AI C-Level executives, 9 productivity tools, and lifetime premium features for early adopters.
      </p>

      {/* Social Proof */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex -space-x-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-8 w-8 rounded-full border-2 border-[#0f0f11] bg-gray-700"
              style={{
                backgroundImage: `url(https://i.pravatar.cc/100?img=${i + 10})`,
                backgroundSize: 'cover',
              }}
            />
          ))}
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0f0f11] bg-gradient-to-br from-pink-500 to-purple-600 text-[10px] font-bold text-white">
            +10k
          </div>
        </div>
        <span className="text-xs text-white/40">
          <span className="font-semibold text-white">12,847</span> people already on the waitlist
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full space-y-3">
        <div className="relative group">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-purple-500/50 focus:bg-white/10 focus:ring-1 focus:ring-purple-500/50"
          />
        </div>

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition-all hover:shadow-purple-500/40 active:scale-[0.98] disabled:opacity-70"
        >
          {status === 'submitting' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <span>Secure My Spot</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}

          {/* Shimmer Effect */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
        </button>
      </form>
      {errorMessage ? (
        <p className="mt-3 text-xs text-red-300">{errorMessage}</p>
      ) : null}

      {/* Trust Badges */}
      <div className="mt-6 flex items-center gap-6 text-[10px] text-white/30">
        <div className="flex items-center gap-1.5">
          <Shield size={12} />
          <span>No spam, ever</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Check size={12} />
          <span>Unsubscribe anytime</span>
        </div>
      </div>
    </motion.div>
  );
};

const SuccessView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="flex flex-col items-center py-4 text-center"
    >
      {/* Animated Checkmark */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        >
          <svg
            className="h-12 w-12 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </motion.div>
      </div>

      <h3 className="mb-2 text-2xl font-bold text-white">You're on the list!</h3>
      <p className="mb-8 max-w-xs text-sm leading-relaxed text-white/50">
        Welcome to the AI2me Pre-Launch waitlist. We're rolling out access in waves — you'll get your invite in the next 2-4 weeks. Watch your inbox!
      </p>

      <button
        onClick={onClose}
        className="rounded-full bg-white/10 px-8 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
      >
        Close
      </button>
    </motion.div>
  );
};

export default WaitlistModal;
