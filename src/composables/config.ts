import { invoke } from '@tauri-apps/api/core';

export const config = {
  api: {
    strapi:  await invoke('get_strapi_url') + '/api/',
  },
  version: await invoke('get_version'),
};

export default config;
