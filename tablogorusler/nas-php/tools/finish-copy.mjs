import { readFileSync,writeFileSync } from 'node:fs';
const filename='frontend/components/AdminPanel.tsx';
let source=readFileSync(filename,'utf8').replace("import { nas, API_BASE }", "import { nas, API_BASE, request }");
const start=source.indexOf('      // Replace modunda');
const mapStart=source.indexOf('const batch = jsonData.slice(i, i + BATCH).map',start);
const mapEnd=source.indexOf('\n        const { error } = await nas.from',mapStart);
if (start<0 || mapStart<0 || mapEnd<0) throw new Error('Aktarım işlevi bulunamadı.');
let mapper=source.slice(mapStart,mapEnd).replace('const batch = jsonData.slice(i, i + BATCH).map','const rows = jsonData.map').replaceAll('i + idx','idx');
const oldEnd=source.indexOf("      setUploadProgress('');",mapEnd);
source=source.slice(0,start)+`      // Normalize in the browser; PHP imports all rows in one transaction.
      ${mapper.trim()}
      setUploadProgress('Veriler kaydediliyor...');
      const { inserted } = await request('import-content', { mode: uploadMode, rows });

`+source.slice(oldEnd);
const resetStart=source.indexOf('      await Promise.all([',source.indexOf('const handleResetAllProposals'));
const resetEnd=source.indexOf('      setShowResetModal(false);',resetStart);
source=source.slice(0,resetStart)+"      await request('reset-proposals');\n"+source.slice(resetEnd);
source=source.replace("    await nas.from('profiles').update({", "    const { error } = await nas.from('profiles').update({");
source=source.replace("    setEditingUserId(null);\n    await onRefresh();", "    if (error) { alert('Kullanıcı kaydedilemedi: ' + error.message); return; }\n    setEditingUserId(null);\n    await onRefresh();");
writeFileSync(filename,source);
