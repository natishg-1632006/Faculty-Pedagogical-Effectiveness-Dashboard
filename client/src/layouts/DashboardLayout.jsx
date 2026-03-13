import { useMemo, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { 
  Menu, X, Bell, LogOut, Moon, Sun, User, 
  LayoutDashboard, Users, Building2, BookOpen, 
  BarChart3, FileText, Search, Command, Clock3
} from 'lucide-react';
import toast from 'react-hot-toast';
import { commonAPI } from '../services/api';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [recentPages, setRecentPages] = useState([]);
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const commandInputRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const storageKey = `fped-recent-pages-${user?.role || 'guest'}`;
    const currentItem = {
      path: location.pathname,
      label: getMenuItems().find((item) => item.path === location.pathname)?.label || 'Current Page',
    };

    setRecentPages((prev) => {
      const existing = prev.length ? prev : (() => {
        try {
          return JSON.parse(localStorage.getItem(storageKey) || '[]');
        } catch {
          return [];
        }
      })();

      const next = [currentItem, ...existing.filter((item) => item.path !== currentItem.path)].slice(0, 5);
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [location.pathname, user?.role]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
      }

      if (event.key === 'Escape') {
        setCommandOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (commandOpen) {
      setTimeout(() => commandInputRef.current?.focus(), 0);
    } else {
      setCommandQuery('');
    }
  }, [commandOpen]);

  const fetchNotifications = async () => {
    try {
      const { data } = await commonAPI.getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.readStatus).length);
    } catch (error) {
      console.error('Failed to fetch notifications');
    }
  };

  const markAsRead = async (id) => {
    try {
      await commonAPI.markAsRead(id);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await commonAPI.markAllAsRead();
      fetchNotifications();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const getMenuItems = () => {
    if (user?.role === 'Admin') {
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
        { icon: Users, label: 'User Management', path: '/admin/users' },
        { icon: Building2, label: 'Departments', path: '/admin/departments' },
        { icon: BookOpen, label: 'Courses', path: '/admin/courses' },
        { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
        { icon: FileText, label: 'Audit Logs', path: '/admin/logs' },
      ];
    } else if (user?.role === 'HOD') {
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/hod' },
        { icon: BarChart3, label: 'Performance', path: '/hod/performance' },
        { icon: Users, label: 'Faculty Ranking', path: '/hod/ranking' },
        { icon: FileText, label: 'Feedback Forms', path: '/hod/feedback-forms' },
        { icon: FileText, label: 'View Feedback', path: '/hod/view-feedback' },
        { icon: FileText, label: 'Reports', path: '/hod/reports' },
      ];
    } else {
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/faculty' },
        { icon: BarChart3, label: 'Performance', path: '/faculty/performance' },
        { icon: BookOpen, label: 'Courses', path: '/faculty/courses' },
        { icon: FileText, label: 'Reports', path: '/faculty/reports' },
      ];
    }
  };

  const quickActions = useMemo(() => ([
    {
      id: 'toggle-theme',
      label: darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      hint: 'Quick action',
      run: () => {
        toggleDarkMode();
        setCommandOpen(false);
      },
    },
    {
      id: 'notifications-read',
      label: 'Mark All Notifications as Read',
      hint: `${unreadCount} unread`,
      run: async () => {
        await markAllAsRead();
        setCommandOpen(false);
      },
    },
    {
      id: 'refresh-notifications',
      label: 'Refresh Notifications',
      hint: 'Sync latest updates',
      run: async () => {
        await fetchNotifications();
        toast.success('Notifications refreshed');
        setCommandOpen(false);
      },
    },
  ]), [darkMode, unreadCount]);

  const commandItems = useMemo(() => {
    const navItems = getMenuItems().map((item) => ({
      id: item.path,
      label: item.label,
      hint: item.path,
      icon: item.icon,
      run: () => {
        navigate(item.path);
        setCommandOpen(false);
      },
    }));

    const actionItems = quickActions.map((item) => ({
      ...item,
      icon: Command,
    }));

    const items = [...navItems, ...actionItems];
    const query = commandQuery.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) =>
      item.label.toLowerCase().includes(query) || item.hint.toLowerCase().includes(query)
    );
  }, [commandQuery, quickActions, user?.role, navigate]);

  const handleCommandSelect = async (item) => {
    try {
      await item.run();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(6,182,212,0.08),_transparent_24%)]" />
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed left-0 top-0 h-full w-64 glass-card z-40 border-r rounded-none"
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                FPED
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{user?.role} Portal</p>
            </div>

            <nav className="px-4 space-y-2">
              {getMenuItems().map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    location.pathname === item.path
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'hover:bg-blue-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            {recentPages.length > 0 && (
              <div className="px-4 pt-8">
                <div className="mb-3 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                  <Clock3 className="w-4 h-4" />
                  Recent Pages
                </div>
                <div className="space-y-2">
                  {recentPages.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className="w-full rounded-xl border border-gray-200/70 bg-white/60 px-3 py-2 text-left text-sm text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`relative transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 glass-card border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setCommandOpen(true)}
                className="hidden md:flex items-center gap-3 rounded-xl border border-gray-200 bg-white/80 px-4 py-2 text-sm text-gray-500 shadow-sm transition hover:border-blue-200 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-300"
              >
                <Search className="w-4 h-4" />
                <span>Search pages and actions</span>
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700">Ctrl K</span>
              </button>

              <button onClick={toggleDarkMode} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <button 
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="absolute right-0 top-16 w-96 glass-card border shadow-2xl z-50 max-h-96 overflow-y-auto">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:underline">
                        Mark all as read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-gray-500">No notifications</p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        onClick={() => markAsRead(notif._id)}
                        className={`p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                          !notif.readStatus ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <p className="text-sm">{notif.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 pl-4 border-l">
                <div className="text-right">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0)}
                </div>
              </div>

              <button onClick={handleLogout} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <div className="mx-auto max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>

      <AnimatePresence>
        {commandOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-slate-950/50 backdrop-blur-sm p-4"
            onClick={() => setCommandOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              className="mx-auto mt-20 w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-gray-900"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  ref={commandInputRef}
                  value={commandQuery}
                  onChange={(event) => setCommandQuery(event.target.value)}
                  placeholder="Search pages, reports, notifications, or actions..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                />
                <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">ESC</span>
              </div>

              <div className="max-h-[420px] overflow-y-auto p-3">
                {commandItems.length > 0 ? (
                  commandItems.map((item) => {
                    const Icon = item.icon || Command;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleCommandSelect(item)}
                        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-blue-50 dark:hover:bg-gray-800"
                      >
                        <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.hint}</p>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-4 py-10 text-center text-sm text-gray-500">
                    No matching page or action found.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardLayout;
