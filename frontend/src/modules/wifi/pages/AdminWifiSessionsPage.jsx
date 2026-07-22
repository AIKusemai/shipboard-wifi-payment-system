import { useEffect, useState } from 'react';
import { BarChart3, Database, DollarSign, Edit3, Plus, Power, RefreshCw, Users, Wifi, X } from 'lucide-react';
import { wifiLocalService, wifiSessionStatus } from '../service/wifiLocalService';

function StatCard({ icon, label, value, sub }) {
    const IconComponent = icon;

    return (
        <div style={statCard}>
            <div style={statIcon}><IconComponent size={20} /></div>
            <div>
                <div style={statLabel}>{label}</div>
                <div style={statValue}>{value}</div>
                {sub && <div style={statSub}>{sub}</div>}
            </div>
        </div>
    );
}

function AdminWifiSessionsPage() {
    const [sessions, setSessions] = useState([]);
    const [plans, setPlans] = useState([]);
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [showPlanForm, setShowPlanForm] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [planForm, setPlanForm] = useState({ name: '', description: '', price: '', durationMinutes: '', dataLimitMb: '' });

    const loadAll = async (showLoading = true) => {
        try {
            if (showLoading) setIsLoading(true);
            setError('');
            const [sessionData, planData, statsData] = await Promise.all([
                wifiLocalService.getAllSessions(),
                wifiLocalService.getAllPlans(),
                wifiLocalService.getStats()
            ]);
            setSessions(sessionData || []);
            setPlans(planData || []);
            setStats(statsData);
        } catch {
            setError('数据加载失败，请刷新重试。');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            await loadAll();
        };

        loadInitialData();
    }, []);

    const disconnectSession = async (sessionId) => {
        try {
            await wifiLocalService.disconnectSession(sessionId);
            setMessage('会话已断开');
            await loadAll(false);
        } catch {
            setError('断开会话失败。');
        }
    };

    const handleTogglePlan = async (planId) => {
        try {
            await wifiLocalService.togglePlan(planId);
            setMessage('套餐状态已更新');
            await loadAll(false);
        } catch {
            setError('更新套餐状态失败。');
        }
    };

    const openCreateForm = () => {
        setEditingPlan(null);
        setPlanForm({ name: '', description: '', price: '', durationMinutes: '', dataLimitMb: '' });
        setShowPlanForm(true);
    };

    const openEditForm = (plan) => {
        setEditingPlan(plan);
        setPlanForm({
            name: plan.name,
            description: plan.description,
            price: String(plan.price),
            durationMinutes: String(plan.durationMinutes),
            dataLimitMb: String(plan.dataLimitMb)
        });
        setShowPlanForm(true);
    };

    const handleSavePlan = async () => {
        const payload = {
            name: planForm.name,
            description: planForm.description,
            price: Number(planForm.price),
            durationMinutes: Number(planForm.durationMinutes),
            dataLimitMb: Number(planForm.dataLimitMb)
        };

        try {
            if (editingPlan) {
                await wifiLocalService.updatePlan(editingPlan.id, payload);
                setMessage('套餐已更新');
            } else {
                await wifiLocalService.createPlan(payload);
                setMessage('新套餐已创建');
            }
            setShowPlanForm(false);
            await loadAll(false);
        } catch (err) {
            const msg = err.response?.data?.message || '保存失败，请检查输入。';
            setError(msg);
        }
    };

    return (
        <div style={page}>
            <div style={container}>
                <div style={header}>
                    <div style={badge}><Wifi size={16} />管理后台</div>
                    <h1 style={title}>船上 WiFi 管理台</h1>
                    <p style={subtitle}>套餐管理 · 会话监控 · 营收统计</p>
                </div>

                {error && <div style={errorBanner}>{error}</div>}
                {message && <div style={successBanner}>{message}</div>}

                {/* Stats Section */}
                {stats && (
                    <div style={statsGrid}>
                        <StatCard icon={Users} label="活跃会话" value={stats.activeSessions} sub={`共 ${stats.totalSessions} 条记录`} />
                        <StatCard icon={DollarSign} label="总营收" value={`¥${stats.totalRevenue}`} />
                        <StatCard icon={Database} label="总流量消耗" value={`${stats.totalDataUsedMb} MB`} />
                        <StatCard icon={BarChart3} label="套餐数量" value={stats.activePlans} sub={`共 ${stats.totalPlans} 个套餐`} />
                    </div>
                )}

                {/* Plan Management */}
                <div style={sectionHeader}>
                    <h2 style={sectionTitle}>套餐管理</h2>
                    <button style={createBtn} onClick={openCreateForm}><Plus size={16} />新建套餐</button>
                </div>

                <div style={planGrid}>
                    {plans.map((plan) => (
                        <div key={plan.id} style={{ ...planCard, opacity: plan.active ? 1 : 0.55 }}>
                            <div style={planHeader}>
                                <h3 style={planTitle}>{plan.name}</h3>
                                <span style={{ ...statusTag, background: plan.active ? '#e7f1ed' : '#f7efe2', color: plan.active ? '#1a6a56' : '#8a6a2b' }}>
                                    {plan.active ? '启用' : '已下架'}
                                </span>
                            </div>
                            <div style={priceLarge}>¥{plan.price}</div>
                            <p style={planDesc}>{plan.description}</p>
                            <div style={planMeta}>
                                <span>{plan.durationMinutes} 分钟</span>
                                <span>{plan.dataLimitMb} MB</span>
                            </div>
                            <div style={planActions}>
                                <button style={editBtn} onClick={() => openEditForm(plan)}><Edit3 size={14} />编辑</button>
                                <button style={toggleBtn} onClick={() => handleTogglePlan(plan.id)}>
                                    {plan.active ? '下架' : '上架'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Plan Form Modal */}
                {showPlanForm && (
                    <div style={overlay} onClick={() => setShowPlanForm(false)}>
                        <div style={modal} onClick={(e) => e.stopPropagation()}>
                            <div style={modalHeader}>
                                <h3 style={modalTitle}>{editingPlan ? '编辑套餐' : '新建套餐'}</h3>
                                <button style={closeBtn} onClick={() => setShowPlanForm(false)}><X size={18} /></button>
                            </div>
                            <div style={formGrid}>
                                <input style={input} placeholder="套餐名称" value={planForm.name}
                                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} />
                                <input style={input} placeholder="描述" value={planForm.description}
                                    onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} />
                                <input style={input} type="number" placeholder="价格 (元)" value={planForm.price}
                                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })} />
                                <input style={input} type="number" placeholder="时长 (分钟)" value={planForm.durationMinutes}
                                    onChange={(e) => setPlanForm({ ...planForm, durationMinutes: e.target.value })} />
                                <input style={input} type="number" placeholder="流量上限 (MB)" value={planForm.dataLimitMb}
                                    onChange={(e) => setPlanForm({ ...planForm, dataLimitMb: e.target.value })} />
                            </div>
                            <div style={modalFooter}>
                                <button style={saveBtn} onClick={handleSavePlan}>{editingPlan ? '保存修改' : '创建套餐'}</button>
                                <button style={cancelBtn} onClick={() => setShowPlanForm(false)}>取消</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Session Table */}
                <div style={sectionHeader}>
                    <h2 style={sectionTitle}>会话记录</h2>
                    <button style={refreshBtn} onClick={() => loadAll(false)}><RefreshCw size={14} />刷新</button>
                </div>

                <div style={tableWrap}>
                    <table style={table}>
                        <thead>
                            <tr>
                                <th style={th}>用户</th>
                                <th style={th}>套餐</th>
                                <th style={th}>开始时间</th>
                                <th style={th}>结束时间</th>
                                <th style={th}>流量</th>
                                <th style={th}>支付</th>
                                <th style={th}>状态</th>
                                <th style={th}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr><td style={td} colSpan="8">正在加载会话数据...</td></tr>
                            )}
                            {!isLoading && sessions.length === 0 && (
                                <tr><td style={td} colSpan="8">当前没有会话记录。</td></tr>
                            )}
                            {sessions.map((session) => (
                                <tr key={session.id}>
                                    <td style={td}>{session.userEmail}</td>
                                    <td style={td}>{session.plan?.name}</td>
                                    <td style={td}>{new Date(session.startTime).toLocaleString()}</td>
                                    <td style={td}>{new Date(session.endTime).toLocaleString()}</td>
                                    <td style={td}>{session.usedDataMb} / {session.dataLimitMb} MB</td>
                                    <td style={td}>
                                        <span style={{
                                            ...statusTag,
                                            background: session.paymentStatus === 'PAID' ? '#e7f1ed' : session.paymentStatus === 'REFUNDED' ? '#fff3ef' : '#fff8e7',
                                            color: session.paymentStatus === 'PAID' ? '#1a6a56' : session.paymentStatus === 'REFUNDED' ? '#b64d35' : '#8a6a2b'
                                        }}>
                                            {session.paymentStatus === 'PAID' ? '已支付' : session.paymentStatus === 'REFUNDED' ? '已退款' : '待支付'}
                                        </span>
                                    </td>
                                    <td style={td}>
                                        <span style={{
                                            ...statusTag,
                                            background: session.status === 'ACTIVE' ? '#e7f1ed' : '#f4efe2',
                                            color: session.status === 'ACTIVE' ? '#1a6a56' : '#6f7a74'
                                        }}>
                                            {session.status}
                                        </span>
                                    </td>
                                    <td style={td}>
                                        {session.status === wifiSessionStatus.ACTIVE && (
                                            <button style={dangerBtn} onClick={() => disconnectSession(session.id)}>
                                                <Power size={14} />断开
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// --- Styles ---
const page = { minHeight: '100vh', background: 'linear-gradient(180deg, #f4efe3, #fbfaf6)', padding: '32px 18px 48px', fontFamily: 'Inter, sans-serif' };
const container = { maxWidth: '1220px', margin: '0 auto' };
const header = { marginBottom: '22px' };
const badge = { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '999px', background: '#e7dbc1', color: '#6e4c17', fontWeight: 700, fontSize: '13px' };
const title = { margin: '16px 0 10px', fontSize: '42px', color: '#1d312a' };
const subtitle = { margin: 0, color: '#66746d', maxWidth: '760px', lineHeight: 1.6 };
const errorBanner = { margin: '0 0 18px', padding: '14px 16px', borderRadius: '14px', background: '#fff3ef', color: '#b64d35', fontWeight: 600 };
const successBanner = { margin: '0 0 18px', padding: '14px 16px', borderRadius: '14px', background: '#eaf5ef', color: '#1f6a56', fontWeight: 600 };

// Stats
const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '32px' };
const statCard = { display: 'flex', gap: '14px', alignItems: 'center', padding: '22px', borderRadius: '18px', background: '#fffdf7', border: '1px solid #e6dcc7', boxShadow: '0 8px 22px rgba(18,32,26,0.04)' };
const statIcon = { color: '#1a6a56' };
const statLabel = { fontSize: '12px', color: '#75817a' };
const statValue = { fontSize: '26px', fontWeight: 900, color: '#173229' };
const statSub = { fontSize: '11px', color: '#9aa39d', marginTop: '2px' };

// Sections
const sectionHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', marginTop: '32px' };
const sectionTitle = { fontSize: '24px', fontWeight: 900, color: '#173229', margin: 0 };
const createBtn = { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: '#173229', color: '#fff9ee', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '13px' };
const refreshBtn = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#fff', color: '#44524b', border: '1px solid #d8dccc', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '12px' };

// Plan cards
const planGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px', marginBottom: '10px' };
const planCard = { padding: '22px', borderRadius: '18px', background: '#fffdf7', border: '1px solid #e6dcc7', boxShadow: '0 8px 22px rgba(18,32,26,0.04)', transition: 'opacity 0.2s' };
const planHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' };
const planTitle = { margin: 0, fontSize: '18px', fontWeight: 800, color: '#173229' };
const statusTag = { padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700 };
const priceLarge = { fontSize: '28px', fontWeight: 900, color: '#8a6a2b', marginBottom: '8px' };
const planDesc = { color: '#66736c', fontSize: '13px', marginBottom: '12px', lineHeight: 1.5 };
const planMeta = { display: 'flex', gap: '16px', fontSize: '12px', color: '#75817a', marginBottom: '14px' };
const planActions = { display: 'flex', gap: '8px' };
const editBtn = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: '#f1e5ba', color: '#6f5820', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '12px' };
const toggleBtn = { padding: '7px 14px', background: '#fff', color: '#44524b', border: '1px solid #d8dccc', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '12px' };

// Modal
const overlay = { position: 'fixed', inset: 0, background: 'rgba(18,32,26,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 };
const modal = { background: '#fffdf8', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 50px rgba(0,0,0,0.12)' };
const modalHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const modalTitle = { margin: 0, fontSize: '20px', fontWeight: 900, color: '#173229' };
const closeBtn = { background: 'none', border: 'none', cursor: 'pointer', color: '#75817a' };
const formGrid = { display: 'flex', flexDirection: 'column', gap: '12px' };
const input = { padding: '12px 14px', borderRadius: '12px', border: '1px solid #e5dfd0', background: '#f8f5ed', fontSize: '14px', outline: 'none' };
const modalFooter = { display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' };
const saveBtn = { padding: '12px 22px', background: '#1a6a56', color: '#fff9ee', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '14px' };
const cancelBtn = { padding: '12px 22px', background: '#fff', color: '#44524b', border: '1px solid #d8dccc', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' };

// Table
const tableWrap = { overflow: 'hidden', borderRadius: '20px', background: '#fffdf7', border: '1px solid #e6dcc7', boxShadow: '0 8px 22px rgba(18,32,26,0.04)' };
const table = { width: '100%', borderCollapse: 'collapse' };
const th = { textAlign: 'left', padding: '16px 18px', background: '#f7f0df', color: '#6b695f', fontSize: '13px' };
const td = { padding: '16px 18px', borderTop: '1px solid #efe6d4', fontSize: '14px', color: '#243730' };
const dangerBtn = { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 12px', border: 'none', borderRadius: '12px', background: '#4f291d', color: '#fff8ef', cursor: 'pointer', fontSize: '13px' };

export default AdminWifiSessionsPage;
