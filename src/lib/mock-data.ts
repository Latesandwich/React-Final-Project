import { Movie, Showtime, Seat, Booking, SeatType } from '@/types';

// Helper to generate realistic seats for a theater
export function generateTheaterSeats(): Seat[] {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const seatsPerRow = 12;
  const seats: Seat[] = [];

  // Random preset booked seats for realism
  const preBookedIds = new Set(['C-5', 'C-6', 'D-7', 'D-8', 'B-10', 'A-3', 'A-4', 'F-6', 'F-7', 'G-11', 'G-12']);

  rows.forEach((row) => {
    let type: SeatType = 'standard';
    let price = 240;

    if (row === 'A' || row === 'B') {
      type = 'vip';
      price = 450;
    } else if (row === 'C' || row === 'D' || row === 'E') {
      type = 'premium';
      price = 300;
    }

    for (let num = 1; num <= seatsPerRow; num++) {
      const id = `${row}-${num}`;
      seats.push({
        id,
        row,
        number: num,
        type,
        price,
        isBooked: preBookedIds.has(id),
      });
    }
  });

  return seats;
}

export const INITIAL_MOVIES: Movie[] = [
  {
    id: 'm-1',
    title: 'Dune: Part Two',
    titleTh: 'ดูน ภาคสอง',
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=80',
    duration: 166,
    rating: '13+',
    genre: ['Sci-Fi', 'Action', 'Adventure'],
    releaseDate: '2026-03-01',
    synopsis: 'พอล อะทรีดีส ร่วมมือกับชานีและชาวเฟรเมน เพื่อล้างแค้นเหล่าผู้สมรู้ร่วมคิดที่ทำลายครอบครัวของเขา พร้อมเผชิญหน้ากับชะตากรรมของจักรวาล',
  },
  {
    id: 'm-2',
    title: 'Interstellar: Re-Release',
    titleTh: 'อินเตอร์สเตลลาร์ ทะลุมิติจักรวาล',
    poster: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1600&auto=format&fit=crop&q=80',
    duration: 169,
    rating: '13+',
    genre: ['Sci-Fi', 'Drama'],
    releaseDate: '2026-04-15',
    synopsis: 'เมื่อโลกมนุษย์ถึงคราววิกฤต ทีมสำรวจอวกาศต้องเดินทางข้ามรูหนอนลึกลับเพื่อค้นหาดาวเคราะห์ดวงใหม่สำหรับมนุษยชาติ',
  },
  {
    id: 'm-3',
    title: 'Cyber Blade 2099',
    titleTh: 'ล่าคมไซเบอร์ 2099',
    poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    duration: 135,
    rating: '18+',
    genre: ['Cyberpunk', 'Action', 'Thriller'],
    releaseDate: '2026-05-10',
    synopsis: 'ในมหานครนีออนแห่งอนาคต นักสืบไซบอร์กต้องไขปริศนาคดีฆาตกรรมปริศนาที่อาจสั่นคลอนเสถียรภาพของปัญญาประดิษฐ์ระดับโลก',
  },
  // Fictional demo films; images are illustrative, not official movie posters.
  {
    id: 'm-4', title: 'Ocean of Secrets', titleTh: 'มหาสมุทรซ่อนปริศนา',
    poster: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1600&auto=format&fit=crop&q=80',
    duration: 118, rating: '13+', genre: ['Adventure', 'Mystery'], releaseDate: '2026-10-01',
    synopsis: 'นักสำรวจทะเลพบสัญญาณจากเมืองที่จมหายไป เมื่อพายุใกล้เข้ามา เธอต้องร่วมมือกับลูกเรือเพื่อไขความลับใต้มหาสมุทรก่อนเส้นทางกลับจะถูกตัดขาด',
  },
  {
    id: 'm-5', title: 'Last Train Home', titleTh: 'รถไฟเที่ยวสุดท้าย',
    poster: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=1600&auto=format&fit=crop&q=80',
    duration: 106, rating: 'ทั่วไป', genre: ['Drama', 'Romance'], releaseDate: '2026-10-02',
    synopsis: 'คนแปลกหน้าสองคนพบกันบนรถไฟเที่ยวดึก การเดินทางกลับบ้านกลายเป็นโอกาสให้ทั้งคู่ทบทวนความฝัน ความรัก และสิ่งที่ยังไม่กล้าบอกคนสำคัญ',
  },
  {
    id: 'm-6', title: 'The Silent Forest', titleTh: 'ป่าไร้เสียง',
    poster: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&auto=format&fit=crop&q=80',
    duration: 112, rating: '18+', genre: ['Horror', 'Thriller'], releaseDate: '2026-10-03',
    synopsis: 'ทีมบันทึกเสียงธรรมชาติเดินทางเข้าสู่ป่าที่ไม่มีเสียงสัตว์ เมื่อเครื่องบันทึกจับเสียงของคนที่หายตัวไปได้ พวกเขาจึงรู้ว่าความเงียบกำลังซ่อนบางสิ่งเอาไว้',
  },
  {
    id: 'm-7', title: 'Skybound', titleTh: 'ปีกฝันเหนือเมฆ',
    poster: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=1600&auto=format&fit=crop&q=80',
    duration: 98, rating: 'ทั่วไป', genre: ['Animation', 'Family', 'Adventure'], releaseDate: '2026-10-04',
    synopsis: 'เด็กนักประดิษฐ์และเพื่อนนกตัวเล็กออกตามหาเกาะลอยฟ้า ทั้งสองต้องเรียนรู้ว่าการไปถึงความฝันไม่ได้ขึ้นอยู่กับเครื่องบินที่เก่งที่สุด แต่ขึ้นอยู่กับการไม่ทิ้งเพื่อนระหว่างทาง',
  },
  {
    id: 'm-8', title: 'Midnight Kitchen', titleTh: 'ครัวเที่ยงคืน',
    poster: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1600&auto=format&fit=crop&q=80',
    duration: 104, rating: 'ทั่วไป', genre: ['Comedy', 'Drama'], releaseDate: '2026-10-05',
    synopsis: 'เชฟมือใหม่รับช่วงร้านอาหารที่เปิดเฉพาะตอนกลางคืน เมนูแปลก ๆ และลูกค้าประจำสุดป่วนทำให้เขาค้นพบสูตรที่ช่วยให้ร้านกลับมาคึกคักอีกครั้ง',
  },
  {
    id: 'm-9', title: 'Redline Bangkok', titleTh: 'เรดไลน์ ฝ่าเมืองเดือด',
    poster: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1600&auto=format&fit=crop&q=80',
    duration: 124, rating: '15+', genre: ['Action', 'Thriller'], releaseDate: '2026-10-06',
    synopsis: 'คนขับรถส่งของได้รับพัสดุที่มีหลักฐานคดีใหญ่ เขาต้องหาทางส่งมันให้ถึงปลายทางท่ามกลางการไล่ล่าบนถนนกรุงเทพฯ โดยมีเพื่อนเก่าเป็นผู้ช่วยเพียงคนเดียว',
  }
];

