// src/contexts/AuthContext.jsx (Full, with rememberMe support in login)
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [tenantData, setTenantData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState('local');  // Force 'local' mode (Bearer) by default
  const navigate = useNavigate();

  // Helper to log all cookies
  const debugCookies = (context) => {
    // console.log(`🍪 [${context}] All cookies:`, document.cookie);
    // console.log(`🍪 [${context}] Has access_token:`, document.cookie.includes('access_token'));
    // console.log(`🍪 [${context}] Has refresh_token:`, document.cookie.includes('refresh_token'));
  };

  // Add this function to check cookie details
  const checkCookieDetails = () => {
   ` // console.log('🍪 Cookie Details:');
    // console.log('Document.cookie:', document.cookie);
    
    // // Check if cookies are accessible
    // console.log('Has access_token:', document.cookie.includes('access_token'));
    // console.log('Has refresh_token:', document.cookie.includes('refresh_token'));`
    
    // Check current origin
    // console.log('Current origin:', window.location.origin);
    // console.log('Current host:', window.location.host);
  };

  // Local storage auth check (now primary)
  const checkLocalAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return false;
    }

    try {
     // console.log('🔐 Checking local auth...');
      
      const response = await fetch(`${config.API_BASE_URL}/api/token/validate/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      //console.log('✅ Validate status:', response.status);

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setTenantData({
          tenant_id: data.tenant_id,
          tenant_organizational_id: data.tenant_organizational_id,
          tenant_unique_id: data.tenant_unique_id,
          tenant_schema: data.tenant_schema,
          tenant_name: data.tenant_name,
        });
        setIsAuthenticated(true);
       // console.log('✅ Local auth check successful');
        return true;
      } else {
       // console.warn('⚠️ Local auth check failed, status:', response.status);
        if (response.status === 401 || response.status === 403) {
         // console.log('🔄 Token invalid, attempting refresh...');
          const refreshSuccess = await refreshToken();
          return refreshSuccess;
        }
        return false;
      }
    } catch (err) {
      console.error('❌ Local auth check failed:', err);
      return false;
    }
  };

// Updated login function for OTP flow
const login = async (credentials) => {
  const { identifier, password, rememberMe = false, otp_method } = credentials;
  const isEmail = identifier.includes('@');
  const body = isEmail
    ? { email: identifier, password, remember_me: rememberMe, ...(otp_method && { otp_method }) }
    : { username: identifier, password, remember_me: rememberMe, ...(otp_method && { otp_method }) };

  try {
    // console.log('🔐 Logging in...');
    // console.log('🌍 API Base URL:', config.API_BASE_URL);
    // console.log('🔧 Environment:', config.DEPLOYMENT_ENV);
    debugCookies('before-login');

    const response = await fetch(`${config.API_BASE_URL}/api/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

   // console.log('📡 Login response status:', response.status);

    // Check ALL response headers
    const headers = {};
    for (const [key, value] of response.headers.entries()) {
      headers[key] = value;
    }
    //console.log('📡 All response headers:', headers);

    // Specifically check Set-Cookie
    const setCookieHeader = response.headers.get('set-cookie');
    //console.log('🍪 Set-Cookie header:', setCookieHeader);

    if (response.ok) {
      const data = await response.json();
      //console.log('✅ Login response data:', data);

      // Check if OTP is required
      if (data.requires_otp) {
        // Return OTP requirement info
        return {
          requires_otp: true,
          user_id: data.user_id,
          email: data.email,
          otp_method: data.otp_method,
          message: data.message
        };
      }

      checkCookieDetails();

      // Wait and check cookies
      await new Promise(resolve => setTimeout(resolve, 500));
      debugCookies('after-login');

      // Handle direct login (no OTP required)
      if (data.access && data.refresh) {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        //console.log('💾 Tokens stored in localStorage');

        setUser(data.user);
        setTenantData({
          tenant_id: data.tenant_id,
          tenant_organizational_id: data.tenant_organizational_id,
          tenant_unique_id: data.tenant_unique_id,
          tenant_schema: data.tenant_schema,
          tenant_name: data.tenant_name,
          tenant_primary_color: data.tenant_primary_color,
          tenant_secondary_color: data.tenant_secondary_color,
          tenant_domain: data.tenant_domain,
        });
        setIsAuthenticated(true);
        setAuthMode('local');
        // console.log('✅ User & tenant data set directly from login response');

        return { success: true };
      } else {
        console.error('❌ No tokens (access/refresh) in response body');
        return { error: 'No tokens in response for local mode' };
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Login error response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText };
      }
      return { error: errorData.non_field_errors?.[0] || errorData.detail || 'Login failed' };
    }
  } catch (err) {
    console.error('❌ Login network error:', err);
    return { error: 'Network error' };
  }
};

