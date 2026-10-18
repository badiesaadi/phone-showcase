import { getStore } from '@netlify/blobs';
import { handle } from './lib/core.mjs';
export default req => handle(req, {
  db: getStore({ name: 'phone-db', consistency: 'strong' }), files: getStore({ name: 'phone-uploads', consistency: 'strong' }), env: process.env
});
export const config = { path: ['/api/*', '/uploads/*'] };