export const INITIAL_SHOWTIMES: Showtime[] = [
  {
    id: 'st-101',
    movieId: 'm-1',
    hall: {
      id: 'h-1',
      name: 'Cinema 1 (IMAX)',
      type: 'IMAX Laser',
      totalSeats: 96,
    },
    dateTime: 'วันนี้, 19:30 น.',
    audio: 'EN/TH',
    seats: generateTheaterSeats(),
  },
  {
    id: 'st-102',
    movieId: 'm-1',
    hall: {
      id: 'h-2',
      name: 'Cinema 2',
      type: 'Digital 4K',
      totalSeats: 96,
    },
    dateTime: 'วันนี้, 21:45 น.',
    audio: 'TH/TH',
    seats: generateTheaterSeats(),
  },
  {
    id: 'st-201',
    movieId: 'm-2',
    hall: {
      id: 'h-1',
      name: 'Cinema 1 (IMAX)',
      type: 'IMAX Laser',
      totalSeats: 96,
    },
    dateTime: 'วันนี้, 20:00 น.',
    audio: 'EN/TH',
    seats: generateTheaterSeats(),
  },
  {
    id: 'st-301',
    movieId: 'm-3',
    hall: {
      id: 'h-3',
      name: 'Cinema 3 (4DX)',
      type: 'Laser 4DX',
      totalSeats: 96,
    },
    dateTime: 'วันนี้, 18:45 น.',
    audio: 'EN/TH',
    seats: generateTheaterSeats(),
  }
];

// Give each additional demo film its own bookable screening and independent seats.
INITIAL_SHOWTIMES.push(...INITIAL_MOVIES.slice(3).map<Showtime>((movie, index) => ({
  id: `st-${index + 4}01`,
  movieId: movie.id,
  hall: {
    id: `h-${index % 3 + 1}`,
    name: `Cinema ${index % 3 + 1}`,
    type: 'Digital 4K',
    totalSeats: 96,
  },
  dateTime: `วันนี้, ${index < 3 ? '15:00' : '22:00'} น.`,
  audio: 'TH/TH',
  seats: generateTheaterSeats(),
})));

// Initial mock booking records
export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'BK-98231',
    userId: 'usr-1',
    userName: 'จิรัฎฐ์ วงค์กาสิทธิ์',
    userEmail: 'example@cinemago.com',
    userPhone: '089-123-4567',
    showtimeId: 'st-101',
    movie: {
      id: 'm-1',
      title: 'Dune: Part Two',
      titleTh: 'ดูน ภาคสอง',
      poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
      duration: 166,
      genre: ['Sci-Fi', 'Action'],
    },
    hallName: 'Cinema 1 (IMAX)',
    hallType: 'IMAX Laser',
    dateTime: 'วันนี้, 19:30 น.',
    audio: 'EN/TH',
    seats: [
      { id: 'C-5', row: 'C', number: 5, type: 'premium', price: 300 },
      { id: 'C-6', row: 'C', number: 6, type: 'premium', price: 300 },
    ],
    totalPrice: 600,
    paymentMethod: 'promptpay',
    paymentStatus: 'completed',
    bookedAt: '2026-10-01 13:30',
  }
];

// (เดโม login แบบเขียนคุกกี้เองถูกแทนที่ด้วยระบบ register/login จริงของ Part A — ดูที่ src/lib/actions/auth.ts)
