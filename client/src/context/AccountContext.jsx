import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import { useAuth } from './AuthContext';

const AccountContext = createContext(null);

export function AccountProvider({ children }) {
  const { user, token } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAccounts = useCallback(async () => {
    if (!token || user?.role === 'admin') return;
    setLoading(true);
    try {
      const res = await api.get('/accounts');
      const accList = res.data.accounts || [];
      setAccounts(accList);
      if (accList.length > 0) {
        // Keep currently selected if it exists in list, else pick first
        setSelectedAccount((prev) => {
          if (!prev) return accList[0];
          const found = accList.find(a => a.id === prev.id);
          return found || accList[0];
        });
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const totalBalance = accounts.reduce((acc, curr) => acc + (curr.balance || 0), 0);

  return (
    <AccountContext.Provider value={{
      accounts,
      selectedAccount,
      setSelectedAccount,
      totalBalance,
      refreshAccounts: fetchAccounts,
      loading
    }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  return useContext(AccountContext);
}
