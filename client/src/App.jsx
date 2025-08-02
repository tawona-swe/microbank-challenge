import React, { useState, useContext, useEffect, createContext, useCallback } from 'react';
import { createPortal } from 'react-dom';

// Tailwind CSS is assumed to be available.
// If you are using create-react-app, you need to configure Tailwind.
// For Next.js, it's typically pre-configured.

// --- Contexts for State Management ---
// AuthContext: Manages user authentication state (token, user info)
const AuthContext = createContext();

// ClientContext: Manages client-specific data (balance, transactions, all clients for admin)
const ClientContext = createContext();

// --- Auth Provider Component ---
// This component wraps the application and provides the auth state to all children.
const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('jwtToken') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

  const login = useCallback((jwtToken, userInfo) => {
    localStorage.setItem('jwtToken', jwtToken);
    localStorage.setItem('user', JSON.stringify(userInfo));
    setToken(jwtToken);
    setUser(userInfo);
    console.log("User logged in successfully.");
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    console.log("User logged out.");
  }, []);

  const isAuthenticated = useCallback(() => !!token, [token]);
  const isAdmin = useCallback(() => user?.roles?.includes('ROLE_ADMIN'), [user]);

  const value = { token, user, login, logout, isAuthenticated, isAdmin };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Client Data Provider Component ---
// This component fetches and manages the client data, including all API calls.
const ClientProvider = ({ children }) => {
  const { token, user, logout } = useContext(AuthContext);
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_CLIENT_URL = 'http://localhost:8081/api';
  const API_BANKING_URL = 'http://localhost:8082/api';

  const fetchData = useCallback(async () => {
    if (!token) {
      console.log("No token found, skipping data fetch.");
      return;
    }

    setIsLoading(true);
    setError(null);
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // --- CRITICAL DEBUGGING STEP: Log the headers to the console ---
    console.log('Fetching protected data with headers:', headers);

    try {
      // Use Promise.all to fetch all data concurrently for efficiency
      const [profileRes, balanceRes, transactionsRes, clientsRes] = await Promise.all([
        fetch(`${API_CLIENT_URL}/profile`, { headers }),
        fetch(`${API_BANKING_URL}/balance`, { headers }),
        fetch(`${API_BANKING_URL}/transactions`, { headers }),
        user?.roles?.includes('ROLE_ADMIN') ? fetch(`${API_CLIENT_URL}/clients`, { headers }) : Promise.resolve(null),
      ]);

      // Handle profile response
      if (profileRes && profileRes.status === 401) {
        console.error("Profile fetch failed: Unauthorized. Logging out.");
        logout();
        return;
      }
      if (profileRes && profileRes.ok) {
        const profileData = await profileRes.json();
        // Assuming profileData might contain other user details if needed.
        // The balance and transactions are now fetched from the Banking Service.
      } else if (profileRes) {
        const errorData = await profileRes.json();
        setError(errorData.message || 'Failed to fetch user profile.');
      }

      // Handle balance response
      if (balanceRes && balanceRes.status === 401) {
        console.error("Balance fetch failed: Unauthorized. Logging out.");
        logout();
        return;
      }
      if (balanceRes && balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setBalance(balanceData.balance);
      } else if (balanceRes) {
        const errorData = await balanceRes.json();
        setError(errorData.message || 'Failed to fetch account balance.');
      }

      // Handle transactions response
      if (transactionsRes && transactionsRes.status === 401) {
        console.error("Transactions fetch failed: Unauthorized. Logging out.");
        logout();
        return;
      }
      if (transactionsRes && transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setTransactions(transactionsData);
      } else if (transactionsRes) {
        const errorData = await transactionsRes.json();
        setError(errorData.message || 'Failed to fetch transactions.');
      }
      
      // Handle clients list for admin
      if (user?.roles?.includes('ROLE_ADMIN') && clientsRes) {
        if (clientsRes.status === 401) {
          console.error("Clients list fetch failed: Unauthorized. Logging out.");
          logout();
          return;
        }
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          setClients(clientsData);
        } else {
          const errorData = await clientsRes.json();
          setError(errorData.message || 'Failed to fetch client list.');
        }
      }

    } catch (err) {
      console.error('A network error occurred during data fetch:', err);
      setError('A network error occurred. Please ensure both services are running.');
    } finally {
      setIsLoading(false);
    }
  }, [token, user, logout]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Function to handle API calls with error handling and token checking
  const handleProtectedApiCall = async (url, options) => {
    if (!token) {
      setError('User is not authenticated.');
      logout();
      return;
    }
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        setError('Session expired or unauthorized. Please log in again.');
        logout();
        return { ok: false, data: null };
      }

      const data = await response.json();
      return { ok: response.ok, data };
    } catch (err) {
      setError('A network error occurred.');
      console.error('API call failed:', err);
      return { ok: false, data: null };
    }
  };

  const toggleBlacklist = async (clientId, isBlacklisted) => {
    const { ok, data } = await handleProtectedApiCall(
      `${API_CLIENT_URL}/admin/blacklist/${clientId}?isBlacklisted=${!isBlacklisted}`,
      { method: 'PUT' }
    );
    if (ok) {
      fetchData();
    } else {
      setError(data?.message || 'Failed to toggle blacklist status.');
    }
  };

  const deposit = async (amount) => {
    const { ok, data } = await handleProtectedApiCall(
      `${API_BANKING_URL}/deposit`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      }
    );
    if (ok) {
      fetchData();
      setError(null); // Clear any previous errors
    } else {
      setError(data?.message || 'Deposit failed.');
    }
  };

  const withdraw = async (amount) => {
    const { ok, data } = await handleProtectedApiCall(
      `${API_BANKING_URL}/withdraw`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      }
    );
    if (ok) {
      fetchData();
      setError(null); // Clear any previous errors
    } else {
      setError(data?.message || 'Withdrawal failed.');
    }
  };

  const value = { balance, transactions, clients, isLoading, error, toggleBlacklist, deposit, withdraw, fetchData };

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  );
};

