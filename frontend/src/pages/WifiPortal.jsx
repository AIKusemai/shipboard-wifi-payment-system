import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Wifi,
    Timer,
    Database,
    CheckCircle,
    XCircle,
    CreditCard,
    RefreshCw,
    ShieldCheck,
    AlertTriangle,
    X
} from 'lucide-react';

const API_BASE = 'http://localhost:8080';

function WifiPortal() {
    const [plans, setPlans] = useState([]);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [message, setMessage] = useState('');
    const [selectedPlan, setSelectedPlan] = useState(null);

    const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111');
    const [expiry, setExpiry] = useState('12/30');
    const [cvv, setCvv] = useState('123');

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const reason = searchParams.get('reason');

    const token =
        localStorage.getItem('jwt_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('authToken');

    const config = useMemo(() => ({
        headers: {
            Authorization: `Bearer ${token}`
        }
    }), [token]);

    const loadPortal = async () => {
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const [plansRes, statusRes] = await Promise.all([
                axios.get(`${API_BASE}/api/wifi/plans`, config),
                axios.get(`${API_BASE}/api/wifi/status`, config)
            ]);

            setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);

            if (!statusRes.data || statusRes.data.status === 'NO_SESSION') {
                setSession(null);
            } else {
                setSession(statusRes.data);
            }
        } catch (err) {
            console.error('Wi-Fi portal load failed:', err);

            const status = err.response?.status;
            const backendMessage = err.response?.data?.message || err.response?.data;

            if (status === 401 || status === 403) {
                setMessage('Failed to load Wi-Fi portal. Login token is missing or expired. Please login again.');
            } else if (status) {
                setMessage(`Failed to load Wi-Fi portal. Backend returned HTTP ${status}. ${backendMessage || ''}`);
            } else {
                setMessage('Failed to load Wi-Fi portal. Please check whether the backend is running on port 8080.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPortal();
    }, []);

    const openPaymentModal = (plan) => {
        setSelectedPlan(plan);
        setMessage('');
    };

    const closePaymentModal = () => {
        if (paying) {
            return;
        }

        setSelectedPlan(null);
    };

    const purchasePlan = async () => {
        if (!selectedPlan) {
            return;
        }

        if (!cardNumber.trim() || !expiry.trim() || !cvv.trim()) {
            setMessage('Please complete the simulated payment information.');
            return;
        }

        setPaying(true);
        setMessage('Processing simulated payment...');

        setTimeout(async () => {
            try {
                const res = await axios.post(
                    `${API_BASE}/api/wifi/purchase`,
                    { planId: selectedPlan.id },
                    config
                );

                setSession(res.data);
                setMessage('Payment successful. Wi-Fi access activated.');
                setSelectedPlan(null);

                navigate('/internet');
            } catch (err) {
                console.error('Wi-Fi purchase failed:', err);

                const status = err.response?.status;
                if (status === 401 || status === 403) {
                    setMessage('Payment failed. Please login again.');
                } else {
                    setMessage('Payment failed. Please try again.');
                }
            } finally {
                setPaying(false);
            }
        }, 900);
    };

    const getRemainingMinutes = () => {
        if (!session?.endTime) {
            return 0;
        }

        const diffMs = new Date(session.endTime).getTime() - Date.now();
        return Math.max(0, Math.ceil(diffMs / 60000));
    };

    const getRemainingData = () => {
        if (!session) {
            return 0;
        }

        return Math.max(0, session.dataLimitMb - session.usedDataMb);
    };

    const usagePercent = session && session.dataLimitMb > 0
        ? Math.min(100, Math.round((session.usedDataMb / session.dataLimitMb) * 100))
        : 0;

    const formatDateTime = (value) => {
        if (!value) {
            return '-';
        }

        return new Date(value).toLocaleString();
    };

    const getReasonText = () => {
        if (reason === 'unauthorized') {
            return 'Please purchase a Wi-Fi package before accessing the internet.';
        }

        if (reason === 'expired') {
            return 'Your Wi-Fi package has expired. Please purchase another package.';
        }

        if (reason === 'disconnected') {
            return 'Your Wi-Fi access has been disconnected because the package expired, data limit was reached, or an administrator disconnected it.';
        }

        return '';
    };

    const reasonText = getReasonText();

    if (loading) {
        return (
            <div style={pageWrapper}>
                <div style={centerBox}>
                    <RefreshCw size={28} />
                    <p>Loading shipboard Wi-Fi portal...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={pageWrapper}>
            <section style={heroSection}>
                <div>
                    <div style={heroBadge}>
                        <Wifi size={16} />
                        SHIPBOARD WI-FI PORTAL
                    </div>

                    <h1 style={heroTitle}>Passenger Internet Access</h1>

                    <p style={heroText}>
                        Choose a Wi-Fi package, complete simulated payment, and activate temporary onboard internet access.
                    </p>
                </div>
            </section>

            {reasonText && (
                <div style={disconnectAlert}>
                    <AlertTriangle size={22} />
                    <div>
                        <strong>Wi-Fi Access Notice</strong>
                        <p>{reasonText}</p>
                    </div>
                </div>
            )}

            {message && <div style={messageBox}>{message}</div>}

            {session && (
                <section style={statusCard}>
                    <div style={statusHeader}>
                        <div>
                            <p style={smallLabel}>Current Access Status</p>
                            <h2 style={statusTitle}>{session.status}</h2>
                        </div>

                        {session.status === 'ACTIVE' ? (
                            <CheckCircle size={38} color="#198754" />
                        ) : (
                            <XCircle size={38} color="#dc3545" />
                        )}
                    </div>

                    <div style={statsGrid}>
                        <div style={miniStat}>
                            <Timer size={20} />
                            <span style={smallLabel}>Remaining Time</span>
                            <strong>{getRemainingMinutes()} min</strong>
                        </div>

                        <div style={miniStat}>
                            <Database size={20} />
                            <span style={smallLabel}>Remaining Data</span>
                            <strong>{getRemainingData()} MB</strong>
                        </div>

                        <div style={miniStat}>
                            <ShieldCheck size={20} />
                            <span style={smallLabel}>Access Token</span>
                            <strong style={tokenText}>{session.accessToken}</strong>
                        </div>
                    </div>

                    <div style={progressOuter}>
                        <div style={{ ...progressInner, width: `${usagePercent}%` }} />
                    </div>

                    <p style={statusMeta}>
                        Package: {session.plan?.name || '-'} · Used: {session.usedDataMb}MB / {session.dataLimitMb}MB · Expires: {formatDateTime(session.endTime)}
                    </p>

                    {session.status === 'ACTIVE' && (
                        <button style={continueBtn} onClick={() => navigate('/internet')}>
                            Continue to Internet
                        </button>
                    )}
                </section>
            )}

            <section style={plansSection}>
                <div style={sectionHeader}>
                    <h2 style={sectionTitle}>Choose Internet Package</h2>
                    <p style={sectionSub}>
                        This payment is simulated for project demonstration. No real payment gateway is used.
                    </p>
                </div>

                <div style={planGrid}>
                    {plans.map(plan => (
                        <div key={plan.id} style={planCard}>
                            <div style={planTopRow}>
                                <span style={planBadge}>Wi-Fi Plan</span>
                                <strong style={price}>₹{plan.price}</strong>
                            </div>

                            <h3 style={planName}>{plan.name}</h3>
                            <p style={planDescription}>{plan.description}</p>

                            <div style={planDetails}>
                                <span>
                                    <Timer size={15} />
                                    {plan.durationMinutes} min
                                </span>

                                <span>
                                    <Database size={15} />
                                    {plan.dataLimitMb} MB
                                </span>
                            </div>

                            <button
                                style={buyBtn}
                                disabled={paying}
                                onClick={() => openPaymentModal(plan)}
                            >
                                <CreditCard size={17} />
                                Select Package
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {selectedPlan && (
                <div style={modalOverlay}>
                    <div style={paymentModal}>
                        <button style={modalCloseBtn} onClick={closePaymentModal}>
                            <X size={20} />
                        </button>

                        <div style={modalIcon}>
                            <CreditCard size={30} color="#6f42c1" />
                        </div>

                        <h2 style={modalTitle}>Simulated Payment</h2>

                        <p style={modalSub}>
                            Complete mock payment to activate your shipboard Wi-Fi access.
                        </p>

                        <div style={summaryBox}>
                            <div>
                                <span style={smallLabel}>Selected Plan</span>
                                <strong>{selectedPlan.name}</strong>
                            </div>

                            <div>
                                <span style={smallLabel}>Price</span>
                                <strong>₹{selectedPlan.price}</strong>
                            </div>

                            <div>
                                <span style={smallLabel}>Duration</span>
                                <strong>{selectedPlan.durationMinutes} min</strong>
                            </div>

                            <div>
                                <span style={smallLabel}>Data Limit</span>
                                <strong>{selectedPlan.dataLimitMb} MB</strong>
                            </div>
                        </div>

                        <label style={inputLabel}>Card Number</label>
                        <input
                            style={input}
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="4111 1111 1111 1111"
                        />

                        <div style={inputRow}>
                            <div>
                                <label style={inputLabel}>Expiry</label>
                                <input
                                    style={input}
                                    value={expiry}
                                    onChange={(e) => setExpiry(e.target.value)}
                                    placeholder="12/30"
                                />
                            </div>

                            <div>
                                <label style={inputLabel}>CVV</label>
                                <input
                                    style={input}
                                    value={cvv}
                                    onChange={(e) => setCvv(e.target.value)}
                                    placeholder="123"
                                />
                            </div>
                        </div>

                        <button
                            style={payNowBtn}
                            disabled={paying}
                            onClick={purchasePlan}
                        >
                            <CreditCard size={18} />
                            {paying ? 'Processing...' : `Pay ₹${selectedPlan.price} Now`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const pageWrapper = {
    minHeight: '100vh',
    background: '#f6f8fb',
    padding: '40px 20px',
    fontFamily: 'Inter, sans-serif'
};

const heroSection = {
    maxWidth: '1100px',
    margin: '0 auto 24px',
    padding: '42px',
    borderRadius: '28px',
    background: 'linear-gradient(135deg, #161B33, #6f42c1)',
    color: '#fff'
};

const heroBadge = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255,255,255,0.16)',
    padding: '8px 14px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 900,
    letterSpacing: '1px'
};

const heroTitle = {
    fontSize: '42px',
    margin: '18px 0 10px',
    fontWeight: 900
};

const heroText = {
    maxWidth: '680px',
    lineHeight: 1.7,
    opacity: 0.92
};

const disconnectAlert = {
    maxWidth: '1100px',
    margin: '0 auto 20px',
    padding: '18px 20px',
    borderRadius: '16px',
    background: '#fff3cd',
    color: '#664d03',
    border: '1px solid #ffec99',
    display: 'flex',
    gap: '14px',
    alignItems: 'flex-start'
};

const messageBox = {
    maxWidth: '1100px',
    margin: '0 auto 20px',
    padding: '14px 18px',
    borderRadius: '14px',
    background: '#e7f1ff',
    color: '#084298',
    fontWeight: 700,
    border: '1px solid #b6d4fe'
};

const statusCard = {
    maxWidth: '1100px',
    margin: '0 auto 28px',
    padding: '28px',
    borderRadius: '24px',
    background: '#fff',
    border: '1px solid #e9ecef',
    boxShadow: '0 10px 28px rgba(0,0,0,0.04)'
};

const statusHeader = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '22px'
};

const smallLabel = {
    fontSize: '12px',
    color: '#777',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'block',
    marginBottom: '4px'
};

const statusTitle = {
    margin: 0,
    fontSize: '30px',
    fontWeight: 900
};

const statsGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: '16px'
};

const miniStat = {
    padding: '18px',
    borderRadius: '18px',
    background: '#f8f5ff',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
};

const tokenText = {
    fontSize: '13px',
    wordBreak: 'break-all'
};

const progressOuter = {
    marginTop: '20px',
    width: '100%',
    height: '10px',
    borderRadius: '999px',
    background: '#edf0f5',
    overflow: 'hidden'
};

const progressInner = {
    height: '100%',
    background: '#6f42c1',
    borderRadius: '999px',
    transition: 'width 0.3s ease'
};

const statusMeta = {
    marginTop: '14px',
    color: '#666',
    fontSize: '14px'
};

const continueBtn = {
    marginTop: '16px',
    padding: '12px 18px',
    border: 'none',
    borderRadius: '14px',
    background: '#198754',
    color: '#fff',
    fontWeight: 900,
    cursor: 'pointer'
};

const plansSection = {
    maxWidth: '1100px',
    margin: '0 auto'
};

const sectionHeader = {
    marginBottom: '22px'
};

const sectionTitle = {
    margin: 0,
    fontSize: '28px',
    fontWeight: 900
};

const sectionSub = {
    color: '#666',
    marginTop: '8px'
};

const planGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '22px'
};

const planCard = {
    background: '#fff',
    padding: '24px',
    borderRadius: '22px',
    border: '1px solid #e9ecef',
    boxShadow: '0 8px 22px rgba(0,0,0,0.035)'
};

const planTopRow = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
};

const planBadge = {
    padding: '6px 10px',
    borderRadius: '999px',
    background: '#f1e8ff',
    color: '#6f42c1',
    fontSize: '12px',
    fontWeight: 900
};

const price = {
    fontSize: '24px',
    fontWeight: 900
};

const planName = {
    fontSize: '21px',
    margin: '20px 0 8px',
    fontWeight: 900
};

const planDescription = {
    color: '#666',
    lineHeight: 1.6,
    minHeight: '52px'
};

const planDetails = {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    margin: '18px 0',
    color: '#555',
    fontSize: '14px'
};

const buyBtn = {
    width: '100%',
    padding: '13px 16px',
    border: 'none',
    borderRadius: '14px',
    background: '#6f42c1',
    color: '#fff',
    fontWeight: 900,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
};

const centerBox = {
    height: '60vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '14px',
    color: '#333'
};

const modalOverlay = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
};

const paymentModal = {
    width: '100%',
    maxWidth: '520px',
    background: '#fff',
    borderRadius: '24px',
    padding: '28px',
    position: 'relative',
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
};

const modalCloseBtn = {
    position: 'absolute',
    right: '18px',
    top: '18px',
    border: 'none',
    background: '#f2f2f2',
    borderRadius: '50%',
    width: '34px',
    height: '34px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
};

const modalIcon = {
    width: '62px',
    height: '62px',
    borderRadius: '50%',
    background: '#f1e8ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px'
};

const modalTitle = {
    margin: '0 0 8px',
    fontSize: '26px',
    fontWeight: 900
};

const modalSub = {
    color: '#666',
    lineHeight: 1.6,
    marginBottom: '18px'
};

const summaryBox = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    background: '#f8f5ff',
    padding: '16px',
    borderRadius: '16px',
    marginBottom: '18px'
};

const inputLabel = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 800,
    color: '#333',
    marginBottom: '6px'
};

const input = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid #ddd',
    marginBottom: '14px',
    fontSize: '15px',
    boxSizing: 'border-box'
};

const inputRow = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '14px'
};

const payNowBtn = {
    width: '100%',
    padding: '14px 16px',
    border: 'none',
    borderRadius: '14px',
    background: '#6f42c1',
    color: '#fff',
    fontWeight: 900,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '15px'
};

export default WifiPortal;