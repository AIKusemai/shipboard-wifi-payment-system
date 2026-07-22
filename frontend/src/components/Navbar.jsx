import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CircleUser, LogIn, LogOut, Shield, Wifi } from 'lucide-react';
import { moduleNavLinks } from '../modules';

const Navbar = () => {
    const [showProfile, setShowProfile] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const token = localStorage.getItem('jwt_token');
    const role = localStorage.getItem('user_role');
    const userEmail = localStorage.getItem('user_email') || '';
    const userName = localStorage.getItem('user_name') || '游客';
    const canAccessAdmin = role === 'ADMIN' || role === 'ROLE_ADMIN';

    const visibleModuleLinks = moduleNavLinks.filter((item) => {
        if (item.requireAdmin && !canAccessAdmin) return false;
        if (item.requireAuth && !token) return false;
        return true;
    });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowProfile(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        setShowProfile(false);
        navigate('/login');
    };

    const navVisible = !['/login', '/register'].includes(location.pathname);

    if (!navVisible) {
        return null;
    }

    return (
        <nav style={navStyle}>
            <div style={navContainer}>
                <Link to="/home" style={logoStyle}>
                    <Wifi size={26} color="#1a6a56" strokeWidth={2.6} />
                    <span style={{ marginLeft: '10px' }}>ShipTourWifi</span>
                </Link>

                <div style={linksStyle}>
                    {visibleModuleLinks
                        .filter((item) => !item.requireAdmin)
                        .map((item) => (
                            <Link key={item.to} to={item.to} style={linkItem}>
                                {item.label}
                            </Link>
                        ))}

                    {visibleModuleLinks
                        .filter((item) => item.requireAdmin)
                        .map((item) => (
                            <Link key={item.to} to={item.to} style={adminLink}>
                                <Shield size={16} style={{ marginRight: '5px' }} />
                                {item.label}
                            </Link>
                        ))}

                    {token ? (
                        <div style={{ position: 'relative' }} ref={dropdownRef}>
                            <div style={avatarCircle} onClick={() => setShowProfile(!showProfile)}>
                                <CircleUser size={24} color="#1a6a56" />
                            </div>

                            {showProfile && (
                                <div style={profileDropdown}>
                                    <div style={dropHeader}>
                                        <p style={dropFullName}>{userName}</p>
                                        <p style={dropEmail}>{userEmail}</p>
                                    </div>
                                    <hr style={divider} />
                                    <button style={{ ...dropItem, color: '#b64d35' }} onClick={handleLogout}>
                                        <LogOut size={16} /> 退出登录
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button onClick={() => navigate('/login')} style={signInBtn}>
                            <LogIn size={18} /> 登录
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};

const navStyle = { position: 'sticky', top: 0, zIndex: 1000, backgroundColor: 'rgba(255, 253, 248, 0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #ece5d5', padding: '10px 0' };
const navContainer = {
    maxWidth: '1240px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
};
const logoStyle = {
    display: 'flex',
    alignItems: 'center',
    fontSize: '22px',
    fontWeight: '900',
    color: '#173229',
    textDecoration: 'none'
};
const linksStyle = { display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' };
const linkItem = {
    textDecoration: 'none',
    color: '#44524b',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px'
};
const adminLink = {
    ...linkItem,
    color: '#6f5820',
    padding: '6px 14px',
    background: '#f1e5ba',
    borderRadius: '10px'
};
const avatarCircle = {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: '#e5f0eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: '1px solid #dce7df'
};
const signInBtn = {
    background: '#1a6a56',
    color: '#fff9ee',
    padding: '10px 18px',
    borderRadius: '12px',
    gap: '8px',
    cursor: 'pointer',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    fontWeight: '700',
    fontSize: '14px'
};
const profileDropdown = {
    position: 'absolute',
    top: '50px',
    right: 0,
    width: '240px',
    backgroundColor: '#fffdf8',
    borderRadius: '14px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
    border: '1px solid #eee7d7',
    padding: '8px',
    zIndex: 1001
};
const dropHeader = { padding: '12px 16px' };
const dropFullName = { margin: 0, fontWeight: '800', fontSize: '15px', color: '#173229' };
const dropEmail = { margin: 0, fontSize: '11px', color: '#87928d' };
const dropItem = {
    width: '100%',
    padding: '12px 16px',
    background: 'none',
    border: 'none',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left'
};
const divider = { border: 'none', borderTop: '1px solid #f1ecdf', margin: '4px 0' };

export default Navbar;