// --- Main App Component ---
// This is the entry point of the application.
const App = () => {
  const [currentPage, setCurrentPage] = useState('auth'); // State to manage current page
  const { isAuthenticated, isAdmin } = useContext(AuthContext);

  useEffect(() => {
    if (isAuthenticated()) {
      setCurrentPage(isAdmin() ? 'admin' : 'dashboard');
    } else {
      setCurrentPage('auth');
    }
  }, [isAuthenticated, isAdmin]);

  const renderPage = () => {
    switch (currentPage) {
      case 'auth':
        return <AuthPage setCurrentPage={setCurrentPage} />;
      case 'dashboard':
        return <DashboardPage />;
      case 'admin':
        return <AdminPage />;
      default:
        return <div>404 Page Not Found</div>;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-4xl min-h-[70vh] flex flex-col items-center justify-start">
        <Header />
        <main className="flex-grow w-full max-w-3xl pt-8">
          {renderPage()}
        </main>
        <Footer />
      </div>
    </div>
  );
};

// --- Header Component ---
const Header = () => {
  const { isAuthenticated, logout, isAdmin } = useContext(AuthContext);

  return (
    <header className="w-full flex justify-between items-center pb-2 border-b border-gray-200">
      <div className="flex-1"></div>
      {isAuthenticated() && (
        <nav className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-500">
            {isAdmin() ? 'Admin Panel' : 'Client Dashboard'}
          </span>
          <button
            onClick={logout}
            className="px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-full shadow-md hover:bg-green-600 transition-colors"
          >
            Logout
          </button>
        </nav>
      )}
    </header>
  );
};

// --- Footer Component ---
const Footer = () => (
  <footer className="w-full text-center mt-8 text-gray-400 text-sm">
    &copy; 2025 Microbank. All rights reserved.
  </footer>
);

// --- Auth Page (Login/Register) ---
const AuthPage = ({ setCurrentPage }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const API_CLIENT_URL = 'http://localhost:8081/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const url = isLogin ? `${API_CLIENT_URL}/auth/signin` : `${API_CLIENT_URL}/auth/signup`;
    // FIX: The backend's SignupRequest DTO requires both 'username' and 'email' fields.
    // The frontend will use the single 'username' input for both fields to satisfy this.
    // The 'name' field has been removed as it is not present in the provided backend code.
    const payload = isLogin
      ? { username: username, password: password }
      : { username: username, email: username, password: password }; 

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (response.ok) {
        // Assuming the response body contains the JWT and user info
        login(data.accessToken, { id: data.id, username: data.username, roles: data.roles });
      } else {
        setError(data.message || 'Authentication failed.');
      }
    } catch (err) {
      setError('A network error occurred. Please ensure the client service is running.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-100 rounded-xl shadow-inner max-w-md mx-auto">
      <div className="flex w-full mb-6">
        <button
          className={`flex-1 py-2 text-center font-bold text-md rounded-tl-md ${isLogin ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}`}
          onClick={() => setIsLogin(true)}
        >
          Login
        </button>
        <button
          className={`flex-1 py-2 text-center font-bold text-md rounded-tr-md ${!isLogin ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}`}
          onClick={() => setIsLogin(false)}
        >
          Register
        </button>
      </div>
      <form onSubmit={handleSubmit} className="w-full space-y-6">
        {!isLogin && (
          <div className="space-y-2">
            <label className="block text-gray-700 font-semibold" htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={!isLogin}
            />
          </div>
        )}
        <div className="space-y-2">
          <label className="block text-gray-700 font-semibold" htmlFor="username">Username/Email</label>
          <input
            id="username"
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="username@email.com"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-gray-700 font-semibold" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
        <button
          type="submit"
          className="w-full px-6 py-2 bg-green-600 text-white text-md font-bold rounded-md shadow-md hover:bg-green-700 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
        </button>
      </form>
    </div>
  );
};

// --- Client Dashboard Page ---
const DashboardPage = () => {
  const { user } = useContext(AuthContext);
  const { balance, transactions, isLoading, error, deposit, withdraw, fetchData } = useContext(ClientContext);
  const [transactionAmount, setTransactionAmount] = useState('');
  const [message, setMessage] = useState('');

  const handleTransaction = async (type) => {
    if (!transactionAmount || isNaN(transactionAmount) || transactionAmount <= 0) {
      setMessage('Please enter a valid amount.');
      return;
    }
    const amount = parseFloat(transactionAmount);
    setMessage('');

    try {
      if (type === 'deposit') {
        await deposit(amount);
        setMessage('Deposit successful!');
      } else if (type === 'withdraw') {
        await withdraw(amount);
        setMessage('Withdrawal successful!');
      }
      setTransactionAmount('');
      // fetchData is called inside deposit/withdraw to refresh data
    } catch (err) {
      setMessage('Transaction failed. Please check your account status.');
    }
  };

  // If there's an error from the API, show the message box
  useEffect(() => {
    if (error) {
      setMessage(error);
    }
  }, [error]);

  if (isLoading) return <div className="text-center p-8 text-gray-500">Loading dashboard...</div>;

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-center text-gray-800">
        Welcome, {user?.name || user?.username || user?.email}!
      </h2>
      
      {message && <MessageBox message={message} type={message.startsWith('Error') || message.includes('failed') ? 'error' : 'success'} />}

      <div className="bg-green-500 text-white p-8 rounded-2xl shadow-xl text-center">
        <p className="text-md font-semibold">Current Balance</p>
        <p className="text-5xl font-extrabold mt-2">${balance !== null ? balance.toFixed(2) : '0.00'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-100 p-6 rounded-2xl shadow-inner">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Make a Transaction</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2" htmlFor="amount">Amount</label>
              <input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
              />
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => handleTransaction('deposit')}
                className="flex-1 px-6 py-2 bg-green-500 text-white font-bold rounded-md shadow-md hover:bg-green-600 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                Deposit
              </button>
              <button
                onClick={() => handleTransaction('withdraw')}
                className="flex-1 px-6 py-2 bg-green-500 text-white font-bold rounded-md shadow-md hover:bg-green-600 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 p-6 rounded-2xl shadow-inner max-h-96 overflow-y-auto">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Transaction History</h3>
          <ul className="space-y-2">
            {transactions.length > 0 ? (
              transactions.map((tx, index) => (
                <li key={index} className={`flex justify-between items-center p-4 rounded-md shadow-sm ${tx.type === 'DEPOSIT' ? 'bg-green-100' : 'bg-green-100'}`}>
                  <span className="font-semibold text-gray-700">{tx.type}</span>
                  <span className={`font-bold text-lg ${tx.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}`}>
                    ${tx.amount.toFixed(2)}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-gray-500 text-center py-8">No transactions yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

// --- Admin Panel Page ---
const AdminPage = () => {
  const { clients, toggleBlacklist, isLoading, error } = useContext(ClientContext);

  if (isLoading) return <div className="text-center p-8 text-gray-500">Loading clients...</div>;
  if (error) return <MessageBox message={error} type="error" />;

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-center text-gray-800">Admin Panel</h2>
      <div className="bg-gray-100 p-6 rounded-2xl shadow-inner overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client ID
              </th>
              <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="relative px-6 py-2">
                <span className="sr-only">Toggle Blacklist</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.length > 0 ? (
              clients.map((client) => (
                <tr key={client.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${client.isBlacklisted ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {client.isBlacklisted ? 'Blacklisted' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => toggleBlacklist(client.id, client.isBlacklisted)}
                      className={`py-2 px-4 rounded-md font-semibold text-white transition-colors ${client.isBlacklisted ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      {client.isBlacklisted ? 'Unblacklist' : 'Blacklist'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-500">No clients found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Custom Message Box for alerts ---
const MessageBox = ({ message, type }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const style = {
    success: 'bg-green-100 text-green-800 border-green-400',
    error: 'bg-red-100 text-red-800 border-red-400',
  };

  return createPortal(
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 p-4 rounded-md border-l-4 shadow-md ${style[type]} z-50`} role="alert">
      <p className="font-bold">{type === 'success' ? 'Success' : 'Error'}</p>
      <p>{message}</p>
      <button onClick={() => setIsVisible(false)} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>,
    document.body
  );
};

// --- Main App Setup ---
const Root = () => (
  <AuthProvider>
    <ClientProvider>
      <App />
    </ClientProvider>
  </AuthProvider>
);

export default Root;