const outline = '#3f4143';
const glass = '#f5fafb';
const detail = '#aeb4b7';
const metal = '#667078';
const darkMetal = '#4c555b';
const rubber = '#76665d';
const wood = '#b98655';
const flame = '#f19b50';
const flameCore = '#f7cf69';
const water = '#78b9c8';

const svg = (content) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" preserveAspectRatio="xMidYMid meet">
    <g fill="none" stroke="${outline}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
      ${content}
    </g>
  </svg>
`;

const glassFill = `fill="${glass}" fill-opacity=".5" stroke="none"`;
const detailStroke = `stroke="${detail}" stroke-width="2.5"`;

const models = {
  beaker: `
    <path ${glassFill} d="M30 24h61l-6 68a10 10 0 0 1-10 9H44a10 10 0 0 1-10-9z"/>
    <path d="M30 24c8 3 15 3 23 0h38l-6 68a10 10 0 0 1-10 9H44a10 10 0 0 1-10-9L34 31"/>
    <path ${detailStroke} d="M75 42h10M76 54h8M77 66h7M78 78h6"/>
  `,
  'erlenmeyer-flask': `
    <path ${glassFill} d="M48 16h25v35l22 42a9 9 0 0 1-8 13H33a9 9 0 0 1-8-13l22-42z"/>
    <path d="M48 16c4 2 6 5 6 10v25L25 93a9 9 0 0 0 8 13h54a9 9 0 0 0 8-13L66 51V26c0-5 2-8 7-10"/>
    <path ${detailStroke} d="M73 58h9M77 70h8M81 82h7"/>
  `,
  'round-bottom-flask': `
    <path ${glassFill} d="M49 15h22v34c0 6 23 15 23 35a34 34 0 1 1-68 0c0-20 23-29 23-35z"/>
    <path d="M49 15c4 2 6 5 6 10v24c0 6-23 15-23 35a28 28 0 1 0 56 0c0-20-23-29-23-35V25c0-5 2-8 6-10"/>
    <path ${detailStroke} d="M77 58h8M81 69h7M83 80h7"/>
  `,
  'test-tube': `
    <path ${glassFill} d="M45 17h30v63a15 15 0 0 1-30 0z"/>
    <path d="M43 17h34M47 17v63a13 13 0 0 0 26 0V17"/>
  `,
  funnel: `
    <path ${glassFill} d="M18 25h84L69 60v43H52V60z"/>
    <path d="M18 25h84L69 60v43M52 103V60z"/>
  `,
  'graduated-cylinder': `
    <path ${glassFill} d="M43 15h34v78a7 7 0 0 1-7 7H50a7 7 0 0 1-7-7z"/>
    <path d="M41 15h38M45 15v78a5 5 0 0 0 5 5h20a5 5 0 0 0 5-5V15M33 101h54"/>
    <path ${detailStroke} d="M52 31h15M52 42h10M52 53h15M52 64h10M52 75h15M52 86h10"/>
  `,
  'retort-stand': `
    <path fill="${metal}" fill-opacity=".22" d="M18 96h80l-7 10H25z"/>
    <path d="M21 96h74M31 106h59M46 96V15M39 15h14M46 32h43M88 32v17"/>
    <circle cx="46" cy="32" r="5" fill="${darkMetal}" stroke="none"/>
  `,
  'iron-ring': `
    <ellipse cx="56" cy="52" rx="31" ry="18" fill="${metal}" fill-opacity=".12"/>
    <ellipse cx="56" cy="52" rx="20" ry="10"/>
    <path d="M87 52h20M96 47v10"/>
  `,
  tripod: `
    <ellipse cx="60" cy="34" rx="35" ry="12" fill="${metal}" fill-opacity=".14"/>
    <ellipse cx="60" cy="34" rx="25" ry="7"/>
    <path d="M33 42 20 103M87 42l13 61M60 46v57M16 103h10M94 103h10M55 103h10"/>
  `,
  'alcohol-lamp': `
    <path ${glassFill} d="M32 50h56l7 37a13 13 0 0 1-13 16H38a13 13 0 0 1-13-16z"/>
    <path d="M32 50h56l7 37a13 13 0 0 1-13 16H38a13 13 0 0 1-13-16zM45 50v-9h30v9M60 41V29"/>
    <path fill="${flame}" stroke="none" d="M60 31c-12-9 7-18 1-29 17 12 8 25-1 29z"/>
    <path fill="${flameCore}" stroke="none" d="M60 27c-5-5 3-10 1-15 7 6 4 12-1 15z"/>
  `,
  thermometer: `
    <path ${glassFill} d="M53 18a9 9 0 0 1 18 0v54a20 20 0 1 1-18 0z"/>
    <path d="M53 72V18a9 9 0 0 1 18 0v54a20 20 0 1 1-18 0"/>
    <path stroke="#d36b61" stroke-width="5" d="M62 38v49"/>
    <circle cx="62" cy="92" r="11" fill="#d36b61" stroke="none"/>
    <path ${detailStroke} d="M76 31h10M76 43h7M76 55h10M76 67h7"/>
  `,
  'stirring-rod': `
    <path stroke="${detail}" stroke-width="7" d="m29 99 63-78"/>
    <path d="m25 103 8-8M88 25l8-8"/>
  `,
  'rubber-stopper': `
    <path fill="${rubber}" fill-opacity=".38" d="M34 38h52l-8 60H42z"/>
    <path d="M34 38h52M42 98h36"/>
    <path stroke="${rubber}" stroke-width="3" d="M39 51h43M41 64h39M43 77h35M44 89h32"/>
  `,
  'flat-bottom-flask': `
    <path ${glassFill} d="M48 16h25v34l22 40v8a9 9 0 0 1-9 9H34a9 9 0 0 1-9-9v-8l22-40z"/>
    <path d="M48 16c4 2 6 5 6 10v24L25 90v8a9 9 0 0 0 9 9h52a9 9 0 0 0 9-9v-8L66 50V26c0-5 2-8 7-10"/>
    <path ${detailStroke} d="M74 58h9M78 70h8M82 82h7"/>
  `,
  'volumetric-flask': `
    <path ${glassFill} d="M50 14h21v39c0 6 24 16 24 34 0 15-13 22-35 22s-35-7-35-22c0-18 24-28 24-34z"/>
    <path d="M50 14c4 2 6 5 6 10v29c0 6-24 16-24 34 0 15 11 22 28 22s28-7 28-22c0-18-24-28-24-34V24c0-5 2-8 7-10"/>
    <path stroke="${detail}" stroke-width="3" d="M48 45h24"/>
  `,
  'filter-flask': `
    <path ${glassFill} d="M47 15h26v34l22 42v7a9 9 0 0 1-9 9H34a9 9 0 0 1-9-9v-7l22-42z"/>
    <path d="M47 15c4 2 6 5 6 10v24L25 91v7a9 9 0 0 0 9 9h52a9 9 0 0 0 9-9v-7L67 49V25c0-5 2-8 6-10M70 34h31M70 43h31"/>
    <path ${detailStroke} d="M74 59h9M78 71h8M82 83h7"/>
  `,
  'test-tube-rack': `
    <path fill="${wood}" fill-opacity=".28" d="M15 38h90v17H15zM20 82h80v15H20z"/>
    <path d="M15 38h90v17H15zM20 82h80v15H20zM24 55v27M96 55v27"/>
    <path ${detailStroke} d="M30 46h10M47 46h10M64 46h10M81 46h10"/>
    <path d="M32 55v22a5 5 0 0 0 10 0V55M49 55v22a5 5 0 0 0 10 0V55M66 55v22a5 5 0 0 0 10 0V55M83 55v22a5 5 0 0 0 10 0V55"/>
  `,
  'u-tube': `
    <path ${glassFill} d="M31 16h18v61a11 11 0 0 0 22 0V16h18v61a29 29 0 0 1-58 0z"/>
    <path d="M28 16h24M34 16v61a26 26 0 0 0 52 0V16M68 16h24"/>
  `,
  condenser: `
    <path ${glassFill} d="M42 20h36v80H42z"/>
    <path d="M42 20h36M42 100h36M47 20v80M73 20v80M55 9v102M65 9v102M42 38H27v-10M78 82h15v10"/>
    <circle cx="27" cy="28" r="3" fill="${water}" stroke="none"/>
    <circle cx="93" cy="92" r="3" fill="${water}" stroke="none"/>
  `,
  'long-neck-funnel': `
    <path ${glassFill} d="M18 22h84L68 56v52H52V56z"/>
    <path d="M18 22h84L68 56v52M52 108V56z"/>
    <path ${detailStroke} d="M35 34h50"/>
  `,
  'dropping-funnel': `
    <path ${glassFill} d="M39 17h42v15c0 7 12 13 12 29 0 15-12 24-25 27v20H52V88c-13-3-25-12-25-27 0-16 12-22 12-29z"/>
    <path d="M39 17h42M44 17v15c0 7-12 13-12 29 0 15 12 22 28 25 16-3 28-10 28-25 0-16-12-22-12-29V17M52 88h16M52 108h16"/>
    <path d="M46 92h28M60 88v20"/>
    <circle cx="60" cy="98" r="4" fill="${metal}"/>
  `,
  'separatory-funnel': `
    <path ${glassFill} d="M44 15h32v20c0 7 20 19 20 39 0 14-16 24-29 27v8H53v-8C40 98 24 88 24 74c0-20 20-32 20-39z"/>
    <path d="M44 15h32M49 15v20c0 7-20 19-20 39 0 14 14 22 31 27 17-5 31-13 31-27 0-20-20-32-20-39V15M53 101h14M53 109h14"/>
    <path d="M45 92h30M60 92v17"/>
  `,
  dropper: `
    <path fill="${rubber}" fill-opacity=".35" d="M50 10q10-9 20 0l-3 13H53z"/>
    <path ${glassFill} d="M52 23h16v60l-8 25-8-25z"/>
    <path d="M50 23h20M54 23v59l6 21 6-21V23M50 10q10-9 20 0l-3 13H53z"/>
  `,
  pipette: `
    <path ${glassFill} d="M55 12h10v76l-5 21-5-21z"/>
    <path d="M53 12h14M56 12v76l4 18 4-18V12"/>
    <path ${detailStroke} d="M49 31h7M49 42h7M49 53h7M49 64h7M49 75h7"/>
  `,
  'volumetric-pipette': `
    <path ${glassFill} d="M56 10h8v39c0 7 10 12 10 24s-7 17-10 20v17h-8V93c-3-3-10-8-10-20s10-17 10-24z"/>
    <path d="M54 10h12M58 10v39c0 7-8 12-8 24s7 17 10 20c3-3 10-8 10-20s-8-17-8-24V10M58 93v17M62 93v17"/>
    <path stroke="${detail}" stroke-width="3" d="M50 46h20"/>
  `,
  'reagent-bottle': `
    <path ${glassFill} d="M39 31h42v12l10 11v42a10 10 0 0 1-10 10H39a10 10 0 0 1-10-10V54l10-11z"/>
    <path d="M39 31h42M41 20h38v11H41M39 43 29 54v42a10 10 0 0 0 10 10h42a10 10 0 0 0 10-10V54L81 43"/>
    <path ${detailStroke} d="M39 65h42M39 78h42"/>
  `,
  'wide-mouth-bottle': `
    <path ${glassFill} d="M32 34h56v62a10 10 0 0 1-10 10H42a10 10 0 0 1-10-10z"/>
    <path d="M32 34h56M37 21h46v13H37M32 34v62a10 10 0 0 0 10 10h36a10 10 0 0 0 10-10V34"/>
    <path ${detailStroke} d="M40 55h40M40 68h40"/>
  `,
  'wash-bottle': `
    <path ${glassFill} d="M32 39h56v57a10 10 0 0 1-10 10H42a10 10 0 0 1-10-10z"/>
    <path d="M32 39h56v57a10 10 0 0 1-10 10H42a10 10 0 0 1-10-10zM42 27h36v12H42M54 27V15h18c10 0 16 6 21 15l8 14M64 39v49"/>
  `,
  'petri-dish': `
    <ellipse cx="60" cy="49" rx="43" ry="14" fill="${glass}" fill-opacity=".4"/>
    <path d="M17 49v18c0 9 19 16 43 16s43-7 43-16V49M17 49c0 8 19 14 43 14s43-6 43-14"/>
  `,
  'evaporating-dish': `
    <path ${glassFill} d="M17 48q43 24 86 0-5 42-43 42S22 72 17 48z"/>
    <path d="M17 48c0 9 19 16 43 16s43-7 43-16M17 48c5 31 20 42 43 42s38-11 43-42M95 54l13 5"/>
  `,
  'watch-glass': `
    <path ${glassFill} d="M15 59q45-25 90 0-45 27-90 0z"/>
    <path d="M15 59q45-25 90 0M15 59q45 27 90 0"/>
  `,
  'surface-dish': `
    <path ${glassFill} d="M13 53q47-20 94 0-9 29-47 29S22 67 13 53z"/>
    <path d="M13 53q47-20 94 0M13 53c9 20 25 29 47 29s38-9 47-29"/>
    <path ${detailStroke} d="M32 59q28 10 56 0"/>
  `,
  'crystallizing-dish': `
    <path ${glassFill} d="M19 39h82l-8 54a10 10 0 0 1-10 9H37a10 10 0 0 1-10-9z"/>
    <path d="M19 39h82M27 39l8 54a8 8 0 0 0 8 7h34a8 8 0 0 0 8-7l8-54"/>
  `,
  'universal-clamp': `
    <path d="M17 60h31M72 60h31M72 60l26-25M72 60l26 25"/>
    <rect x="47" y="45" width="26" height="30" rx="5" fill="${metal}" fill-opacity=".25"/>
    <circle cx="60" cy="60" r="8" fill="${glass}"/>
    <path d="M47 45c-9 8-9 22 0 30M73 45c9 8 9 22 0 30"/>
  `,
  'flask-clamp': `
    <path d="M15 60h33M73 60l30-27M73 60l30 27"/>
    <path fill="${metal}" fill-opacity=".2" d="M47 43h27v34H47z"/>
    <circle cx="60" cy="60" r="10" fill="${glass}"/>
    <path d="M47 43c-10 9-10 25 0 34M74 43c10 9 10 25 0 34M92 39l7 8M92 81l7-8"/>
  `,
  'test-tube-holder': `
    <path fill="${wood}" fill-opacity=".35" d="M19 53h47v14H19z"/>
    <path d="M19 53h47v14H19M66 60l34-22M66 60l34 22M88 42l8 10M88 78l8-10"/>
  `,
  'crucible-tongs': `
    <path d="M24 101 58 60 33 22M96 101 62 60 87 22M58 60h4"/>
    <circle cx="60" cy="60" r="7" fill="${metal}"/>
    <path d="M20 98l9 7M100 98l-9 7M30 20l7 5M90 20l-7 5"/>
  `,
  'bunsen-burner': `
    <path fill="${metal}" fill-opacity=".25" d="M34 91h52l10 13H24z"/>
    <path d="M24 104h72L86 91H34zM52 91V39h16v52M48 39h24M60 39V29M68 66h19"/>
    <path fill="${flame}" stroke="none" d="M60 31c-13-10 7-19 1-30 18 13 9 26-1 30z"/>
    <path fill="${flameCore}" stroke="none" d="M60 27c-6-5 3-10 1-15 8 6 4 12-1 15z"/>
  `,
  'asbestos-mesh': `
    <path fill="${metal}" fill-opacity=".1" d="M17 25h86v70H17z"/>
    <path d="M17 25h86v70H17zM17 39h86M17 53h86M17 67h86M17 81h86M31 25v70M45 25v70M59 25v70M73 25v70M87 25v70"/>
    <circle cx="60" cy="60" r="22" fill="${glass}" fill-opacity=".7"/>
  `,
  'wooden-stopper': `
    <path fill="${wood}" fill-opacity=".55" d="M34 38h52l-8 60H42z"/>
    <path d="M34 38h52M42 98h36"/>
    <path stroke="${wood}" stroke-width="3" d="m39 50 42 8M40 63l40 8M42 76l36 7M43 89l33 6"/>
  `,
  'glass-tubing': `
    <path stroke="${detail}" stroke-width="8" d="m24 99 72-78"/>
    <path d="m20 103 8-8M92 25l8-8"/>
  `,
  'rubber-tubing': `
    <path stroke="${rubber}" stroke-width="9" d="M17 86C30 19 79 108 104 34"/>
    <circle cx="17" cy="86" r="6" fill="${glass}"/>
    <circle cx="104" cy="34" r="6" fill="${glass}"/>
  `,
  'water-tank': `
    <path ${glassFill} d="M16 34h88L94 101H26z"/>
    <path d="M13 34h94M19 34l9 67h64l9-67"/>
  `,
  aspirator: `
    <path ${glassFill} d="M51 14h18v34l12 11v13H69v35H51V72H39V59l12-11z"/>
    <path d="M51 14h18v34l12 11h24M81 72H69v35H51V72H39V59l12-11V14M43 59h34M43 72h34"/>
    <path stroke="${water}" stroke-width="3" d="M60 20v79"/>
  `,
  'water-delivery-tube': `
    <path stroke="${water}" stroke-width="9" d="M16 86C35 26 76 103 104 32"/>
    <circle cx="16" cy="86" r="6" fill="${glass}"/>
    <circle cx="104" cy="32" r="6" fill="${glass}"/>
    <path stroke="#fff" stroke-width="2" stroke-dasharray="5 8" d="M19 81C38 32 76 96 100 38"/>
  `,
  'gas-delivery-tube': `
    <path stroke="${rubber}" stroke-width="8" d="M16 86C31 27 77 102 104 32"/>
    <circle cx="16" cy="86" r="6" fill="${glass}"/>
    <circle cx="104" cy="32" r="6" fill="${glass}"/>
    <path stroke="#fff" stroke-width="2" stroke-dasharray="2 8" d="M19 81C34 33 77 96 100 38"/>
  `,
  'gas-jar': `
    <path ${glassFill} d="M35 21h50v73a12 12 0 0 1-12 12H47a12 12 0 0 1-12-12z"/>
    <path d="M31 21h58M37 21v73a10 10 0 0 0 10 10h26a10 10 0 0 0 10-10V21"/>
  `,
  'pneumatic-trough': `
    <path ${glassFill} d="M13 38h94L96 101H24z"/>
    <path d="M10 38h100M17 38l9 63h68l9-63M42 38v34M60 38v34M78 38v34"/>
  `,
  'test-tube-brush': `
    <path stroke="${metal}" stroke-width="4" d="m27 105 59-76"/>
    <path d="M22 108l10-7M78 28l14-14M72 36l17 5M66 44l17 7M60 52l17 9M54 60l16 10M48 68l15 11"/>
  `,
  spatula: `
    <path stroke="${metal}" stroke-width="6" d="m28 101 52-67"/>
    <path fill="${metal}" fill-opacity=".25" d="m76 29 15-11 10 8-13 16z"/>
    <path d="m23 105 10-8M76 29l15-11 10 8-13 16z"/>
  `,
  tweezers: `
    <path d="M27 20 58 88v15M93 20 62 88v15M27 20h12M81 20h12M40 38h40"/>
    <path stroke="${metal}" stroke-width="3" d="M34 27 60 86 86 27"/>
  `,
  'electronic-balance': `
    <path fill="${metal}" fill-opacity=".16" d="M24 45h72l9 53H15z"/>
    <path d="M24 45h72l9 53H15zM33 45v-9h54v9M40 29h40"/>
    <rect x="42" y="65" width="36" height="16" rx="3" fill="#dcebea"/>
    <path stroke="${darkMetal}" stroke-width="2.5" d="M48 73h24"/>
    <circle cx="88" cy="73" r="4" fill="${metal}"/>
  `,
};

export const apparatusModelIds = Object.freeze(Object.keys(models));

export const getApparatusSvg = (equipmentId) => {
  const model = models[equipmentId];
  if (!model) throw new Error(`Missing SVG model for equipment: ${equipmentId}`);
  return svg(model);
};
