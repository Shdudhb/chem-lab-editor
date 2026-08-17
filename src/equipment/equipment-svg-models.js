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
    <path ${glassFill} d="M23 14h74v82a11 11 0 0 1-11 11H34a11 11 0 0 1-11-11z"/>
    <path d="M23 14v82a11 11 0 0 0 11 11h52a11 11 0 0 0 11-11V14"/>
    <path ${detailStroke} d="M78 31h12M82 43h8M78 55h12M82 67h8M78 79h12M82 91h8"/>
  `,
  'erlenmeyer-flask': `
    <path ${glassFill} d="M49 7h22v40l24 50a10 10 0 0 1-9 16H34a10 10 0 0 1-9-16l24-50z"/>
    <path d="M42 7c5 2 7 5 7 10v30L25 97a10 10 0 0 0 9 16h52a10 10 0 0 0 9-16L71 47V17c0-5 2-8 7-10"/>
    <path ${detailStroke} d="M72 59h10M77 71h9M82 83h8M87 95h6"/>
  `,
  'round-bottom-flask': `
    <path ${glassFill} d="M49 6h22v32c20 4 35 15 35 36 0 27-20 41-46 41S14 101 14 74c0-21 15-32 35-36z"/>
    <path d="M42 6c5 2 7 5 7 10v22C29 42 14 53 14 74c0 27 20 41 46 41s46-14 46-41c0-21-15-32-35-36V16c0-5 2-8 7-10"/>
  `,
  'test-tube': `
    <path ${glassFill} d="M49 5h22v98a11 11 0 0 1-22 0z"/>
    <path d="M49 5v98a11 11 0 0 0 22 0V5"/>
  `,
  funnel: `
    <path ${glassFill} d="M15 14l39 43v51h12V57l39-43z"/>
    <path d="M15 14 54 57v51M105 14 66 57v51"/>
  `,
  'graduated-cylinder': `
    <path ${glassFill} d="M50 8h20v88l12 12H38l12-12z"/>
    <path d="M44 8c4 2 6 5 6 10v78l-12 12h44L70 96V18c0-5 2-8 6-10"/>
    <path ${detailStroke} d="M59 22h8M63 30h4M59 38h8M63 46h4M59 54h8M63 62h4M59 70h8M63 78h4M59 86h8M63 94h4"/>
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
    <path ${glassFill} d="M49 6h22v33c21 4 36 17 36 37 0 15-10 28-27 36H40c-17-8-27-21-27-36 0-20 15-33 36-37z"/>
    <path d="M42 6c5 2 7 5 7 10v23C28 43 13 56 13 76c0 15 10 28 27 36h40c17-8 27-21 27-36 0-20-15-33-36-37V16c0-5 2-8 7-10"/>
  `,
  'volumetric-flask': `
    <path ${glassFill} d="M50 5h20v54c6 9 14 22 16 35 2 11-5 18-12 21H46c-7-3-14-10-12-21 2-13 10-26 16-35z"/>
    <path d="M43 5c5 2 7 5 7 10v44C44 68 36 81 34 94c-2 11 5 18 12 21h28c7-3 14-10 12-21-2-13-10-26-16-35V15c0-5 2-8 7-10"/>
    <path ${detailStroke} d="M51 38h18"/>
  `,
  'filter-flask': `
    <path ${glassFill} d="M49 7h22v40l24 50a10 10 0 0 1-9 16H34a10 10 0 0 1-9-16l24-50z"/>
    <path d="M42 7c5 2 7 5 7 10v30L25 97a10 10 0 0 0 9 16h52a10 10 0 0 0 9-16L71 47V17c0-5 2-8 7-10M71 29h32M71 41h32"/>
    <path ${detailStroke} d="M64 59h10M69 70h10M74 81h10M79 92h10M82 103h9"/>
  `,
  'test-tube-rack': `
    <path fill="${metal}" fill-opacity=".16" d="M13 29h94v17H13zM19 87h82v14H19z"/>
    <path d="M13 29h94v17H13zM19 87h82v14H19zM22 46v41M98 46v41"/>
    <g fill="${glass}" stroke-width="3">
      <ellipse cx="27" cy="37.5" rx="6" ry="3.5"/>
      <ellipse cx="43.5" cy="37.5" rx="6" ry="3.5"/>
      <ellipse cx="60" cy="37.5" rx="6" ry="3.5"/>
      <ellipse cx="76.5" cy="37.5" rx="6" ry="3.5"/>
      <ellipse cx="93" cy="37.5" rx="6" ry="3.5"/>
    </g>
  `,
  'u-tube': `
    <path ${glassFill} d="M32 11h18v65a10 10 0 0 0 20 0V11h18v65a28 28 0 0 1-56 0z"/>
    <path d="M32 11v65a28 28 0 0 0 56 0V11M50 11v65a10 10 0 0 0 20 0V11"/>
  `,
  condenser: `
    <path ${glassFill} d="M44 27c0-6 5-10 12-10h8c7 0 12 4 12 10v66c0 6-5 10-12 10h-8c-7 0-12-4-12-10z"/>
    <path d="M56 5v110M64 5v110"/>
    <path d="M56 17c-7 0-12 4-12 10v7M44 44v49c0 6 5 10 12 10M64 103c7 0 12-4 12-10v-7M76 76V27c0-6-5-10-12-10"/>
    <path d="M44 34H20M44 44H20M76 76h24M76 86h24"/>
  `,
  'long-neck-funnel': `
    <path ${glassFill} d="M45 8c7 3 10 7 10 12-8 2-13 7-13 13 0 6 5 10 13 13v69h10V46c8-3 13-7 13-13 0-6-5-11-13-13 0-5 3-9 10-12z"/>
    <path d="M45 8c7 3 10 7 10 12-8 2-13 7-13 13 0 6 5 10 13 13v69M75 8c-7 3-10 7-10 12 8 2 13 7 13 13 0 6-5 10-13 13v69"/>
  `,
  'dropping-funnel': `
    <path ${glassFill} d="M52 5h16v15c9 3 14 8 14 16v24c0 8-6 13-16 16v6H54v-6c-10-3-16-8-16-16V36c0-8 5-13 14-16z"/>
    <path d="M45 5c5 2 7 5 7 10v5C43 23 38 28 38 36v24c0 8 6 13 16 16v6M75 5c-5 2-7 5-7 10v5c9 3 14 8 14 16v24c0 8-6 13-16 16v6"/>
    <path d="M43 82h34M56 87v29M64 87v29"/>
    <circle cx="60" cy="82" r="5" fill="${metal}"/>
    <path ${detailStroke} d="M69 34h8M71 44h6M69 54h8M71 64h6"/>
  `,
  'separatory-funnel': `
    <path ${glassFill} d="M52 6h16v22c15 4 25 10 25 19 0 12-16 37-29 47h-8C43 84 27 59 27 47c0-9 10-15 25-19z"/>
    <path d="M45 6c5 2 7 5 7 10v12C37 32 27 38 27 47c0 12 16 37 29 47M75 6c-5 2-7 5-7 10v12c15 4 25 10 25 19 0 12-16 37-29 47"/>
    <path d="M43 96h34M56 101v15M64 101v15"/>
    <circle cx="60" cy="96" r="5" fill="${metal}"/>
    <path ${detailStroke} d="M75 43h9M77 54h8M74 65h8"/>
  `,
  dropper: `
    <path fill="${rubber}" fill-opacity=".5" d="M60 5c-6 0-9 4-9 10v10l-4 7h26l-4-7V15c0-6-3-10-9-10z"/>
    <path ${glassFill} d="M54 32h12v62c0 7-3 14-6 21-3-7-6-14-6-21z"/>
    <path d="M60 5c-6 0-9 4-9 10v10l-4 7h26l-4-7V15c0-6-3-10-9-10M47 32h26M54 32v62c0 7 3 14 6 21 3-7 6-14 6-21V32"/>
    <path ${detailStroke} d="M61 43v42"/>
  `,
  pipette: `
    <path ${glassFill} d="M56 5h8v40c0 4 7 6 7 13s-4 11-7 13v44h-8V71c-3-2-7-6-7-13s7-9 7-13z"/>
    <path d="M56 5v40c0 4-7 6-7 13s4 11 7 13v44M64 5v40c0 4 7 6 7 13s-4 11-7 13v44"/>
    <path stroke="#d36b61" stroke-width="3" d="M55 16h10"/>
  `,
  'volumetric-pipette': `
    <path ${glassFill} d="M57 5h6v34c9 5 15 12 15 22s-6 18-15 23v20c0 4-1 8-3 11-2-3-3-7-3-11V84c-9-5-15-13-15-23s6-17 15-22z"/>
    <path d="M57 5v34c-9 5-15 12-15 22s6 18 15 23v20c0 4 1 8 3 11M63 5v34c9 5 15 12 15 22s-6 18-15 23v20c0 4-1 8-3 11"/>
    <path stroke="#d36b61" stroke-width="3" d="M56 20h8"/>
  `,
  'reagent-bottle': `
    <path ${glassFill} d="M43 8h34l-5 20v15c12 3 18 8 18 17v45c0 6-5 10-11 10H41c-6 0-11-4-11-10V60c0-9 6-14 18-17V28z"/>
    <path d="M43 8h34M47 14h26l-4 14H51zM48 28v15C36 46 30 51 30 60v45c0 6 5 10 11 10h38c6 0 11-4 11-10V60c0-9-6-14-18-17V28"/>
  `,
  'wide-mouth-bottle': `
    <path fill="${metal}" fill-opacity=".2" d="M37 8h46v24H37z"/>
    <path ${glassFill} d="M43 32h34v10c10 2 15 7 15 15v48c0 6-5 10-11 10H39c-6 0-11-4-11-10V57c0-8 5-13 15-15z"/>
    <path d="M37 8h46v24H37zM37 16h46M37 24h46M43 32v10C33 44 28 49 28 57v48c0 6 5 10 11 10h42c6 0 11-4 11-10V57c0-8-5-13-15-15V32"/>
  `,
  'wash-bottle': `
    <path ${glassFill} d="M48 38h24c0 4 2 7 8 9 7 3 10 8 10 15v39c0 8-5 13-13 13H43c-8 0-13-5-13-13V62c0-7 3-12 10-15 6-2 8-5 8-9z"/>
    <path d="M48 38h24c0 4 2 7 8 9 7 3 10 8 10 15v39c0 8-5 13-13 13H43c-8 0-13-5-13-13V62c0-7 3-12 10-15 6-2 8-5 8-9"/>
    <path d="M47 25h26v13H47zM47 31h26M58 25v-7c0-5-3-8-8-8h-7L16 33M65 25v-7c0-9-6-15-15-15H41L13 29M58 38v64M65 38v64"/>
  `,
  'petri-dish': `
    <path ${glassFill} d="M18 42v22c0 8 6 13 14 13h56c8 0 14-5 14-13V42z"/>
    <path d="M18 42v22c0 8 6 13 14 13h56c8 0 14-5 14-13V42"/>
  `,
  'evaporating-dish': `
    <path ${glassFill} d="M17 38c2 24 7 38 18 45 6 4 15 6 25 6s19-2 25-6c10-7 15-21 17-39l7-5z"/>
    <path d="M17 38c2 24 7 38 18 45 6 4 15 6 25 6s19-2 25-6c10-7 15-21 17-39l7-5"/>
  `,
  'watch-glass': `
    <path ${glassFill} d="M14 52c12 12 28 17 46 17s34-5 46-17z"/>
    <path d="M14 52c12 12 28 17 46 17s34-5 46-17"/>
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
