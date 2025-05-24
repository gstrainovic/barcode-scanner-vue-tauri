import { invoke } from '@tauri-apps/api/core';

export const Config = async () => {
  const strapiUrl = await invoke('get_strapi_url');
  const dialogTitle : string = await invoke('get_dialog_title');
  const version : string = await invoke('get_version');
  return {
    api: {
      strapi: strapiUrl + '/api/',
    },
    version: version,
    dialog: {
      title: dialogTitle,
    },
  };
};

export default Config;