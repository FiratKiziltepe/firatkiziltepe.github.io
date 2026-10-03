import test from 'node:test';
import assert from 'node:assert/strict';
const base=process.env.NAS_TEST_URL;
class Client {
  cookie=''; csrf='';
  async call(action,body={},expected=200,csrf=true) {
    const response=await fetch(`${base}/api/index.php?action=${action}`,{
      method:'POST',headers:{'Content-Type':'application/json',...(this.cookie?{Cookie:this.cookie}:{}),...(csrf&&this.csrf?{'X-CSRF-Token':this.csrf}:{})},body:JSON.stringify(body),
    });
    for(const cookie of response.headers.getSetCookie()) this.cookie=cookie.split(';')[0];
    const result=await response.json();
    assert.equal(response.status,expected,`${action}: ${JSON.stringify(result)}`);
    if(result?.session) this.csrf=result.session.access_token;
    return result;
  }
  async query(table,operation='select',values,filters=[],expected=200,extra={}) {
    return this.call('query',{table,operation,values,filters,...extra},expected);
  }
}
const eq=(column,value)=>({column,operator:'eq',value});
test('PHP + MariaDB: kullanıcı, yetki, öneri, onay, aktarım ve oturum akışları',{skip:!base},async t=>{
  const admin=new Client();const teacher=new Client();const moderator=new Client();const stranger=new Client();
  let teacherId,moderatorId,firstId,firstLesson,originalText,proposalId;
  await t.test('ilk yönetici ve başlangıç verileri atomik kurulur',async()=>{
    const result=await admin.call('setup',{token:process.env.NAS_TEST_SETUP_TOKEN,kullanici_adi:'admin',ad_soyad:'NAS Test Yönetici',sifre:'Nas-test-admin-123!',import_initial:true});
    assert.ok(result.imported>1000);
    await admin.call('setup',{token:process.env.NAS_TEST_SETUP_TOKEN},409);
    await admin.call('login',{username:'admin',password:'Nas-test-admin-123!'});
    const rows=await admin.query('e_icerikler','select',undefined,[],200,{limit:1});
    [firstId,firstLesson,originalText]=[rows[0].id,rows[0].ders_adi,rows[0].aciklama];
    assert.match(firstLesson,/Hayat Bilgisi/);
    assert.ok(rows[0].created_at.endsWith('Z'));
  });
  await t.test('oturumsuz ve CSRF eksik işlemler reddedilir',async()=>{
    await stranger.query('e_icerikler','select',undefined,[],401);
    await admin.call('query',{table:'e_icerikler',operation:'delete',filters:[eq('id',firstId)]},403,false);
    const response=await fetch(`${base}/api/index.php?action=session`,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://foreign.example'},body:'{}'});
    assert.equal(response.status,403);
  });
  await t.test('SQL alanları ve son yönetici rolü korunur',async()=>{
    await admin.query('e_icerikler; DROP TABLE profiles','select',undefined,[],400);
    await admin.query('e_icerikler','select',undefined,[eq('password_hash','x')],400);
    const profiles=await admin.query('profiles');
    assert.ok(!('password_hash' in profiles[0]));
    await admin.query('profiles','update',{rol:'teacher'},[eq('id',profiles[0].id)],409);
  });
  await t.test('kullanıcı oluşturulur, parola değişikliği zorunludur',async()=>{
    const result=await admin.call('create-user',{kullanici_adi:'ogretmen',ad_soyad:'Test Öğretmen',sifre:'ilk-parola',atanan_dersler:[firstLesson]});
    teacherId=result.user.id;
    await admin.call('create-user',{kullanici_adi:'ogretmen',ad_soyad:'Aynı kişi',sifre:'ilk-parola'},409);
    await teacher.call('login',{username:'ogretmen',password:'ilk-parola'});
    await teacher.query('e_icerikler','select',undefined,[],403);
    await teacher.call('manage-password',{action:'change_own_password',new_password:'Yeni-parola-123!'});
    const resultMod=await admin.call('create-user',{kullanici_adi:'moderator',ad_soyad:'Test Moderatör',sifre:'ilk-parola',rol:'moderator',atanan_dersler:[firstLesson]});
    moderatorId=resultMod.user.id;
    await moderator.call('login',{username:'moderator',password:'ilk-parola'});
    await moderator.call('manage-password',{action:'change_own_password',new_password:'Yeni-parola-123!'});
  });
  await t.test('ders yetkisi ve yönetici sınırları sunucuda uygulanır',async()=>{
    const rows=await teacher.query('e_icerikler');
    assert.ok(rows.length>0&&rows.every(row=>row.ders_adi===firstLesson));
    const other=await admin.query('e_icerikler','select',undefined,[{column:'ders_adi',operator:'neq',value:firstLesson}],200,{limit:1});
    await teacher.query('degisiklik_onerileri','insert',{e_icerik_id:other[0].id,alan:'aciklama',yeni_deger:'Yetkisiz'},[],403);
    await teacher.query('profiles','update',{rol:'admin'},[eq('id',teacherId)],403);
    await teacher.call('create-user',{kullanici_adi:'hack',ad_soyad:'Hack',sifre:'password'},403);
    await moderator.call('manage_user_status',{p_action:'list'},403);
  });
  await t.test('öneri sahibi sunucudan alınır ve öğretmen onaylayamaz',async()=>{
    const result=await teacher.query('degisiklik_onerileri','insert',{user_id:moderatorId,e_icerik_id:firstId,alan:'aciklama',eski_deger:'sahte',yeni_deger:'Yeni Türkçe açıklama: İ ğ ş ü',gerekce:'İnceleme'},[],200,{returning:true,single:true});
    proposalId=result.id;
    assert.equal(result.user_id,teacherId);assert.equal(result.eski_deger,originalText);
    await teacher.call('resolve-proposal',{type:'degisiklik',id:proposalId,durum:'approved'},403);
    await teacher.query('degisiklik_onerileri','update',{durum:'approved'},[eq('id',proposalId)],400);
  });
  await t.test('alan onayı, diğer taleplerin reddi ve ikinci onay engeli atomiktir',async()=>{
    const duplicate=await teacher.query('degisiklik_onerileri','insert',{e_icerik_id:firstId,alan:'aciklama',yeni_deger:'Diğer açıklama'},[],200,{single:true});
    await moderator.call('resolve-proposal',{type:'degisiklik',id:proposalId,durum:'approved'});
    const row=await admin.query('e_icerikler','select',undefined,[eq('id',firstId)],200,{single:true});
    assert.equal(row.aciklama,'Yeni Türkçe açıklama: İ ğ ş ü');
    const other=await admin.query('degisiklik_onerileri','select',undefined,[eq('id',duplicate.id)],200,{single:true});assert.equal(other.durum,'rejected');
    await moderator.call('resolve-proposal',{type:'degisiklik',id:proposalId,durum:'approved'},409);
    const logs=await admin.query('degisiklik_loglari');assert.ok(logs.some(log=>log.islem_tipi==='onaylandi'));
  });
  await t.test('eski değeri değişmiş öneri onaylanmaz ve durum geri alınır',async()=>{
    const p=await teacher.query('degisiklik_onerileri','insert',{e_icerik_id:firstId,alan:'aciklama',yeni_deger:'Eski öneri'},[],200,{single:true});
    await admin.query('e_icerikler','update',{aciklama:'Yönetici doğrudan güncelledi'},[eq('id',firstId)]);
    await moderator.call('resolve-proposal',{type:'degisiklik',id:p.id,durum:'approved'},409);
    const row=await admin.query('degisiklik_onerileri','select',undefined,[eq('id',p.id)],200,{single:true});assert.equal(row.durum,'pending');
    await teacher.query('degisiklik_onerileri','update',{yeni_deger:'Düzenlendi'},[eq('id',p.id)]);
    await teacher.query('degisiklik_onerileri','delete',undefined,[eq('id',p.id)]);
  });
  let newId;
  await t.test('yeni satır onayı ve eşzamanlı ikinci onay aynı satırı iki kez eklemez',async()=>{
    const p=await teacher.query('yeni_satir_onerileri','insert',{ders_adi:firstLesson,unite_tema:'Test Ünite',kazanim:'Test Kazanım',e_icerik_turu:'Video',aciklama:'NAS-test-yeni-satir',program_turu:'TYMM'},[],200,{single:true});
    const body={type:'yeni_satir',id:p.id,durum:'approved'};
    const outcomes=await Promise.all([fetch(`${base}/api/index.php?action=resolve-proposal`,{method:'POST',headers:{'Content-Type':'application/json',Cookie:moderator.cookie,'X-CSRF-Token':moderator.csrf},body:JSON.stringify(body)}),fetch(`${base}/api/index.php?action=resolve-proposal`,{method:'POST',headers:{'Content-Type':'application/json',Cookie:admin.cookie,'X-CSRF-Token':admin.csrf},body:JSON.stringify(body)})]);
    assert.deepEqual(outcomes.map(r=>r.status).sort(),[200,409]);
    const rows=await admin.query('e_icerikler','select',undefined,[eq('aciklama','NAS-test-yeni-satir')]);assert.equal(rows.length,1);newId=rows[0].id;
  });
  await t.test('silme onayı ilişkili değişiklikleri reddeder',async()=>{
    const change=await teacher.query('degisiklik_onerileri','insert',{e_icerik_id:newId,alan:'aciklama',yeni_deger:'Bekleyen'},[],200,{single:true});
    const p=await teacher.query('silme_talepleri','insert',{e_icerik_id:newId,aciklama:'Gereksiz'},[],200,{single:true});
    await moderator.call('resolve-proposal',{type:'silme',id:p.id,durum:'approved'});
    const rows=await admin.query('e_icerikler','select',undefined,[eq('id',newId)]);assert.equal(rows.length,0);
    const related=await admin.query('degisiklik_onerileri','select',undefined,[eq('id',change.id)],200,{single:true});assert.equal(related.durum,'rejected');
  });
  await t.test('hatalı replace aktarımı eski verileri silmez',async()=>{
    const before=(await admin.query('e_icerikler')).length;
    await admin.call('import-content',{mode:'replace',rows:[{ders_adi:'Test',sira_no:1},{ders_adi:'',sira_no:2}]},400);
    assert.equal((await admin.query('e_icerikler')).length,before);
    await admin.call('import-content',{mode:'append',rows:[{ders_adi:'Test',sira_no:99999,aciklama:'Aktarılan içerik'}]});
  });
  await t.test('pasif hesap açık oturumda hemen engellenir, tekrar aktif edilince eski oturum dönmez',async()=>{
    await admin.call('manage_user_status',{p_action:'set',p_active:false,p_user_id:teacherId});
    await teacher.query('e_icerikler','select',undefined,[],401);
    await teacher.call('login',{username:'ogretmen',password:'Yeni-parola-123!'},401);
    await admin.call('manage_user_status',{p_action:'set',p_active:true,p_user_id:teacherId});
    await teacher.call('login',{username:'ogretmen',password:'Yeni-parola-123!'});
  });
  await t.test('atanan dersleri boş kullanıcı içerik göremez',async()=>{
    await admin.query('profiles','update',{atanan_dersler:[]},[eq('id',teacherId)]);
    assert.deepEqual(await teacher.query('e_icerikler'),[]);
  });
  await t.test('yönetici parola sıfırlayınca mevcut oturum iptal edilir',async()=>{
    await admin.call('manage-password',{action:'admin_change_password',user_id:teacherId,new_password:'Sifirlanan-123!'});
    await teacher.call('session',{},401);
    await teacher.call('login',{username:'ogretmen',password:'Sifirlanan-123!'});
    await teacher.query('e_icerikler','select',undefined,[],403);
  });
  await t.test('çıkış yapınca oturum kullanılamaz',async()=>{
    await moderator.call('logout');
    await moderator.query('e_icerikler','select',undefined,[],401);
  });
  await t.test('toplu parola ve kullanıcı erişim işlemleri çalışır',async()=>{
    const result=await admin.call('manage-password',{action:'reset_all_passwords'});assert.equal(result.updated,3);
    await admin.call('manage-password',{action:'change_own_password',new_password:'Nas-test-admin-123!'});
    const statuses=await admin.call('manage_user_status',{p_action:'list'});assert.equal(Object.keys(statuses.statuses).length,3);
    await admin.call('manage_user_status',{p_action:'set',p_active:false,p_user_id:null});
    await admin.call('manage_user_status',{p_action:'set',p_active:true,p_user_id:null});
    await admin.call('reset-proposals');
    assert.deepEqual(await admin.query('degisiklik_onerileri'),[]);
  });
  await t.test('giriş denemeleri sınırlanır',async()=>{
    for(let i=0;i<10;i++) await stranger.call('login',{username:'wrong-user',password:'wrong-password'},401);
    await stranger.call('login',{username:'wrong-user',password:'wrong-password'},429);
  });
});
