import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareBulkUsers } from '../lib/bulkUsers.ts';

test('Türkçe adlardan kullanıcı adı oluşturur ve çakışmaları ayırır', () => {
  const rows = prepareBulkUsers('  Ayşe Yılmaz\r\n\nİlker Işık\nAyşe Yılmaz', ['ayse_yilmaz', 'ayse_yilmaz_2']);
  assert.deepEqual(rows.map(row => row.kullanici_adi), ['ayse_yilmaz_3', 'ilker_isik', 'ayse_yilmaz_4']);
  assert.equal(rows[0].ad_soyad, 'Ayşe Yılmaz');
});
test('boş liste ve geçersiz adlar', () => {
  assert.deepEqual(prepareBulkUsers('\n  ', []), []);
  assert.equal(prepareBulkUsers('---', [])[0].valid, false);
});
