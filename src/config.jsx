const getConfig = () => {
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isStaging = hostname.includes('staging');
  const isServerDeployment = !isLocalhost && !isStaging; // covers Vercel or any custom domain

  if (isLocalhost) {
    return {
      API_BASE_URL: 'http://localhost:9090',
      WEB_PAGE_URL: 'http://localhost:5173',
      DEPLOYMENT_ENV: 'development',
      DEBUG: true,
      COOKIE_DOMAIN: 'localhost',
      QR_ENCRYPTION_KEY: 'e9SQU1V0RmKKxz1w6nLKnBX9sFMEy7SXBnsuK900xDM='
    };
  } else if (isStaging) {
    return {
      API_BASE_URL: 'https://server1.prolianceltd.com',
      WEB_PAGE_URL: 'https://finance-manager-ruby.vercel.app',
      DEPLOYMENT_ENV: 'staging',
      DEBUG: true,
      COOKIE_DOMAIN: '.prolianceltd.com',
      QR_ENCRYPTION_KEY: 'e9SQU1V0RmKKxz1w6nLKnBX9sFMEy7SXBnsuK900xDM='
    };
  } else if (isServerDeployment) {
    // Any remote domain (e.g. Vercel, Netlify, AWS, etc.)
    return {
      API_BASE_URL: 'https://server1.prolianceltd.com',
      WEB_PAGE_URL: `https://finance-manager-ruby.vercel.app`,
      DEPLOYMENT_ENV: 'remote',
      DEBUG: false,
      COOKIE_DOMAIN: '.prolianceltd.com',
      QR_ENCRYPTION_KEY: 'e9SQU1V0RmKKxz1w6nLKnBX9sFMEy7SXBnsuK900xDM='
    };
  } else {
    // Fallback for production with a dedicated API domain
    return {
      API_BASE_URL: 'technicalglobaladministrator.e3os.co.uk',
      WEB_PAGE_URL: 'technicalglobaladministrator.e3os.co.uk',
      DEPLOYMENT_ENV: 'production',
      DEBUG: false,
      COOKIE_DOMAIN: '.e3os.co.uk',
      QR_ENCRYPTION_KEY: 'e9SQU1V0RmKKxz1w6nLKnBX9sFMEy7SXBnsuK900xDM='
    };
  }
};

const config = getConfig();

export default config;
