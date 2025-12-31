// src/components/services/AdminApiService.jsx
import { useAuth } from '../../contexts/AuthContext';
import { useCallback } from 'react';

const useAdminApi = () => {
  const { apiFetch, isAuthenticated } = useAuth();

  const getDaysFromRange = (range) => {
    const ranges = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    };
    return ranges[range] || 7;
  };

  /**
    * Fetch all users with investment data integrated
    */
  const fetchUsers = useCallback(async () => {
    if (!isAuthenticated) {
      console.warn('User not authenticated, skipping fetchUsers');
      return { staff: [], investors: [], potentialInvestors: [] };
    }

    try {
      // Fetch all users (handle pagination)
      const allUsers = [];
      let usersUrl = '/api/user/users/';

      while (usersUrl) {
        const usersResponse = await apiFetch(usersUrl, { method: 'GET' });
        if (!usersResponse.ok) {
          console.error('Failed to fetch users:', usersResponse.status);
          break;
        }

        const usersData = await usersResponse.json();
        const usersBatch = usersData.data || usersData.results || usersData || [];
        allUsers.push(...usersBatch);

        // Check for next page
        usersUrl = usersData.next ? usersData.next.replace(/^.*\/\/[^\/]+/, '') : null;
      }

      // Fetch all investment policies
      const policiesResponse = await apiFetch('/api/investments/policies/', { method: 'GET' });
      let allPolicies = [];
      if (policiesResponse.ok) {
        const policiesData = await policiesResponse.json();
        allPolicies = policiesData.results || policiesData || [];
      }

      // Group policies by user
      let policiesByUser = {};
      allPolicies.forEach(policy => {
        const userId = policy.user_details?.id;
        if (userId) {
          if (!policiesByUser[userId]) {
            policiesByUser[userId] = [];
          }
          policiesByUser[userId].push(policy);
        }
      });

      const mappedUsers = allUsers.map((u) => {
        // Get policies for this user
        const userPolicies = policiesByUser[u.id] || [];
        
        // Calculate totals from policies
        const totalPrincipal = userPolicies.reduce((sum, p) => 
          sum + parseFloat(p.principal_amount || 0), 0
        );
        const totalRoiBalance = userPolicies.reduce((sum, p) => 
          sum + parseFloat(p.roi_balance || 0), 0
        );
        const totalBalance = userPolicies.reduce((sum, p) => 
          sum + parseFloat(p.total_balance || 0), 0
        );

        // Get investment details from profile (legacy)
        const investmentDetails = u.profile?.investment_details || [];
        
        // Map policies to investments format
        const investments = userPolicies.map(policy => ({
          id: policy.id,
          policy_number: policy.policy_number,
          investment_amount: policy.principal_amount,
          remaining_balance: policy.current_balance,
          roi_rate: policy.roi_rate,
          investment_start_date: policy.start_date,
          status: policy.status
        }));

        // Get withdrawals from user profile
        const withdrawals = u.profile?.withdrawal_details || [];

        // Get primary policy for ROI due date
        const primaryPolicy = userPolicies[0];
        const nextRoiDate = primaryPolicy?.roi_frequency === 'monthly' 
          ? calculateNextRoiDate(primaryPolicy?.start_date)
          : 'On Demand';

        return {
          id: u.id,
          date: u.date_joined?.split('T')[0] || new Date().toISOString().split('T')[0],
          uniquePolicy: primaryPolicy?.policy_number || 
                       u.profile?.policy_number || 
                       `PRO-${u.id.toString().padStart(6, '0')}`,
          name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
          email: u.email,
          phoneNumber: u.profile?.work_phone || u.profile?.personal_phone || 'N/A',
          role: u.role,
          job_role: u.job_role,
          department: u.profile?.department || 'N/A',
          status: u.status,
          address: `${u.profile?.street || ''}, ${u.profile?.city || ''}`.trim() || 'N/A',
          dateOfBirth: u.profile?.dob || 'N/A',
          gender: u.profile?.gender || 'N/A',
          firstName: u.first_name || '',
          surname: u.last_name || '',
          otherName: u.middle_name || '',
          residentialAddress: u.profile?.residential_address || 'N/A',
          homeAddress: u.profile?.home_address || 'N/A',
          sex: u.profile?.gender || 'N/A',
          qualifications: u.profile?.professional_qualifications?.map(q => q.name) || [],
          emergencyContact: {
            name: u.profile?.next_of_kin || 'N/A',
            phone: u.profile?.next_of_kin_phone_number || 'N/A',
            relationship: u.profile?.relationship_to_next_of_kin || 'N/A',
          },
          kycStatus: u.profile?.kyc_status || 'Pending',
          roiFrequency: primaryPolicy?.roi_frequency || u.profile?.roi_frequency || 'monthly',
          policyDate: primaryPolicy?.start_date || 
                     u.profile?.policy_date || 
                     u.date_joined?.split('T')[0] || 
                     new Date().toISOString().split('T')[0],
          
          // Investment amounts from policies
          investmentAmount: totalPrincipal,
          remainingBalance: totalBalance,
          roiDue: totalRoiBalance,
          roiDueDate: nextRoiDate,
          
          // Bank details
          disbursementBank: u.profile?.bank_name || 'N/A',
          accountName: u.profile?.account_name || 'N/A',
          accountNumber: u.profile?.account_number || 'N/A',
          
          // Next of kin
          nextOfKinName: u.profile?.next_of_kin_name || 'N/A',
          nextOfKinAddress: u.profile?.next_of_kin_address || 'N/A',
          nextOfKinPhone: u.profile?.next_of_kin_phone || 'N/A',
          nextOfKinSex: u.profile?.next_of_kin_sex || 'N/A',
          
          // Additional fields
          referredBy: u.profile?.referred_by || 'N/A',
          signatureDate: u.profile?.signature_date || 'N/A',
          passportPhoto: u.profile?.passport_photo,
          investorSignature: u.profile?.investor_signature,
          directorSignature: u.profile?.director_signature,
          
          // Investment and withdrawal arrays
          investments: investments,
          withdrawals: withdrawals,
          
          // All user policies
          policies: userPolicies,

          // Include full profile for access to investment_details
          profile: u.profile,
        };
      });

      const sortedStaff = mappedUsers.filter(u => u.role === 'staff');
      const sortedInvestors = mappedUsers.filter(u => u.role === 'investor');
      const sortedPotentialInvestors = mappedUsers.filter(u => u.role === 'user');

      return {
        staff: sortedStaff,
        investors: sortedInvestors,
        potentialInvestors: sortedPotentialInvestors,
      };
    } catch (err) {
      console.error('Error fetching users:', err);
      return { staff: [], investors: [], potentialInvestors: [] };
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Calculate next ROI date based on policy start date
   * Returns next month's 1st if investment was made between 1st-12th
   * Returns month after next if investment was made after 12th
   */
  const calculateNextRoiDate = (startDate) => {
    if (!startDate) return 'N/A';
    
    const start = new Date(startDate);
    const day = start.getDate();
    const now = new Date();
    
    let nextRoiDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    // If investment was made after 12th, ROI starts from next month
    if (day > 12) {
      nextRoiDate = new Date(now.getFullYear(), now.getMonth() + 2, 1);
    }
    
    // If we're past the ROI date, move to next month
    if (nextRoiDate < now) {
      nextRoiDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }
    
    return nextRoiDate.toISOString().split('T')[0];
  };

  /**
   * Fetch activity dashboard data
   */
  const fetchActivityDashboard = useCallback(async (timeRange) => {
    if (!isAuthenticated) {
      console.warn('User not authenticated - attempting fetch anyway');
    }
   
    const days = getDaysFromRange(timeRange);
   
    try {
      const [statsRes, activitiesRes, securityRes] = await Promise.all([
        apiFetch(`/api/user/user-activities/dashboard/quick-stats/?days=${days}`),
        apiFetch(`/api/user/user-activities/?limit=10&ordering=-timestamp`),
        apiFetch(`/api/user/user-activities/security/overview/?days=${days}&limit=5`),
      ]);
   
      const failed = [];
      if (!statsRes.ok) {
        try {
          const errorData = await statsRes.json();
          failed.push(`Stats: ${errorData.detail || 'Unknown error'}`);
        } catch {
          failed.push(`Stats: ${statsRes.status}`);
        }
      }
      if (!activitiesRes.ok) {
        try {
          const errorData = await activitiesRes.json();
          failed.push(`Activities: ${errorData.detail || 'Unknown error'}`);
        } catch {
          failed.push(`Activities: ${activitiesRes.status}`);
        }
      }
      if (!securityRes.ok) {
        try {
          const errorData = await securityRes.json();
          failed.push(`Security: ${errorData.detail || 'Unknown error'}`);
        } catch {
          failed.push(`Security: ${securityRes.status}`);
        }
      }

      if (failed.length > 0) {
        throw new Error(`Dashboard API failed: ${failed.join(', ')}`);
      }

      const [stats, activities, security] = await Promise.all([
        statsRes.json(),
        activitiesRes.json(),
        securityRes.json()
      ]);

      return {
        stats,
        activities: activities.results || activities,
        security: security.results || security
      };
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      throw error;
    }
  }, [isAuthenticated, apiFetch]);

  /**
   * Delete a user by ID
   */
  const deleteUser = useCallback(async (userId) => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await apiFetch(`/api/user/users/${userId}/`, { method: 'DELETE' });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to delete user: ${response.status}`);
      }

      return { success: true };
    } catch (err) {
      console.error('Error deleting user:', err);
      throw err;
    }
  }, [isAuthenticated, apiFetch]);

  /**
    * Fetch investment dashboard data
    */
  const fetchDashboard = useCallback(async () => {
    if (!isAuthenticated) return null;

    try {
      const response = await apiFetch('/api/investments/dashboard/', { method: 'GET' });

      if (response.ok) {
        const data = await response.json();
        // console.log('Dashboard API response:', data);
        return data;
      } else {
        console.error('Failed to fetch dashboard:', response.status);
        return null;
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      return null;
    }
  }, [isAuthenticated, apiFetch]);

  return { fetchUsers, fetchActivityDashboard, deleteUser, fetchDashboard };
};

export default useAdminApi;