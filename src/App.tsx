import React, { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useApp } from './context/AppContext';
import LoginForm from './components/Auth/LoginForm';
import Sidebar from './components/Layout/Sidebar';
import ChatArea from './components/Chat/ChatArea';
import SettingsPage from './components/Settings/SettingsPage';
import UserRequestsPage from './components/UserRequests/UserRequestsPage';
import MemberManagementPage from './components/MemberManagement/MemberManagementPage';
import PrivateChatOversight from './components/MemberManagement/PrivateChatOversight';
import UserProfile from './components/UserProfile';
import SearchResultsPage from './components/Search/SearchResultsPage';
import AdminDashboardPage from './components/Admin/AdminDashboardPage';
import AuditLogPage from './components/Admin/AuditLogPage';
import Modal from './components/UI/Modal';
import StartChatModal from './components/Chat/StartChatModal';

function App() {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Move useApp hook outside of try-catch to avoid conditional hook calls
  const { currentUser, currentScreen, requestNotificationPermission, notifications, loading, isModalOpen, modalContent, openModal, closeModal } = useApp();

  // Error boundary functionality
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('App Error:', error);
      setHasError(true);
      setErrorMessage(error.message || 'An unexpected error occurred');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled Promise Rejection:', event.reason);
      setHasError(true);
      setErrorMessage('Network or server error occurred');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    // Request notification permission on app load
    if (!notifications.requested && 'Notification' in window) {
      requestNotificationPermission();
    }
  }, [notifications.requested, requestNotificationPermission]);

  useEffect(() => {
    // فتح النوافذ المنبثقة للشاشات الثانوية
    if (currentScreen === 'settings') {
      openModal(<SettingsPage />);
    } else if (currentScreen === 'profile') {
      openModal(<UserProfile />);
    } else if (currentScreen === 'start-chat') {
      openModal(<StartChatModal isOpen={true} onClose={closeModal} />);
    } else {
      closeModal();
    }
    // eslint-disable-next-line
  }, [currentScreen]);

  // If there's an error, show error screen
  if (hasError) {
    return (
      <div className="h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
            Something went wrong
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400 mb-4">
            {errorMessage}
          </p>
          <button
            onClick={() => {
              setHasError(false);
              setErrorMessage('');
              window.location.reload();
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }

  try {
    if (loading) {
      return (
        <div className="h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
              IIB Chat
            </h1>
            <p className="text-secondary-600 dark:text-secondary-400">
              Loading...
            </p>
            <div className="mt-4">
              <div className="w-32 h-2 bg-secondary-200 dark:bg-secondary-700 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-primary-600 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!currentUser) {
      return <LoginForm />;
    }

    const renderCurrentScreen = () => {
      switch (currentScreen) {
        case 'settings':
          return <SettingsPage />;
        case 'user-requests':
          return <UserRequestsPage />;
        case 'member-management':
          return <MemberManagementPage />;
        case 'private-chat-oversight':
          return <PrivateChatOversight />;
        case 'profile':
          return <UserProfile />;
        case 'search-results':
          return <SearchResultsPage />;
        case 'admin-dashboard':
          return <AdminDashboardPage />;
        case 'audit-log':
          return <AuditLogPage />;
        case 'chat':
        default:
          return <ChatArea />;
      }
    };

    return (
      <div className="h-screen flex bg-secondary-50 dark:bg-secondary-900 overflow-hidden">
        {/* Sidebar with responsive width */}
        <div className="w-64 lg:w-80 flex-shrink-0 border-r border-secondary-200 dark:border-secondary-700">
          <Sidebar />
        </div>
        
        {/* Main content area - takes remaining space */}
        <div className="flex-1 flex flex-col min-w-0">
          {renderCurrentScreen()}
        </div>
        
        {/* Modal for popups */}
        <Modal isOpen={isModalOpen} onClose={closeModal}>
          {modalContent}
        </Modal>
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: '#10B981',
              },
            },
            error: {
              duration: 5000,
              style: {
                background: '#EF4444',
              },
            },
          }}
        />
      </div>
    );
  } catch (error) {
    console.error('App render error:', error);
    return (
      <div className="h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
            App Error
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400 mb-4">
            Please refresh the page
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }
}

export default App;