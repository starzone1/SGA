import { Article, User, ArticleComment } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'kancah4d-official',
    name: 'KANCAH4D Official',
    email: 'official@kancah4d.com',
    role: 'author',
    avatar: 'https://ik.imagekit.io/dxokd3m9y/sgaicon.png',
    bio: 'Official Brand Representative & Jurnalis Media KANCAH4D. Menyajikan warta resmi, artikel edukasi teknologi, dan hiburan online terpercaya.',
    joinedDate: 'Januari 2026',
    articlesCount: 5,
    followersCount: 152,
    profileLikesCount: 98
  },
  {
    id: 'user-admin-owner',
    name: 'Admin SGA Redaksi',
    email: 'admin@sganews.id',
    role: 'admin',
    avatar: 'https://ik.imagekit.io/dxokd3m9y/sgaicon.png',
    bio: 'Pemimpin Redaksi Utama & Owner SGA News Portal. Bertanggung jawab atas kebijakan jurnalistik, verifikasi berita, dan pengawasan tim redaksi.',
    joinedDate: 'Januari 2024',
    articlesCount: 18
  },
  {
    id: 'user-editor-1',
    name: 'Siti Rahma, M.I.Kom',
    email: 'siti.rahma@sganews.id',
    role: 'editor',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    bio: 'Redaktur Senior bidang Sains & Teknologi SGA News.',
    joinedDate: 'Maret 2024',
    articlesCount: 12,
    followersCount: 0,
    profileLikesCount: 0
  },
  {
    id: 'user-author-1',
    name: 'Budi Santoso',
    email: 'budi.santoso@gmail.com',
    role: 'author',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    bio: 'Jurnalis Komunitas & Pengamat Industri Digital Nusantara.',
    joinedDate: 'Mei 2024',
    articlesCount: 6,
    followersCount: 0,
    profileLikesCount: 0
  },
  {
    id: 'user-reader-1',
    name: 'Andi Wijaya',
    email: 'andi.wijaya@gmail.com',
    role: 'author',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    bio: 'Kontributor & Penulis Berita Teknologi dan Ekonomi Digital.',
    joinedDate: 'Juni 2024',
    articlesCount: 4,
    followersCount: 0,
    profileLikesCount: 0
  }
];

