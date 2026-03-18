import env from '../config/env.js';
import { getDataFromJson, saveDataToJson } from './jsonStorage.js';
import { getDataFromMysql, saveDataToMysql } from './mysqlStorage.js';

const storageDriver = env.STORAGE_DRIVER;

export async function readAppData() {
  if (storageDriver === 'mysql') {
    return getDataFromMysql();
  }
  return getDataFromJson();
}

export async function writeAppData(payload) {
  if (storageDriver === 'mysql') {
    return saveDataToMysql(payload);
  }
  return saveDataToJson(payload);
}

export function getStorageDriver() {
  return storageDriver;
}
