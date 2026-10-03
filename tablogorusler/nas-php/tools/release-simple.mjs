import { readFileSync,writeFileSync,cpSync,mkdirSync,existsSync,rmSync } from 'node:fs';
import { randomBytes,randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
const target=path.resolve('release/kolay');
if(!target.startsWith(path.resolve('release')+path.sep)) throw new Error('Paket yolu geçersiz.');
rmSync(target,{recursive:true,force:true});
const web=path.join(target,'tablogorusler');
mkdirSync(web,{recursive:true});
for(const file of ['index.html','assets','baglan.php','.htaccess']) cpSync(path.join('public',file),path.join(web,file),{recursive:true});
mkdirSync(path.join(web,'api'),{recursive:true});
mkdirSync(path.join(web,'server'),{recursive:true});
for(const file of ['bootstrap.php','mysqli.php','auth.php','queries.php','proposals.php','import.php','.htaccess']) {
  let source=readFileSync(path.join('server',file),'utf8');
  if(file==='bootstrap.php') source=source.replace("__DIR__.'/../public/baglan.php'","__DIR__.'/../baglan.php'");
  writeFileSync(path.join(web,'server',file),source);
}
let api=readFileSync('public/api/index.php','utf8').replaceAll("__DIR__.'/../../server/","__DIR__.'/../server/")
  .replace("require __DIR__.'/../server/setup.php';\n",'')
  .replace("    if ($action==='setup') $result=setup($body);\n    elseif ($action==='login')", "    if ($action==='login')");
// Normalize line endings so the packaged API never depends on a removed setup file.
api=api.replace(/require __DIR__\.'\/\.\.\/server\/setup\.php';\r?\n/g,'');
writeFileSync(path.join(web,'api/index.php'),api);
mkdirSync('.runtime',{recursive:true});
const credentialPath='.runtime/simple-admin.json';
const credentials=existsSync(credentialPath)?JSON.parse(readFileSync(credentialPath,'utf8')):{username:'admin',password:'Nas-'+randomBytes(12).toString('base64url'),id:randomUUID()};
writeFileSync(credentialPath,JSON.stringify(credentials));
const php=process.env.PHP_EXE || path.resolve('.runtime/php83/php.exe');
const hash=execFileSync(php,['-n','-r','echo password_hash($argv[1], PASSWORD_DEFAULT);',credentials.password],{encoding:'utf8'}).trim();
const value=text=>text===''?"''":`CONVERT(0x${Buffer.from(String(text),'utf8').toString('hex')} USING utf8mb4)`;
let sql=readFileSync('database/schema.sql','utf8')+'\n\nSTART TRANSACTION;\n';
sql+=`INSERT INTO profiles (id,kullanici_adi,ad_soyad,rol,password_hash,sifre_degistirildi) SELECT ${value(credentials.id)},'admin',${value('Sistem Yöneticisi')},'admin',${value(hash)},0 WHERE NOT EXISTS (SELECT 1 FROM profiles);\n`;
sql+='SET @nas_empty_contents = (SELECT COUNT(*) = 0 FROM e_icerikler);\n';
const data=JSON.parse(readFileSync('database/initial-data.json','utf8'));
let count=0;
for(const [i,row] of data.entries()) {
  const lesson=row.ders_adi??row['DERS ADI']??'';
  if(!lesson||['DERS ADI','ders_adi'].includes(lesson)) continue;
  const values=[Number(row.sira_no??row['SIRA NO']??i+1),lesson,
    row.unite_tema??row['ÜNİTE/TEMA/ ÖĞRENME ALANI']??row['ÜNİTE/TEMA']??'',
    row.kazanim??row['KAZANIM/ÖĞRENME ÇIKTISI/BÖLÜM']??row['KAZANIM/ÇIKTI']??'',
    row.e_icerik_turu??row['E-İÇERİK TÜRÜ']??'',row.aciklama??row['AÇIKLAMA']??'',
    row.program_turu??row['Program Türü']??row['PROGRAM TÜRÜ']??'TYMM'];
  if(!Number.isInteger(values[0])) throw new Error('Başlangıç verisinde sıra numarası hatalı.');
  sql+=`INSERT INTO e_icerikler (sira_no,ders_adi,unite_tema,kazanim,e_icerik_turu,aciklama,program_turu) SELECT ${values.map((item,index)=>index===0?item:value(item)).join(',')} WHERE @nas_empty_contents=1;\n`;
  count++;
}
sql+='COMMIT;\n';
writeFileSync(path.join(target,'phpmyadmin-kurulum.sql'),sql);
writeFileSync(path.join(target,'phpmyadmin-kurulum.sql.gz'),gzipSync(sql));
writeFileSync(path.join(target,'ILK-GIRIS.txt'),`Yalnızca yeni, boş veritabanının ilk giriş bilgileri:\nKullanıcı adı: ${credentials.username}\nGeçici şifre: ${credentials.password}\nİlk girişte şifre değiştirmeniz istenir.\nBu dosyayı ve SQL dosyasını NAS web klasörüne yüklemeyin.\nMevcut kullanıcılar varsa şifrelerini değiştirmez.\n`);
cpSync('KOLAY-KURULUM.md',path.join(target,'KOLAY-KURULUM.md'));
console.log(`Kolay paket hazır: baglan.php + mysqli, ${count} başlangıç içeriği, phpMyAdmin SQL dosyası. setup.php gerekmez.`);
