import WifiPortalPage from './pages/WifiPortalPage';
import InternetAccessPage from './pages/InternetAccessPage';
import AdminWifiSessionsPage from './pages/AdminWifiSessionsPage';

export const wifiModule = {
    id: 'wifi',
    routes: [
        {
            path: '/wifi',
            component: WifiPortalPage,
            requireAuth: true
        },
        {
            path: '/internet',
            component: InternetAccessPage,
            requireAuth: true
        },
        {
            path: '/admin/wifi',
            component: AdminWifiSessionsPage,
            requireAuth: true,
            requireAdmin: true
        }
    ],
    navLinks: [
        {
            to: '/',
            label: '套餐中心',
            requireAuth: true
        },
        {
            to: '/internet',
            label: '在线状态',
            requireAuth: true
        },
        {
            to: '/admin/wifi',
            label: '会话管理',
            requireAuth: true,
            requireAdmin: true
        }
    ]
};
