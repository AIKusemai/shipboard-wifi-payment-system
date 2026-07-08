import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
    Wifi,
    Users,
    Database,
    IndianRupee,
    RefreshCw,
    Power,
    Clock,
    AlertTriangle
} from 'lucide-react';

const API_BASE = 'http://localhost:8080';

function AdminWifiSessions() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    const token =
        localStorage.getItem('jwt_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('authToken');

    const config = useMemo(() => ({
        headers: {
            Authorization: `Bearer ${token}`
        }
    }), [token]);

    const loadSessions = async () => {
        setLoading(true);
        setMessage('');

        try {
            const res = await axios.get(`${API_BASE}/api/admin/wifi/sessions`, config);
            setSessions(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Load admin Wi-Fi sessions failed:', err);

            const status = err.response?.status;
            if (status === 401 || status === 403) {
                setMessage('You do not have permission to view Wi-Fi admin sessions. Please login as an administrator.');
            } else if (status) {
                setMessage(`Failed to load Wi-Fi sessions. Backend returned HTTP ${status}.`);
            } else {
                setMessage('Failed to load Wi-Fi sessions. Please check whether backend is running on port 8080.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

    const disconnectSession = async (sessionId) => {
        const confirmed = window.confirm('Disconnect this passenger Wi-Fi session?');

        if (!confirmed) {
            return;
        }

        try {
            await axios.post(
                `${API_BASE}/api/admin/wifi/sessions/${sessionId}/disconnect`,
                {},
                config
            );

            setMessage('Passenger Wi-Fi access disconnected.');
            loadSessions();
        } catch (err) {
            console.error('Disconnect Wi-Fi session failed:', err);
            setMessage('Failed to disconnect this session.');
        }
    };

    const activeCount = sessions.filter(s => s.status === 'ACTIVE').length;
    const expiredCount = sessions.filter(s => s.status === 'EXPIRED').length;
    const usedUpCount = sessions.filter(s => s.status === 'USED_UP').length;

    const totalUsedData = sessions.reduce((sum, s) => {
        return sum + Number(s.usedDataMb || 0);
    }, 0);

    const totalRevenue = sessions.reduce((sum, s) => {
        return sum + Number(s.plan?.price || 0);
    }, 0);

    const formatDateTime = (value) => {
        if (!value) {
            return '-';
        }

        return new Date(value).toLocaleString();
    };

    const getStatusStyle = (status) => {
        if (status === 'ACTIVE') {
            return activeStatus;
        }

        if (status === 'EXPIRED') {
            return expiredStatus;
        }

        if (status === 'USED_UP') {
            return usedUpStatus;
        }

        return disconnectedStatus;
    };

    return (
        <div style={pageWrapper}>
            <section style={heroSection}>
                <div>
                    <div style={heroBadge}>
                        <Wifi size={16} />
                        ADMIN WI-FI MONITOR
                    </div>

                    <h1 style={heroTitle}>Shipboard Wi-Fi Sessions</h1>

                    <p style={heroText}>
                        Monitor passenger internet access, package usage, expiration status, and manually disconnect active sessions.
                    </p>
                </div>

                <button style={refreshBtn} onClick={loadSessions}>
                    <RefreshCw size={17} />
                    Refresh
                </button>
            </section>

            {message && (
                <div style={messageBox}>
                    <AlertTriangle size={18} />
                    {message}
                </div>
            )}

            <section style={statsGrid}>
                <div style={statCard}>
                    <div style={statIconPurple}>
                        <Users size={24} />
                    </div>
                    <span style={statLabel}>Active Sessions</span>
                    <strong style={statValue}>{activeCount}</strong>
                </div>

                <div style={statCard}>
                    <div style={statIconBlue}>
                        <Clock size={24} />
                    </div>
                    <span style={statLabel}>Expired Sessions</span>
                    <strong style={statValue}>{expiredCount}</strong>
                </div>

                <div style={statCard}>
                    <div style={statIconGreen}>
                        <Database size={24} />
                    </div>
                    <span style={statLabel}>Total Data Used</span>
                    <strong style={statValue}>{totalUsedData} MB</strong>
                </div>

                <div style={statCard}>
                    <div style={statIconOrange}>
                        <IndianRupee size={24} />
                    </div>
                    <span style={statLabel}>Simulated Revenue</span>
                    <strong style={statValue}>₹{totalRevenue}</strong>
                </div>
            </section>

            <section style={tableCard}>
                <div style={tableHeader}>
                    <div>
                        <h2 style={sectionTitle}>Passenger Access Records</h2>
                        <p style={sectionSub}>
                            ACTIVE means the passenger can access the simulated internet page.
                            EXPIRED or USED_UP means the system has automatically disconnected access.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div style={loadingBox}>
                        <RefreshCw size={26} />
                        <p>Loading Wi-Fi sessions...</p>
                    </div>
                ) : sessions.length === 0 ? (
                    <div style={emptyBox}>
                        No Wi-Fi sessions found.
                    </div>
                ) : (
                    <div style={tableWrapper}>
                        <table style={table}>
                            <thead>
                                <tr>
                                    <th style={th}>Passenger</th>
                                    <th style={th}>Plan</th>
                                    <th style={th}>Start Time</th>
                                    <th style={th}>End Time</th>
                                    <th style={th}>Data Usage</th>
                                    <th style={th}>Status</th>
                                    <th style={th}>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {sessions.map(session => (
                                    <tr key={session.id}>
                                        <td style={td}>
                                            <strong>{session.userEmail}</strong>
                                            <div style={tokenText}>{session.accessToken}</div>
                                        </td>

                                        <td style={td}>
                                            <strong>{session.plan?.name || '-'}</strong>
                                            <div style={mutedText}>₹{session.plan?.price || 0}</div>
                                        </td>

                                        <td style={td}>{formatDateTime(session.startTime)}</td>

                                        <td style={td}>{formatDateTime(session.endTime)}</td>

                                        <td style={td}>
                                            <strong>{session.usedDataMb}MB / {session.dataLimitMb}MB</strong>
                                            <div style={usageBarOuter}>
                                                <div
                                                    style={{
                                                        ...usageBarInner,
                                                        width: `${session.dataLimitMb > 0
                                                            ? Math.min(100, Math.round((session.usedDataMb / session.dataLimitMb) * 100))
                                                            : 0}%`
                                                    }}
                                                />
                                            </div>
                                        </td>

                                        <td style={td}>
                                            <span style={getStatusStyle(session.status)}>
                                                {session.status}
                                            </span>
                                        </td>

                                        <td style={td}>
                                            {session.status === 'ACTIVE' ? (
                                                <button
                                                    style={disconnectBtn}
                                                    onClick={() => disconnectSession(session.id)}
                                                >
                                                    <Power size={15} />
                                                    Disconnect
                                                </button>
                                            ) : (
                                                <span style={mutedText}>No action</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div style={summaryNote}>
                    Used up sessions: {usedUpCount}. These represent passengers whose package data limit has been reached.
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
    maxWidth: '1180px',
    margin: '0 auto 24px',
    padding: '34px',
    borderRadius: '28px',
    background: 'linear-gradient(135deg, #161B33, #6f42c1)',
    color: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '20px',
    alignItems: 'center'
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
    fontSize: '38px',
    margin: '16px 0 8px',
    fontWeight: 900
};

const heroText = {
    maxWidth: '720px',
    lineHeight: 1.7,
    opacity: 0.92
};

const refreshBtn = {
    padding: '12px 16px',
    border: 'none',
    borderRadius: '14px',
    background: '#fff',
    color: '#6f42c1',
    fontWeight: 900,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
};

const messageBox = {
    maxWidth: '1180px',
    margin: '0 auto 20px',
    padding: '14px 18px',
    borderRadius: '14px',
    background: '#fff3cd',
    color: '#664d03',
    border: '1px solid #ffec99',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: 700
};

const statsGrid = {
    maxWidth: '1180px',
    margin: '0 auto 24px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '18px'
};

const statCard = {
    background: '#fff',
    borderRadius: '22px',
    padding: '22px',
    border: '1px solid #e9ecef',
    boxShadow: '0 8px 22px rgba(0,0,0,0.035)'
};

const statIconPurple = {
    width: '48px',
    height: '48px',
    borderRadius: '16px',
    background: '#f1e8ff',
    color: '#6f42c1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px'
};

const statIconBlue = {
    ...statIconPurple,
    background: '#e7f1ff',
    color: '#0d6efd'
};

const statIconGreen = {
    ...statIconPurple,
    background: '#e9f7ef',
    color: '#198754'
};

const statIconOrange = {
    ...statIconPurple,
    background: '#fff3cd',
    color: '#b26b00'
};

const statLabel = {
    display: 'block',
    color: '#666',
    fontWeight: 800,
    fontSize: '13px',
    marginBottom: '6px'
};

const statValue = {
    fontSize: '28px',
    fontWeight: 900
};

const tableCard = {
    maxWidth: '1180px',
    margin: '0 auto',
    background: '#fff',
    borderRadius: '24px',
    padding: '26px',
    border: '1px solid #e9ecef',
    boxShadow: '0 10px 28px rgba(0,0,0,0.04)'
};

const tableHeader = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '20px',
    alignItems: 'center',
    marginBottom: '20px'
};

const sectionTitle = {
    margin: 0,
    fontSize: '26px',
    fontWeight: 900
};

const sectionSub = {
    color: '#666',
    lineHeight: 1.6,
    marginTop: '8px'
};

const loadingBox = {
    padding: '50px',
    textAlign: 'center',
    color: '#666'
};

const emptyBox = {
    padding: '50px',
    textAlign: 'center',
    color: '#666',
    background: '#f8f9fa',
    borderRadius: '18px'
};

const tableWrapper = {
    overflowX: 'auto'
};

const table = {
    width: '100%',
    borderCollapse: 'collapse'
};

const th = {
    textAlign: 'left',
    padding: '14px',
    background: '#f8f9fa',
    color: '#555',
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
};

const td = {
    padding: '16px 14px',
    borderBottom: '1px solid #f1f1f1',
    verticalAlign: 'middle'
};

const tokenText = {
    color: '#777',
    fontSize: '12px',
    marginTop: '4px',
    wordBreak: 'break-all'
};

const mutedText = {
    color: '#777',
    fontSize: '13px',
    marginTop: '4px'
};

const usageBarOuter = {
    width: '140px',
    height: '8px',
    borderRadius: '999px',
    background: '#edf0f5',
    marginTop: '8px',
    overflow: 'hidden'
};

const usageBarInner = {
    height: '100%',
    background: '#6f42c1',
    borderRadius: '999px'
};

const activeStatus = {
    padding: '6px 10px',
    borderRadius: '999px',
    background: '#e9f7ef',
    color: '#198754',
    fontWeight: 900,
    fontSize: '12px'
};

const expiredStatus = {
    ...activeStatus,
    background: '#fff3cd',
    color: '#856404'
};

const usedUpStatus = {
    ...activeStatus,
    background: '#fdecea',
    color: '#dc3545'
};

const disconnectedStatus = {
    ...activeStatus,
    background: '#f1f3f5',
    color: '#555'
};

const disconnectBtn = {
    border: 'none',
    borderRadius: '12px',
    background: '#dc3545',
    color: '#fff',
    padding: '9px 12px',
    cursor: 'pointer',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
};

const summaryNote = {
    marginTop: '18px',
    padding: '14px 16px',
    borderRadius: '14px',
    background: '#f8f5ff',
    color: '#555'
};

export default AdminWifiSessions;