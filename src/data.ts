import { Sector, Beta, ClimberStats, ActivityMatrixDay } from './types';

export const INITIAL_SECTORS: Sector[] = [
  {
    id: 'cueva',
    name: 'La Cueva',
    angle: '45°',
    description: 'Desplome agresivo, regletas y romos. Alta intensidad física.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKVhw-jksVTj69fhU_ftDWaMiyDnw2XPb4KpPpN5Nx1OAV6kn5O7BXlj0dVqjUI0JoCaCIN_6zFZhrC8Sz2YlJfQMMhEQgML6AK8x_0rIasUTpzh4jLerc46e-GaPHvRTfBxnPELwmVXZeKUR1Q3C550-Ih9Psyeirh-Pr3oNoZcETAhOAKCtKarttBT9fvOcYCt51gN5Nbn2q0MHlRrGcFM5GMr0Iw4zKYW0B_VQlXhNRpBgh9BjDyjOmKZoXHTRtWWNqc_GTre_g'
  },
  {
    id: 'placa',
    name: 'Placa Técnica',
    angle: '0°',
    description: 'Equilibrio puro, micro-pies y adherencia. Paciencia y técnica requeridas.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXbX6i_PTHXvdkQS4XfNE3HCGr0_9MfLHY55tlJGSuepodWHzPEMlye3xlJQHmRrCw3p1h5aHMil2ojAPDyMoyNyvInlypQXpyz1zQBvIZxJ8t4y4qAYuOxLfMG7oh8glAxe-8bar2KINuVy3dBdqbb2yG1F4xfxB3C89nk0ZXorDTTm5kWEskw3nqrjdW8kyftzCnC88eRUmORHJg0i7wloW6eFTsQM6SMMg5cEghMwSdRxCaul9EYbPopWgRbQ6qQOWzIy1COizB'
  },
  {
    id: 'comp',
    name: 'Muro Competición',
    angle: '15°',
    description: 'Volúmenes gigantes, lances (dynos) y coordinación. Estilo moderno de competición.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmjRPAAuRWfQzeaPG_YW6guSs6HTTuEWQvBN1nuGjTAWf3Sb0c3CU1wz4kXJ-deGpyEJGmgNsZq-dcD5o-CQmIQ6CvBsyOnsfNtZQeiY1ugkSPVeTM2-RVM_j_CY8bylg8XGt4Y8ZPGLsetjs54rgOSEOvHR_H08og4EJbi7w70TRdiSXLIJpq4TYysb-L3XQ_VClruEuFwgcqrn2KKZIboLl6ZlXSKAN1PUf5kD2UvGikAEuVqys6cdkPcohhcif06v2CLSudapXp'
  }
];

