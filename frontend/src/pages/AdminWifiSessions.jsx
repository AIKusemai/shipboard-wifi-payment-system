import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Power, RefreshCw, Wifi } from 'lucide-react';

const API_BASE = 'http://localhost:8080';

function AdminWifiSessions() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const getToken = () => localStorage.getItem('jwt_token');

    const config = () => ({
        headers: {
            Authorization: `Bearer ${getToken()}`
        }
    });

    const fetchSessions = async () => {
        const token = getToken();
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const res = await axios.get(`${API_BASE}/api/admin/wifi/sessions`, config());
            setSessions(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Admin Wi-Fi session fetch failed:', err);
            if (err.response?.status === 403) navigate('/home');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const disconnect = async (id) => {
        if (!window.confirm('Disconnect this passenger Wi-Fi session?')) return;

        try {
            await axios.post(`${API_BASE}/api/admin/wifi/sessions/${id}/disconnect`, {}, config());
            fetchSessions();
        } catch (err) {
            console.error('Wi-Fi disconnect failed:', err);
            alert('Disconnect failed. Please check admin permission.');
        }
    };

    const formatDateTime = (value) => {
        if (!value) return '-';
        return new Date(value).toLocaleString();
    };

    const statusStyle = (status) => {
        const base = { padding: '5px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 900 };
        if (status === 'ACTIVE') return { ...base, background: '#e9f7ef', color: '#198754' };
        if (status === 'EXPIRED') return { ...base, background: '#fff3cd', color: '#856404' };
        if (status === 'USED_UP') return { ...base, background: '#fde2e1', color: '#dc3545' };
        return { ...base, background: '#f1f3f5', color: '#555' };
    };

    return (
        <div style={pageWrapper}>
            <div style={topBar}>
                <div>
                    <div style={badge}><Wifi size={15} /> ADMIN WI-FI CONTROL</div>
                    <h1 style={title}>Passenger Wi-Fi Sessions</h1>
                </div>

                <div style={actions}>
                    <button style={secondaryBtn} onClick={() => navigate('/admin')}>
                        <ArrowLeft size={17} /> Back to Admin
                    </button>
                    <button style={primaryBtn} onClick={fetchSessions}>
                        <RefreshCw size={17} /> Refresh
                    </button>
                </div>
            </div>

            <div style={tableCard}>
                {loading ? (
                    <p>Loading Wi-Fi sessions...</p>
                ) : sessions.length === 0 ? (
                    <p>No Wi-Fi sessions found.</p>
                ) : (
                    <table style={table}>
                        <thead>
                            <tr>
                                <th style={th}>ID</th>
                                <th style={th}>Passenger</th>
                                <th style={th}>Package</th>
                                <th style={th}>Time Window</th>
                                <th style={th}>Usage</th>
                                <th style={th}>Status</th>
                                <th style={th}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map(session => (
                                <tr key={session.id}>
                                    <td style={td}>#{session.id}</td>
                                    <td style={td}>{session.userEmail}</td>
                                    <td style={td}>{session.plan?.name || '-'}</td>
                                    <td style={td}>
                                        <div>{formatDateTime(session.startTime)}</div>
                                        <div style={muted}>to {formatDateTime(session.endTime)}</div>
                                    </td>
                                    <td style={td}>{session.usedDataMb}MB / {session.dataLimitMb}MB</td>
                                    <td style={td}><span style={statusStyle(session.status)}>{session.status}</span></td>
                                    <td style={td}>
                                        {session.status === 'ACTIVE' ? (
                                            <button style={dangerBtn} onClick={() => disconnect(session.id)}>
                                                <Power size={15} /> Disconnect
                                            </button>
                                        ) : (
                                            <span style={muted}>No action</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

const pageWrapper = { minHeight: '100vh', background: '#f6f8fb', padding: '40px 20px', fontFamily: 'Inter, sans-serif' };
const topBar = { maxWidth: '1180px', margin: '0 auto 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const badge = { display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f1e8ff', color: '#6f42c1', padding: '7px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 900 };
const title = { margin: '14px 0 0', fontSize: '34px', fontWeight: 900 };
const actions = { display: 'flex', gap: '12px' };
const primaryBtn = { border: 'none', background: '#6f42c1', color: '#fff', borderRadius: '12px', padding: '12px 16px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' };
const secondaryBtn = { border: '1px solid #e5e7eb', background: '#fff', color: '#333', borderRadius: '12px', padding: '12px 16px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' };
const tableCard = { maxWidth: '1180px', margin: '0 auto', background: '#fff', border: '1px solid #e9ecef', borderRadius: '22px', padding: '24px', overflowX: 'auto', boxShadow: '0 8px 22px rgba(0,0,0,0.035)' };
const table = { width: '100%', borderCollapse: 'collapse' };
const th = { textAlign: 'left', padding: '12px', fontSize: '11px', color: '#777', textTransform: 'uppercase', borderBottom: '1px solid #f0f0f0' };
const td = { padding: '14px 12px', borderBottom: '1px solid #f8f8f8', fontSize: '14px', color: '#333' };
const muted = { color: '#888', fontSize: '12px' };
const dangerBtn = { border: '1px solid #ffd0d0', background: '#fff5f5', color: '#dc3545', borderRadius: '10px', padding: '8px 10px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' };

export default AdminWifiSessions;
