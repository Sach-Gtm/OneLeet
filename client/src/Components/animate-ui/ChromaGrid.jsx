import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

const ChromaGrid = ({ items, className = '', radius = 300, damping = 0.45, fadeOut = 0.6, ease = 'power3.out' }) => {
  const rootRef = useRef(null);
  const fadeRef = useRef(null);
  const setX = useRef(null);
  const setY = useRef(null);
  const pos = useRef({ x: 0, y: 0 });

  const demo = [
    {
      image: "https://res.cloudinary.com/dtgo1vvgs/image/upload/v1765214319/sauravanand_r9lt8n.jpg",
      title: 'Saurav Anand',
      subtitle: 'Rank 23 @ipuLeet-2025',
      Rank:"MAIT'28",
      handle: '@isauravanand',
      borderColor: '#4F46E5',
      gradient: 'linear-gradient(145deg,#4F46E5,#000)',
      url: 'https://github.com/isauravanand'
    },
    {
      image: 'https://res.cloudinary.com/dtgo1vvgs/image/upload/v1765214319/sachingautam_gjva2h.jpg',
      title: 'Sachin Gautam',
      subtitle: 'Rank 54 @ipuLeet-2025',
      Rank: "Rank 54 @ipuLeet-2025",
      handle: '@sachingautam',
      borderColor: '#4F46E5',
      gradient: 'linear-gradient(145deg,#4F46E5,#000)',
      url: 'https://www.linkedin.com/in/sachin-gautam-1484a2227/'
    },
    
  ];

  const data = items?.length ? items : demo;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    setX.current = gsap.quickSetter(el, '--x', 'px');
    setY.current = gsap.quickSetter(el, '--y', 'px');
    const { width, height } = el.getBoundingClientRect();
    pos.current = { x: width / 2, y: height / 2 };
    setX.current(pos.current.x);
    setY.current(pos.current.y);
  }, []);

  const moveTo = (x, y) => {
    gsap.to(pos.current, {
      x,
      y,
      duration: damping,
      ease,
      onUpdate: () => {
        setX.current?.(pos.current.x);
        setY.current?.(pos.current.y);
      },
      overwrite: true
    });
  };

  const handleMove = e => {
    const r = rootRef.current.getBoundingClientRect();
    moveTo(e.clientX - r.left, e.clientY - r.top);
    gsap.to(fadeRef.current, { opacity: 0, duration: 0.25, overwrite: true });
  };

  const handleLeave = () => {
    gsap.to(fadeRef.current, {
      opacity: 1,
      duration: fadeOut,
      overwrite: true
    });
  };

  const handleCardClick = url => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCardMove = e => {
    const c = e.currentTarget;
    const rect = c.getBoundingClientRect();
    c.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    c.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={rootRef}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={`relative w-full h-full flex flex-wrap justify-center items-start gap-3 ${className}`}
      style={{
        '--r': `${radius}px`,
        '--x': '50%',
        '--y': '50%'
      }}>
      {data.map((c, i) => (
        <article
          key={i}
          onMouseMove={handleCardMove}
          onClick={() => handleCardClick(c.url)}
          className="group relative flex flex-col w-[360px] rounded-[20px] overflow-hidden border-2 border-transparent transition-colors duration-300 cursor-pointer"
          style={{
            '--card-border': c.borderColor || 'transparent',
            background: "transparent",

            '--spotlight-color': 'rgba(255,255,255,0.3)'
          }}>
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-500 z-20 opacity-0 group-hover:opacity-100"
            style={{
              background:
                'radial-gradient(circle at var(--mouse-x) var(--mouse-y), var(--spotlight-color), transparent 70%)'
            }} />
            
          {/* {c.Rank && (
            <div className="
      absolute top-3 left-1/2 -translate-x-1/2
      w-50
      rounded-lg
      flex items-center gap-2
      text-sm font-semibold
      text-black
      bg-gradient-to-r from-yellow-300 to-yellow-400
      shadow-[0_4px_12px_rgba(255,223,0,0.35)]
      backdrop-blur-md
      border border-yellow-200/60
      z-30
  ">
              <span className="text-yellow-800 text-base">👑</span>
              <span>{c.Rank}</span>
            </div>
          )} */}


          <div className="relative z-10 flex-1 p-[10px] box-border">
            <img
              src={c.image}
              alt={c.title}
              loading="lazy"
              className="w-full h-[500px] object-cover rounded-[10px] grayscale group-hover:grayscale-0 transition-all duration-500"
 />
          </div>
          <footer
            className="relative z-10 p-3 text-white font-sans grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
            <h3 className="m-0 text-[1.05rem] font-semibold">{c.title}</h3>
            {/* {c.Rank && (
              <p className="text-sm font-semibold text-yellow-400 drop-shadow">
                {c.Rank}
              </p>
            )} */}

            {c.handle && <span className="text-[0.95rem] opacity-80 text-right">{c.handle}</span>}
            <p className="m-0 text-yellow-400 text-[1rem] opacity-85">{c.subtitle}</p>
            {c.location && <span className="text-[0.85rem] opacity-85 text-right">{c.location}</span>}
          </footer>
        </article>
      ))}
      <div
        style={{
          backdropFilter: 'grayscale(1) brightness(0.78)',
          WebkitBackdropFilter: 'grayscale(1) brightness(0.78)',
          background: 'rgba(0,0,0,0.001)',
          maskImage:
            'radial-gradient(circle var(--r) at var(--x) var(--y),transparent 0%,transparent 15%,rgba(0,0,0,0.10) 30%,rgba(0,0,0,0.22)45%,rgba(0,0,0,0.35)60%,rgba(0,0,0,0.50)75%,rgba(0,0,0,0.68)88%,white 100%)',
          WebkitMaskImage:
            'radial-gradient(circle var(--r) at var(--x) var(--y),transparent 0%,transparent 15%,rgba(0,0,0,0.10) 30%,rgba(0,0,0,0.22)45%,rgba(0,0,0,0.35)60%,rgba(0,0,0,0.50)75%,rgba(0,0,0,0.68)88%,white 100%)'
        }} />
      <div
        ref={fadeRef}
        // className="absolute inset-0 pointer-events-none transition-opacity duration-[250ms] z-40"
        style={{
          backdropFilter: 'grayscale(1) brightness(0.78)',
          WebkitBackdropFilter: 'grayscale(1) brightness(0.78)',
          background: 'rgba(0,0,0,0.001)',
          maskImage:
            'radial-gradient(circle var(--r) at var(--x) var(--y),white 0%,white 15%,rgba(255,255,255,0.90)30%,rgba(255,255,255,0.78)45%,rgba(255,255,255,0.65)60%,rgba(255,255,255,0.50)75%,rgba(255,255,255,0.32)88%,transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(circle var(--r) at var(--x) var(--y),white 0%,white 15%,rgba(255,255,255,0.90)30%,rgba(255,255,255,0.78)45%,rgba(255,255,255,0.65)60%,rgba(255,255,255,0.50)75%,rgba(255,255,255,0.32)88%,transparent 100%)',
          opacity: 1
        }} />
    </div>
  );
};

export default ChromaGrid;
