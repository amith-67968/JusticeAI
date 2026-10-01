import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, animate, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  Eye,
  EyeOff,
  FileText,
  Gavel,
  LoaderCircle,
  Lock,
  Mail,
  MessageSquare,
  Quote,
  Scale,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Knowledge base', href: '#knowledge' },
];

const MARQUEE_ITEMS = [
  'Consumer Protection Act, 2019',
  'Bharatiya Nyaya Sanhita',
  'Information Technology Act, 2000',
  'Model Tenancy Act, 2021',
  'Transfer of Property Act',
  'Code of Civil Procedure',
  'Negotiable Instruments Act',
  'Domestic Violence Act, 2005',
];

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'AI legal chat',
    body: 'Ask questions in plain language and get answers that cite the exact IPC, IT Act or Consumer Protection section behind the answer.',
    accent: 'from-blue-500 to-cyan-400',
    tint: 'bg-blue-50 text-blue-600',
    span: 'lg:col-span-2',
  },
  {
    icon: UploadCloud,
    title: 'Document intelligence',
    body: 'Drop a PDF, scan or typed notice. OCR plus structured extraction pulls out parties, dates, amounts and clauses.',
    accent: 'from-violet-500 to-fuchsia-400',
    tint: 'bg-violet-50 text-violet-600',
    span: '',
  },
  {
    icon: BarChart3,
    title: 'Case strength analysis',
    body: 'A deterministic rule engine plus an LLM pass scores your evidence, flags missing elements and lists the next step to take.',
    accent: 'from-emerald-500 to-teal-400',
    tint: 'bg-emerald-50 text-emerald-600',
    span: '',
  },
  {
    icon: FileText,
    title: 'Automatic case classification',
    body: 'A legal-domain BERT model sorts every document into consumer, civil, criminal, cyber crime or other — with confidence scores.',
    accent: 'from-amber-500 to-orange-400',
    tint: 'bg-amber-50 text-amber-600',
    span: 'lg:col-span-2',
  },
];

const STEPS = [
  {
    icon: UploadCloud,
    title: 'Upload your case',
    body: 'Notices, agreements, FIRs, rent papers or receipts. PDF, image or plain text.',
  },
  {
    icon: Bot,
    title: 'Let the analysis run',
    body: 'OCR, classification, rule checks and the language model work through the file together.',
  },
  {
    icon: Gavel,
    title: 'Act on clear next steps',
    body: 'Get a plain-language summary, the sections that apply, and what to do next.',
  },
];

const KNOWLEDGE = [
  { title: 'Consumer Protection', detail: 'Defective goods, refunds, e-commerce and service deficiency.', tone: 'text-blue-600 bg-blue-50' },
  { title: 'Criminal law', detail: 'FIR process, fraud, cheating and common offences.', tone: 'text-violet-600 bg-violet-50' },
  { title: 'Cyber crime', detail: 'Phishing, identity theft, hacking and reporting steps.', tone: 'text-rose-600 bg-rose-50' },
  { title: 'Rent & tenancy', detail: 'Security deposits, eviction notices and tenant remedies.', tone: 'text-emerald-600 bg-emerald-50' },
  { title: 'Civil procedure', detail: 'Filing suits, court hierarchy, limitation and legal aid.', tone: 'text-amber-600 bg-amber-50' },
  { title: 'Document timeline', detail: 'Every key date and event extracted into a single ordered view.', tone: 'text-cyan-600 bg-cyan-50' },
];

const STATS = [
  { value: 5, suffix: '', label: 'Case categories detected' },
  { value: 120, suffix: '+', label: 'Legal sections indexed' },
  { value: 10, suffix: 's', label: 'Average first response' },
  { value: 24, suffix: '/7', label: 'Available to citizens' },
];

