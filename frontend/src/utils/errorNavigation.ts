import { NextRouter } from 'next/router';

/**
 * Navigate to error pages using Next.js router
 * This replaces the React Router navigation for error pages
 */
export const navigateToError = {
  /**
   * Navigate to the not found error page
   * @param router Next.js router instance
   */
  notFound: (router: NextRouter) => {
    router.push('/error/not-found');
  },
  
  /**
   * Navigate to the rate limit error page
   * @param router Next.js router instance
   */
  rateLimit: (router: NextRouter) => {
    router.push('/error/rate-limit');
  },
  
  /**
   * Navigate to the server error page
   * @param router Next.js router instance
   */
  serverError: (router: NextRouter) => {
    router.push('/error/server');
  }
};

export default navigateToError;