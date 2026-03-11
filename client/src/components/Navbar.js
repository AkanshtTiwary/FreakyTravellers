'use client';

import { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, LogOut, Plane, BookOpen } from 'lucide-react';

// Memoized navigation link component
const NavLink = memo(({ href, active, children }) => (
  <Link
    href={href}
    className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
      active
        ? 'text-white bg-white/15 backdrop-blur-sm'
        : 'text-white/80 hover:text-white hover:bg-white/10'
    }`}
  >
    {children}
    {active && (
      <motion.div
        layoutId="activeTab"
        className="absolute inset-0 bg-white/15 backdrop-blur-sm rounded-full -z-10"
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
    className="block px-4 py-3 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors duration-150"
  >
    {children}
  </Link>
));

MobileNavLink.displayName = 'MobileNavLink';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-black/85 backdrop-blur-2xl shadow-lg shadow-black/30'
          : 'bg-transparent backdrop-blur-sm'
      }`}
    >
      {/* bottom gradient border — only when scrolled */}
      {scrolled && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="p-2 bg-gradient-accent rounded-xl group-hover:shadow-glow-blue transition-all duration-300">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white hidden sm:block tracking-tight">
              FreakyTravellers
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <NavLink href="/" active={pathname === '/'}>
              Home
            </NavLink>
            
            {isAuthenticated ? (
              <>
                <NavLink href="/my-bookings" active={pathname === '/my-bookings'}>
                  My Bookings
                </NavLink>
                {/* User Profile Link */}
                <Link
                  href="/profile"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
                    pathname === '/profile'
                      ? 'bg-white/15 ring-1 ring-white/20'
                      : 'hover:bg-white/10'
                  }`}
                >
                  {user?.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-white/20"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-accent flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-white/90">
                    {user?.name}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 text-white/70 rounded-full hover:bg-white/10 hover:text-red-400 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </>  
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 rounded-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200">
                  Login
                </Link>
                <Link href="/signup" className="px-4 py-2 rounded-full text-sm font-bold text-white bg-accent-blue hover:bg-blue-500 transition-all duration-200 shadow-lg shadow-blue-500/25">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-white/10 transition-colors duration-200"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
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
            className="md:hidden border-t border-white/10 bg-black/90 backdrop-blur-2xl"
          >
            <div className="px-4 py-4 space-y-2">
              <MobileNavLink href="/" onClick={() => setIsOpen(false)}>
                Home
              </MobileNavLink>
              
              {isAuthenticated ? (
                <>
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center space-x-3 mb-4 px-4">
                      {user?.picture ? (
                        <img
                          src={user.picture}
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20"
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
                      className="block w-full mb-2 px-4 py-3 bg-white/10 text-accent-blue rounded-xl text-center hover:bg-white/15 transition-colors duration-150"
                    >
                      View Profile
                    </Link>
                    <Link
                      href="/my-bookings"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-2 w-full mb-2 px-4 py-3 bg-white/10 text-accent-green rounded-xl text-center hover:bg-white/15 transition-colors duration-150"
                    >
                      My Bookings
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                      className="w-full px-4 py-3 bg-white/10 text-red-400 rounded-xl hover:bg-white/15 transition-colors duration-150"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2 pt-4 border-t border-white/10">
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="block w-full px-4 py-3 bg-white/10 text-white rounded-xl text-center hover:bg-white/15 transition-colors duration-150"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsOpen(false)}
                    className="block w-full px-4 py-3 bg-accent-blue text-white rounded-xl text-center hover:bg-blue-500 transition-colors duration-150"
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

