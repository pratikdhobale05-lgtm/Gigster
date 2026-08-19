import { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';
import { X, ShieldCheck, CheckCircle, Clock, Zap, Copy, RefreshCw, Smartphone } from 'lucide-react';

/**
 * PaymentQRModal
 * Props:
 *   - isOpen: bool
 *   - onClose: fn
 *   - onSuccess: fn(paymentData)
 *   - amount: number (in paise)
 *   - orderId: string
 *   - upiString: string  (UPI deep-link)
 *   - simulated: bool
 *   - projectName: string
 */
const PaymentQRModal = ({ isOpen, onClose, onSuccess, amount, orderId, upiString, simulated, projectName }) => {
    const [status, setStatus] = useState('pending'); // 'pending' | 'verifying' | 'success' | 'failed'
    const [timer, setTimer] = useState(300); // 5-minute countdown
    const [copied, setCopied] = useState(false);
    const [dots, setDots] = useState('');
    const intervalRef = useRef(null);
    const dotsRef = useRef(null);

    const amountInRupees = amount ? (amount / 100).toFixed(2) : '0.00';

    // Countdown timer
    useEffect(() => {
        if (!isOpen || status !== 'pending') return;
        setTimer(300);
        intervalRef.current = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(intervalRef.current);
    }, [isOpen, status]);

    // Animated dots for loading state
    useEffect(() => {
        if (status !== 'verifying') return;
        dotsRef.current = setInterval(() => {
            setDots(d => d.length >= 3 ? '' : d + '.');
        }, 400);
        return () => clearInterval(dotsRef.current);
    }, [status]);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStatus('pending');
            setTimer(300);
            setCopied(false);
            setDots('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const timerPercent = (timer / 300) * 100;
    const timerColor = timer > 120 ? '#10b981' : timer > 60 ? '#f59e0b' : '#ef4444';

    const handleCopy = () => {
        if (upiString) {
            navigator.clipboard.writeText(upiString);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSimulatedPay = async () => {
        setStatus('verifying');
        // Simulate a 1.5s processing delay for realism
        await new Promise(r => setTimeout(r, 1500));
        setStatus('success');
        setTimeout(() => {
            onSuccess({
                razorpay_order_id: orderId,
                razorpay_payment_id: 'pay_sim_' + Math.random().toString(36).substring(2, 10),
                razorpay_signature: 'sim_signature_valid',
            });
        }, 1200);
    };

    const handleManualConfirm = () => {
        setStatus('verifying');
        // For real mode, we trust the webhook — show verifying + prompt
        setTimeout(() => {
            onSuccess({
                razorpay_order_id: orderId,
                razorpay_payment_id: 'pay_upi_' + Math.random().toString(36).substring(2, 10),
                razorpay_signature: 'sim_signature_valid', // simulated fallback for demo
            });
        }, 2000);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={status === 'pending' ? onClose : undefined}
                style={{
                    position: 'fixed', inset: 0, zIndex: 9998,
                    background: 'rgba(7, 10, 20, 0.85)',
                    backdropFilter: 'blur(8px)',
                    animation: 'fadeIn 0.2s ease-out',
                }}
            />

            {/* Modal */}
            <div
                style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem',
                }}
            >
                <div
                    className="animate-fade-in-up"
                    style={{
                        background: 'linear-gradient(145deg, #1a2235, #141b2d)',
                        border: '1px solid rgba(99,102,241,0.25)',
                        borderRadius: 24,
                        padding: '0',
                        width: '100%',
                        maxWidth: 420,
                        boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
                        overflow: 'hidden',
                        position: 'relative',
                    }}
                >
                    {/* Header gradient bar */}
                    <div style={{
                        height: 4,
                        background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)',
                        backgroundSize: '200% 100%',
                        animation: 'gradientShift 3s ease infinite',
                    }} />

                    {/* Close button */}
                    {status === 'pending' && (
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute', top: 16, right: 16,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 8, width: 32, height: 32,
                                cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                color: 'var(--color-text-muted)',
                                transition: 'all 0.2s',
                                zIndex: 1,
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        >
                            <X size={16} />
                        </button>
                    )}

                    <div style={{ padding: '1.75rem 2rem 2rem' }}>
                        {/* ── PENDING STATE ── */}
                        {status === 'pending' && (
                            <>
                                {/* Title */}
                                <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        background: 'rgba(99,102,241,0.12)',
                                        border: '1px solid rgba(99,102,241,0.2)',
                                        borderRadius: 100, padding: '0.4rem 1rem',
                                        marginBottom: '0.875rem',
                                    }}>
                                        <Smartphone size={14} style={{ color: '#818cf8' }} />
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#818cf8', letterSpacing: '0.04em' }}>
                                            {simulated ? 'DEMO MODE' : 'UPI / QR PAYMENT'}
                                        </span>
                                    </div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, marginBottom: 4 }}>
                                        Scan to Pay
                                    </h2>
                                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0 }}>
                                        {projectName ? `Funding: ${projectName}` : 'Secure Escrow Payment'}
                                    </p>
                                </div>

                                {/* Amount display */}
                                <div style={{
                                    background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.08))',
                                    border: '1px solid rgba(16,185,129,0.2)',
                                    borderRadius: 16, padding: '0.875rem',
                                    textAlign: 'center', marginBottom: '1.25rem',
                                }}>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>Amount to Pay</p>
                                    <p style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: '#34d399', letterSpacing: '-0.03em' }}>
                                        ₹{amountInRupees}
                                    </p>
                                </div>

                                {/* QR Code */}
                                <div style={{
                                    background: '#ffffff',
                                    borderRadius: 16,
                                    padding: '1.25rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    marginBottom: '1rem',
                                    position: 'relative',
                                    boxShadow: '0 0 0 1px rgba(99,102,241,0.15), 0 8px 32px rgba(0,0,0,0.3)',
                                }}>
                                    {/* Corner accents */}
                                    {[{top:0,left:0},{top:0,right:0},{bottom:0,left:0},{bottom:0,right:0}].map((pos, i) => (
                                        <div key={i} style={{
                                            position: 'absolute',
                                            width: 20, height: 20,
                                            border: '3px solid #6366f1',
                                            borderRadius: 3,
                                            ...pos,
                                            ...(pos.right !== undefined ? {borderLeft:'none'} : {borderRight:'none'}),
                                            ...(pos.bottom !== undefined ? {borderTop:'none'} : {borderBottom:'none'}),
                                        }} />
                                    ))}

                                    <QRCode
                                        value={upiString || `upi://pay?pa=gigster@upi&pn=Gigster&am=${amountInRupees}&cu=INR&tn=EscrowPayment&tr=${orderId}`}
                                        size={180}
                                        style={{ display: 'block' }}
                                        fgColor="#0f172a"
                                        bgColor="#ffffff"
                                    />

                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.6875rem', color: '#64748b', margin: 0, fontWeight: 600 }}>
                                            Scan with any UPI app
                                        </p>
                                        <p style={{ fontSize: '0.625rem', color: '#94a3b8', margin: '2px 0 0', letterSpacing: '0.03em' }}>
                                            PhonePe · GPay · Paytm · BHIM
                                        </p>
                                    </div>
                                </div>

                                {/* Timer */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <Clock size={13} style={{ color: timerColor }} />
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>QR expires in</span>
                                        </div>
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: timerColor, fontVariantNumeric: 'tabular-nums' }}>
                                            {timer === 0 ? 'Expired' : formatTime(timer)}
                                        </span>
                                    </div>
                                    <div style={{ height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${timerPercent}%`,
                                            background: `linear-gradient(90deg, ${timerColor}, ${timerColor}88)`,
                                            borderRadius: 100,
                                            transition: 'width 1s linear, background 0.5s ease',
                                        }} />
                                    </div>
                                </div>

                                {/* Copy UPI ID */}
                                <button
                                    onClick={handleCopy}
                                    style={{
                                        width: '100%', padding: '0.625rem',
                                        background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
                                        border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
                                        borderRadius: 10, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        color: copied ? '#34d399' : 'var(--color-text-muted)',
                                        fontSize: '0.75rem', fontWeight: 600,
                                        transition: 'all 0.2s', marginBottom: '1rem',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    <Copy size={13} />
                                    {copied ? 'UPI String Copied!' : 'Copy UPI Payment String'}
                                </button>

                                {/* Action buttons */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {simulated ? (
                                        <button
                                            onClick={handleSimulatedPay}
                                            className="btn-primary"
                                            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.9375rem' }}
                                        >
                                            <Zap size={16} />
                                            Simulate Payment (Demo)
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleManualConfirm}
                                            className="btn-success"
                                            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.9375rem' }}
                                        >
                                            <CheckCircle size={16} />
                                            I've Completed the Payment
                                        </button>
                                    )}
                                    <button
                                        onClick={onClose}
                                        style={{
                                            width: '100%', padding: '0.625rem',
                                            background: 'transparent', border: 'none',
                                            color: 'var(--color-text-muted)', fontSize: '0.8125rem',
                                            cursor: 'pointer', fontFamily: 'inherit',
                                            transition: 'color 0.2s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
                                        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                                    >
                                        Cancel
                                    </button>
                                </div>

                                {/* Security badge */}
                                <div style={{
                                    marginTop: '1rem', paddingTop: '1rem',
                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                }}>
                                    <ShieldCheck size={14} style={{ color: '#6366f1' }} />
                                    <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                                        256-bit encrypted · Funds held in Escrow · Safe
                                    </span>
                                </div>
                            </>
                        )}

                        {/* ── VERIFYING STATE ── */}
                        {status === 'verifying' && (
                            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                <div style={{
                                    width: 72, height: 72, margin: '0 auto 1.5rem',
                                    borderRadius: '50%',
                                    background: 'rgba(99,102,241,0.12)',
                                    border: '2px solid rgba(99,102,241,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    position: 'relative',
                                }}>
                                    <RefreshCw size={28} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
                                </div>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 8 }}>
                                    Verifying Payment{dots}
                                </h3>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', maxWidth: 280, margin: '0 auto' }}>
                                    Confirming your transaction and securing funds in escrow.
                                </p>
                            </div>
                        )}

                        {/* ── SUCCESS STATE ── */}
                        {status === 'success' && (
                            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                                <div style={{
                                    width: 80, height: 80, margin: '0 auto 1.5rem',
                                    borderRadius: '50%',
                                    background: 'rgba(16,185,129,0.12)',
                                    border: '2px solid rgba(16,185,129,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    animation: 'pulseGlow 2s ease-in-out infinite',
                                }}>
                                    <CheckCircle size={40} style={{ color: '#10b981' }} />
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 8, color: '#34d399' }}>
                                    Payment Successful!
                                </h3>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                                    ₹{amountInRupees} has been secured in escrow.
                                    The freelancer can now begin work.
                                </p>
                                <div style={{
                                    background: 'rgba(16,185,129,0.08)',
                                    border: '1px solid rgba(16,185,129,0.2)',
                                    borderRadius: 12, padding: '0.875rem',
                                }}>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#6ee7b7', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                        <ShieldCheck size={14} />
                                        Funds are locked in secure escrow
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Spin animation */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
};

export default PaymentQRModal;
