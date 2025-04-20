import { invoke } from '@tauri-apps/api/core';

export const config = async () => {
  const strapiUrl = await invoke('get_strapi_url');
  const version : string = await invoke('get_version');
  return {
    api: {
      strapi: strapiUrl + '/api/',
    },
    version: version,
  };
};

export default config;