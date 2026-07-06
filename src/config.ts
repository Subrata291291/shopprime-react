const config = {
  wpUrl: import.meta.env.VITE_WP_URL || '',
  wcConsumerKey: import.meta.env.VITE_WC_CONSUMER_KEY || '',
  wcConsumerSecret: import.meta.env.VITE_WC_CONSUMER_SECRET || '',
  jwtToken: import.meta.env.VITE_JWT_TOKEN || '',
};

export const isWpConfigured = (): boolean =>
  !!config.wpUrl && !!config.wcConsumerKey && !!config.wcConsumerSecret;

export default config;
