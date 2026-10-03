import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeContentTypes } from '../frontend/lib/contentTypeReport.ts';

test('çoklu türleri ayırır, aynı satırda türü bir kez sayar ve boşları korur', () => {
  const report = summarizeContentTypes([
    { e_icerik_turu: 'Video / Ses / VİDEO' },
    { e_icerik_turu: 'Etkileşimli İçerik; Video' },
    { e_icerik_turu: null },
    { e_icerik_turu: 'Özel Tür' },
  ]);
  assert.deepEqual(report.find(row => row.type === 'Video'), { type: 'Video', count: 2, percent: 50 });
  assert.equal(report.find(row => row.type === 'Belirtilmemiş').count, 1);
  assert.equal(report.find(row => row.type === 'Özel Tür').count, 1);
  assert.equal(report.reduce((sum, row) => sum + row.count, 0), 6);
});
test('boş veri kümesinde sayım yapmaz', () => assert.deepEqual(summarizeContentTypes([]), []));
