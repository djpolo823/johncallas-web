import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, User, Search, LogOut, ChevronDown, Warehouse, Scissors } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Role } from '../../types';

const Navbar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { totalItems } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const clickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  // Close mobile menu and search when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setSearchQuery('');
    setIsUserDropdownOpen(false);
  }, [location]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalogo?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    } else {
      setIsSearchOpen(false);
    }
  };

  const toggleSearch = () => {
    if (isSearchOpen && searchQuery.trim()) {
      navigate(`/catalogo?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    } else {
      setIsSearchOpen(!isSearchOpen);
      if (!isSearchOpen) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    }
  };

  const handleLogoutClick = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '70px',
        backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.95)' : 'var(--color-white)',
        backdropFilter: isScrolled ? 'blur(10px)' : 'none',
        borderBottom: isScrolled ? '1px solid var(--color-border)' : '1px solid transparent',
        transition: 'all var(--transition-normal)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-menu-btn"
          style={{ display: 'none' }} 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Abrir Menú"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Logo */}
        <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.1em' }} className="text-serif">
          JOHNCALLAS
        </Link>

        {/* Desktop Navigation */}
        <nav style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }} className="desktop-nav">
          {/* Show storefront nav only for non-industrial roles */}
          {(!currentUser || [Role.CLIENT, Role.ADMIN, Role.VENDOR].includes(currentUser.role)) && (
            <>
              <Link to="/catalogo" style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 400 }}>Colección</Link>
              <Link to="/guia" style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 400 }}>Guía de Estilo</Link>
            </>
          )}
          {currentUser && currentUser.role === Role.ADMIN && (
            <>
              <Link to="/admin" style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, color: 'var(--color-gold-subtle)' }}>Admin</Link>
              <Link to="/almacen" style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, color: 'var(--color-gold-subtle)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><Warehouse size={14} />Almacén</Link>
              <Link to="/produccion" style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, color: 'var(--color-gold-subtle)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><Scissors size={14} />Taller</Link>
            </>
          )}
          {currentUser && currentUser.role === Role.VENDOR && (
            <Link to="/vendedor" style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, color: 'var(--color-gold-subtle)' }}>Mis Creaciones</Link>
          )}
          {currentUser && currentUser.role === Role.INVENTARIO && (
            <Link to="/almacen" style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, color: 'var(--color-gold-subtle)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Warehouse size={14} /> Panel de Almacén
            </Link>
          )}
          {currentUser && currentUser.role === Role.ARTESANO && (
            <Link to="/produccion" style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, color: 'var(--color-gold-subtle)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Scissors size={14} /> Panel de Taller
            </Link>
          )}
        </nav>

        {/* Icons & Search */}
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {/* Search System */}
          <div className="search-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center' }}>
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Buscar..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => {
                  if (!searchQuery) setIsSearchOpen(false);
                }}
                className="search-input"
                style={{
                  width: isSearchOpen ? '150px' : '0',
                  opacity: isSearchOpen ? 1 : 0,
                  border: 'none',
                  borderBottom: '1px solid var(--color-black)',
                  background: 'transparent',
                  outline: 'none',
                  padding: '0.25rem 0',
                  fontSize: '0.875rem',
                  transition: 'all var(--transition-normal)',
                }}
              />
              <button 
                type="button" 
                aria-label="Buscar" 
                style={{ marginLeft: '0.5rem', display: 'flex', alignItems: 'center' }} 
                onClick={toggleSearch}
              >
                <Search size={18} />
              </button>
            </form>
          </div>

          {/* Quiet Luxury Account Dropdown / Icon */}
          {currentUser ? (
            <div ref={dropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button 
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8125rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 500,
                  color: 'var(--color-black)'
                }}
              >
                {currentUser.avatar ? (
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name} 
                    style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                ) : (
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-leather-beige)',
                    color: 'var(--color-black)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: 600
                  }}>
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="navbar-username" style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.name.split(' ')[0]}
                </span>
                <ChevronDown size={12} style={{ opacity: 0.6 }} />
              </button>

              {/* Sophisticated Dropdown Menu */}
              {isUserDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '35px',
                  right: 0,
                  backgroundColor: 'var(--color-white)',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
                  padding: '1.5rem',
                  width: '240px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  zIndex: 1100
                }} className="animate-fade-in">
                  <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-gold-subtle)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                      {currentUser.role}
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-black)', display: 'block' }}>{currentUser.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginTop: '0.15rem' }}>{currentUser.email}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {currentUser.role === Role.ADMIN && (
                      <>
                        <Link to="/admin" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-black)' }}>
                          Colección Privada (Admin)
                        </Link>
                        <Link to="/almacen" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-black)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Warehouse size={12} /> Panel de Almacén
                        </Link>
                        <Link to="/produccion" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-black)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Scissors size={12} /> Panel de Taller
                        </Link>
                      </>
                    )}
                    {currentUser.role === Role.VENDOR && (
                      <Link to="/vendedor" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-black)' }}>
                        Mis Creaciones
                      </Link>
                    )}
                    {currentUser.role === Role.INVENTARIO && (
                      <Link to="/almacen" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-black)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Warehouse size={12} /> Panel de Almacén
                      </Link>
                    )}
                    {currentUser.role === Role.ARTESANO && (
                      <Link to="/produccion" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-black)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Scissors size={12} /> Panel de Taller
                      </Link>
                    )}
                    <button 
                      onClick={handleLogoutClick}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: '#D98888',
                        width: '100%',
                        textAlign: 'left'
                      }}
                    >
                      <LogOut size={12} /> Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" aria-label="Cuenta" style={{ display: 'flex', alignItems: 'center' }}>
              <User size={18} />
            </Link>
          )}

          <Link to="/carrito" aria-label="Carrito" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <ShoppingBag size={18} />
            <span style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              backgroundColor: 'var(--color-black)',
              color: 'var(--color-white)',
              fontSize: '0.6rem',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
                            {totalItems}
            </span>
          </Link>
        </div>
      </div>

      {/* Basic responsive styles for navbar */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .navbar-username { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
