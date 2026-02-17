import React, { useState } from 'react';
import { Shield, Lock } from 'lucide-react';
import { authService } from '../services/authService';

interface AuthScreenProps {
    mode: 'login' | 'signup';
    onBack: () => void;
    onSuccess: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ mode, onBack, onSuccess }) => {
    const [step, setStep] = useState<'form' | 'otp'>('form');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [dob, setDob] = useState('');
    const [gender, setGender] = useState('');
    const [otp, setOtp] = useState(''); // Keep otp state as it's used in the OTP screen
    const [loading, setLoading] = useState(false);

    // ... (inside component)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (mode === 'signup') {
            const { error } = await authService.signUp(email, password, fullName, dob, gender);
            setLoading(false);
            if (error) {
                alert(error.message);
            } else {
                setStep('otp');
            }
        } else {
            const { error } = await authService.signIn(email, password);
            setLoading(false);
            if (error) {
                alert(error.message);
            } else {
                onSuccess();
            }
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await authService.verifyOtp(email, otp);
        setLoading(false);

        if (error) {
            alert(error.message);
        } else {
            onSuccess();
        }
    }

    // OTP Verification Screen
    if (step === 'otp') {
        return (
            <div className="w-full h-full relative overflow-hidden bg-[#91D7FF] flex flex-col items-center justify-center font-sans select-none">
                {/* Background Clouds */}
                <div className="absolute top-12 left-8 w-24 h-10 bg-white rounded-full"></div>
                <div className="absolute top-24 right-[-20px] w-32 h-12 bg-white rounded-full"></div>

                <div className="z-10 bg-white/90 backdrop-blur-sm border-4 border-[#4A5568] rounded-[2rem] p-8 w-[85%] max-w-sm shadow-xl text-center">
                    <div className="w-16 h-16 bg-[#F6E05E] rounded-full border-4 border-[#744210] flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <span className="text-2xl">🔒</span>
                    </div>
                    <h2 className="text-xl font-bold text-[#2D3748] mb-2">Verify Email</h2>
                    <p className="text-sm text-[#4A5568] mb-6">
                        Enter the OTP sent to <br /> <span className="font-bold text-[#2B6CB0]">{email}</span>
                    </p>

                    <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
                        <input
                            type="text"
                            required
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full bg-white rounded-xl border-2 border-[#CBD5E0] p-4 text-center text-2xl tracking-[0.5em] font-bold text-[#2D3748] focus:border-[#4299E1] outline-none"
                            placeholder="000000"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 bg-[#4299E1] hover:bg-[#3182CE] text-white p-3.5 rounded-xl font-bold shadow-md active:scale-95 transition-all text-sm w-full"
                        >
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep('form')}
                            className="text-xs font-bold text-[#718096] hover:text-[#4A5568] mt-2"
                        >
                            Wrong email? Go Back
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative overflow-hidden bg-[#91D7FF] flex flex-col items-center justify-center font-sans select-none">

            {/* Background Elements */}
            <div className="absolute top-12 left-8 w-24 h-10 bg-white rounded-full"></div>
            <div className="absolute top-24 right-[-20px] w-32 h-12 bg-white rounded-full"></div>

            {mode === 'login' && (
                <div className="z-10 flex flex-col items-center mb-6">
                    <div className="w-20 h-20 bg-[#4299E1] rounded-2xl border-4 border-[#2B6CB0] flex items-center justify-center shadow-lg mb-2 relative overflow-hidden transform rotate-[-5deg]">
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-4 border-4 border-[#2B6CB0] rounded-t-lg"></div>
                        <div className="relative z-10 w-10 h-10 flex items-center justify-center">
                            <div className="absolute w-3 h-10 bg-white rounded-sm"></div>
                            <div className="absolute w-10 h-3 bg-white rounded-sm"></div>
                        </div>
                        <div className="absolute top-2 left-2 w-4 h-4 bg-white opacity-20 rounded-full"></div>
                    </div>
                    <h1 className="text-3xl font-bold text-[#2D3748] tracking-tight">MedLinkAI</h1>
                </div>
            )}

            {mode === 'signup' && (
                <h1 className="text-2xl font-black text-[#2D3748] mb-4 z-10 tracking-tight">MedLinkAI</h1>
            )}

            {/* Auth Card */}
            <div className={`z-20 bg-[rgba(255,255,255,0.4)] backdrop-blur-sm border-4 border-[#4A5568] rounded-[2rem] p-6 w-[90%] max-w-sm shadow-xl relative ${mode === 'signup' ? 'my-0 max-h-[85vh] overflow-y-auto' : ''}`}>

                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                    {/* Emoji Face */}
                    <div className="w-12 h-12 bg-[#F6E05E] rounded-full border-4 border-[#744210] flex items-center justify-center shadow-sm shrink-0">
                        <div className="flex gap-2">
                            <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                            <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                        </div>
                        <div className="absolute mt-3 w-4 h-1 bg-black rounded-full"></div>
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-[#2D3748] leading-tight">
                            {mode === 'login' ? 'Welcome back!' : 'Start Your Journey!'}
                        </h2>
                        <p className="text-xs text-[#4A5568] opacity-80">
                            {mode === 'login' ? 'Please log in to continue.' : 'A new hero approaches...'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">

                    {mode === 'signup' && (
                        <>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-[#4A5568] ml-1 uppercase">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full bg-white rounded-xl border-none p-2.5 text-base text-[#2D3748] placeholder-[#A0AEC0] shadow-sm focus:ring-2 focus:ring-[#4299E1] outline-none font-medium"
                                    placeholder="Your hero name"
                                />
                            </div>

                            <div className="flex gap-2">
                                <div className="space-y-1 flex-1">
                                    <label className="text-xs font-bold text-[#4A5568] ml-1 uppercase">Date of Birth</label>
                                    <input
                                        type="date"
                                        required
                                        value={dob}
                                        onChange={(e) => setDob(e.target.value)}
                                        className="w-full bg-white rounded-xl border-none p-2.5 text-base text-[#2D3748] placeholder-[#A0AEC0] shadow-sm focus:ring-2 focus:ring-[#4299E1] outline-none font-medium"
                                    />
                                </div>
                                <div className="space-y-1 flex-1">
                                    <label className="text-xs font-bold text-[#4A5568] ml-1 uppercase">Gender</label>
                                    <select
                                        required
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        className="w-full bg-white rounded-xl border-none p-2.5 text-base text-[#2D3748] shadow-sm focus:ring-2 focus:ring-[#4299E1] outline-none font-medium appearance-none"
                                    >
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="space-y-1">
                        <label className={`text-${mode === 'signup' ? 'xs' : 'sm'} font-bold text-[#4A5568] ml-1 uppercase`}>
                            {mode === 'signup' ? 'Email Address' : 'Email'}
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white rounded-xl border-none p-3 text-base text-[#2D3748] placeholder-[#A0AEC0] shadow-sm focus:ring-2 focus:ring-[#4299E1] outline-none font-medium"
                            placeholder={mode === 'login' ? "hero@example.com" : "enter email"}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className={`text-${mode === 'signup' ? 'xs' : 'sm'} font-bold text-[#4A5568] ml-1 uppercase`}>
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white rounded-xl border-none p-3 text-base text-[#2D3748] placeholder-[#A0AEC0] shadow-sm focus:ring-2 focus:ring-[#4299E1] outline-none font-medium tracking-widest"
                            placeholder={mode === 'signup' ? "Your secret phrase" : "••••••••"}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 bg-[#4299E1] hover:bg-[#3182CE] text-white p-3.5 rounded-xl font-bold shadow-md active:scale-95 transition-all text-sm"
                    >
                        {loading ? 'Processing...' : (mode === 'login' ? 'Login' : 'Create Account')}
                    </button>

                    {mode === 'login' && (
                        <div className="text-center">
                            <button type="button" className="text-xs font-semibold text-[#718096] hover:text-[#4A5568]">
                                Forgot Secret Phrase?
                            </button>
                        </div>
                    )}
                </form>
            </div>

            {/* Footer / Switch Mode */}
            <div className="z-20 mt-4 text-center pb-8">
                <p className="text-sm text-[#2D3748] font-semibold">
                    {mode === 'login' ? "Don't have an account?" : "Already a hero?"}
                    <button
                        onClick={onBack}
                        className="ml-1 text-[#4299E1] font-bold hover:underline"
                    >
                        <span className="cursor-pointer">{mode === 'login' ? 'Sign Up' : 'Log In'}</span>
                    </button>
                </p>
            </div>

            {/* Hills Background */}
            <div className="absolute bottom-[-50px] w-[120%] h-[30vh] bg-[#68D391] rounded-[100%] z-0"></div>
            <div className="absolute bottom-[-80px] left-[-20%] w-[120%] h-[35vh] bg-[#48BB78] rounded-[100%] z-0"></div>

        </div>
    );
};

export default AuthScreen;
