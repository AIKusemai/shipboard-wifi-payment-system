import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Database, RefreshCw, ShieldCheck, Timer, Wifi } from 'lucide-react';
import { wifiLocalService, wifiSessionStatus } from '../service/wifiLocalService';

function InternetAccessPage() {
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [currentTime, setCurrentTime] = useState(() => Date.now());
    const [isChecking, setIsChecking] = useState(true);
    const sessionId = session?.id;
    const sessionStatus = session?.status;

    useEffect(() => {
        let mounted = true;

        const loadCurrentSession = async () => {
            try {
                const currentSession = await wifiLocalService.getCurrentSession();

                if (!mounted) return;

                setSession(currentSession);

                if (!currentSession || currentSession.status !== wifiSessionStatus.ACTIVE) {
                    navigate('/wifi?reason=unauthorized');
                }
            } finally {
                if (mounted) {
                    setIsChecking(false);
                }
            }
        };

        loadCurrentSession();

        return () => {
            mounted = false;
        };
    }, [navigate]);

    useEffect(() => {
        if (!sessionId || sessionStatus !== wifiSessionStatus.ACTIVE) {
            return;
        }

        const timerId = window.setInterval(() => {
            setCurrentTime(Date.now());
            wifiLocalService.getCurrentSession()
                .then((nextSession) => {
                    if (!nextSession || nextSession.status !== wifiSessionStatus.ACTIVE) {
                        navigate('/wifi?reason=disconnected');
                        return;
                    }
                    setSession(nextSession);
                })
                .catch(() => navigate('/wifi?reason=disconnected'));
        }, 5000);

        return () => window.clearInterval(timerId);
    }, [navigate, sessionId, sessionStatus]);

    if (isChecking || !session || session.status !== wifiSessionStatus.ACTIVE) {
        return (
            <div style={page}>
                <div style={loadingBox}>
                    <RefreshCw size={24} />
                    <p>正在校验当前上网会话...</p>
                </div>
            </div>
        );
    }

    const remainingMinutes = Math.max(
        0,
        Math.ceil((new Date(session.endTime).getTime() - currentTime) / 60000)
    );

    return (
        <div style={page}>
            <div style={card}>
                <div style={header}>
                    <div style={badge}>
                        <Wifi size={16} />
                        在线服务
                    </div>
                </div>

                <div style={intro}>
                    <h1 style={title}>网络已开通</h1>
                    <p style={subtitle}>你已成功接入船上网络。这里可以查看剩余时间、流量使用情况以及当前连接状态。</p>
                </div>

                <div style={stats}>
                    <div style={statItem}>
                        <ShieldCheck size={18} />
                        <div>
                            <div style={label}>状态</div>
                            <div style={value}>{session.status}</div>
                        </div>
                    </div>
                    <div style={statItem}>
                        <Timer size={18} />
                        <div>
                            <div style={label}>剩余时间</div>
                            <div style={value}>{remainingMinutes} 分钟</div>
                        </div>
                    </div>
                    <div style={statItem}>
                        <Database size={18} />
                        <div>
                            <div style={label}>流量使用</div>
                            <div style={value}>{session.usedDataMb} / {session.dataLimitMb} MB</div>
                        </div>
                    </div>
                    <div style={statItem}>
                        <Activity size={18} />
                        <div>
                            <div style={label}>当前套餐</div>
                            <div style={value}>{session.plan?.name || '已开通'}</div>
                        </div>
                    </div>
                </div>

                <div style={actionRow}>
                    <button type="button" style={secondaryButton} onClick={() => navigate('/wifi')}>
                        返回套餐中心
                    </button>
                </div>
            </div>
        </div>
    );
}

const page = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: '#fdfbf6',
    boxSizing: 'border-box'
};
const loadingBox = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: '#5d5d5d' };
const card = {
    width: '100%',
    maxWidth: '980px',
    padding: '34px',
    borderRadius: '24px',
    background: '#fffdf8',
    color: '#173229',
    boxShadow: '0 18px 40px rgba(31, 42, 37, 0.06)',
    border: '1px solid #ece5d5'
};
const header = { marginBottom: '18px' };
const badge = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '999px',
    background: '#e7f1ed',
    color: '#1a6a56',
    fontWeight: 700,
    fontSize: '13px'
};
const intro = { marginBottom: '24px' };
const title = { margin: '0 0 10px', fontSize: '38px', color: '#173229' };
const subtitle = { margin: 0, maxWidth: '620px', lineHeight: 1.6, color: '#66736c' };
const stats = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' };
const statItem = {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    padding: '18px',
    borderRadius: '18px',
    background: '#fff',
    color: '#173229',
    border: '1px solid #ece5d5'
};
const label = { fontSize: '12px', color: '#75817a' };
const value = { marginTop: '4px', fontWeight: 800 };
const actionRow = { marginTop: '22px', display: 'flex', justifyContent: 'flex-start' };
const secondaryButton = {
    padding: '12px 20px',
    background: '#fff',
    color: '#173229',
    border: '1px solid #d8dccc',
    borderRadius: '12px',
    fontWeight: '800',
    cursor: 'pointer'
};

export default InternetAccessPage;