const DEMO_MESSAGES = [
  {
    role: 'user',
    text: 'My landlord locked me out of my flat without any notice.',
    chips: [],
  },
  {
    role: 'ai',
    text: 'Under the Model Tenancy Act, a written notice is required before eviction can proceed.',
    chips: ['MTA 2021 §14', 'TPA §14'],
  },
  {
    role: 'ai',
    text: 'Three steps you can take today — starting with a written demand notice.',
    chips: ['Demand notice', 'Tenant forum'],
  },
  {
    role: 'user',
    text: 'How long do I have to respond to that notice?',
    chips: [],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

function Reveal({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      custom={delay}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({ eyebrow, title, description, align = 'center' }) {
  const alignment = align === 'center' ? 'items-center text-center mx-auto' : 'items-start text-left';
  return (
    <Reveal className={`flex max-w-2xl flex-col gap-4 ${alignment}`}>
      <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-1.5 text-xs font-semibold tracking-wide text-accent-primary uppercase shadow-sm">
        <Sparkles size={14} />
        {eyebrow}
      </span>
      <h2 className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="text-base leading-relaxed text-slate-600 sm:text-lg">{description}</p>
    </Reveal>
  );
}

function CountUp({ to, suffix = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return undefined;
    const controls = animate(0, to, {
      duration: 1.4,
      ease: 'easeOut',
      onUpdate: (latest) => setValue(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, to]);

  return (
    <span ref={ref} className="tabular-nums">
      {value}
      {suffix}
    </span>
  );
}

function AuthPanelBrand() {
  return (
    <div className="relative hidden overflow-hidden bg-linear-to-br from-blue-50 via-sky-50 to-violet-50 p-10 lg:flex lg:flex-col lg:justify-between">
      <div className="animate-drift-a pointer-events-none absolute -top-16 -left-10 h-56 w-56 rounded-full bg-blue-300/40 blur-3xl" />
      <div className="animate-drift-b pointer-events-none absolute right-0 bottom-0 h-64 w-64 rounded-full bg-violet-300/40 blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-200 bg-white shadow-sm">
            <Scale className="text-accent-primary" size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">JusticeAI</span>
        </div>
        <p className="mt-8 text-2xl leading-snug font-semibold tracking-tight text-slate-900 text-balance">
          Legal clarity, in the language you actually speak.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Create a free account to unlock document analysis, case scoring and a legal assistant trained on
          Indian statutes.
        </p>
      </div>

      <ul className="relative mt-10 space-y-3">
        {['No credit card required', 'Documents analysed in seconds', 'Built for Indian law'].map((item) => (
          <li key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-accent-primary shadow-sm">
              <Check size={14} />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AuthModal({ open, onClose, isSignup, onToggleMode, error }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const { body } = document;
    const previous = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = previous;
    };
  }, [open]);

  const fieldClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3.5 pr-11 pl-11 text-slate-900 placeholder-slate-400 outline-none transition focus:border-accent-primary focus:bg-white focus:ring-2 focus:ring-accent-primary/15';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={isSignup ? 'Create account' : 'Log in'}
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="surface-card relative z-10 grid max-h-[92dvh] w-full max-w-4xl grid-cols-1 overflow-y-auto lg:grid-cols-2"
          >
            <AuthPanelBrand />

            <div className="relative p-6 sm:p-10">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute top-4 right-4 p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>

              <AnimatePresence mode="wait">
                <motion.div
                  key={isSignup ? 'signup' : 'login'}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  {isSignup ? (
                    <SignupFields
                      fieldClass={fieldClass}
                      error={error}
                      showPassword={showPassword}
                      showConfirmPassword={showConfirmPassword}
                      setShowPassword={setShowPassword}
                      setShowConfirmPassword={setShowConfirmPassword}
                    />
                  ) : (
                    <LoginFields
                      fieldClass={fieldClass}
                      error={error}
                      showPassword={showPassword}
                      setShowPassword={setShowPassword}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              <p className="mt-6 text-center text-sm text-slate-600">
                {isSignup ? 'Already have an account?' : "Don't have an account?"}
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="ml-1.5 rounded font-semibold text-accent-primary transition hover:text-accent-hover hover:underline"
                >
                  {isSignup ? 'Log in' : 'Sign up'}
                </button>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LoginFields({ fieldClass, error, showPassword, setShowPassword }) {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/dashboard';
  const message = localError || error;

  const handleLogin = async (event) => {
    event.preventDefault();
    setLocalError('');
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Login failed.');
    }
  };

  return (
    <>
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Welcome back</h2>
        <p className="mt-2 text-sm text-slate-600">Log in to continue to your legal workspace.</p>
      </div>

      <form onSubmit={handleLogin} className="mt-8 space-y-4">
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {message}
          </motion.div>
        )}

        <div className="relative">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            className={fieldClass}
          />
          <Mail className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={18} />
        </div>

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className={fieldClass}
          />
          <Lock className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={18} />
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute top-1/2 right-3 -translate-y-1/2 p-1.5 text-slate-400 transition hover:text-slate-700"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button
          disabled={loading}
          type="submit"
          className="btn-primary flex w-full items-center justify-center gap-2 py-3.5 shadow-lg shadow-blue-600/20"
        >
          {loading ? <LoaderCircle className="animate-spin" size={18} /> : null}
          {loading ? 'Authenticating...' : 'Log in'}
        </button>
      </form>
    </>
  );
}

function SignupFields({
  fieldClass,
  error,
  showPassword,
  showConfirmPassword,
  setShowPassword,
  setShowConfirmPassword,
}) {
  const { signup, loading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/dashboard';
  const message = localError || error;

  const handleSignup = async (event) => {
    event.preventDefault();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    try {
      await signup(name, email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Signup failed.');
    }
  };

  return (
    <>
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Create your account</h2>
        <p className="mt-2 text-sm text-slate-600">Free while the hackathon preview is live.</p>
      </div>

      <form onSubmit={handleSignup} className="mt-8 space-y-4">
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {message}
          </motion.div>
        )}

        <div className="relative">
          <input
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Full name"
            className={fieldClass}
          />
          <User className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={18} />
        </div>

        <div className="relative">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            className={fieldClass}
          />
          <Mail className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={18} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className={fieldClass}
            />
            <Lock className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={18} />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-3 -translate-y-1/2 p-1.5 text-slate-400 transition hover:text-slate-700"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm"
              className={fieldClass}
            />
            <Lock className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={18} />
            <button
              type="button"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute top-1/2 right-3 -translate-y-1/2 p-1.5 text-slate-400 transition hover:text-slate-700"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          disabled={loading}
          type="submit"
          className="btn-primary flex w-full items-center justify-center gap-2 py-3.5 shadow-lg shadow-blue-600/20"
        >
          {loading ? <LoaderCircle className="animate-spin" size={18} /> : null}
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </>
  );
}

function HeroVisual() {
  const containerRef = useRef(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);
  const smoothX = useSpring(pointerX, { stiffness: 80, damping: 20 });
  const smoothY = useSpring(pointerY, { stiffness: 80, damping: 20 });
  const glowX = useTransform(smoothX, [0, 1], ['25%', '75%']);
  const glowY = useTransform(smoothY, [0, 1], ['25%', '75%']);

  const currentMessage = DEMO_MESSAGES[messageIndex % DEMO_MESSAGES.length];
  const nextMessage = DEMO_MESSAGES[(messageIndex + 1) % DEMO_MESSAGES.length];
  const isTyping = nextMessage.role === 'ai';

  useEffect(() => {
    const timer = setTimeout(
      () => setMessageIndex((index) => index + 1),
      isTyping ? 2200 : 1800,
    );
    return () => clearTimeout(timer);
  }, [messageIndex, isTyping]);

  const handlePointerMove = (event) => {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return;
    pointerX.set((event.clientX - bounds.left) / bounds.width);
    pointerY.set((event.clientY - bounds.top) / bounds.height);
  };

  return (
    <div ref={containerRef} onPointerMove={handlePointerMove} className="relative">
      <div className="animate-drift-a pointer-events-none absolute -inset-6 rounded-[3rem] bg-blue-200/50 blur-3xl" />
      <div className="animate-drift-b pointer-events-none absolute -top-10 -right-8 h-40 w-40 rounded-full bg-violet-300/50 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 40, rotateX: 12 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="surface-card relative overflow-hidden rounded-[2rem] p-3"
      >
        <div className="relative h-72 overflow-hidden rounded-[1.5rem] sm:h-80 lg:h-[26rem]">
          {/* Animated light backdrop — no video */}
          <div className="absolute inset-0 bg-linear-to-br from-blue-50 via-white to-violet-50" />
          <div className="animate-drift-a absolute -top-12 -left-10 h-56 w-56 rounded-full bg-blue-300/40 blur-3xl" />
          <div className="animate-drift-b absolute -right-8 -bottom-12 h-64 w-64 rounded-full bg-violet-300/40 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_30%_20%,rgba(59,130,246,0.14),transparent_70%)]" />

          {/* Rotating rings with orbiting icons */}
          <div className="pointer-events-none absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 opacity-70">
            <span className="animate-spin-slow absolute inset-0 rounded-full border border-dashed border-blue-300/60" />
            <span
              className="animate-spin-slow absolute inset-8 rounded-full border border-blue-200/70"
              style={{ animationDirection: 'reverse', animationDuration: '18s' }}
            />
            <span
              className="animate-spin-slow absolute inset-16 rounded-full border border-violet-200/70"
              style={{ animationDuration: '13s' }}
            />
            {[
              { icon: <Scale size={14} />, tone: 'bg-white text-accent-primary border-blue-200', position: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2', speed: '26s', reverse: false },
              { icon: <Gavel size={14} />, tone: 'bg-white text-violet-600 border-violet-200', position: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2', speed: '26s', reverse: false },
              { icon: <ShieldCheck size={14} />, tone: 'bg-white text-emerald-600 border-emerald-200', position: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2', speed: '18s', reverse: true },
            ].map((node) => (
              <span
                key={node.tone}
                className="animate-spin-slow absolute grid h-8 w-8 place-items-center rounded-full border shadow-sm"
                style={{ animationDuration: node.speed, animationDirection: node.reverse ? 'reverse' : 'normal' }}
              >
                <span
                  className={`absolute inset-0 grid place-items-center rounded-full border ${node.tone} ${node.position}`}
                />
                <span
                  className="animate-spin-slow relative grid place-items-center"
                  style={{ animationDuration: node.speed, animationDirection: node.reverse ? 'normal' : 'reverse' }}
                >
                  {node.icon}
                </span>
              </span>
            ))}
          </div>

          {/* Vertical scan sweep */}
          <div className="animate-scan pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-transparent via-accent-primary/10 to-transparent" />

          <div className="absolute inset-x-0 top-0 flex items-center gap-2 px-5 py-4">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="ml-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 [animation:pulse-ring_2s_ease-out_infinite]" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Analysing live
            </span>
          </div>

          {/* Looping conversation */}
          <div className="absolute inset-x-5 top-20 bottom-36 flex flex-col justify-end gap-3 sm:inset-x-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={messageIndex}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 240, damping: 24 }}
                className={`max-w-[85%] rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  currentMessage.role === 'user'
                    ? 'self-end border-blue-100 bg-white/90 text-slate-700'
                    : 'self-start border-white/80 bg-linear-to-br from-white/95 to-blue-50/90 text-slate-700'
                }`}
              >
                {currentMessage.text}
                {currentMessage.chips.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {currentMessage.chips.map((chip) => (
                      <motion.span
                        key={chip}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15 }}
                        className="rounded-full border border-blue-100 bg-white/80 px-2.5 py-1 text-[0.7rem] font-semibold text-accent-primary"
                      >
                        {chip}
                      </motion.span>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex w-fit items-center gap-1.5 self-start rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-sm"
                >
                  {[0, 1, 2].map((dot) => (
                    <motion.span
                      key={dot}
                      className="h-1.5 w-1.5 rounded-full bg-accent-primary/60"
                      animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: dot * 0.15, ease: 'easeInOut' }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/70 bg-white/85 p-4 shadow-lg backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-accent-primary">
                <FileText size={20} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">notice_of_dispute.pdf</p>
                <p className="text-xs text-slate-500">Scanned PDF · OCR complete</p>
              </div>
              <span className="ml-auto rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                Consumer
              </span>
            </div>
            <div className="mt-4 space-y-2.5">
              {[
                { label: 'Sections matched', width: '82%', color: 'bg-accent-primary' },
                { label: 'Evidence strength', width: '64%', color: 'bg-violet-500' },
                { label: 'Missing elements', width: '38%', color: 'bg-amber-400' },
              ].map((row, index) => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 text-xs text-slate-600">{row.label}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200/80">
                    <motion.span
                      className={`block h-full rounded-full ${row.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: row.width }}
                      transition={{ duration: 1, delay: 0.6 + index * 0.15, ease: 'easeOut' }}
                    />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        style={{ left: glowX, top: glowY }}
        className="pointer-events-none absolute -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-primary/25 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, x: -30, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.7, delay: 0.9 }}
        className="animate-float-slow absolute -top-6 -left-4 hidden rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-xl sm:flex sm:items-center sm:gap-3"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <ShieldCheck size={18} />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">Priv-first</p>
          <p className="text-xs text-slate-500">Files stay private</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30, y: -20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.7, delay: 1.1 }}
        className="animate-float-slower absolute -right-2 -bottom-6 hidden rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-xl sm:flex sm:items-center sm:gap-3"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <Gavel size={18} />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">BNS §420</p>
          <p className="text-xs text-slate-500">Cheating detected</p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  const openAuth = (mode) => {
    setIsSignup(mode);
    setIsAuthOpen(true);
  };

  const primaryAction = user ? (
    <Link
      to="/dashboard"
      className="btn-primary group flex items-center justify-center gap-2 px-7 py-3.5 text-base shadow-lg shadow-blue-600/20"
    >
      Open dashboard
      <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
    </Link>
  ) : (
    <motion.button
      type="button"
      onClick={() => openAuth(true)}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="btn-primary group flex items-center justify-center gap-2 px-7 py-3.5 text-base shadow-lg shadow-blue-600/20"
    >
      Get started free
      <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
    </motion.button>
  );

  return (
    <div className="relative w-full overflow-x-clip bg-bg-primary">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="animate-drift-a absolute -top-32 -left-24 h-[30rem] w-[30rem] rounded-full bg-blue-200/45 blur-3xl" />
        <div className="animate-drift-b absolute top-24 -right-32 h-[34rem] w-[34rem] rounded-full bg-violet-200/40 blur-3xl" />
        <div className="animate-float-slower absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-200/35 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(148,163,184,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.18) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(70% 60% at 50% 0%, #000 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(70% 60% at 50% 0%, #000 40%, transparent 100%)',
          }}
        />
      </div>

      {/* Navbar */}
      <motion.header
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl"
      >
        <nav className="mx-auto flex h-18 w-full max-w-(--max-w-app) items-center justify-between px-4 sm:px-6">
          <Link to="/" className="group flex items-center gap-3">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-white shadow-sm transition-transform duration-300 group-hover:scale-105">
              <Scale className="text-accent-primary" size={22} />
              <span className="absolute inset-0 rounded-xl bg-accent-primary/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">JusticeAI</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-accent-primary"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden text-sm font-medium text-slate-600 sm:inline">
                  {user.name?.split(' ')[0]}
                </span>
                <Link to="/dashboard" className="btn-primary px-5 py-2.5 text-sm">
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openAuth(false)}
                  className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => openAuth(true)}
                  className="btn-primary px-5 py-2.5 text-sm shadow-md shadow-blue-600/15"
                >
                  Get started
                </button>
              </>
            )}
          </div>
        </nav>
      </motion.header>

      <main>
        {/* Hero */}
        <section className="relative mx-auto grid max-w-(--max-w-app) items-center gap-14 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:py-28">
          <div className="flex flex-col items-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 py-1.5 pr-4 pl-1.5 text-sm font-medium text-slate-600 shadow-sm"
            >
              <span className="rounded-full bg-accent-primary px-2.5 py-0.5 text-xs font-semibold text-white">
                New
              </span>
              Document intelligence for Indian law
              <span className="animate-caret text-accent-primary">▍</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 text-4xl leading-[1.08] font-bold tracking-tight text-slate-900 text-balance sm:text-5xl lg:text-6xl"
            >
              Move from legal confusion to <span className="text-gradient">clear next steps</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600"
            >
              Upload a notice, agreement or FIR. JusticeAI extracts what matters, checks it against the
              statute that applies, and explains your options in plain language — in seconds.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center"
            >
              {primaryAction}
              <a
                href="#features"
                className="group flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-7 py-3.5 text-base font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                See how it works
                <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 transition-transform duration-300 group-hover:translate-y-0.5">
                  <ArrowRight size={14} className="rotate-90" />
                </span>
              </a>
            </motion.div>

            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500"
            >
              {['No credit card', 'Plain-language answers', 'Built on BNS, IT Act & CPA'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-50 text-accent-primary">
                    <Check size={12} />
                  </span>
                  {item}
                </li>
              ))}
            </motion.ul>
          </div>

          <HeroVisual />
        </section>

        {/* Marquee */}
        <section className="relative border-y border-slate-200/70 bg-white/60 py-6 backdrop-blur">
          <p className="mb-5 text-center text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
            Grounded in
          </p>
          <div className="pause-on-hover relative flex overflow-hidden">
            <div className="flex shrink-0 animate-marquee items-center gap-10 pr-10">
              {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="flex items-center gap-3 text-sm font-medium whitespace-nowrap text-slate-500"
                >
                  <Scale size={16} className="text-accent-primary/70" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="relative mx-auto max-w-(--max-w-app) px-4 py-20 sm:px-6 lg:py-28">
          <SectionHeading
            eyebrow="Capabilities"
            title="Everything you need to understand a legal problem"
            description="Four tools that work together on the documents you already have."
          />

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Reveal key={feature.title} delay={index * 0.08} className={feature.span}>
                  <motion.article
                    whileHover={{ y: -8 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="surface-card group relative h-full overflow-hidden p-8"
                  >
                    <div
                      className={`pointer-events-none absolute -top-24 -right-16 h-48 w-48 rounded-full bg-linear-to-br ${feature.accent} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20`}
                    />
                    <div className="relative">
                      <span
                        className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${feature.tint} transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}
                      >
                        <Icon size={24} />
                      </span>
                      <h3 className="mt-6 text-xl font-semibold tracking-tight text-slate-900">{feature.title}</h3>
                      <p className="mt-3 leading-relaxed text-slate-600">{feature.body}</p>
                      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-primary opacity-0 transition-all duration-300 group-hover:opacity-100">
                        Learn more
                        <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </motion.article>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="relative overflow-hidden bg-white/70 py-20 backdrop-blur lg:py-28">
          <div className="animate-drift-b pointer-events-none absolute -top-20 right-0 h-96 w-96 rounded-full bg-blue-100/70 blur-3xl" />
          <div className="relative mx-auto max-w-(--max-w-app) px-4 sm:px-6">
            <SectionHeading
              eyebrow="Workflow"
              title="Three steps, no legal jargon"
              description="From a scanned notice to an actionable plan, the whole flow stays in your browser."
            />

            <div className="relative mt-16 grid gap-10 md:grid-cols-3">
              <div className="absolute top-12 right-[16%] left-[16%] hidden h-px bg-linear-to-r from-transparent via-blue-200 to-transparent md:block" />
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <Reveal key={step.title} delay={index * 0.15} className="relative">
                    <div className="flex flex-col items-center text-center">
                      <motion.span
                        whileHover={{ scale: 1.1, rotate: 6 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                        className="surface-card relative z-10 grid h-24 w-24 place-items-center rounded-3xl text-accent-primary"
                      >
                        <Icon size={30} />
                        <span className="absolute -top-2 -right-2 grid h-7 w-7 place-items-center rounded-full bg-accent-primary text-xs font-bold text-white shadow-md">
                          {index + 1}
                        </span>
                      </motion.span>
                      <h3 className="mt-6 text-lg font-semibold tracking-tight text-slate-900">{step.title}</h3>
                      <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-600">{step.body}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="relative mx-auto max-w-(--max-w-app) px-4 py-20 sm:px-6 lg:py-24">
          <div className="surface-card overflow-hidden p-8 sm:p-12">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {STATS.map((stat, index) => (
                <Reveal key={stat.label} delay={index * 0.08} className="text-center">
                  <p className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                    <span className="text-gradient">
                      <CountUp to={stat.value} suffix={stat.suffix} />
                    </span>
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-600">{stat.label}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Knowledge base */}
        <section id="knowledge" className="relative bg-white/70 py-20 backdrop-blur lg:py-28">
          <div className="mx-auto max-w-(--max-w-app) px-4 sm:px-6">
            <SectionHeading
              eyebrow="Knowledge base"
              title="Built on the statutes Indians actually argue about"
              description="Every answer traces back to a specific act, so you can always verify the source yourself."
            />

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {KNOWLEDGE.map((item, index) => (
                <Reveal key={item.title} delay={index * 0.06}>
                  <motion.div
                    whileHover={{ y: -6 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                    className="surface-card group flex h-full items-start gap-4 p-6"
                  >
                    <span
                      className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.tone} transition-transform duration-300 group-hover:scale-110`}
                    >
                      <Scale size={18} />
                    </span>
                    <div>
                      <h3 className="font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.detail}</p>
                    </div>
                  </motion.div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.2} className="mt-12">
              <div className="surface-card flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center sm:p-10">
                <Quote size={32} className="shrink-0 text-accent-primary/40" />
                <p className="flex-1 text-lg leading-relaxed font-medium text-slate-700 text-balance">
                  JusticeAI is an informational tool, not a substitute for an advocate. Use it to understand your
                  situation faster — then talk to a qualified lawyer before you act.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* CTA */}
        <section className="relative mx-auto max-w-(--max-w-app) px-4 py-20 sm:px-6 lg:py-28">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-linear-to-br from-blue-50 via-white to-violet-50 px-6 py-14 text-center sm:px-14">
              <div className="animate-spin-slow pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full border border-blue-200/60" />
              <div className="animate-drift-a pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-blue-200/40 blur-3xl" />

              <div className="relative">
                <h2 className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Know where you stand before you walk into court
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
                  Create a free account and turn your next legal question into a clear plan of action.
                </p>
                <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  {primaryAction}
                  <Link
                    to="/chat"
                    className="flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    Try the assistant
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/70 bg-white/70 py-12 backdrop-blur">
        <div className="mx-auto flex max-w-(--max-w-app) flex-col items-center gap-6 px-4 sm:px-6 md:flex-row md:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-blue-200 bg-white shadow-sm">
              <Scale className="text-accent-primary" size={22} />
            </span>
            <div>
              <p className="font-bold tracking-tight text-slate-900">JusticeAI</p>
              <p className="text-sm text-slate-500">AI-powered legal assistance for Indian law.</p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-600">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="transition-colors hover:text-accent-primary">
                {link.label}
              </a>
            ))}
            <Link to="/login" className="transition-colors hover:text-accent-primary">
              Log in
            </Link>
          </nav>
        </div>

        <p className="mx-auto mt-8 max-w-3xl px-4 text-center text-xs leading-relaxed text-slate-400 sm:px-6">
          JusticeAI provides general information, not legal advice. It does not create a lawyer-client
          relationship. Always consult a qualified advocate for formal legal matters.
        </p>
      </footer>

      <AuthModal
        open={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        isSignup={isSignup}
        onToggleMode={() => setIsSignup((current) => !current)}
      />
    </div>
  );
}
