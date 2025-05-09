document.addEventListener('DOMContentLoaded', () => {
    const aracListesiBolumu = document.getElementById('aracListesi');
    const aramaCubugu = document.getElementById('aramaCubugu');
    const kategoriListesiBolumu = document.getElementById('kategoriListesi');
    let allTools = [];
    let seciliKategori = null;

    fetch('tools.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Veriler başarıyla yüklendi:", data);
            if (Array.isArray(data) && data.length > 0) {
                allTools = data;
                kategoriBasliklariniYukle(data);
                
                if (data.length > 0) {
                    const ilkKategori = data[0].kategori;
                    const ilkKategoriElementi = document.querySelector('.kategori-basligi');
                    if (ilkKategoriElementi) {
                        ilkKategoriElementi.classList.add('aktif');
                        seciliKategori = ilkKategori;
                        filtreleVeGoster();
                    }
                }
            } else {
                console.error("Geçerli veri yüklenemedi veya veri boş!");
            }
        })
        .catch(error => {
            console.error('Veri yüklenirken hata oluştu:', error);
            aracListesiBolumu.innerHTML = '<div class="hata-mesaji">Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.</div>';
        });

    function kategoriBasliklariniYukle(kategorilerData) {
        kategoriListesiBolumu.innerHTML = '';
        const kategoriler = [...new Set(kategorilerData.map(item => item.kategori))];
        kategoriler.forEach(kategoriAdi => {
            const kategoriElementi = document.createElement('div');
            kategoriElementi.classList.add('kategori-basligi');
            kategoriElementi.textContent = kategoriAdi;
            kategoriElementi.addEventListener('click', () => {
                seciliKategori = kategoriAdi;
                document.querySelectorAll('.kategori-basligi.aktif').forEach(el => el.classList.remove('aktif'));
                kategoriElementi.classList.add('aktif');
                filtreleVeGoster();
            });
            kategoriListesiBolumu.appendChild(kategoriElementi);
        });
    }

    function araclariGoster(gosterilecekAraclar) {
        aracListesiBolumu.innerHTML = '';
        
        if (gosterilecekAraclar.length === 0) {
            aracListesiBolumu.innerHTML = '<div class="bilgi-mesaji">Bu kategoride araç bulunamadı.</div>';
            return;
        }

        gosterilecekAraclar.forEach(kategoriData => {
            if (!seciliKategori || kategoriData.kategori === seciliKategori) {
                kategoriData.araclar.forEach(arac => {
                    const aracKarti = document.createElement('div');
                    aracKarti.classList.add('arac-karti');
                    aracKarti.innerHTML = `
                        <h3>${arac.isim}</h3>
                        <p>${arac.aciklama}</p>
                        <a href="${arac.url}" target="_blank">Siteye Git</a>
                    `;
                    aracListesiBolumu.appendChild(aracKarti);
                });
            }
        });
    }

    function filtreleVeGoster() {
        const arananKelime = aramaCubugu.value.toLowerCase();
        let filtrelenmisAraclar = [];

        if (seciliKategori) {
            const aktifKategoriData = allTools.find(k => k.kategori === seciliKategori);
            if (aktifKategoriData) {
                filtrelenmisAraclar = [{
                    ...aktifKategoriData,
                    araclar: aktifKategoriData.araclar.filter(arac => {
                        const isimUygun = arac.isim.toLowerCase().includes(arananKelime);
                        const aciklamaUygun = arac.aciklama.toLowerCase().includes(arananKelime);
                        return isimUygun || aciklamaUygun;
                    })
                }];
            }
        } else {
            if (arananKelime) {
                filtrelenmisAraclar = allTools.map(kategoriData => {
                    return {
                        ...kategoriData,
                        araclar: kategoriData.araclar.filter(arac => {
                            const isimUygun = arac.isim.toLowerCase().includes(arananKelime);
                            const aciklamaUygun = arac.aciklama.toLowerCase().includes(arananKelime);
                            return isimUygun || aciklamaUygun;
                        })
                    };
                }).filter(kategoriData => kategoriData.araclar.length > 0);
            } else {
                filtrelenmisAraclar = allTools;
            }
        }
        araclariGoster(filtrelenmisAraclar);
    }

    aramaCubugu.addEventListener('input', filtreleVeGoster);
}); 