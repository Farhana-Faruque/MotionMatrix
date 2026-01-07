import { useState, useEffect } from 'react'
import HomePage from './components/HomePage'
import LoginPage from './components/LoginPage'
import AdminDashboard from './components/AdminDashboard'
import logo from './assets/logo.jpeg'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [previousPage, setPreviousPage] = useState(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [adminUser, setAdminUser] = useState(() => {
    // Restore admin user from localStorage on app load
    const savedUser = localStorage.getItem('adminUser')
    return savedUser ? JSON.parse(savedUser) : null
  })

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.page) {
        setCurrentPage(event.state.page)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Update browser history when page changes
  useEffect(() => {
    window.history.pushState({ page: currentPage }, '', window.location.pathname)
  }, [currentPage])

  // Don't auto-redirect - allow user to navigate freely while logged in

  const navigateToPage = (page) => {
    setIsTransitioning(true)
    setPreviousPage(currentPage)
    setTimeout(() => {
      setCurrentPage(page)
      setIsTransitioning(false)
    }, 300)
  }

  const handleNavigateToLogin = () => {
    navigateToPage('login')
  }

  const handleBackToHome = () => {
    navigateToPage('home')
  }

  const handleLoginSuccess = (userRole, userData) => {
    // Only admin users can access the admin dashboard
    if (userRole === 'admin') {
      setAdminUser(userData);
      // Save admin user to localStorage
      localStorage.setItem('adminUser', JSON.stringify(userData));
      navigateToPage('admin');
    } else {
      // Other roles cannot access the admin dashboard
      navigateToPage('home');
    }
  }

  const handleLogout = () => {
    setAdminUser(null)
    // Clear admin user from localStorage
    localStorage.removeItem('adminUser')
    navigateToPage('home')
  }

  return (
    <div className="app">
      {/* Navbar - Always visible when logged in, or on home/login pages */}
      {(adminUser || currentPage !== 'admin') && (
        <nav className="navbar">
          <div className="nav-container">
            <div className="nav-logo-container">
              <img src="/src/assets/logo.jpeg" alt="MotionMatrix Logo" className="nav-logo-img" />
              <h2 className="nav-logo">MotionMatrix</h2>
            </div>
            <div className="nav-buttons">
              {adminUser ? (
                <>
                  <button 
                    className="nav-btn nav-login-btn"
                    onClick={() => navigateToPage('admin')}
                  >
                    Dashboard
                  </button>
                  <button 
                    className="nav-btn nav-register-btn"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button 
                  className="nav-btn nav-login-btn"
                  onClick={handleNavigateToLogin}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Home Page */}
      {currentPage === 'home' && (
        <HomePage onNavigateToLogin={handleNavigateToLogin} />
      )}
      
      {/* Login Page */}
      {currentPage === 'login' && (
        <div className={`page-wrapper ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
          <LoginPage onBack={handleBackToHome} onLoginSuccess={handleLoginSuccess} />
        </div>
      )}

      {/* Admin Dashboard */}
      {currentPage === 'admin' && adminUser && (
        <AdminDashboard 
          onLogout={handleLogout} 
          adminUser={adminUser}
          onNavigateToHome={() => navigateToPage('home')}
        />
      )}
    </div>
  )
}

export default App
