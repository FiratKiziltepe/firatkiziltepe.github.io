import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync,cpSync,mkdirSync,writeFileSync } from 'node:fs';
import path from 'node:path';
const url=process.env.NAS_SIMPLE_TEST_URL;
test('basit paket: phpMyAdmin SQL + baglan.php + alt klasör adresi',{skip:!url},async()=>{
  assert.match(url,/^http:\/\/127\.0\.0\.1:8084\/tablogorusler$/);
  const mysql=process.env.NAS_TEST_MYSQL || 'C:/xampp/mysql/bin/mysql.exe';
  const database='tablogorusler_simple_test_'+Date.now();
  const args=['--no-defaults','--host=127.0.0.1','--port=33083','--user=root'];
  execFileSync(mysql,[...args,'--execute',`CREATE DATABASE ${database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`]);
  const sql=readFileSync('release/kolay/phpmyadmin-kurulum.sql','utf8');
  execFileSync(mysql,[...args,database],{input:sql});
  const fixture=path.resolve('.runtime/simple-web/tablogorusler');
  mkdirSync(fixture,{recursive:true});
  cpSync('release/kolay/tablogorusler',fixture,{recursive:true});
  const file=path.join(fixture,'baglan.php');
  writeFileSync(file,readFileSync(file,'utf8').replace('$host = "localhost";','$host = "127.0.0.1";')
    .replace('$pass = "BURAYA_VERITABANI_SIFRENIZ";','$pass = "";')
    .replace('$db   = "tablogorusler";',`$db = "${database}";`)
    .replace('new mysqli($host, $user, $pass, $db)','new mysqli($host, $user, $pass, $db, 33083)'));
  let cookie='',csrf='';
  async function call(action,body={},status=200) {
    const response=await fetch(`${url}/api/index.php?action=${action}`,{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://127.0.0.1:8084',Cookie:cookie,'X-CSRF-Token':csrf},body:JSON.stringify(body)});
    for(const entry of response.headers.getSetCookie()) cookie=entry.split(';')[0];
    const result=await response.json();assert.equal(response.status,status,JSON.stringify(result));
    if(result?.session) csrf=result.session.access_token;
    return result;
  }
  const index=await fetch(`${url}/`);assert.equal(index.status,200);assert.match(await index.text(),/\.\/assets\//);
  const credentials=JSON.parse(readFileSync('.runtime/simple-admin.json','utf8'));
  await call('login',{username:credentials.username,password:credentials.password});
  await call('query',{table:'e_icerikler',operation:'select'},403);
  await call('manage-password',{action:'change_own_password',new_password:'Simple-test-new-password!'});
  const rows=await call('query',{table:'e_icerikler',operation:'select',limit:5000});assert.equal(rows.length,3488);
  const profiles=await call('query',{table:'profiles',operation:'select'});assert.equal(profiles.length,1);
  // Importing the SQL a second time must neither overwrite the password nor duplicate content.
  execFileSync(mysql,[...args,database],{input:sql});
  assert.equal((await call('query',{table:'e_icerikler',operation:'select',limit:5000})).length,3488);
  await call('login',{username:'admin',password:'Simple-test-new-password!'});
  assert.equal((await fetch(`${url}/baglan.php`)).status,404);
  assert.equal((await fetch(`${url}/setup.php`)).status,404);
  await call('setup',{},404);
});
