export function prepareBulkUsers(text: string, existingNames: string[]) {
  const used = new Set(existingNames.map(name => name.toLowerCase()));
  return text.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(ad_soyad => {
    const base = ad_soyad.toLocaleLowerCase('tr-TR').normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i')
      .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    let kullanici_adi = base;
    let suffix = 2;
    while (used.has(kullanici_adi)) kullanici_adi = `${base}_${suffix++}`;
    used.add(kullanici_adi);
    return { ad_soyad, kullanici_adi, valid: base.length > 0 };
  });
}
