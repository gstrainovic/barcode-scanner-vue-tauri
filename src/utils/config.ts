import { invoke } from '@tauri-apps/api/core';
import type { ConfigInterface } from '@/interfaces';

export async function getConfig(): Promise<ConfigInterface & { api: { strapi: string } }> {
  const cfgJson: ConfigInterface = await invoke('get_config');
  return {
    ...cfgJson,
    api: {
      ...cfgJson.api,
      strapi: `${cfgJson.api.strapi}/api/`
    }
  };
}
