
export const config = {
  api: {
    strapi: import.meta.env.VITE_STRAPI_URL + '/api/',
  },
  version: import.meta.env.VITE_VERSION,
  dialog: {
    title: import.meta.env.VITE_DIALOG_TITLE,
  },
};

export default config;
