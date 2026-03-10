'use client';

import { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, LogOut, Plane } from 'lucide-react';

// Memoized navigation link component
const NavLink = memo(({ href, active, children }) => (
  <Link
    href={href}
    className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
      active 
        ? 'text-white bg-dark-700' 
        : 'text-dark-300 hover:text-dark-100 hover:bg-dark-800'
    }`}
  >
    {children}
    {active && (
      <motion.div
        layoutId="activeTab"
        className="absolute inset-0 bg-dark-700 rounded-full -z-10"
        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
      />
    )}
  </Link>
));

NavLink.displayName = 'NavLink';

// Mobile nav link
const MobileNavLink = memo(({ href, onClick, children }) => (
  <Link
    href={href}
    onClick={onClick}
    className="block px-4 py-3 rounded-xl text-dark-200 hover:bg-dark-800 hover:text-white transition-colors duration-150"
  >
    {children}
  </Link>
));

MobileNavLink.displayName = 'MobileNavLink';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log('Navbar - Auth state:', { isAuthenticated, user });
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    logout();
    setTimeout(() => {
      router.push('/login');
      window.location.href = '/login';
    }, 300);
  };

  return (
    <nav className="fixed top-0 w-full bg-black/80 backdrop-blur-xl border-b border-dark-600 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="p-2 bg-gradient-accent rounded-xl group-hover:shadow-glow-blue transition-all duration-300">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white hidden sm:block">
              SmartBudgetTrip
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <NavLink href="/" active={pathname === '/'}>
              Home
            </NavLink>
            
            {isAuthenticated ? (
              <>
                {/* User Profile Link */}
                <Link
                  href="/profile"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
                    pathname === '/profile' 
                      ? 'bg-dark-700 ring-1 ring-accent-blue/50' 
                      : 'bg-dark-800 hover:bg-dark-700'
                  }`}
                >
                  {user?.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-dark-600"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-accent flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-dark-200">
                    {user?.name}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-dark-800 text-dark-300 rounded-full hover:bg-dark-700 hover:text-accent-red transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </>  
            ) : (
              <>
                <Link href="/login" className="btn-ghost">
                  Login
                </Link>
                <Link href="/signup" className="btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-dark-800 transition-colors duration-200"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6 text-dark-200" /> : <Menu className="w-6 h-6 text-dark-200" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-dark-600 bg-dark-900/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-2">
              <MobileNavLink href="/" onClick={() => setIsOpen(false)}>
                Home
              </MobileNavLink>
              
              {isAuthenticated ? (
                <>
                  <div className="pt-4 border-t border-dark-600">
                    <div className="flex items-center space-x-3 mb-4 px-4">
                      {user?.picture ? (
                        <img
                          src={user.picture}
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-dark-600"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-accent flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-white">{user?.name}</p>
                        <p className="text-xs text-dark-400">{user?.email}</p>
                      </div>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setIsOpen(false)}
                      className="block w-full mb-2 px-4 py-3 bg-dark-800 text-accent-blue rounded-xl text-center hover:bg-dark-700 transition-colors duration-150"
                    >
                      View Profile
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                      className="w-full px-4 py-3 bg-dark-800 text-accent-red rounded-xl hover:bg-dark-700 transition-colors duration-150"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2 pt-4 border-t border-dark-600">
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="block w-full px-4 py-3 bg-dark-800 text-dark-200 rounded-xl text-center hover:bg-dark-700 transition-colors duration-150"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsOpen(false)}
                    className="block w-full px-4 py-3 bg-accent-blue text-white rounded-xl text-center hover:bg-accent-blue-dark transition-colors duration-150"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default memo(Navbar);

