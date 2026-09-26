/* Ceresio OS — icone 16x16 disegnate a mano. Lettere = colori della palette (vedi core.js). */
(() => {
'use strict';
const OS = window.OS;

const ICONS = {
  doc: [
    '................', '..kkkkkkkkk.....', '..kwwwwwwwkk....', '..kwwwwwwwkwk...', '..kwgggggwkkkk..', '..kwwwwwwwwwwk..',
    '..kwggggggggwk..', '..kwwwwwwwwwwk..', '..kwggggggggwk..', '..kwwwwwwwwwwk..', '..kwgggggggwwk..', '..kwwwwwwwwwwk..',
    '..kwggggggggwk..', '..kwwwwwwwwwwk..', '..kkkkkkkkkkkk..', '................'
  ],
  person: [
    '................', '.....kkkkkk.....', '....kuuuuuuk....', '...kuuuuuuuuk...', '...kuRRRRRRuk...', '...kRkRRRRkRk...',
    '...kRRRRRRRRk...', '...kRRRkkRRRk...', '....kRRRRRRk....', '.....kkRRkk.....', '...kkbbkkbbkk...', '..kbbbbbwbbbbk..',
    '.kbbbbbbwbbbbbk.', '.kbbbbbbwbbbbbk.', '.kbbbbbbwbbbbbk.', '.kkkkkkkkkkkkkk.'
  ],
  path: [
    '................', '..........k.....', '..........krr...', '..........krrrr.', '..........k.....', '.........kwk....',
    '........kwwwk...', '.......kwwGwwk..', '......kGwGGGGGk.', '.....kGGGGGGGGGk', '....kGGGyGGGGGGk', '...kGGGGGyGGGGGk',
    '..kGGGGGGGyGGGGk', '.kGGGGGGGGGGyGGk', 'kbbbbbbbbbbbbbbk', 'kkkkkkkkkkkkkkkk'
  ],
  school: [
    '................', '................', '................', '.......kk.......', '.....kknnkk.....', '...kknnnnnnkk...',
    '.kknnnnnnnnnnkk.', '...kknnnnnnkk.y.', '....kkknnkkk..y.', '....kGGkkGGk..y.', '....kGGGGGGk.yyy', '....kGGGGGGk.yyy',
    '.....kkkkkk.....', '................', '................', '................'
  ],
  langs: [
    '................', '.kkkkkkkkk......', 'kwwwwwwwwwk.....', 'kwGGwGGGwwk.....', 'kwwwwwwwwwk.....', 'kwGGGwGGwwk.....',
    '.kkkkkkkkkkkkkk.', '..kk.kBBBBBBBBBk', '..k..kBwwBwwwBBk', '.....kBBBBBBBBBk', '.....kBwwwBwwBBk', '.....kBBBBBBBBBk',
    '......kkkkkkkkk.', '...........kk...', '................', '................'
  ],
  floppy: [
    '................', '.kkkkkkkkkkkkkk.', '.kbbkggggggkbbk.', '.kbbkgGGgggkbbk.', '.kbbkgGGgggkbbk.', '.kbbkggggggkbbk.',
    '.kbbbkkkkkkbbbk.', '.kbbbbbbbbbbbbk.', '.kbkkkkkkkkkkbk.', '.kbkwwwwwwwwkbk.', '.kbkwrrrrrrwkbk.', '.kbkwwwwwwwwkbk.',
    '.kbkwGGGGGwwkbk.', '.kbkwwwwwwwwkbk.', '.kkkkkkkkkkkkkk.', '................'
  ],
  mail: [
    '................', '................', '................', '.kkkkkkkkkkkkkk.', '.kkwwwwwwwwwwkk.', '.kwkwwwwwwwwkwk.',
    '.kwwkwwwwwwkwwk.', '.kwwwkwwwwkwwwk.', '.kwwwwkrrkwwwwk.', '.kwwwkwrrwkwwwk.', '.kwwkwwwwwwkwwk.', '.kwkwwwwwwwwkwk.',
    '.kkwwwwwwwwwwkk.', '.kkkkkkkkkkkkkk.', '................', '................'
  ],
  term: [
    '................', '.kkkkkkkkkkkkkk.', '.kggggggggggggk.', '.kgkkkkkkkkkkgk.', '.kgknnnnnnnnkgk.', '.kgknlnnnnnnkgk.',
    '.kgknnlnnnnnkgk.', '.kgknlnlllnnkgk.', '.kgknnnnnnnnkgk.', '.kgkkkkkkkkkkgk.', '.kggggggggggggk.', '.kkkkkkkkkkkkkk.',
    '......kggk......', '....kkkkkkkk....', '....kggggggk....', '....kkkkkkkk....'
  ],
  joy: [
    '................', '......kkk.......', '.....krrrk......', '.....krwrk......', '.....krrrk......', '......kkk.......',
    '.......k........', '.......k........', '.......k........', '..kkkkkkkkkkkk..', '.kGGGGGGGGGGGGk.', '.kGrrGGGGGyyGGk.',
    '.kGGGGGGGGGGGGk.', '.kkkkkkkkkkkkkk.', '................', '................'
  ],
  folder: [
    '................', '................', '.kkkkk..........', 'kyyyyyk.........', 'kyyyyyykkkkkkkk.', 'kyyyyyyyyyyyyyyk',
    'kkkkkkkkkkkkkkkk', 'kyyyyyyyyyyyyyyk', 'kyyyyyyyyyyyyyyk', 'kyyyyyyyyyyyyyyk', 'kyyyyyyyyyyyyyyk', 'kyyyyyyyyyyyyyyk',
    'kyyyyyyyyyyyyyyk', 'kooooooooooooook', 'kkkkkkkkkkkkkkkk', '................'
  ],
  trophy: [
    '................', '..kkkkkkkkkkkk..', 'kkkyyywyyyyyykkk', 'kykyywyyyyyyykyk', 'kykyywyyyyyyykyk', '.kkyyyyyyyyyykk.',
    '...kyyyyyyyyk...', '....kyyyyyyk....', '.....kyyyyk.....', '......kyyk......', '......kyyk......', '.....kkyykk.....',
    '....kuuuuuuk....', '....kuuuuuuk....', '....kkkkkkkk....', '................'
  ],
  trash: [
    '................', '......kkkk......', '..kkkkkkkkkkkk..', '..kggggggggggk..', '..kkkkkkkkkkkk..', '...kgGgGgGgGk...',
    '...kgGgGgGgGk...', '...kgGgGgGgGk...', '...kgGgGgGgGk...', '...kgGgGgGgGk...', '...kgGgGgGgGk...', '...kgGgGgGgGk...',
    '...kgGgGgGgGk...', '...kgGgGgGgGk...', '...kkkkkkkkkk...', '................'
  ],
  trashFull: [
    '.....kwk.kwk....', '....kwwkkwwwk...', '..kkkkkkkkkkkk..', '..kggggggggggk..', '..kkkkkkkkkkkk..', '...kgGgGgGgGk...',
    '...kgGgGgGgGk...', '...kgGgGgGgGk...', '...kgGgGgGgGk...', '...kgGgGgGgGk...', '...kgGgGgGgGk...', '...kgGgGgGgGk...',
    '...kgGgGgGgGk...', '...kgGgGgGgGk...', '...kkkkkkkkkk...', '................'
  ],
  gear: [
    '................', '......kkkk......', '...kk.kGGk.kk...', '..kGGkkGGkkGGk..', '..kGGGGGGGGGGk..', '...kGGGkkGGGk...',
    '.kkkGGk..kGGkkk.', '.kGGGk....kGGGk.', '.kGGGk....kGGGk.', '.kkkGGk..kGGkkk.', '...kGGGkkGGGk...', '..kGGGGGGGGGGk..',
    '..kGGkkGGkkGGk..', '...kk.kGGk.kk...', '......kkkk......', '................'
  ],
  vinyl: [
    '................', '.....kkkkkk.....', '...kkGkkkkGkk...', '..kkkkkkkkkkkk..', '.kkkkkkkkkkkkkk.', '.kkkkkrrrrkkkkk.',
    'kkkGkrrrrrrkkkkk', 'kkkkkrrwwrrkkkkk', 'kkkkkrrwwrrkkkkk', 'kkkkkrrrrrrkGkkk', '.kkkkkrrrrkkkkk.', '.kkkkkkkkkkkkkk.',
    '..kkkkkkkkkkkk..', '...kkGkkkkGkk...', '.....kkkkkk.....', '................'
  ],
  paint: [
    '................', '................', '....kkkkkkk.....', '..kkwwwwwwwkk...', '.kwwrrwwyywwwk..', '.kwwrrwwyywwwwk.',
    'kwwwwwwwwwbbwwk.', 'kwllwwkkwwwbbwk.', 'kwllwk..kwwwwwk.', 'kwwwwk..kwwoowk.', 'kwwwwwkkwwwoowk.', '.kwwRRwwwwwwwk..',
    '..kkRRwwwwwkk...', '....kkkkkkk.....', '................', '................'
  ],
  clock: [
    '................', '.....kkkkkk.....', '...kkwwwwwwkk...', '..kwwwwwkwwwwk..', '.kwwwwwwkwwwwwk.', '.kwwwwwwkwwwwwk.',
    'kwwwwwwwkwwwwwwk', 'kwwwwwwwkwwwwwwk', 'kkwwwwwwkkkkwwkk', 'kwwwwwwwwwwwrwwk', 'kwwwwwwwwwwrwwwk', '.kwwwwwwwwrwwwk.',
    '.kwwwwwwwwwwwwk.', '..kwwwwwkwwwwk..', '...kkwwwwwwkk...', '.....kkkkkk.....'
  ],
  pizza: [
    '................', 'kkkkkkkkkkkkkkkk', 'kuuuuuuuuuuuuuuk', 'kuuuuuuuuuuuuuuk', 'kkyyyyyyyyyyyykk', '.kyyrryyyyyyyyk.',
    '.kyyrryyyyrryk..', '..kyyyyyyyrrk...', '..kyyyryyyyyk...', '...kyyrryyyk....', '...kyyrryyyk....', '....kyyyyyk.....',
    '....kyylyk......', '.....kyyk.......', '.....kyk........', '......k.........'
  ],
  bricks: [
    '................', '................', 'kkkkkkkkkkkkkkkk', 'krrrrrrkrrrrrrrk', 'kkkkkkkkkkkkkkkk', 'koookoooooookook',
    'kkkkkkkkkkkkkkkk', 'kyyyyyykyyyyyyyk', 'kkkkkkkkkkkkkkkk', '................', '......kwwk......', '......kwwk......',
    '................', '....kkkkkkkk....', '....kBBBBBBk....', '....kkkkkkkk....'
  ],
  bomb: [
    '................', '..........k.y...', '.........k.yoy..', '........k...y...', '....kkkkkk......', '..kkGGkkkkkk....',
    '.kGGkkkkkkkkk...', '.kGkkkkkkkkkk...', 'kkkkkkkkkkkkkk..', 'kkkkkkkkkkkkkk..', 'kkkkkkkkkkkkkk..', '.kkkkkkkkkkkk...',
    '.kkkkkkkkkkkk...', '..kkkkkkkkkk....', '....kkkkkk......', '................'
  ],
  computer: [
    '................', '..kkkkkkkkkkkk..', '..kggggggggggk..', '..kgkkkkkkkkgk..', '..kgkbbbbbbkgk..', '..kgkbsbbbbkgk..',
    '..kgkbbbbbbkgk..', '..kgkkkkkkkkgk..', '..kggggggggrgk..', '..kkkkkkkkkkkk..', '.kggggggggggggk.', '.kgGgGgGgGgGggk.',
    '.kggggggggggggk.', '.kkkkkkkkkkkkkk.', '................', '................'
  ],
  key: [
    '................', '................', '................', '................', '.kkkk...........', 'kyyyyk..........',
    'kykkykkkkkkkkkk.', 'kykkyyyyyyyyyyyk', 'kyyyykkkkkkkykyk', '.kkkk.......k.k.', '................', '................',
    '................', '................', '................', '................'
  ],
  info: [
    '................', '.....kkkkkk.....', '...kkbbbbbbkk...', '..kbbbbwwbbbbk..', '.kbbbbbwwbbbbbk.', '.kbbbbbbbbbbbbk.',
    'kbbbbbwwwbbbbbbk', 'kbbbbbbwwbbbbbbk', 'kbbbbbbwwbbbbbbk', 'kbbbbbbwwbbbbbbk', '.kbbbbbwwbbbbbk.', '.kbbbbwwwwbbbbk.',
    '..kbbbbbbbbbbk..', '...kkbbbbbbkk...', '.....kkkkkk.....', '................'
  ],
  warn: [
    '................', '.......kk.......', '......kyyk......', '......kyyk......', '.....kyyyyk.....', '.....kykkyk.....',
    '....kyykkyyk....', '....kyykkyyk....', '...kyyykkyyyk...', '...kyyykkyyyk...', '..kyyyyyyyyyyk..', '..kyyyykkyyyyk..',
    '.kyyyyykkyyyyyk.', '.kyyyyyyyyyyyyk.', 'kkkkkkkkkkkkkkkk', '................'
  ],
  note: [
    '................', '..kkkkkkkkk.....', '..kwwwwwwwkk....', '..kwwwwwwwkwk...', '..kwBBBBBwkkkk..', '..kwwwwwwwwwwk..',
    '..kwBBBBBBBBwk..', '..kwwwwwwwwwwk..', '..kwBBBBBBwwwk..', '..kwwwwwwwwwwk..', '..kwBBBBBBBBwk..', '..kwwwwwwwwwyk..',
    '..kwBBBBwwwyrk..', '..kwwwwwwwyrkk..', '..kkkkkkkkkkk...', '................'
  ],
  // Mascotte: 12x16, due fotogrammi di camminata, con cartone della pizza.
  carlo1: [
    '....kkkk....', '...kuuuuk...', '..kuuuuuuk..', '..kRkRRkRk..', '..kRRRRRRk..', '...kRkkRk...', '....kRRk....',
    '..kkbbbbkk..', '.kbbbbbbbbk.', 'kRkbbbbbbkyyyyk', 'kRkbbbbbbkuuuuk', '..kbbbbbbk..', '..kGGkkGGk..', '..kGGkkGGk..',
    '..kGk..kGk..', '.kkk....kkk.'
  ],
  carlo2: [
    '....kkkk....', '...kuuuuk...', '..kuuuuuuk..', '..kRkRRkRk..', '..kRRRRRRk..', '...kRkkRk...', '....kRRk....',
    '..kkbbbbkk..', '.kbbbbbbbbk.', 'kRkbbbbbbkyyyyk', 'kRkbbbbbbkuuuuk', '..kbbbbbbk..', '...kGGGGk...', '...kGkkGk...',
    '...kGkkGk...', '..kkk..kkk..'
  ],
  flag: [
    'kkkkkkkkkkk', 'krrrrrrrrrk', 'krrrrwrrrrk', 'krrrrwrrrrk', 'krrwwwwwrrk', 'krrrrwrrrrk', 'krrrrwrrrrk', 'krrrrrrrrrk', 'kkkkkkkkkkk'
  ],
  // Emblema 9x9 per la barra dei menu.
  emblem: [
    '.........', '......yy.', '......yy.', '...ww....', '..wppp...', '.pppppp..', 'ppppppppp', 'bbBbbbBbb', 'bbbbBbbbb'
  ],
  speaker: ['...k....', '..kk.k..', 'kkkk..k.', 'kkkk.k.k', 'kkkk.k.k', 'kkkk..k.', '..kk.k..', '...k....'],
  mute: ['...k....', '..kk....', 'kkkkk.k.', 'kkkk.k..', 'kkkk.k..', 'kkkkk.k.', '..kk....', '...k....']
};

OS.tasks.push({
  it: 'Disegno le icone', en: 'Drawing icons',
  run: async () => {
    for (const [name, rows] of Object.entries(ICONS)) OS.SPR[name] = OS.makeSprite(rows);
    // Variante "selezionata": retino blu sopra i pixel pieni, come i vecchi desktop.
    for (const name of Object.keys(ICONS)) {
      const s = OS.SPR[name];
      const c = document.createElement('canvas'); c.width = s.width; c.height = s.height;
      const x = c.getContext('2d');
      x.drawImage(s, 0, 0);
      x.globalCompositeOperation = 'source-atop';
      x.fillStyle = OS.P.lake;
      for (let yy = 0; yy < s.height; yy++) for (let xx = (yy & 1); xx < s.width; xx += 2) x.fillRect(xx, yy, 1, 1);
      OS.SPR[name + ':sel'] = c;
    }
    return Object.keys(ICONS).length + ' ' + OS.L('icone', 'icons');
  }
});
})();
