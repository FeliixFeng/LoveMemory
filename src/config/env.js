import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const VALID_STORAGE_DRIVERS = ['json', 'mysql'];

function readStorageDriver() {
  const value = (process.env.STORAGE_DRIVER || 'json').toLowerCase();
  if (VALID_STORAGE_DRIVERS.includes(value)) {
    return value;
  }
  console.warn(`Invalid STORAGE_DRIVER "${value}", fallback to "json".`);
  return 'json';
}

function ensureMysqlEnv(storageDriver) {
  if (storageDriver !== 'mysql') {
    return;
  }

  const requiredKeys = [
    'MYSQL_HOST',
    'MYSQL_PORT',
    'MYSQL_DATABASE',
    'MYSQL_USER',
    'MYSQL_PASSWORD'
  ];

  const missingKeys = requiredKeys.filter((key) => !process.env[key]);
  if (missingKeys.length > 0) {
    throw new Error(`Missing MySQL env vars: ${missingKeys.join(', ')}`);
  }
}

const storageDriver = readStorageDriver();
ensureMysqlEnv(storageDriver);

const env = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  STORAGE_DRIVER: storageDriver,
  MYSQL_HOST: process.env.MYSQL_HOST || '',
  MYSQL_PORT: Number(process.env.MYSQL_PORT) || 3306,
  MYSQL_DATABASE: process.env.MYSQL_DATABASE || '',
  MYSQL_USER: process.env.MYSQL_USER || '',
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || ''
};

export default env;
