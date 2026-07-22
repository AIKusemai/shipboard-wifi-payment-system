import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Activity, ArrowRight, CreditCard, Database, Loader2, ShieldCheck, Timer, Wifi } from 'lucide-react';
import { wifiLocalService } from '../service/wifiLocalService';

function WifiPortalPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const role = localStorage.getItem('user_role');
    const isAdmin = role === 'ADMIN' || role === 'ROLE_ADMIN';
    const [plans, setPlans] = useState([]);
    const [session, setSession] = useState(null);
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [message, setMessage] = useState('');
    const [currentTime, setCurrentTime] = useState(() => Date.now());
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;

        const loadInitialData = async () => {
            try {
                setIsLoading(true);
                const [planData, currentSession] = await Promise.all([
                    wifiLocalService.getPlans(),
                    wifiLocalService.getCurrentSession()
                ]);

                if (!mounted) return;

                setPlans(planData || []);
                setSession(currentSession);
                setSelectedPlanId((planData && planData[1]?.id) || (planData && planData[0]?.id) || null);
            } catch (err) {
                if (!mounted) return;
                setError(err.response?.data?.message || '套餐信息加载失败，请稍后重试。');
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        loadInitialData();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        const sessionTimer = window.setInterval(() => {
            setCurrentTime(Date.now());
            wifiLocalService.getCurrentSession()
                .then((nextSession) => setSession(nextSession))
                .catch(() => {
                    // Ignore polling errors and keep the last known state on screen.
                });
        }, 15000);

        return () => window.clearInterval(sessionTimer);
    }, []);

    const reason = searchParams.get('reason');
    const reasonMessage = {
        unauthorized: '当前没有有效会话，请先购买船上网络套餐。',
        expired: '当前会话已过期，请重新购买套餐。',
        disconnected: '当前会话已断开，请重新开通。'
    }[reason];

    const remainingMinutes = session?.endTime
        ? Math.max(0, Math.ceil((new Date(session.endTime).getTime() - currentTime) / 60000))
        : 0;

    const remainingData = session
        ? Math.max(0, session.dataLimitMb - session.usedDataMb)
        : 0;

    const usageRatio = session?.dataLimitMb
        ? Math.min(100, Math.round((session.usedDataMb / session.dataLimitMb) * 100))
        : 0;

    const featuredPlan = plans.find((plan) => plan.id === selectedPlanId) || plans[0];

    const handlePurchase = async () => {
        if (!selectedPlanId) {
            setMessage('请先选择一个套餐。');
            return;
        }

        try {
            setIsPurchasing(true);
            setError('');
            const nextSession = await wifiLocalService.purchasePlan(selectedPlanId);
            setSession(nextSession);
            setMessage('套餐已开通，现在可以开始使用船上网络。');
            navigate('/internet');
        } catch (err) {
            setError(err.response?.data?.message || '套餐开通失败，请稍后重试。');
        } finally {
            setIsPurchasing(false);
        }
    };

    if (isLoading) {
        return (
            <div style={emptyStateStyle}>
                <Loader2 size={40} className="animate-spin" color="#1a6a56" />
                <p style={{ marginTop: '20px', color: '#66736c', fontWeight: '700' }}>正在加载套餐信息...</p>
            </div>
        );
    }

    if (!featuredPlan) {
        return (
            <div style={emptyStateStyle}>
                <p style={{ marginTop: '20px', color: '#66736c', fontWeight: '700' }}>当前没有可用套餐。</p>
            </div>
        );
    }

    return (
        <div style={pageWrapper}>
            <div style={heroContainer}>
                <div style={heroSlide}>
                    <div style={heroContent}>
                        <span style={heroBadge}>船上上网服务</span>
                        <h1 style={heroTitle}>随时连接，按需购买船上 WiFi 套餐</h1>
                        <p style={heroSub}>
                            当前推荐 {featuredPlan.name}，适合 {featuredPlan.description}
                        </p>
                        <button onClick={handlePurchase} style={heroBtn}>
                            立即开通 <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div style={contentContainer}>
                {reasonMessage && <div style={warning}>{reasonMessage}</div>}
                {message && <div style={success}>{message}</div>}
                {error && <div style={danger}>{error}</div>}

                <div style={sectionHeader}>
                    <h2 style={sectionTitle}>当前服务状态</h2>
                    <p style={sectionSub}>查看你的上网时长、剩余流量与当前会话情况。</p>
                </div>

                <div style={statusGrid}>
                    <div style={statusCard}>
                        <Timer size={18} color="#1a6a56" />
                        <div style={statusLabel}>剩余时长</div>
                        <div style={statusValue}>{session ? `${remainingMinutes} 分钟` : '未开通'}</div>
                    </div>
                    <div style={statusCard}>
                        <Database size={18} color="#1a6a56" />
                        <div style={statusLabel}>剩余流量</div>
                        <div style={statusValue}>{session ? `${remainingData} MB` : '未开通'}</div>
                    </div>
                    <div style={statusCard}>
                        <Activity size={18} color="#1a6a56" />
                        <div style={statusLabel}>会话状态</div>
                        <div style={statusValue}>{session?.status || '未开通'}</div>
                    </div>
                    <div style={statusCard}>
                        <ShieldCheck size={18} color="#1a6a56" />
                        <div style={statusLabel}>当前套餐</div>
                        <div style={statusValue}>{session?.plan?.name || '请选择套餐'}</div>
                    </div>
                </div>

                {session && (
                    <div style={usageCard}>
                        <div style={usageHeader}>
                            <span style={usageTitle}>流量使用进度</span>
                            <strong>{usageRatio}%</strong>
                        </div>
                        <div style={usageTrack}>
                            <div style={{ ...usageFill, width: `${usageRatio}%` }} />
                        </div>
                    </div>
                )}

                <div style={{ ...sectionHeader, marginTop: '52px' }}>
                    <h2 style={sectionTitle}>选择适合你的套餐</h2>
                    <p style={sectionSub}>根据停留时间和上网需求选择不同的时长与流量组合。</p>
                </div>

                <div style={gridStyle}>
                    {plans.map((plan) => {
                        const selected = selectedPlanId === plan.id;

                        return (
                            <div
                                key={plan.id}
                                style={{
                                    ...planCard,
                                    borderColor: selected ? '#1a6a56' : '#ece5d5',
                                    boxShadow: selected ? '0 14px 28px rgba(26,106,86,0.10)' : '0 8px 22px rgba(18,32,26,0.04)'
                                }}
                                onClick={() => setSelectedPlanId(plan.id)}
                            >
                                <div style={planHeader}>
                                    <h3 style={planTitle}>{plan.name}</h3>
                                    <div style={priceValue}>￥{plan.price}</div>
                                </div>
                                <p style={planDesc}>{plan.description}</p>
                                <div style={infoRow}><Timer size={14} color="#1a6a56" /> {plan.durationMinutes} 分钟</div>
                                <div style={infoRow}><Wifi size={14} color="#1a6a56" /> {plan.dataLimitMb} MB</div>
                                <div style={footerRow}>
                                    <div><span style={priceLabel}>{selected ? '已选择' : '点击选择'}</span></div>
                                    <div style={buyIndicator}><CreditCard size={18} color="#fff" /></div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div style={actionRow}>
                    <button onClick={handlePurchase} style={isPurchasing ? disabledPrimaryButton : primaryButton} disabled={isPurchasing}>
                        {isPurchasing ? '正在开通...' : '购买所选套餐'}
                    </button>
                    {session?.status === 'ACTIVE' && (
                        <button onClick={() => navigate('/internet')} style={secondaryButton}>
                            查看在线状态
                        </button>
                    )}
                    {isAdmin && (
                        <button onClick={() => navigate('/admin/wifi')} style={adminButton}>
                            管理会话
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

const pageWrapper = { backgroundColor: '#fdfbf6', minHeight: '100vh', fontFamily: 'Inter, sans-serif' };
const heroContainer = { padding: '20px', maxWidth: '1300px', margin: '0 auto' };
const heroSlide = {
    minHeight: '360px',
    borderRadius: '24px',
    background: 'linear-gradient(135deg, #204b3f, #1a6a56 62%, #c5a15f 140%)',
    display: 'flex',
    alignItems: 'flex-end',
    padding: '48px'
};
const heroContent = { color: '#fffaf0', maxWidth: '640px', zIndex: 10 };
const heroBadge = { background: '#f1e5ba', padding: '6px 14px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', letterSpacing: '1px', color: '#564117' };
const heroTitle = { fontSize: '46px', fontWeight: '900', margin: '16px 0', lineHeight: '1.12' };
const heroSub = { fontSize: '17px', opacity: 0.92, marginBottom: '26px', lineHeight: 1.6 };
const heroBtn = { padding: '14px 26px', background: '#fff8ec', color: '#173229', border: 'none', borderRadius: '14px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' };
const contentContainer = { maxWidth: '1240px', margin: '0 auto', padding: '40px 20px 70px' };
const sectionHeader = { marginBottom: '30px' };
const sectionTitle = { fontSize: '32px', fontWeight: '900', color: '#173229', margin: '0 0 10px 0' };
const sectionSub = { color: '#6f7a74', fontSize: '16px' };
const warning = { marginBottom: '18px', padding: '14px 16px', borderRadius: '14px', background: '#fff3e2', color: '#8a5a20' };
const success = { marginBottom: '18px', padding: '14px 16px', borderRadius: '14px', background: '#eaf5ef', color: '#1f6a56' };
const danger = { marginBottom: '18px', padding: '14px 16px', borderRadius: '14px', background: '#fff3ef', color: '#b64d35' };
const statusGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' };
const statusCard = { padding: '22px', borderRadius: '20px', background: '#fff', border: '1px solid #ece5d5', boxShadow: '0 8px 22px rgba(18,32,26,0.04)' };
const statusLabel = { marginTop: '12px', fontSize: '13px', color: '#75817a' };
const statusValue = { marginTop: '5px', fontSize: '22px', fontWeight: '800', color: '#173229' };
const usageCard = { marginTop: '22px', padding: '20px 22px', borderRadius: '20px', background: '#fff', border: '1px solid #ece5d5', boxShadow: '0 8px 22px rgba(18,32,26,0.04)' };
const usageHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', color: '#173229' };
const usageTitle = { fontWeight: 800 };
const usageTrack = { height: '12px', borderRadius: '999px', background: '#ece5d5', overflow: 'hidden' };
const usageFill = { height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, #1a6a56, #d0a760)' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' };
const planCard = { borderRadius: '20px', overflow: 'hidden', border: '1px solid #ece5d5', cursor: 'pointer', backgroundColor: '#fff', padding: '24px' };
const planHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' };
const planTitle = { margin: 0, fontSize: '22px', fontWeight: '800', color: '#173229' };
const planDesc = { color: '#66736c', fontSize: '14px', lineHeight: '1.7', marginBottom: '18px' };
const infoRow = { display: 'flex', alignItems: 'center', gap: '10px', color: '#55625b', fontSize: '14px', marginBottom: '10px' };
const footerRow = { marginTop: '22px', paddingTop: '18px', borderTop: '1px solid #f4efe2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const priceLabel = { fontSize: '12px', color: '#7d847f', textTransform: 'uppercase', fontWeight: '800' };
const priceValue = { fontSize: '24px', fontWeight: '900', color: '#8a6a2b' };
const buyIndicator = { background: '#173229', padding: '10px', borderRadius: '12px' };
const actionRow = { marginTop: '34px', display: 'flex', gap: '14px', flexWrap: 'wrap' };
const primaryButton = { padding: '14px 24px', background: '#173229', color: '#fff9ee', border: 'none', borderRadius: '14px', fontWeight: '800', cursor: 'pointer' };
const disabledPrimaryButton = { ...primaryButton, opacity: 0.72, cursor: 'not-allowed' };
const secondaryButton = { padding: '14px 24px', background: '#fff', color: '#173229', border: '1px solid #d8dccc', borderRadius: '14px', fontWeight: '800', cursor: 'pointer' };
const adminButton = { padding: '14px 24px', background: '#f1e5ba', color: '#6f5820', border: 'none', borderRadius: '14px', fontWeight: '800', cursor: 'pointer' };
const emptyStateStyle = { textAlign: 'center', padding: '120px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' };

export default WifiPortalPage;
