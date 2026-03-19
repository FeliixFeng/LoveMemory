import { getStorageDriver } from '../storage/index.js';

export const getHealth = async (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    storageDriver: getStorageDriver()
  });
};