// Verify OTP and complete login
const verifyOTP = async (identifier, otpCode) => {
  const isEmail = identifier.includes('@');
  const body = isEmail
    ? { email: identifier, otp_code: otpCode }
    : { username: identifier, otp_code: otpCode };

  try {
    // console.log('🔐 Verifying OTP...');

    const response = await fetch(`${config.API_BASE_URL}/api/verify-otp/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    // console.log('📡 Verify OTP response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      // console.log('✅ OTP verification successful, response data:', data);

      checkCookieDetails();

      // Wait and check cookies
      await new Promise(resolve => setTimeout(resolve, 500));
      debugCookies('after-otp-verification');

      if (data.access && data.refresh) {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        // console.log('💾 Tokens stored in localStorage');

        setUser(data.user);
        setTenantData({
          tenant_id: data.tenant_id,
          tenant_organizational_id: data.tenant_organizational_id,
          tenant_unique_id: data.tenant_unique_id,
          tenant_schema: data.tenant_schema,
          tenant_name: data.tenant_name,
          tenant_primary_color: data.tenant_primary_color,
          tenant_secondary_color: data.tenant_secondary_color,
          tenant_domain: data.tenant_domain,
        });
        setIsAuthenticated(true);
        setAuthMode('local');
        // console.log('✅ User & tenant data set after OTP verification');

        return { success: true };
      } else {
        console.error('❌ No tokens in OTP verification response');
        return { error: 'No tokens in response' };
      }
    } else {
      const errorText = await response.text();
      console.error('❌ OTP verification error response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText };
      }
      return { error: errorData.detail || 'OTP verification failed' };
    }
  } catch (err) {
    console.error('❌ OTP verification network error:', err);
    return { error: 'Network error' };
  }
};

// Refresh token (local mode only, since forced)
  const refreshToken = useCallback(async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) {
      await logout();
      return false;
    }

    try {
      //console.log('🔄 Refreshing token (local mode)...');
      
      const response = await fetch(`${config.API_BASE_URL}/api/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refresh }),  // Backend expects 'refresh'
      });

      if (response.ok) {
        const data = await response.json();
       // console.log('✅ Token refresh successful');
        
        if (data.access) {  // Backend returns 'access'
          localStorage.setItem('access_token', data.access);
        }
        if (data.refresh) {  // Backend returns 'refresh'
          localStorage.setItem('refresh_token', data.refresh);
        }
        
        // Sync state
        await checkLocalAuth();
        return true;
      } else {
        const errorText = await response.text();
        console.warn('⚠️ Token refresh failed, status:', response.status, 'error:', errorText);
        await logout();
        return false;
      }
    } catch (err) {
      console.error('❌ Refresh token error:', err);
      await logout();
      return false;
    }
  }, []);

  // Logout (local mode)
  const logout = async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) {
      //console.log('🚪 Logging out (local mode)...');
      await fetch(`${config.API_BASE_URL}/api/logout/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refresh }),  // Backend expects 'refresh'
      });
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Clear state
    setIsAuthenticated(false);
    setUser(null);
    setTenantData(null);
    setAuthMode('local');
    navigate('/login');
  };

  // API helper (always prefer Bearer if token exists)
  const apiFetch = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem('access_token');  // Always check local first
    const headers = {
      ...options.headers,
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Always use Bearer if token present (like Postman)
    if (token) {
      headers.Authorization = `Bearer ${token}`;
     // console.log('🔑 Using Bearer token for request');
    }

    const fetchConfig = {
      ...options,
      headers,
      credentials: 'omit',  // No cookies needed for Bearer
    };

    // console.log('🔍 Making request to:', url);
    // console.log('🔍 Request credentials:', fetchConfig.credentials);
    if (token) {
     //  console.log('🔑 Token present in request');
    } else {
      console.warn('⚠️ No token for request - this will likely 401');
    }

    let response = await fetch(`${config.API_BASE_URL}${url}`, fetchConfig);
    
   // console.log('🔍 Response status:', response.status);

    if (response.status === 401) {
     // console.log('🔄 API call returned 401, attempting refresh...');
      const refreshed = await refreshToken();
      if (refreshed) {
        // Re-fetch with new token
        const newToken = localStorage.getItem('access_token');
        if (newToken) {
          fetchConfig.headers.Authorization = `Bearer ${newToken}`;
        }
        response = await fetch(`${config.API_BASE_URL}${url}`, fetchConfig);
      }
    }

    return response;
  }, [refreshToken]);

  useEffect(() => {
    const initializeAuth = async () => {
      //console.log('🚀 Initializing auth...');
      debugCookies('initialization');
      
      // Prioritize local mode if tokens exist
      if (localStorage.getItem('access_token')) {
        const success = await checkLocalAuth();
        if (success) {
          setAuthMode('local');
        } else {
          // Clear invalid tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setIsLoading(false);
    };
    
    initializeAuth();
  }, []);

  const value = {
    isAuthenticated,
    user,
    tenantData,
    isLoading,
    login,
    verifyOTP,
    logout,
    refreshToken,
    apiFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;