export const INITIAL_BETAS: Beta[] = [
  {
    id: 'pink-menace',
    name: 'The Pink Menace',
    grade: 'V5',
    styles: ['CRIMP', 'OVERHANG'],
    holdColor: '#ec4899', // pink/purple
    notes: 'El crux es juntar manos en la tercera regleta regleta muy fina. Asegura pies altos y un dropknee técnico con la derecha para estabilizar el centro de gravedad.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3z4qhIPquNgcDTxCVRtP8S2M0HiNYxvXkbCwTPgxA9RMGl69UI_Tv3nrl0k4t13qFnnS740gXkG0YeWeinOrwFa80DvdZE4mgKyqt_p8pp12vt9BTs67axOhQhskNvmZMjYKwNoIFDxtD3AnR5fvbpxkPrWnBnpKrjaw-gpdv6u0G8eiTeLUSiBKUlVNAHBOgrb_R0exzDFAEFectGPu9Hx1eKniRVD2mBMr5BaG8VemlqRu2i9x4zXT2q_-FRMWOS-PEqjzgdVVO',
    markers: [
      { id: '1', x: 28, y: 76, type: 'START' },
      { id: '2', x: 38, y: 62, type: 'SEQ', label: '1' },
      { id: '3', x: 50, y: 52, type: 'SEQ', label: '2' },
      { id: '4', x: 58, y: 44, type: 'SEQ', label: '3' },
      { id: '5', x: 42, y: 22, type: 'TOP' }
    ],
    createdAt: 'Hace 2 días',
    sectorId: 'cueva',
    author: 'mauryemmanuel83'
  },
  {
    id: 'yellow-dyno',
    name: 'Yellow Dyno',
    grade: 'V7',
    styles: ['DYNAMIC', 'VOLUME', 'JUG'],
    holdColor: '#eab308', // yellow
    notes: 'Realiza un lance coordinado explosivo hacia el volumen romo superior. Mantén la tensión del core activa y balancea las piernas para controlar el péndulo.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0mf13e04Wx5uPbko7kV5UI9xBcif7Tq99oQn33YrdmKAAC7G1os9_W_vVd0PTtqt0psI71MoVPdpfPNh8X4mTqZcBIcMokXrB9Rkrl9wn-JkJ3aDFs5-6gZBwlkKeFjrq8i_1xEWdCGZQvTLnai3M_bb-rfR0S240ED5roXR7C2lbMhf12BokayaSpwjGCBVRpY-MhMadS__iZHoiUdnqluENiuFGCahm0LWIZJYKaeJvWpFu8V7nAHci45ETfruP0EdjTj_z6CQB',
    markers: [
      { id: '1', x: 48, y: 82, type: 'START' },
      { id: '2', x: 50, y: 55, type: 'SEQ', label: '1' },
      { id: '3', x: 32, y: 25, type: 'TOP' }
    ],
    createdAt: 'Hace 5 días',
    sectorId: 'comp',
    author: 'mauryemmanuel83'
  },
  {
    id: 'corner-project',
    name: 'Corner Project',
    grade: 'V6',
    styles: ['STEMMING', 'SLOPER'],
    holdColor: '#3b82f6', // blue
    notes: 'Presión lenta y controlada en diedro con adherencias técnicas. Los micro-apoyos de pies son la clave absoluta. Limpia bien la goma de tus pies antes de subir.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5b2JWPJa-cwssKYfkw05X2LcyCVhtnuNV3FEacTadR9SW162Jan_ZV-c0zG6dnYJwrvtUaqKtwJZHSPAyUNY5W256ZcT38f3SJsWDp2Pd4ebAYZ_Gtz0QLr0Prf6DLda7wQyx0iAt4uV4g4tuLbkjtyKehpmHxAQwT-GGvjWHAPaSvp61eYu_w7swtzVSLaQalSJ9E8YxweBFlHOtwEKiKHvvNz-sagJxEYO-lR7BO1sJqJ1elv9yHhSb0dM_CK4EPTOHWwER_0-G',
    markers: [
      { id: '1', x: 35, y: 78, type: 'START' },
      { id: '2', x: 42, y: 64, type: 'SEQ', label: '1' },
      { id: '3', x: 38, y: 45, type: 'SEQ', label: '2' },
      { id: '4', x: 55, y: 35, type: 'SEQ', label: '3' },
      { id: '5', x: 48, y: 15, type: 'TOP' }
    ],
    createdAt: 'Proyecto Activo',
    sectorId: 'placa',
    author: 'mauryemmanuel83',
    activeProject: true
  }
];

export const INITIAL_STATS: ClimberStats = {
  globalBetaScore: 4092,
  sendsThisWeek: 24,
  activeProjects: 3,
  flashesCount: 12,
  level: 42,
  title: 'Climber',
  sector: 'Sector Alpha'
};

// Generates dates for consistency matrix
export const generateActivityMatrix = (): ActivityMatrixDay[] => {
  const days: ActivityMatrixDay[] = [];
  const now = new Date();
  
  // Create 15 weeks * 7 days of climbing activity (last 105 days)
  for (let i = 105; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    // Pseudo-random activity level favoring weekends and Wednesdays
    const dayOfWeek = d.getDay(); // 0 is Sunday, 3 is Wed, 6 is Saturday
    let count = 0;
    const rand = Math.random();
    
    if (dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 3) {
      if (rand > 0.8) count = 4;
      else if (rand > 0.5) count = 3;
      else if (rand > 0.2) count = 2;
    } else {
      if (rand > 0.9) count = 2;
      else if (rand > 0.75) count = 1;
    }
    
    days.push({ date: dateStr, count });
  }
  
  return days;
};
