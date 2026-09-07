const isPlaceholderValue = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();
  return !normalized || normalized.includes('dummy') || normalized.includes('example') || normalized.includes('your_') || normalized.includes('changeme');
};

const config = {
  wpUrl: import.meta.env.VITE_WP_URL || '',
  jwtToken: '',
};

export const isWpConfigured = (): boolean => {
  return !!config.wpUrl && !isPlaceholderValue(config.wpUrl);
};

export const isStoreConfigured = (): boolean => {
  return !!config.wpUrl && !isPlaceholderValue(config.wpUrl);
};

export default config;