
import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import Layout from './components/common/Layout/Layout'
import ErrorBoundary from './components/common/ErrorBoundary'
const HomePage = lazy(() => import('./components/pages/Home/HomePage'))
const NewHomePage = lazy(() => import('./components/pages/Home/NewHomePage'))
import OwnerDashboard from './components/pages/Owner/OwnerDashboard'
import AdminDashboard from './components/pages/Admin/AdminDashboard'
import SecretAdminAccess from './components/pages/Admin/SecretAdminAccess'
import PropertyDetailsPage from './components/pages/Property/PropertyDetailsPage'
import WishlistPage from './components/pages/Wishlist/WishlistPage'
import ContactPage from './components/pages/other/ContactPage'
import AboutPage from './components/pages/other/AboutPage'
import TermsAndConditions from './components/pages/other/TermConditionPage'
import PrivacyPolicy from './components/pages/other/PrivacyPolicyPage'
import FaqPage from './components/pages/other/FaqPage'
import MyBookings from './components/pages/bookings/MyBookings'
import PropertiesPage from './components/pages/Property/Properties'
import SubscriptionPlans from './components/pages/other/SubscriptionPlans'
import MySubscription from './components/pages/Profile/MySubscription'
import PaymentCallback from './components/pages/other/PaymentCallback'
import ScrollToTop from './components/common/ScrollToTop'

// ✅ Newly added imports
import SuccessPage from './components/pages/subscription/SuccessPage'
import ErrorPage from './components/pages/subscription/ErrorPage'
import ProcessingPage from './components/pages/subscription/ProcessingPage' // <-- Added

import './styles/globals.css'
import './styles/components.css'

// comment added

function AppContent() {
  const { user, isAuthenticated } = useAuth()

  // Show Owner Dashboard for logged-in owners
  if (isAuthenticated && user?.role === 'owner') {
    return (
      <Layout>
        <ErrorBoundary>
          <OwnerDashboard />
        </ErrorBoundary>
      </Layout>
    )
  }

  // Show regular HomePage for other users
  return (
    <Layout>
      <ErrorBoundary>
         <Suspense fallback={null}>
        <NewHomePage />
        <HomePage />
        </Suspense>
      </ErrorBoundary>
    </Layout>
  )
}

// Helper component to wrap routes with Layout and ErrorBoundary
const LayoutWrapper = ({ children }) => (
  <Layout>
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  </Layout>
)

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AdminAuthProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              {/* Main App Route */}
              <Route path="/" element={<AppContent />} />

              {/* Public Pages */}
              <Route path="/contact" element={<LayoutWrapper><ContactPage /></LayoutWrapper>} />
              <Route path="/about" element={<LayoutWrapper><AboutPage /></LayoutWrapper>} />
              <Route path="/privacy" element={<LayoutWrapper><PrivacyPolicy /></LayoutWrapper>} />
              <Route path="/termcondition" element={<LayoutWrapper><TermsAndConditions /></LayoutWrapper>} />
              <Route path="/faq" element={<LayoutWrapper><FaqPage /></LayoutWrapper>} />
              <Route path="/properties" element={<LayoutWrapper><PropertiesPage /></LayoutWrapper>} />

              {/* Subscription Plans Page */}
              <Route path="/subscription-plans" element={<LayoutWrapper><SubscriptionPlans /></LayoutWrapper>} />

              {/* Payment Callback Page */}
              <Route path="/payment/callback" element={<LayoutWrapper><PaymentCallback /></LayoutWrapper>} />

              {/* Property & User Pages */}
              <Route path="/property/:id" element={<LayoutWrapper><PropertyDetailsPage /></LayoutWrapper>} />
              <Route path="/wishlist" element={<LayoutWrapper><WishlistPage /></LayoutWrapper>} />
              <Route path="/my-bookings" element={<LayoutWrapper><MyBookings /></LayoutWrapper>} />
              <Route path="/my-subscription" element={<LayoutWrapper><MySubscription /></LayoutWrapper>} />

              {/* ✅ FontPage / PhonePe Integration Result Pages */}
              <Route path="/processing" element={<LayoutWrapper><ProcessingPage /></LayoutWrapper>} /> {/* <-- Added */}
              <Route path="/success" element={<LayoutWrapper><SuccessPage /></LayoutWrapper>} />
              <Route path="/error" element={<LayoutWrapper><ErrorPage /></LayoutWrapper>} />

              {/* Admin Routes */}
              <Route 
                path="/system/admin/secure-access-portal-2025" 
                element={<ErrorBoundary><SecretAdminAccess /></ErrorBoundary>} 
              />
              <Route 
                path="/admin/dashboard" 
                element={<ErrorBoundary><AdminDashboard /></ErrorBoundary>} 
              />

              {/* Fallback Route */}
              <Route path="*" element={<AppContent />} />
            </Routes>
          </Router>
        </AdminAuthProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
