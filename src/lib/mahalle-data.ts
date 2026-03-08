// Türkiye mahalle verileri — ilçe bazında
// Format: "İl > İlçe": ["Mahalle1", "Mahalle2", ...]

const mahalleData: Record<string, string[]> = {
  // ─── İSTANBUL ───
  "İstanbul > Silivri": [
    "Akören", "Alibey", "Alipaşa", "Bekirli", "Beyciler",
    "Büyükçavuşlu", "Büyükkılıçlı", "Büyüksinekli",
    "Cumhuriyet", "Çanta Balaban", "Çanta Sancaktepe",
    "Çayırdere", "Çeltik", "Danamandıra",
    "Değirmenköy Fevzipaşa", "Değirmenköy İsmetpaşa",
    "Fatih", "Fenerköy", "Gazitepe", "Gümüşyaka",
    "Kadıköy", "Kavaklı", "Kavaklı Hürriyet", "Kavaklı İstiklal",
    "Kurfallı", "Küçük Kılıçlı", "Küçüksinekli",
    "Mimar Sinan", "Ortaköy", "Piri Mehmet Paşa",
    "Sayalar", "Selimpaşa", "Semizkumlar", "Seymen",
    "Yeni", "Yolçatı",
  ],
  "İstanbul > Çatalca": [
    "Akalan", "Atatürk", "Aydınlar", "Bahşayiş", "Başak",
    "Belgrat", "Celepköy", "Çakıl", "Çanakça", "Çiftlikköy",
    "Dağyenice", "Elbasan", "Fatih", "Ferhatpaşa",
    "Gökçeali", "Gümüşpınar", "Hallaçlı", "Hisarbeyli",
    "İhsaniye", "İnceğiz", "İzzettin", "Kabakça",
    "Kaleiçi", "Kalfa", "Karacaköy Merkez", "Karamandere",
    "Kestanelik", "Kızılcaali", "Muratbey Merkez", "Nakkaş",
    "Oklalı", "Ormanlı", "Ovayenice", "Örcünlü", "Örencik",
    "Subaşı", "Yalıköy", "Yaylacık", "Yazlık",
  ],

  // ─── TEKİRDAĞ ───
  "Tekirdağ > Süleymanpaşa": [
    "100. Yıl", "Ahmedikli", "Ahmetçe", "Akçahalil", "Altınova",
    "Araphacı", "Aşağıkılıçlı", "Atatürk", "Avşar", "Aydoğdu",
    "Bahçelievler", "Banarlı", "Barbaros", "Bıyıkali",
    "Cumhuriyet", "Çanakçı", "Çıftlikönü", "Çınarlı",
    "Dedecik", "Değirmenaltı", "Demirli", "Doğrukaracamurat",
    "Ertuğrul", "Evciler", "Ferhadanlı", "Gazioğlu",
    "Generli", "Gündüzlü", "Güveçli", "Husunlu", "Hürriyet",
    "Işıklar", "İnecik", "İstiklal", "Karacakılavuz",
    "Karabezirgan", "Karaçalı", "Karadeniz", "Karaevli",
    "Karahalil", "Karahisarlı", "Karansıllı", "Kaşıkçı",
    "Kayı", "Kazandere", "Kılavuzlu", "Kınıklar",
    "Köseilyas", "Kumbağ", "Mahramlı", "Naipköy", "Namık Kemal",
    "Nusratfakı", "Nusratlı", "Oğuzlu", "Ormanlı", "Ortaca",
    "Ortacami", "Oruçbeyli", "Osmanlı", "Otmanlı",
    "Selçuk", "Semetli", "Seymenli", "Taşumurca", "Tatarlı",
    "Topağaç", "Vatan", "Yağcı", "Yavuz", "Yayabaşı",
    "Yazır", "Yenice", "Yeniköy", "Yukarıkılıçlı", "Yuva", "Zafer",
    "Hacıköy",
  ],
  "Tekirdağ > Çorlu": [
    "Alipaşa", "Cemaliye", "Cumhuriyet", "Çobançeşme",
    "Deregündüzlü", "Esentepe", "Hatip", "Havuzlar",
    "Hıdırağa", "Hürriyet", "Kazımiye", "Kemalettin",
    "Maksutlu", "Muhittin", "Nusratiye", "Önerler",
    "Reşadiye", "Rumeli", "Sarılar", "Seymen",
    "Silahtarağa", "Şahpaz", "Şeyhsinan", "Türkgücü",
    "Yenice", "Zafer",
  ],
  "Tekirdağ > Çerkezköy": [
    "Bağlık", "Cumhuriyet", "Fatih", "Fevzi Paşa",
    "Gazi Mustafa Kemalpaşa", "Gazi Osman Paşa",
    "İstasyon", "Kızılpınar Atatürk", "Kızılpınar Gültepe",
    "Kızılpınar Namık Kemal", "Veliköy", "Yıldırım Beyazıt",
  ],
  "Tekirdağ > Ergene": [
    "Ahimehmet", "Bakırca", "Cumhuriyet", "Esenler",
    "İğneler", "Karamehmet", "Kırkgöz", "Marmaracık",
    "Misinli", "Paşaköy", "Pınarbaşı", "Sağlık",
    "Ulaş", "Vakıflar", "Velimeşe", "Yeşiltepe", "Yulaflı",
  ],
  "Tekirdağ > Kapaklı": [
    "19 Mayıs", "Adnan Menderes", "Atatürk", "Bahçeağıl",
    "Bahçelievler", "Cumhuriyet", "Fatih", "İnönü",
    "İsmet Paşa", "Karaağaç", "Karlı", "Kazım Karabekir",
    "Mevlana", "Mimar Sinan", "Ömer Halisdemir", "Pınarca",
    "Uzunhacı", "Vatan", "Yanıkağıl", "Yıldızkent", "Yunus Emre",
  ],
  "Tekirdağ > Hayrabolu": [
    "Ataköy", "Avluobası", "Aydınevler", "Aydınlar",
    "Bayramşah", "Buzağcı", "Büyükkarakarlı",
    "Cambazdere", "Canhıdır", "Çene", "Çerkezmüsellim",
    "Çıkrıkçı", "Dambaslar", "Danişment", "Delibedir",
    "Duğcalı", "Emiryakup", "Fahrioğlu", "Hacıllı",
    "Hasköy", "Hedeyli", "Hisar", "İlyas", "İsmailli",
    "Kabahöyük", "Kadriye", "Kahya", "Kandamış",
    "Karababa", "Karabürçek", "Karakavak", "Karayahşi",
    "Kemallar", "Kılıçlar", "Kurtdere", "Kutlugün",
    "Küçükkarakarlı", "Lahna", "Muzruplu", "Örey",
    "Övenler", "Parmaksız", "Soylu", "Subaşı",
    "Susuzmüsellim", "Şalgamlı", "Tatarlı",
    "Temrezli", "Umurbey", "Umurcu", "Yörgüç", "Yörükler",
  ],
  "Tekirdağ > Malkara": [
    "Ahievren", "Ahmetpaşa", "Aksakal", "Alaybey", "Allıışık",
    "Bağpınarı", "Balabancık", "Ballı", "Ballısüle",
    "Batkın", "Bayramtepe", "Cami Atik", "Çavuşköy",
    "Çımendere", "Çınaraltı", "Çınarlıdere",
    "Danişment", "Davuteli", "Deliller", "Demircili",
    "Dereköy", "Deveci", "Develi", "Doğanköy", "Dolu",
    "Elmalı", "Emirali", "Esendik", "Evrenbey",
    "Gazibey", "Gönence", "Gözsüz", "Güneşli",
    "Hacıevhat", "Hacısungur", "Halıç", "Hasköy",
    "Hemit", "Hereke", "İbribey", "İbrice", "İshakça",
    "Izgar", "Kadıköy", "Kalaycı", "Karacagür",
    "Karacahalil", "Karaiğdemir", "Karamurat",
    "Kavakçeşme", "Kermeyan", "Kiremitlik", "Kırıkali",
    "Kozyörük", "Kuyucu", "Küçükhıdır", "Kürtüllü",
    "Mestanlar", "Müstecep", "Pirinççeşme", "Sağlamtaş",
    "Sarıpolat", "Sarıyar", "Sarnıç", "Sırtbey",
    "Şahin", "Tekkeköy", "Teteköy", "Vakıfiğdemir",
    "Yaylagöne", "Yaylaköy", "Yeni", "Yenidibek",
    "Yenice", "Yılanlı", "Yörücek", "Yörük",
  ],
  "Tekirdağ > Şarköy": [
    "Aşağıkalamış", "Beyoğlu", "Bulgur", "Camikebir",
    "Cumhuriyet", "Çengelli", "Çınarlı", "Eriklice",
    "Gaziköy", "Gölcük", "Güzelköy", "Hoşköy",
    "İğdebağları", "İshaklı", "İstiklal", "Kirazlı",
    "Kızılcaterzi", "Kocaali", "Mürefte", "Mursallı",
    "Palamut", "Sofuköy", "Şenköy", "Tepeköy",
    "Uçmakdere", "Ulaman", "Yayaağaç", "Yayaköy",
    "Yeniköy", "Yörgüç", "Yukarıkalamış",
  ],
  "Tekirdağ > Muratlı": [
    "Bağçeşme", "Büyükyoncalı", "Cumhuriyet", "Hürriyet",
    "İstiklal", "Karaağaç", "Küçükyoncalı", "Naip",
  ],
  "Tekirdağ > Saray": [
    "Atatürk", "Büyükyoncalı", "Çukuryurt", "Edirne",
    "Güngörmez", "Küçükyoncalı", "Sinanlı", "Sofuhalil",
  ],
  "Tekirdağ > Marmaraereğlisi": [
    "Cumhuriyet", "Hürriyet", "İstiklal", "Sultanköy",
    "Yeniçiftlik",
  ],
};

export const getMahalleler = (il: string, ilce: string): string[] => {
  const key = `${il} > ${ilce}`;
  return (mahalleData[key] || []).sort((a, b) => a.localeCompare(b, "tr"));
};

export const hasMahalleData = (il: string, ilce: string): boolean => {
  const key = `${il} > ${ilce}`;
  return key in mahalleData && mahalleData[key].length > 0;
};

export default mahalleData;
