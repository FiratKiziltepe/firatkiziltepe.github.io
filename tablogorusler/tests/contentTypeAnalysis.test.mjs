import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeContentType, normalizeContentText } from '../lib/contentTypeAnalysis.ts';

test('açıklamadaki video türde yoksa işaretler', () => {
  assert.deepEqual(analyzeContentType('Kısa bir video hazırlanır.', 'Ses').map(issue => issue.kind), ['video']);
});

test('etkileşimli içerik ayrı bir tür olarak beklenir', () => {
  assert.deepEqual(analyzeContentType('Etkileşimli içerik hazırlanır.', 'Video').map(issue => issue.kind), ['interactive']);
});

test('etkileşimli video hem Video hem Etkileşimli İçerik gerektirir', () => {
  assert.deepEqual(analyzeContentType('Etkileşimli video hazırlanır.', 'Video').map(issue => issue.kind), ['interactive']);
  assert.deepEqual(analyzeContentType('Etkileşimli video hazırlanır.', 'Etkileşimli İçerik').map(issue => issue.kind), ['video']);
  assert.deepEqual(analyzeContentType('Etkileşimli video hazırlanır.', '').map(issue => issue.kind), ['video', 'interactive']);
});

test('infografik ve ses eksikliklerini birlikte bulur', () => {
  assert.deepEqual(analyzeContentType('İnfografiği sesli anlatımla destekleyin.', 'Video').map(issue => issue.kind), ['infographic', 'audio']);
});

test('türler varsa sorun üretmez ve Türkçe büyük harfleri karşılaştırır', () => {
  assert.deepEqual(analyzeContentType('VİDEO, ETKİLEŞİMLİ İÇERİK, İNFOGRAFİK ve SES', 'Video/Etkileşimli İçerik/İnfografik/Ses'), []);
  assert.equal(normalizeContentText('İÇERİK'), 'icerik');
});

test('sessiz ve videosuz ifadeleri istek saymaz', () => {
  assert.deepEqual(analyzeContentType('Sessiz ve videosuz bir sunu hazırlanır.', ''), []);
});
