// One-time conversion of the isolated copy. Never reads or writes the original app.
import { readFileSync, writeFileSync, readdirSync, renameSync } from 'node:fs';
import path from 'node:path';
const root = path.resolve('frontend');
function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
}
const typePath = path.join(root, 'lib/supabase.ts');
const original = readFileSync(typePath,'utf8');
writeFileSync(typePath, `export { nas, API_BASE, request } from './nasClient';\n\n${original.slice(original.indexOf('export type Profile'))}`);
renameSync(typePath,path.join(root,'lib/apiClient.ts'));
for (const filename of files(root).filter(file => /\.(tsx?|mjs)$/.test(file))) {
  let text = readFileSync(filename,'utf8');
  text = text.replaceAll('lib/supabase','lib/apiClient').replaceAll("'./supabase'","'./apiClient'")
    .replaceAll('SUPABASE_URL','API_BASE').replaceAll('supabase','nas')
    .replaceAll('${API_BASE}/functions/v1/','${API_BASE}?action=')
    .replaceAll("'Authorization': `Bearer ${session.access_token}`", "'X-CSRF-Token': session.access_token")
    .replaceAll("'Authorization': `Bearer ${activeToken}`", "'X-CSRF-Token': activeToken || ''")
    .replaceAll("'Authorization': `Bearer ${session?.access_token}`", "'X-CSRF-Token': session?.access_token || ''")
    .replaceAll('Authorization: `Bearer ${session.access_token}`', "'X-CSRF-Token': session.access_token");
  writeFileSync(filename,text);
}
// Types come from the local client, independent of any cloud SDK.
const authPath = path.join(root,'context/AuthContext.tsx');
let auth = readFileSync(authPath,'utf8').replace("import type { User, Session } from '@nas/nas-js';", "import type { NasUser as User, NasSession as Session } from '../lib/nasClient';");
writeFileSync(authPath,auth);
// Resolve a proposal in a single server transaction instead of multiple browser requests.
const appPath = path.join(root,'App.tsx');
let app=readFileSync(appPath,'utf8').replace("import { nas } from './lib/apiClient';", "import { nas, request } from './lib/apiClient';");
const start=app.indexOf('  // Onaylama/Reddetme');
const end=app.indexOf('  // Talep geri cekme',start);
if(start<0 || end<0) throw new Error('Onay işlevi bulunamadı');
app=app.slice(0,start)+`  // PHP performs authorization, locking, content changes and history atomically.
  const handleResolveProposal = useCallback(async (
    type: 'degisiklik' | 'yeni_satir' | 'silme',
    proposalId: number,
    durum: 'approved' | 'rejected',
    redNedeni?: string,
  ) => {
    try {
      await request('resolve-proposal', { type, id: proposalId, durum, red_nedeni: redNedeni || null });
    } catch (error: any) {
      alert('Talep sonuçlandırılamadı: ' + error.message);
    }
    await fetchData();
  }, [fetchData]);

`+app.slice(end);
app=app.replace("const { data: rows } = await query;", "const { data: rows, error } = await query;\n      if (error) throw new Error(error.message);");
app=app.replaceAll('.then(r => r.data)', '.then(r => { if (r.error) throw new Error(r.error.message); return r.data; })');
writeFileSync(appPath,app);
// Keep existing utility tests attached to their copied implementation.
for(const filename of files(path.resolve('tests')).filter(file=>file.endsWith('.mjs'))) {
  const text=readFileSync(filename,'utf8').replaceAll('../lib/','../frontend/lib/');
  writeFileSync(filename,text);
}
console.log('Yerel kopyanın bağlantıları PHP API olarak değiştirildi.');