export const INITIAL_ARTICLES: Article[] = [
  {
    id: 'art-live-portugal-spanyol-kancah4d',
    title: 'Saksikan Live Streaming World Cup Portugal vs Spanyol via SGA News! Kancah4D',
    slug: 'live-streaming-portugal-vs-spanyol-world-cup-kancah4d',
    excerpt: 'Saksikan siaran langsung & live streaming piala dunia World Cup Portugal vs Spanyol dengan kualitas tayangan HD, akses cepat, dan update skor teraktual via SGA News dan KANCAH4D.',
    content: `
      <p class="lead"><strong>JAKARTA, SGA News —</strong> Pertandingan krusial babak piala dunia World Cup antara <strong>Portugal vs Spanyol</strong> siap tersaji malam ini. Bagi para pecinta sepak bola di tanah air, laga sengit dua raksasa Eropa ini dapat disaksikan melalui tayangan live streaming resmi di portal <strong>SGA News</strong> bekerja sama dengan <strong>KANCAH4D</strong>.</p>

      <h3>Pratinjau Pertandingan: Portugal vs Spanyol</h3>
      <p>Laga duel sengit ini diprediksi berlangsung dalam tempo tinggi sejak menit awal. Portugal mengandalkan ketajaman lini serang dan kombinasi pemain muda berbakat, sementara Spanyol siap mendominasi penguasaan bola lewat taktik permainan cepat.</p>

      <ul>
        <li><strong>Akses Kualitas HD:</strong> Tayangan siaran langsung jernih dan bebas hambatan di semua perangkat.</li>
        <li><strong>Update Skor Real-Time:</strong> Statistik pertandingan, cuplikan gol, dan pembaruan menit ke menit.</li>
        <li><strong>Layanan Bantuan 24 Jam:</strong> Tim dukungan informasi dari KANCAH4D siap memberikan panduan akses pertandingan.</li>
      </ul>

      <blockquote class="my-4 border-l-4 border-blue-600 pl-4 italic text-slate-700 dark:text-slate-300">
        "Nikmati keseruan pertandingan piala dunia Portugal vs Spanyol dengan kenyamanan akses terbaik dan informasi terpercaya di KANCAH4D & SGA News Portal."
      </blockquote>

      <h3>Cara Menyaksikan Live Streaming</h3>
      <p>Pembaca cukup mengakses portal SGA News atau mengunjungi platform resmi KANCAH4D untuk menikmati tayangan laga akbar World Cup malam ini tanpa kendala.</p>
    `,
    coverImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200',
    category: 'Sepak Bola',
    tags: ['KANCAH4D', 'LiveStreaming', 'WorldCup', 'PortugalVsSpanyol', 'SepakBola'],
    authorId: 'user-admin-owner',
    authorName: 'Admin SGA Redaksi',
    authorAvatar: 'https://ik.imagekit.io/dxokd3m9y/sgaicon.png',
    authorRole: 'Pemimpin Redaksi',
    status: 'published',
    createdAt: '2026-07-05T15:00:00Z',
    publishedAt: '2026-07-05T15:00:00Z',
    views: 5890,
    likes: 420,
    isBreaking: true,
    isFeatured: true,
    reactions: { suka: 350, inspiratif: 45, haru: 5, kaget: 20 }
  },
  {
    id: 'art-kancah4d-1',
    title: 'KANCAH4D Platform Hiburan Online Resmi 2026',
    slug: 'kancah4d-platform-hiburan-online-resmi-2026',
    excerpt: 'Platform hiburan online resmi 2026 KANCAH4D menyajikan pengalaman interaktif dengan sistem keamanan tingkat tinggi, variasi hiburan terlengkap, dan layanan responsif 24 jam.',
    content: `
      <p class="lead"><strong>JAKARTA, SGA News —</strong> Di era tranformasi digital 2026, permintaan akan platform hiburan online yang aman, responsif, dan terpercaya semakin meningkat. <strong>KANCAH4D</strong> hadir sebagai solusi utama hiburan online modern bagi masyarakat Indonesia.</p>

      <h3>Keunggulan Utama KANCAH4D</h3>
      <p>KANCAH4D menghadirkan berbagai fitur unggulan dengan teknologi server terkini yang menjamin kestabilan dan keamanan data para penggunanya:</p>
      <ul>
        <li><strong>Sistem Keamanan Terenkripsi:</strong> Perlindungan data pengguna menggunakan enkripsi SSL berkekuatan tinggi.</li>
        <li><strong>Layanan Bantuan 24/7:</strong> Tim dukungan pelanggan profesional siap membantu kapan saja secara responsif.</li>
        <li><strong>Akses Cepat & Stabil:</strong> Tampilan web yang ringan dan kompatibel untuk semua perangkat smartphone dan desktop.</li>
      </ul>

      <blockquote class="my-4 border-l-4 border-blue-600 pl-4 italic text-slate-700 dark:text-slate-300">
        "Kepercayaan dan kenyamanan pengguna adalah prioritas tertinggi KANCAH4D dalam menghadirkan ekosistem hiburan online terbaik di Indonesia."
      </blockquote>

      <h3>Kesimpulan</h3>
      <p>Bagi Anda yang mencari platform hiburan digital dengan reputasi terpercaya dan layanan terlengkap di tahun 2026, KANCAH4D adalah pilihan resmi yang tepat.</p>
    `,
    coverImage: 'https://ik.imagekit.io/dxokd3m9y/sgaicon.png',
    category: 'Hiburan',
    tags: ['KANCAH4D', 'HiburanOnline', 'PlatformResmi', 'Teknologi2026'],
    authorId: 'kancah4d-official',
    authorName: 'KANCAH4D Official',
    authorAvatar: 'https://ik.imagekit.io/dxokd3m9y/sgaicon.png',
    authorRole: 'Official Brand Representative',
    status: 'published',
    createdAt: '2026-07-05T12:00:00Z',
    publishedAt: '2026-07-05T12:00:00Z',
    views: 3450,
    likes: 210,
    isBreaking: true,
    isFeatured: true,
    reactions: { suka: 180, inspiratif: 25, haru: 2, kaget: 3 }
  },
  {
    id: 'art-kancah4d-2',
    title: 'Tren Era Baru 2026: Mengapa KANCAH4D Menjadi Platform Hiburan Paling Dicari',
    slug: 'tren-era-baru-2026-mengapa-kancah4d-menjadi-platform-hiburan-paling-dicari',
    excerpt: 'Ulasan mendalam mengenai fenomena popularitas KANCAH4D di kalangan pecinta hiburan digital modern di Indonesia.',
    content: `
      <p class="lead"><strong>SGA News —</strong> Mengapa KANCAH4D menjadi salah satu kata kunci pencarian paling populer sepanjang tahun 2026? Berikut ulasan lengkap mengenai inovasi dan keunggulan layanan KANCAH4D.</p>
      <p>Dengan desain antarmuka intuitif, transaksi transparan, dan kecepatan akses luar biasa, KANCAH4D menetapkan standar baru dalam industri media hiburan digital.</p>
    `,
    coverImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1200',
    category: 'Teknologi',
    tags: ['KANCAH4D', 'Tren2026', 'InovasiDigital'],
    authorId: 'kancah4d-official',
    authorName: 'KANCAH4D Official',
    authorAvatar: 'https://ik.imagekit.io/dxokd3m9y/sgaicon.png',
    authorRole: 'Official Brand Representative',
    status: 'published',
    createdAt: '2026-07-05T10:00:00Z',
    publishedAt: '2026-07-05T10:30:00Z',
    views: 2180,
    likes: 145,
    isBreaking: false,
    isFeatured: true,
    reactions: { suka: 110, inspiratif: 30, haru: 1, kaget: 4 }
  },
  {
    id: 'art-1',
    title: 'Transformasi Ekonomi Digital Indonesia 2026: Proyeksi Pertumbuhan UMKM Berbasis AI',
    slug: 'transformasi-ekonomi-digital-indonesia-2026',
    excerpt: 'Pemerintah merilis peta jalan baru untuk mengakselerasi digitalisasi lebih dari 10 juta UMKM lokal dengan memanfaatkan integrasi AI dan kecerdasan buatan terapan.',
    content: `
      <p class="lead"><strong>JAKARTA, SGA News —</strong> Kementerian Koperasi dan UKM bersama Kementerian Komunikasi dan Digital meluncurkan inisiatif nasional peluncuran platform akselerasi AI bagi Usaha Mikro, Kecil, dan Menengah (UMKM) untuk menyongsong era baru ekonomi terintegrasi 2026.</p>

      <h3>Akselerasi Daya Saing Produk Lokal</h3>
      <p>Langkah ini menargetkan peningkatkan efisiensi rantai pasok dan pemasaran produk komoditas unggulan daerah hingga ke pasar ekspor internasional. Melalui kecerdasan buatan, pelaku usaha mikro kini dapat melakukan analisis tren pasar secara *real-time* serta optimasi manajemen stok secara otomatis.</p>

      <blockquote class="my-4 border-l-4 border-red-600 pl-4 italic text-slate-700 dark:text-slate-300">
        "Integrasi teknologi masa depan bukan lagi sekadar opsi bagi bisnis besar, melainkan fondasi penting bagi UMKM untuk bersaing di tingkat global." — Menkop UKM RI
      </blockquote>

      <h3>Dukungan Infrastruktur dan Pelatihan Regional</h3>
      <p>Program sertifikasi dan pelatihan digitalisasi gratis akan diselenggarakan serentak di 38 provinsi. Selain itu, pendaftaran bagi para kontributor dan penggiat ekonomi desa kini dimudahkan melalui portal layanan terpadu secara inklusif.</p>
    `,
    coverImage: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=1200',
    category: 'Bisnis',
    tags: ['UMKM', 'Ekonomi Digital', 'AI', 'Indonesia2026'],
    authorId: 'user-editor-1',
    authorName: 'Siti Rahma, M.I.Kom',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    authorRole: 'Redaktur Senior',
    status: 'published',
    createdAt: '2026-07-03T08:30:00Z',
    publishedAt: '2026-07-03T09:00:00Z',
    views: 1420,
    likes: 89,
    isBreaking: true,
    isFeatured: true,
    reactions: { suka: 54, inspiratif: 28, haru: 2, kaget: 5 }
  },
  {
    id: 'art-2',
    title: 'Peluncuran Satelit Komunikasi Nusantara 3 Sukses Mengorbit di Ketinggian Geostasioner',
    slug: 'peluncuran-satelit-komunikasi-nusantara-3-sukses',
    excerpt: 'Satelit komunikasi tercanggih generasi terbaru Indonesia berhasil mengorbit untuk memperluas jangkauan internet broadband ke seluruh pelosok daerah 3T.',
    content: `
      <p class="lead"><strong>FLORIDA, SGA News —</strong> Badan Aksesibilitas Telekomunikasi dan Informasi berhasil mengawal peluncuran Satelit Nusantara 3 pada Jumat dini hari waktu setempat. Satelit ini membawa kapasitas hingga 150 Gbps.</p>

      <p>Pemerintah menargetkan seluruh fasilitas kesehatan, sekolah, dan kantor pemerintahan di pelosok tanah air akan terhubung penuh jaringan konektivitas berkecepatan tinggi dalam waktu kurang dari enam bulan ke depan.</p>

      <h3>Membuka Akses Pendidikan dan Kesehatan Digital</h3>
      <p>Dengan beroperasinya satelit ini, program telemedicine dan pembelajaran jarak jauh berbasis Cloud di wilayah pelosok Nusantara tidak lagi terkendala masalah latensi jaringan.</p>
    `,
    coverImage: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=1200',
    category: 'Teknologi',
    tags: ['Satelit', 'Internet3T', 'Konektivitas', 'Teknologi'],
    authorId: 'user-author-1',
    authorName: 'Budi Santoso',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    authorRole: 'Penulis Komunitas',
    status: 'published',
    createdAt: '2026-07-02T14:15:00Z',
    publishedAt: '2026-07-02T15:00:00Z',
    views: 980,
    likes: 64,
    isBreaking: false,
    isFeatured: true,
    reactions: { suka: 40, inspiratif: 18, haru: 1, kaget: 5 }
  },
  {
    id: 'art-3',
    title: 'Timnas Sepak Bola Indonesia Tembus Babak Kualifikasi Final Kejuaraan Asia 2026',
    slug: 'timnas-indonesia-tembus-kualifikasi-final-asia-2026',
    excerpt: 'Dukungan penuh jutaan suporter di Stadion Gelora Bung Karno membakar semangat Tim Garuda menundukkan lawan kuat dengan skor meyakinkan 3-1.',
    content: `
      <p class="lead"><strong>JAKARTA, SGA News —</strong> Stadion Utama Gelora Bung Karno bergemuruh saat peluit panjang dibunyikan. Tim Nasional Indonesia melangkah pasti ke babak utama Piala Asia usai penampilan memukau sepanjang pertandingan.</p>

      <p>Gol penentu kemenangan tercipta di menit ke-82 lewat aksi individu apik pemain muda berbakat. Pelatih kepala mengapresiasi kedisiplinan taktik serta koordinasi pertahanan solid seluruh pemain.</p>
    `,
    coverImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200',
    category: 'Sepak Bola',
    tags: ['Timnas', 'PialaAsia', 'SepakBola', 'GBK'],
    authorId: 'user-admin-owner',
    authorName: 'Admin SGA Redaksi',
    authorAvatar: 'https://ik.imagekit.io/dxokd3m9y/sgaicon.png',
    authorRole: 'Pemimpin Redaksi',
    status: 'published',
    createdAt: '2026-07-02T20:00:00Z',
    publishedAt: '2026-07-02T20:30:00Z',
    views: 2150,
    likes: 180,
    isBreaking: true,
    isFeatured: true,
    reactions: { suka: 130, inspiratif: 35, haru: 10, kaget: 5 }
  },
  {
    id: 'art-5',
    title: 'Festival Film Nusantara 2026 Siap Digelar di Bali dengan Ratusan Karya Inovatif',
    slug: 'festival-film-nusantara-2026-siap-digelar-di-bali',
    excerpt: 'Ajang bergengsi perfilman tanah air siap menyapa para sineas muda dari 34 negara. Menampilkan karya sinematografi berbasis teknologi efek visual terdepan.',
    content: `
      <p class="lead"><strong>DENPASAR, SGA News —</strong> Denpasar terpilih menjadi tuan rumah perhelatan akbar Festival Film Nusantara tahun ini. Lebih dari 150 film dokumenter dan naratif independen akan diputar secara eksklusif.</p>
    `,
    coverImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1200',
    category: 'Hiburan',
    tags: ['FilmNusantara', 'SeniBudaya', 'Cinema', 'Bali'],
    authorId: 'user-author-1',
    authorName: 'Budi Santoso',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    authorRole: 'Penulis Komunitas',
    status: 'published',
    createdAt: '2026-06-30T16:00:00Z',
    publishedAt: '2026-06-30T17:00:00Z',
    views: 620,
    likes: 38,
    reactions: { suka: 22, inspiratif: 14, haru: 1, kaget: 1 }
  },
  {
    id: 'art-6',
    title: 'Panduan Gaya Hidup Sehat: Efektivitas Metode Meditasi dan Mindful Living di Era Serba Cepat',
    slug: 'panduan-gaya-hidup-sehat-meditasi-mindful-living',
    excerpt: 'Para ahli kesehatan mental merekomendasikan jeda 15 menit mindful breathing setiap hari untuk meredakan kelelahan emosional dan meningkatkan fokus produktivitas.',
    content: `
      <p class="lead"><strong>YOGYAKARTA, SGA News —</strong> Di tengah padatnya mobilitas perkotaan, pakar psikologi mengampanyekan pentingnya latihan kesadaran penuh (mindfulness) harian.</p>
      <p>Melakukan meditasi teratur terbukti menstabilkan hormon kortisol serta memicu fokus kognitif yang lebih tenang dalam mengambil keputusan kerja harian.</p>
    `,
    coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1200',
    category: 'Gaya Hidup',
    tags: ['Mindfulness', 'KesehatanMental', 'GayaHidup', 'Wellness'],
    authorId: 'user-editor-1',
    authorName: 'Siti Rahma, M.I.Kom',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    authorRole: 'Redaktur Senior',
    status: 'published',
    createdAt: '2026-06-29T10:00:00Z',
    publishedAt: '2026-06-29T10:30:00Z',
    views: 750,
    likes: 51,
    reactions: { suka: 30, inspiratif: 20, haru: 1, kaget: 0 }
  },
  {
    id: 'art-7',
    title: '[Hiburan] Pentingnya Literasi Media di Tengah Arus Informasi Serba Cepat',
    slug: 'hiburan-pentingnya-literasi-media-di-tengah-arus-informasi',
    excerpt: 'Ulasan publik: Mengapa verifikasi fakta dan kekritisan pembaca menjadi benteng pertahanan utama masyarakat dari jebakan narasi hoax dan disinformasi digital.',
    content: `
      <p class="lead">Oleh: <strong>Budi Santoso</strong></p>
      <p>Perkembangan platform berita digital memberi kita kemudahan tak terhingga dalam mengakses kabar terbaru. Namun, kemudahan ini menuntut standar kehati-hatian tinggi agar kita tidak mudah terprovokasi oleh judul bermotif clickbait tanpa verifikasi sumber jurnalisme yang kredibel.</p>
    `,
    coverImage: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1200',
    category: 'Hiburan',
    tags: ['LiterasiMedia', 'Jurnalisme', 'CekFakta', 'Hiburan'],
    authorId: 'user-author-1',
    authorName: 'Budi Santoso',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    authorRole: 'Penulis Komunitas',
    status: 'published',
    createdAt: '2026-06-28T09:00:00Z',
    publishedAt: '2026-06-28T10:00:00Z',
    views: 530,
    likes: 44,
    reactions: { suka: 25, inspiratif: 15, haru: 2, kaget: 2 }
  },
  {
    id: 'art-pending-1',
    title: 'Inovasi Kendaraan Listrik Lokal Buatan Mahasiswa Indonesia Lolos Uji Emisi Nol',
    slug: 'inovasi-kendaraan-listrik-lokal-mahasiswa-indonesia',
    excerpt: 'Artikel kontribusi warga: Tim riset teknik universitas berhasil menciptakan prototipe mobil listrik bertenaga surya dengan efisiensi baterai hingga 400 kilometer.',
    content: `
      <p class="lead"><strong>BANDUNG, SGA News (Kontribusi Penulis) —</strong> Hasil karya inovator muda Indonesia kembali menorehkan prestasi membanggakan. Prototipe mobil ramah lingkungan buatan mahasiswa Bandung resmi dinyatakan lulus pengujian standar keselamatan transportasi nasional.</p>
      <p>Penulis memotret langsung jalannya pengujian dan mewawancarai ketua tim pengembang mengenai rencana produksi massal dalam skala industri lokal.</p>
    `,
    coverImage: 'https://images.unsplash.com/photo-1558441719-67724220b329?auto=format&fit=crop&q=80&w=1200',
    category: 'Teknologi',
    tags: ['MobilListrik', 'InovasiLokal', 'Mahasiswa', 'EBT'],
    authorId: 'user-author-1',
    authorName: 'Budi Santoso',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    authorRole: 'Penulis Komunitas',
    status: 'pending',
    createdAt: '2026-07-03T10:00:00Z',
    views: 0,
    likes: 0,
    editorialNotes: 'Menunggu peninjauan oleh Redaktur Eksekutif.'
  }
];

export const INITIAL_COMMENTS: ArticleComment[] = [
  {
    id: 'comm-1',
    articleId: 'art-1',
    authorName: 'Andi Wijaya',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    authorRole: 'Pembaca',
    content: 'Sangat menginspirasi! Semoga program integrasi AI untuk UMKM ini benar-benar bisa merata sampai ke daerah-daerah pelosok desa.',
    createdAt: '2026-07-03T10:15:00Z',
    likes: 12
  },
  {
    id: 'comm-2',
    articleId: 'art-1',
    authorName: 'Budi Santoso',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    authorRole: 'Penulis Komunitas',
    content: 'Betul mas Andi, kunci utamanya adalah pendampingan berkelanjutan dari para mentor digital agar pelaku UMKM senior tidak kebingungan.',
    createdAt: '2026-07-03T11:00:00Z',
    likes: 8
  },
  {
    id: 'comm-3',
    articleId: 'art-3',
    authorName: 'Rian Perdana',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    authorRole: 'Pembaca',
    content: 'Bangga sekali dengan perjuangan Timnas Garuda! Permainan lini tengah semalam sangat disiplin dan cepat!',
    createdAt: '2026-07-02T21:10:00Z',
    likes: 25
  }
];
