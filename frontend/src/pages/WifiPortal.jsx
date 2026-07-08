import { useCallback, useEffect, useMemo, useState } from 'react';
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
    ArrowRight
} from 'lucide-react';

const API_BASE = 'http://localhost:8080';

function WifiPortal() {
    const [plans, setPlans] = useState([]);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [payingPlanId, setPayingPlanId] = useState(null);
    const [message, setMessage] = useState('');

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const reason = searchParams.get('reason');
    const token = localStorage.getItem('jwt_token');

    const config = useMemo(() => ({
        headers: token ? {
            Authorization: `Bearer ${token}`
        } : {}
    }), [token]);

    const reasonText = useMemo(() => {
        if (reason === 'expired') {
            return 'Your Wi-Fi package has expired. Please purchase another package.';
        }

        if (reason === 'disconnected') {
            return 'Your Wi-Fi access has been disconnected because the package expired or the data limit was reached.';
        }

        if (reason === 'unauthorized') {
            return 'Please purchase a Wi-Fi package before accessing the internet.';
        }

        return '';
    }, [reason]);

    const loadPortal = useCallback(async () => {
        if (!token) {
            navigate('/login');
            return;
        }

        setLoading(true);

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
    }, [config, navigate, token]);

    useEffect(() => {
        loadPortal();
    }, [loadPortal]);

    const purchasePlan = async (planId) => {
        if (!token) {
            navigate('/login');
            return;
        }

        setPayingPlanId(planId);
        setMessage('Processing simulated payment...');

        try {
            // Simulate a short payment gateway delay for demonstration.
            await new Promise(resolve => setTimeout(resolve, 900));

            const res = await axios.post(
                `${API_BASE}/api/wifi/purchase`,
                { planId },
                config
            );

            setSession(res.data);
            setMessage('Payment successful. Wi-Fi access activated.');
            navigate('/internet');
        } catch (err) {
            console.error('Wi-Fi purchase failed:', err);
            setMessage('Payment failed. Please try again.');
        } finally {
            setPayingPlanId(null);
        }
    };

    const getRemainingMinutes = () => {
        if (!session?.endTime) return 0;
        const diffMs = new Date(session.endTime).getTime() - Date.now();
        return Math.max(0, Math.ceil(diffMs / 60000));
    };

    const getRemainingData = () => {
        if (!session) return 0;
        return Math.max(0, Number(session.dataLimitMb || 0) - Number(session.usedDataMb || 0));
    };

    const usagePercent = session && session.dataLimitMb
        ? Math.min(100, Math.round((Number(session.usedDataMb || 0) / Number(session.dataLimitMb)) * 100))
        : 0;

    const formatDateTime = (value) => {
        if (!value) return '-';
        return new Date(value).toLocaleString();
    };

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
                    <div style={heroBadge}><Wifi size={16} /> SHIPBOARD WI-FI PORTAL</div>
                    <h1 style={heroTitle}>Passenger Internet Access</h1>
                    <p style={heroText}>
                        Choose a Wi-Fi package, complete simulated payment, and activate temporary onboard internet access.
                    </p>
                </div>
            </section>

            {reasonText && <div style={alertBox}>{reasonText}</div>}
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
                            <Wifi size={20} />
                            <span style={smallLabel}>Access Token</span>
                            <strong style={tokenText}>{session.accessToken || '-'}</strong>
                        </div>
                    </div>

                    <div style={progressOuter}>
                        <div style={{ ...progressInner, width: `${usagePercent}%` }} />
                    </div>

                    <p style={statusMeta}>
                        Package: {session.plan?.name || '-'} · Used: {session.usedDataMb || 0}MB / {session.dataLimitMb || 0}MB · Expires: {formatDateTime(session.endTime)}
                    </p>

                    {session.status === 'ACTIVE' ? (
                        <button style={continueBtn} onClick={() => navigate('/internet')}>
                            Continue to Internet
                            <ArrowRight size={17} />
                        </button>
                    ) : (
                        <div style={expiredNotice}>
                            This access session is no longer active. Please choose another package below.
                        </div>
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
                                <span><Timer size={15} /> {plan.durationMinutes} min</span>
                                <span><Database size={15} /> {plan.dataLimitMb} MB</span>
                            </div>

                            <button
                                style={{
                                    ...buyBtn,
                                    opacity: payingPlanId === plan.id ? 0.75 : 1,
                                    cursor: payingPlanId === plan.id ? 'not-allowed' : 'pointer'
                                }}
                                disabled={payingPlanId === plan.id}
                                onClick={() => purchasePlan(plan.id)}
                            >
                                <CreditCard size={17} />
                                {payingPlanId === plan.id ? 'Paying...' : 'Simulate Payment'}
                            </button>
                        </div>
                    ))}
                </div>
            </section>
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

const alertBox = {
    maxWidth: '1100px',
    margin: '0 auto 20px',
    padding: '14px 18px',
    borderRadius: '14px',
    background: '#fff3cd',
    color: '#664d03',
    fontWeight: 800,
    border: '1px solid #ffec99'
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
    letterSpacing: '0.5px'
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
    marginTop: '18px',
    padding: '12px 18px',
    border: 'none',
    borderRadius: '14px',
    background: '#198754',
    color: '#fff',
    fontWeight: 900,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
};

const expiredNotice = {
    marginTop: '18px',
    padding: '12px 14px',
    borderRadius: '12px',
    background: '#f8d7da',
    color: '#842029',
    fontWeight: 700
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

export default WifiPortal;
