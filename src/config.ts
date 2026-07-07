const isPlaceholderValue = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();
  return !normalized || normalized.includes('dummy') || normalized.includes('example') || normalized.includes('your_') || normalized.includes('changeme');
};

const config = {
  wpUrl: import.meta.env.VITE_WP_URL || '',
  wcConsumerKey: import.meta.env.VITE_WC_CONSUMER_KEY || '',
  wcConsumerSecret: import.meta.env.VITE_WC_CONSUMER_SECRET || '',
  jwtToken: import.meta.env.VITE_JWT_TOKEN || '',
};

export const isWpConfigured = (): boolean => {
  return !!config.wpUrl && !isPlaceholderValue(config.wpUrl) && !isPlaceholderValue(config.wcConsumerKey) && !isPlaceholderValue(config.wcConsumerSecret);
};

export default config;