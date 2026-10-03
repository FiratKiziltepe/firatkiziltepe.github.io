import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync,readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=new URL('../',import.meta.url);
function walk(directory) {
  return readdirSync(directory,{withFileTypes:true}).flatMap(item=>item.isDirectory()?walk(path.join(directory,item.name)):[path.join(directory,item.name)]);
}
test('NAS kaynaklarında Supabase adresi veya SDK bağlantısı bulunmaz',()=>{
  for(const file of walk(fileURLToPath(new URL('frontend',root)))) {
    if(!/\.(ts|tsx|html|css)$/.test(file)) continue;
    const source=readFileSync(file,'utf8');
    assert.ok(!/supabase\.co|@supabase|cdn\.tailwindcss|fonts\.googleapis/.test(source),file);
  }
});
test('temel ekran bileşenleri özgün arayüzle aynı kalır',()=>{
  for(const filename of ['ContentTable.tsx','Dashboard.tsx','Sidebar.tsx','Header.tsx','ReportPanel.tsx','ChangeHistory.tsx','LessonMultiSelect.tsx','EIcerikTuruInput.tsx','BulkUsers.tsx']) {
    const original=readFileSync(new URL(`../../components/${filename}`,import.meta.url),'utf8')
      .replaceAll('lib/supabase','lib/apiClient').replaceAll('SUPABASE_URL','API_BASE').replaceAll('supabase','nas');
    assert.equal(readFileSync(new URL(`frontend/components/${filename}`,root),'utf8'),original,filename);
  }
});
