// src/services/InvestmentApiService.jsx
import { useAuth } from '../contexts/AuthContext';


import { useCallback } from 'react';

const useInvestmentApi = () => {
  const { apiFetch, isAuthenticated } = useAuth();

  // ==================== INVESTMENT POLICIES ====================

  /**
   * Get all investment policies for authenticated user
   * Admins see all policies, investors see only their own
   */
  const getPolicies = useCallback(async (params = {}) => {
    if (!isAuthenticated) return { results: [], count: 0 };

    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/investments/policies/${queryString ? `?${queryString}` : ''}`;
      const response = await apiFetch(url, { method: 'GET' });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to fetch policies:', response.status);
        return { results: [], count: 0 };
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
      return { results: [], count: 0 };
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Create a new investment policy
   */
  const createPolicy = useCallback(async (policyData) => {
    if (!isAuthenticated) throw new Error('Not authenticated');

    try {
      const response = await apiFetch('/api/investments/policies/', {
        method: 'POST',
        body: JSON.stringify(policyData),
      });

      if (response.ok) {
        return { success: true, data: await response.json() };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || 'Failed to create policy' };
      }
    } catch (error) {
      console.error('Error creating policy:', error);
      return { success: false, error: error.message };
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Get a specific policy by ID
   */
  const getPolicy = useCallback(async (policyId) => {
    if (!isAuthenticated) return null;

    try {
      const response = await apiFetch(`/api/investments/policies/${policyId}/`, {
        method: 'GET',
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to fetch policy:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error fetching policy:', error);
      return null;
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Update a specific policy by ID
   */
  const updatePolicy = useCallback(async (policyId, policyData) => {
    if (!isAuthenticated) return null;

    try {
      const response = await apiFetch(`/api/investments/policies/${policyId}/`, {
        method: 'PUT',
        body: JSON.stringify(policyData),
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to update policy:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error updating policy:', error);
      return null;
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Search policies by policy number, investor name, or email
   */
  const searchPolicies = useCallback(async (query, searchType = 'all') => {
    if (!isAuthenticated) return { results: [], count: 0 };

    try {
      const response = await apiFetch(
        `/api/investments/policies/search/?q=${encodeURIComponent(query)}&search_type=${searchType}`,
        { method: 'GET' }
      );

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to search policies:', response.status);
        return { results: [], count: 0 };
      }
    } catch (error) {
      console.error('Error searching policies:', error);
      return { results: [], count: 0 };
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Change ROI frequency for a policy
   */
  const changeRoiFrequency = useCallback(async (policyId, roiFrequency) => {
    if (!isAuthenticated) throw new Error('Not authenticated');

    try {
      const response = await apiFetch(
        `/api/investments/policies/${policyId}/change_roi_frequency/`,
        {
          method: 'POST',
          body: JSON.stringify({ roi_frequency: roiFrequency }),
        }
      );

      if (response.ok) {
        return { success: true, data: await response.json() };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || 'Failed to change ROI frequency' };
      }
    } catch (error) {
      console.error('Error changing ROI frequency:', error);
      return { success: false, error: error.message };
    }
  }, [isAuthenticated, apiFetch]);

  // ==================== WITHDRAWALS ====================

  /**
   * Get all withdrawal requests
   */
  const getWithdrawals = useCallback(async (params = {}) => {
    if (!isAuthenticated) return { results: [], count: 0 };

    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/investments/withdrawals/${queryString ? `?${queryString}` : ''}`;
      const response = await apiFetch(url, { method: 'GET' });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to fetch withdrawals:', response.status);
        return { results: [], count: 0 };
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      return { results: [], count: 0 };
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Create a withdrawal request
   */
  const createWithdrawal = useCallback(async (withdrawalData) => {
    if (!isAuthenticated) throw new Error('Not authenticated');

    try {
      const response = await apiFetch('/api/investments/withdrawals/', {
        method: 'POST',
        body: JSON.stringify(withdrawalData),
      });

      if (response.ok) {
        return { success: true, data: await response.json() };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || error };
      }
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      return { success: false, error: error.message };
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Approve a withdrawal request (Admin only)
   */
  const approveWithdrawal = useCallback(async (withdrawalId) => {
    if (!isAuthenticated) throw new Error('Not authenticated');

    try {
      const response = await apiFetch(
        `/api/investments/withdrawals/${withdrawalId}/approve/`,
        { method: 'POST' }
      );

      if (response.ok) {
        return { success: true, data: await response.json() };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || 'Failed to approve withdrawal' };
      }
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      return { success: false, error: error.message };
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Process a withdrawal (Admin only)
   */
  const processWithdrawal = useCallback(async (withdrawalId) => {
    if (!isAuthenticated) throw new Error('Not authenticated');

    try {
      const response = await apiFetch(
        `/api/investments/withdrawals/${withdrawalId}/process/`,
        { method: 'POST' }
      );

      if (response.ok) {
        return { success: true, data: await response.json() };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || 'Failed to process withdrawal' };
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      return { success: false, error: error.message };
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Add top-up to existing policy
   */
  const addTopUp = useCallback(async (policyId, amount) => {
    if (!isAuthenticated) throw new Error('Not authenticated');

    try {
      const response = await apiFetch(
        `/api/investments/policies/${policyId}/add_topup/`,
        {
          method: 'POST',
          body: JSON.stringify({ amount }),
        }
      );

      if (response.ok) {
        return { success: true, data: await response.json() };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || 'Failed to add top-up' };
      }
    } catch (error) {
      console.error('Error adding top-up:', error);
      return { success: false, error: error.message };
    }
  }, [isAuthenticated, apiFetch]);

  // ==================== LEDGER ====================

  /**
   * Get ledger entries with filtering
   */
  const getLedger = useCallback(async (params = {}) => {
    if (!isAuthenticated) return { results: [], count: 0 };

    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/investments/ledger/${queryString ? `?${queryString}` : ''}`;
      const response = await apiFetch(url, { method: 'GET' });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to fetch ledger:', response.status);
        return { results: [], count: 0 };
      }
    } catch (error) {
      console.error('Error fetching ledger:', error);
      return { results: [], count: 0 };
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Get ledger summary
   */
  const getLedgerSummary = useCallback(async (params = {}) => {
    if (!isAuthenticated) return null;

    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/investments/ledger/summary/${queryString ? `?${queryString}` : ''}`;
      const response = await apiFetch(url, { method: 'GET' });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to fetch ledger summary:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error fetching ledger summary:', error);
      return null;
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Export ledger to CSV
   */
  const exportLedger = useCallback(async (params = {}) => {
    if (!isAuthenticated) return null;

    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/investments/ledger/export/${queryString ? `?${queryString}` : ''}`;
      const response = await apiFetch(url, { method: 'GET' });

      if (response.ok) {
        const blob = await response.blob();
        return blob;
      } else {
        console.error('Failed to export ledger:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error exporting ledger:', error);
      return null;
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Get ledger grouped by policy
   */
  const getLedgerByPolicy = useCallback(async () => {
    if (!isAuthenticated) return [];

    try {
      const response = await apiFetch('/api/investments/ledger/by_policy/', {
        method: 'GET',
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to fetch ledger by policy:', response.status);
        return [];
      }
    } catch (error) {
      console.error('Error fetching ledger by policy:', error);
      return [];
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Get monthly ledger report
   */
  const getMonthlyLedgerReport = useCallback(async () => {
    if (!isAuthenticated) return null;

    try {
      const response = await apiFetch('/api/investments/ledger/monthly_report/', {
        method: 'GET',
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to fetch monthly report:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error fetching monthly report:', error);
      return null;
    }
  }, [isAuthenticated, apiFetch]);

  // ==================== STATEMENTS ====================

  /**
   * Generate investment statement
   */
  const generateStatement = useCallback(async (statementData) => {
    if (!isAuthenticated) throw new Error('Not authenticated');

    try {
      const response = await apiFetch('/api/investments/statements/generate/', {
        method: 'POST',
        body: JSON.stringify(statementData),
      });

      if (response.ok) {
        return { success: true, data: await response.json() };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || 'Failed to generate statement' };
      }
    } catch (error) {
      console.error('Error generating statement:', error);
      return { success: false, error: error.message };
    }
  }, [isAuthenticated, apiFetch]);

  // ==================== REPORTS ====================

  /**
   * Get investment performance report
   */
  const getPerformanceReport = useCallback(async (params = {}) => {
    if (!isAuthenticated) return null;

    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/investments/reports/performance/${queryString ? `?${queryString}` : ''}`;
      const response = await apiFetch(url, { method: 'GET' });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to fetch performance report:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error fetching performance report:', error);
      return null;
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Get ROI due report
   */
  const getRoiDueReport = useCallback(async () => {
    if (!isAuthenticated) return null;

    try {
      const response = await apiFetch('/api/investments/reports/roi-due/', {
        method: 'GET',
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to fetch ROI due report:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error fetching ROI due report:', error);
      return null;
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Get investment dashboard data
   */
  const getDashboard = useCallback(async () => {
    if (!isAuthenticated) return null;

    try {
      const response = await apiFetch('/api/investments/dashboard/', {
        method: 'GET',
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to fetch dashboard:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      return null;
    }
  }, [isAuthenticated, apiFetch]);

  // ==================== ROI ACCRUAL ====================

  /**
   * Manually trigger ROI accrual (Admin only)
   */
  const accrueRoi = useCallback(async () => {
    if (!isAuthenticated) throw new Error('Not authenticated');

    try {
      const response = await apiFetch('/api/investments/roi/accrue/', {
        method: 'POST',
      });

      if (response.ok) {
        return { success: true, data: await response.json() };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || 'Failed to accrue ROI' };
      }
    } catch (error) {
      console.error('Error accruing ROI:', error);
      return { success: false, error: error.message };
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Get ROI accrual status
   */
  const getRoiAccrualStatus = useCallback(async () => {
    if (!isAuthenticated) return null;

    try {
      const response = await apiFetch('/api/investments/roi/accrue/', {
        method: 'GET',
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to fetch ROI accrual status:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error fetching ROI accrual status:', error);
      return null;
    }
  }, [isAuthenticated, apiFetch]);

  /**
    * Get all investment policies for a specific investor (Admin only)
    */
   const getInvestorPolicies = useCallback(async (investorId, investorEmail) => {
     if (!isAuthenticated) return { investor: null, policies: [], policies_count: 0 };

     try {
       const params = new URLSearchParams();
       if (investorId) params.append('investor_id', investorId);
       if (investorEmail) params.append('investor_email', investorEmail);

       const response = await apiFetch(`/api/investments/policies/by_investor/?${params}`, {
         method: 'GET',
       });

       if (response.ok) {
         return await response.json();
       } else {
         console.error('Failed to fetch investor policies:', response.status);
         return { investor: null, policies: [], policies_count: 0 };
       }
     } catch (error) {
       console.error('Error fetching investor policies:', error);
       return { investor: null, policies: [], policies_count: 0 };
     }
   }, [isAuthenticated, apiFetch]);


  // ===============================
  // TAX MANAGEMENT APIs
  // ===============================

  /**
   * Calculate taxes for a transaction
   */
  const calculateTax = useCallback(async (amount, taxType, annualIncome = null) => {
    if (!isAuthenticated) throw new Error('Not authenticated');

    try {
      const payload = {
        amount: parseFloat(amount),
        tax_type: taxType,
        include_breakdown: true
      };

      if (annualIncome && taxType === 'pit') {
        payload.annual_income = parseFloat(annualIncome);
      }

      const response = await apiFetch('/api/investments/taxes/calculate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        return { success: true, data: await response.json() };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || 'Tax calculation failed' };
      }
    } catch (error) {
      console.error('Error calculating tax:', error);
      return { success: false, error: error.message };
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Get tax records for user or all (admin)
   */
  const getTaxRecords = useCallback(async (params = {}) => {
    if (!isAuthenticated) return { results: [], count: 0 };

    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/investments/taxes/records/${queryString ? `?${queryString}` : ''}`;

      const response = await apiFetch(url, { method: 'GET' });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to fetch tax records:', response.status);
        return { results: [], count: 0 };
      }
    } catch (error) {
      console.error('Error fetching tax records:', error);
      return { results: [], count: 0 };
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Get tax summary for a user
   */
  const getTaxSummary = useCallback(async (userId = null, taxYear = null) => {
    if (!isAuthenticated) return null;

    try {
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      if (taxYear) params.append('tax_year', taxYear);

      const response = await apiFetch(`/api/investments/taxes/summary/?${params}`, {
        method: 'GET'
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to fetch tax summary:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error fetching tax summary:', error);
      return null;
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Get tax certificates
   */
  const getTaxCertificates = useCallback(async (params = {}) => {
    if (!isAuthenticated) return { results: [], count: 0 };

    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/investments/taxes/certificates/${queryString ? `?${queryString}` : ''}`;

      const response = await apiFetch(url, { method: 'GET' });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to fetch tax certificates:', response.status);
        return { results: [], count: 0 };
      }
    } catch (error) {
      console.error('Error fetching tax certificates:', error);
      return { results: [], count: 0 };
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Generate a tax certificate
   */
  const generateTaxCertificate = useCallback(async (certificateType, taxYear, userId = null) => {
    if (!isAuthenticated) throw new Error('Not authenticated');

    try {
      const payload = {
        certificate_type: certificateType,
        tax_year: taxYear.toString()
      };

      if (userId) {
        payload.user_id = userId;
      }

      const response = await apiFetch('/api/investments/taxes/certificates/generate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        return { success: true, data: await response.json() };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || 'Failed to generate tax certificate' };
      }
    } catch (error) {
      console.error('Error generating tax certificate:', error);
      return { success: false, error: error.message };
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Approve a tax certificate (admin only)
   */
  const approveTaxCertificate = useCallback(async (certificateId) => {
    if (!isAuthenticated) throw new Error('Not authenticated');

    try {
      const response = await apiFetch(`/api/investments/taxes/certificates/${certificateId}/approve/`, {
        method: 'POST'
      });

      if (response.ok) {
        return { success: true, data: await response.json() };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || 'Failed to approve tax certificate' };
      }
    } catch (error) {
      console.error('Error approving tax certificate:', error);
      return { success: false, error: error.message };
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Get tax settings (admin only)
   */
  const getTaxSettings = useCallback(async () => {
    if (!isAuthenticated) return null;

    try {
      const response = await apiFetch('/api/investments/taxes/settings/', {
        method: 'GET'
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to fetch tax settings:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error fetching tax settings:', error);
      return null;
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Update tax settings (admin only)
   */
  const updateTaxSettings = useCallback(async (settings) => {
    if (!isAuthenticated) throw new Error('Not authenticated');

    try {
      const response = await apiFetch('/api/investments/taxes/settings/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        return { success: true, data: await response.json() };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || 'Failed to update tax settings' };
      }
    } catch (error) {
      console.error('Error updating tax settings:', error);
      return { success: false, error: error.message };
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Get tax reports
   */
  const getTaxReports = useCallback(async (reportType = 'annual_summary', taxYear = null) => {
    if (!isAuthenticated) return null;

    try {
      const params = new URLSearchParams();
      params.append('report_type', reportType);
      if (taxYear) params.append('tax_year', taxYear);

      const response = await apiFetch(`/api/investments/taxes/reports/?${params}`, {
        method: 'GET'
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to fetch tax reports:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error fetching tax reports:', error);
      return null;
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Get comprehensive user profile data including investments, withdrawals, etc.
   */
  const getUserProfileData = useCallback(async () => {
    if (!isAuthenticated) return null;

    try {
      const response = await apiFetch('/api/user/profile-data/', {
        method: 'GET',
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to fetch user profile data:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile data:', error);
      return null;
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Update user profile data
   */
  const updateUserProfile = useCallback(async (profileData) => {
    if (!isAuthenticated) throw new Error('Not authenticated');

    try {
      const response = await apiFetch('/api/user/profile-data/', {
        method: 'PATCH',
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        return { success: true, data: await response.json() };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || 'Failed to update profile' };
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  }, [isAuthenticated, apiFetch]);

  return {
    // Policies
    getPolicies,
    createPolicy,
    getPolicy,
    updatePolicy,
    searchPolicies,
    changeRoiFrequency,
    getInvestorPolicies,

    // Withdrawals
    getWithdrawals,
    createWithdrawal,
    approveWithdrawal,
    processWithdrawal,
    addTopUp,

    // Ledger
    getLedger,
    getLedgerSummary,
    exportLedger,
    getLedgerByPolicy,
    getMonthlyLedgerReport,

    // Statements
    generateStatement,

    // Reports
    getPerformanceReport,
    getRoiDueReport,
    getDashboard,

    // ROI
    accrueRoi,
    getRoiAccrualStatus,

    // User Profile Data
    getUserProfileData,
    updateUserProfile,

    // Tax Management
    calculateTax,
    getTaxRecords,
    getTaxSummary,
    getTaxCertificates,
    generateTaxCertificate,
    approveTaxCertificate,
    getTaxSettings,
    updateTaxSettings,
    getTaxReports,
  };
};

export default useInvestmentApi;
