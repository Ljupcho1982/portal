/* Portal — personal start page
 * ----------------------------------------------------------------
 * Everything runs in the browser. No accounts, no API keys, no paid
 * services, no trackers. Config lives in localStorage only.
 * External calls (all free, keyless, optional — the page works without them):
 *   - api.open-meteo.com          weather + sunrise/sunset
 *   - geocoding-api.open-meteo.com city lookup
 *   - api.frankfurter.dev         ECB reference exchange rates
 *   - ./feeds.json                news, written by the local fetcher (Phase 2)
 */

'use strict';

/* ═══════════ i18n ═══════════ */

const I18N = {
  en: {
    settings:'Settings', appearance:'Appearance', theme:'Theme', language:'Language',
    density:'Density', location:'Location', find:'Find', currency:'Currency',
    base:'Base', show:'Show', widgets:'Widgets', feeds:'News feeds', data:'Your data',
    export:'Export', import:'Import', reset:'Reset', save:'Save', cancel:'Cancel',
    edit:'Edit', refresh:'Refresh',
    weather:'Weather', sun:'Sun', rates:'Exchange rates', bookmarks:'Bookmarks',
    apps:'My apps', notes:'Notes', todo:'To do', news:'News',
    sunrise:'Sunrise', sunset:'Sunset', daylight:'Daylight', noon:'Solar noon',
    feels:'Feels', humidity:'Humidity', wind:'Wind',
    loading:'Loading…', offline:'Offline — showing last saved data',
    failed:'Could not load', noLocation:'Set a location in Settings',
    addTodo:'Add a task…', noTodo:'Nothing to do. Enjoy.',
    noNews:'No feeds.json yet. Run  node fetch-feeds.js  to fill this.',
    notesPh:'Scratchpad. Saves as you type.',
    listHint:'One per line:  Title | URL | icon (icon optional)',
    ratesHint:'ECB daily reference rates. MKD is shown from its fixed euro peg.',
    dragHint:'Drag a card by its title bar to reorder.',
    feedsHint:'Edit feeds.txt next to this page (one RSS/Atom URL per line), then run  node fetch-feeds.js  to refresh the news card.',
    dataHint:'Everything is stored in this browser only. Export makes a backup file.',
    resetAsk:'Erase all settings, bookmarks, notes and tasks?',
    morning:'Good morning', afternoon:'Good afternoon', evening:'Good evening', night:'Good night',
    updated:'updated', free:'No accounts · no keys · no tracking · works offline',
    /* add / remove cards */
    addCard:'Add a card', chooseType:'What kind of card?', restore:'Add a built-in card',
    nothingHidden:'All built-in cards are already on the page.', remove:'Remove', delete:'Delete',
    delAsk:'Delete this card and its content?',
    t_note:'Note', t_links:'Link list', t_embed:'Embedded page', t_countdown:'Countdown', t_clock:'World clock',
    d_note:'Free text that stays where you put it',
    d_links:'Your own group of links',
    d_embed:'Any page or map inside a frame',
    d_countdown:'Days left until a date',
    d_clock:'The time in another city',
    f_title:'Title', f_text:'Text', f_list:'Links', f_url:'Address', f_h:'Height (px)',
    f_date:'Target date', f_note:'Caption', f_tz:'Time zone',
    embedHint:'Some sites refuse to be framed. Local files and maps almost always work.',
    openTab:'Open in a tab', daysLeft:'days left', daysAgo:'days ago', today:'Today',
    noUrl:'No address set yet.', badTz:'Unknown time zone',
    emptyCard:'Empty — press the pencil to fill it in.',
    /* mail */
    mail:'Mail', mailConnect:'Connect Gmail', mailDisconnect:'Disconnect',
    mailNoId:'Add your Google client ID in Settings first.',
    mailSetupLead:'Anyone can use this card with their own Gmail. It needs a free Google client ID once — five minutes, no payment, no billing details.',
    mailStep1:'Open the Google Cloud console and create a project.',
    mailStep2:'APIs & Services → Library → enable the Gmail API.',
    mailStep3:'OAuth consent screen → External → add the scope gmail.readonly.',
    mailStep4:'Credentials → Create OAuth client ID → Web application, and add this page’s address as an authorised JavaScript origin.',
    mailStep5:'Paste the client ID into Settings → Mail, then press Connect.',
    mailOpenConsole:'Google Cloud console', mailOrigin:'This page’s address:',
    mailSwitch:'Sign in as someone else', mailSignOut:'Sign out',
    mailIdLabel:'Google client ID', mailPollLabel:'Check every (min)',
    mailNotifyLabel:'Desktop notification',
    mailIdHint:'Create a free OAuth client ID (type: Web application) at console.cloud.google.com, enable the Gmail API, and add this page’s address as an authorised JavaScript origin. Nothing is paid and no secret is needed.',
    mailEmpty:'No unread mail.', mailUnread:'unread',
    mailOpenGmail:'Open in Gmail', mailBodyLoad:'Loading the message…',
    mailSignedIn:'Signed in as', mailFailed:'Gmail refused the request. Try connecting again.',
    mailNotifyTitle:'New mail', mailNoNotifyPerm:'The browser blocked notifications.',
    mailFileOrigin:'Gmail sign-in needs the page served over http, not opened from disk.',
    mailReadOnly:'Read-only access. The portal can never send or delete mail.',
    appsEmpty:'No app tiles yet — press the pencil above to add your own.'
  },
  mk: {
    settings:'Поставки', appearance:'Изглед', theme:'Тема', language:'Јазик',
    density:'Густина', location:'Локација', find:'Најди', currency:'Валути',
    base:'Основна', show:'Прикажи', widgets:'Виџети', feeds:'Извори на вести', data:'Твои податоци',
    export:'Извези', import:'Увези', reset:'Ресетирај', save:'Зачувај', cancel:'Откажи',
    edit:'Уреди', refresh:'Освежи',
    weather:'Време', sun:'Сонце', rates:'Курсна листа', bookmarks:'Обележувачи',
    apps:'Мои апликации', notes:'Белешки', todo:'Задачи', news:'Вести',
    sunrise:'Изгрев', sunset:'Залез', daylight:'Должина на ден', noon:'Сончево пладне',
    feels:'Чувство', humidity:'Влажност', wind:'Ветер',
    loading:'Се вчитува…', offline:'Нема мрежа — прикажани се последните податоци',
    failed:'Не успеа вчитувањето', noLocation:'Постави локација во Поставки',
    addTodo:'Додај задача…', noTodo:'Нема задачи. Уживај.',
    noNews:'Сè уште нема feeds.json. Изврши  node fetch-feeds.js  за да се пополни.',
    notesPh:'Тетратка. Се зачувува додека пишуваш.',
    listHint:'По еден во ред:  Наслов | URL | икона (иконата е по избор)',
    ratesHint:'Дневни референтни курсеви на ЕЦБ. МКД се пресметува од фиксниот однос со еврото.',
    dragHint:'Влечи ја картичката за насловот за да ја преместиш.',
    feedsHint:'Уреди го feeds.txt покрај оваа страница (по еден RSS/Atom URL во ред), па изврши  node fetch-feeds.js  за да се освежат вестите.',
    dataHint:'Сè се чува само во овој прелистувач. „Извези“ прави резервна копија.',
    resetAsk:'Да се избришат сите поставки, обележувачи, белешки и задачи?',
    morning:'Добро утро', afternoon:'Добар ден', evening:'Добра вечер', night:'Добра ноќ',
    updated:'освежено', free:'Без сметки · без клучеви · без следење · работи офлајн',
    /* додавање / бришење картички */
    addCard:'Додај картичка', chooseType:'Каква картичка?', restore:'Додај вградена картичка',
    nothingHidden:'Сите вградени картички се веќе на страницата.', remove:'Тргни', delete:'Избриши',
    delAsk:'Да се избрише картичката заедно со содржината?',
    t_note:'Белешка', t_links:'Список линкови', t_embed:'Вгнездена страница', t_countdown:'Одбројување', t_clock:'Светски часовник',
    d_note:'Слободен текст што останува каде што ќе го ставиш',
    d_links:'Твоја сопствена група линкови',
    d_embed:'Било која страница или мапа во рамка',
    d_countdown:'Преостанати денови до датум',
    d_clock:'Времето во друг град',
    f_title:'Наслов', f_text:'Текст', f_list:'Линкови', f_url:'Адреса', f_h:'Висина (px)',
    f_date:'Целен датум', f_note:'Опис', f_tz:'Временска зона',
    embedHint:'Некои страници не дозволуваат вгнездување. Локални датотеки и мапи речиси секогаш работат.',
    openTab:'Отвори во ново јазиче', daysLeft:'преостанати денови', daysAgo:'дена поминаа', today:'Денес',
    noUrl:'Се́ уште нема адреса.', badTz:'Непозната временска зона',
    emptyCard:'Празно — притисни го моливот за да пополниш.',
    /* пошта */
    mail:'Пошта', mailConnect:'Поврзи Gmail', mailDisconnect:'Прекини врска',
    mailNoId:'Прво внеси го твојот Google client ID во Поставки.',
    mailSetupLead:'Секој може да ја користи оваа картичка со сопствен Gmail. Потребен е бесплатен Google client ID, само еднаш — пет минути, без плаќање и без картичка.',
    mailStep1:'Отвори ја Google Cloud конзолата и направи проект.',
    mailStep2:'APIs & Services → Library → вклучи го Gmail API.',
    mailStep3:'OAuth consent screen → External → додај го опсегот gmail.readonly.',
    mailStep4:'Credentials → Create OAuth client ID → Web application, и додај ја адресата на оваа страница како дозволен JavaScript origin.',
    mailStep5:'Залепи го client ID во Поставки → Пошта и притисни Поврзи.',
    mailOpenConsole:'Google Cloud конзола', mailOrigin:'Адреса на оваа страница:',
    mailSwitch:'Најави се како друг', mailSignOut:'Одјави се',
    mailIdLabel:'Google client ID', mailPollLabel:'Проверувај на (мин)',
    mailNotifyLabel:'Известување на екран',
    mailIdHint:'Направи бесплатен OAuth client ID (тип: Web application) на console.cloud.google.com, вклучи го Gmail API и додај ја адресата на оваа страница како дозволен JavaScript origin. Ништо не се плаќа и не треба тајна лозинка.',
    mailEmpty:'Нема непрочитана пошта.', mailUnread:'непрочитани',
    mailOpenGmail:'Отвори во Gmail', mailBodyLoad:'Се вчитува пораката…',
    mailSignedIn:'Најавен како', mailFailed:'Gmail го одби барањето. Обиди се да се поврзеш повторно.',
    mailNotifyTitle:'Нова пошта', mailNoNotifyPerm:'Прелистувачот ги блокира известувањата.',
    mailFileOrigin:'Најавата на Gmail бара страницата да е сервирана преку http, не отворена од диск.',
    mailReadOnly:'Пристап само за читање. Порталот никогаш не може да испрати или избрише пошта.',
    appsEmpty:'Сè уште нема плочки — притисни го моливот погоре за да додадеш свои.'
  }
};

let T = I18N.en;
const t = k => T[k] || k;

/* ═══════════ config ═══════════ */

const KEY = 'portal.config.v2';

/* The app launcher's default tiles use paths relative to this file — they
   only resolve when the sibling project folders actually sit next to
   portal/, which is true on this machine but not on a public deployment
   (only portal/ gets published, so ../nevreme/… is a 404 for a stranger).
   Ship them only when the page is plainly running locally; a deployed copy
   starts with an empty launcher that anyone can fill with their own links. */
function isLocalHost(host) {
  return host === 'localhost' || host === '127.0.0.1' || host === '' || host.endsWith('.local');
}
const LOCAL_APPS = [
  { title: 'Nevreme',      url: '../nevreme/index.html',                 icon: '⛈️' },
  { title: 'What to Wear', url: '../what-to-wear/index.html',            icon: '👕' },
  { title: 'Expira',       url: '../expira/www/index.html',              icon: '⏳' },
  { title: 'My Diary',     url: '../my-diary/www/index.html',            icon: '📔' },
  { title: 'Parkinson',    url: '../parkinson-app/index.html',           icon: '💊' },
  { title: 'Kitchen',      url: '../kitchen-assistant/index.html',       icon: '🍳' },
  { title: 'ProofLog',     url: '../prooflog/www/index.html',            icon: '🔒' },
  { title: 'Break Point',  url: '../break-point/index.html',             icon: '⏱️' },
  { title: 'Mirror Hours', url: '../mirror-hours/index.html',            icon: '🕚' },
  { title: 'Kairos',       url: '../kairos/docs/index.html',             icon: '🔮' },
  { title: 'Tishina',      url: '../tishina/docs/index.html',            icon: '🧘' },
  { title: 'Wave',         url: '../wave/www/index.html',                icon: '🌊' },
  { title: 'Sunrise',      url: '../sunrise-circadian/index.html',       icon: '🌅' },
  { title: 'Landed',       url: '../landed/index.html',                  icon: '🛬' },
  { title: 'Nearby',       url: '../nearby-places/index.html',           icon: '📍' },
  { title: 'Rent Manager', url: '../rent-manager/index.html',            icon: '🏠' },
  { title: 'Faktura Pro',  url: '../faktura-pro/docs/index.html',        icon: '🧾' },
  { title: 'Health Diary', url: '../health-diary/web/index.html',        icon: '🩺' },
  { title: 'Prodrome',     url: '../prodrome/www/index.html',            icon: '📡' },
  { title: 'BorderWatch',  url: '../borderwatch/index.html',             icon: '🛂' }
];
const DEFAULT_APPS = isLocalHost(location.hostname) ? LOCAL_APPS : [];

const DEFAULTS = {
  lang: 'en',
  theme: 'dark',
  density: 'compact',
  engine: 'ddg',
  loc: { name: 'Skopje', country: 'MK', lat: 41.9981, lon: 21.4254 },
  /* 'default' = never resolved, 'auto' = guessed from the time zone,
     'user' = deliberately chosen. Only 'default' gets overwritten. */
  locFrom: 'default',
  units: 'metric',
  base: 'EUR',
  symbols: 'USD,GBP,CHF,MKD',
  order: ['weather', 'mail', 'news', 'apps', 'sun', 'bookmarks', 'todo', 'rates', 'notes'],
  /* Mail starts switched off on purpose: nothing should invite a Google
     sign-in until someone deliberately asks for it. Add it from the + menu. */
  off: ['mail'],
  custom: {},          // cards you add yourself: id → { type, title, … }
  gmailId: '',         // your own OAuth client ID — public, not a secret
  mailPoll: 5,         // minutes between checks
  mailNotify: true,
  mailConnected: false,
  notes: '',
  todo: [],
  bookmarks: [
    { title: 'Gmail',          url: 'https://mail.google.com',        icon: '✉️' },
    { title: 'Google Drive',   url: 'https://drive.google.com',       icon: '📁' },
    { title: 'Calendar',       url: 'https://calendar.google.com',    icon: '📅' },
    { title: 'GitHub',         url: 'https://github.com',             icon: '🐙' },
    { title: 'Claude',         url: 'https://claude.ai',              icon: '🤖' },
    { title: 'YouTube',        url: 'https://youtube.com',            icon: '▶️' },
    { title: 'Time.mk',        url: 'https://time.mk',                icon: '📰' },
    { title: 'НБРМ курс',      url: 'https://www.nbrm.mk/kursna_lista.nspx', icon: '💱' }
  ],
  apps: DEFAULT_APPS,
};

let cfg = load();

const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);

/* Only http(s), mail, phone and relative paths may become a link or a frame.
   Anything else — javascript:, data:, vbscript: — is refused outright. */
function safeUrl(u) {
  const s = String(u ?? '').trim();
  if (!s) return '';
  if (/^(https?:|mailto:|tel:)/i.test(s)) return s;
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return '';    // some other scheme
  return s;                                          // relative path
}

/* A stored config can be hand-edited, imported from another machine, or left
   over from an older version. Anything of the wrong shape falls back to the
   default rather than breaking the page on every future load. */
function sane(raw) {
  const c = Object.assign(structuredClone(DEFAULTS), isObj(raw) ? raw : {});

  ['lang', 'theme', 'density', 'engine', 'base', 'symbols', 'notes', 'gmailId']
    .forEach(k => { if (typeof c[k] !== 'string') c[k] = DEFAULTS[k]; });
  c.mailPoll = Math.min(60, Math.max(1, Number(c.mailPoll) || DEFAULTS.mailPoll));
  c.mailNotify = !!c.mailNotify;
  c.mailConnected = !!c.mailConnected;

  ['order', 'off', 'todo', 'bookmarks', 'apps']
    .forEach(k => { if (!Array.isArray(c[k])) c[k] = structuredClone(DEFAULTS[k]); });

  if (!isObj(c.custom)) c.custom = {};
  if (!isObj(c.loc) || typeof c.loc.lat !== 'number' || typeof c.loc.lon !== 'number')
    c.loc = structuredClone(DEFAULTS.loc);
  if (!['default', 'auto', 'user'].includes(c.locFrom)) c.locFrom = DEFAULTS.locFrom;

  c.order = c.order.filter(x => typeof x === 'string');
  c.off   = c.off.filter(x => typeof x === 'string');
  c.todo  = c.todo.filter(isObj).map(x => ({ text: String(x.text ?? ''), done: !!x.done }));
  ['bookmarks', 'apps'].forEach(k => {
    c[k] = c[k].filter(isObj)
      .map(x => ({ title: String(x.title ?? ''), url: safeUrl(x.url), icon: String(x.icon ?? '') }))
      .filter(x => x.title && x.url);
  });
  return c;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return sane(raw ? JSON.parse(raw) : null);
  } catch { return structuredClone(DEFAULTS); }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch {}
}

/* small cache so the page still shows something with no network */
const cache = {
  get(k) { try { return JSON.parse(localStorage.getItem('portal.cache.' + k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem('portal.cache.' + k, JSON.stringify({ at: Date.now(), v })); } catch {} }
};

/* ═══════════ helpers ═══════════ */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}
const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const hhmm = d => d.toLocaleTimeString(cfg.lang === 'mk' ? 'mk-MK' : 'en-GB',
  { hour: '2-digit', minute: '2-digit', hour12: false });

/* YYYY-MM-DD in the *local* calendar. toISOString() converts to UTC first,
   so east of Greenwich it reports yesterday for the hours after midnight. */
const isoDay = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

async function getJSON(url, ms = 9000) {
  const c = new AbortController();
  const id = setTimeout(() => c.abort(), ms);
  try {
    const r = await fetch(url, { signal: c.signal, cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } finally { clearTimeout(id); }
}

/* ═══════════ icons ═══════════
   Inline 24×24 stroke paths — no icon font, no network, themeable via
   currentColor. Drawn here once and reused everywhere.                */

const ICON = {
  search:    '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>',
  go:        '<path d="M5 12h13M13 6l6 6-6 6"/>',
  plus:      '<path d="M12 5v14M5 12h14"/>',
  moon:      '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
  sunLight:  '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.4M12 19.6V22M4.4 4.4l1.7 1.7M17.9 17.9l1.7 1.7M2 12h2.4M19.6 12H22M4.4 19.6l1.7-1.7M17.9 6.1l1.7-1.7"/>',
  settings:  '<path d="M4 7h4M13 7h7M4 12h10M19 12h1M4 17h4M13 17h7"/><circle cx="10.5" cy="7" r="2.2"/><circle cx="16.5" cy="12" r="2.2"/><circle cx="10.5" cy="17" r="2.2"/>',
  refresh:   '<path d="M20.5 12a8.5 8.5 0 1 1-2.5-6"/><path d="M20.5 4v5h-5"/>',
  edit:      '<path d="M12 20h8"/><path d="M16.4 3.6a2.1 2.1 0 0 1 3 3L7.5 18.5 3.5 19.5l1-4z"/>',
  close:     '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  target:    '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.4"/><path d="M12 2v2.6M12 19.4V22M2 12h2.6M19.4 12H22"/>',

  weather:   '<path d="M7.5 18.5a4.2 4.2 0 0 1 .6-8.4A5.4 5.4 0 0 1 18.5 11a3.8 3.8 0 0 1-.6 7.5z"/>',
  sun:       '<path d="M17 18.5a5 5 0 0 0-10 0"/><path d="M2 18.5h20"/><path d="M12 2.5v4M4.9 9.4l1.5 1.5M17.6 10.9l1.5-1.5"/><path d="M9.4 5.1L12 2.5l2.6 2.6"/>',
  rates:     '<path d="M4 8.5h13l-3.4-3.4"/><path d="M20 15.5H7l3.4 3.4"/>',
  bookmarks: '<path d="M18 21l-6-4.4L6 21V5.5A2.5 2.5 0 0 1 8.5 3h7A2.5 2.5 0 0 1 18 5.5z"/>',
  apps:      '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
  notes:     '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
  todo:      '<path d="M20 11.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/><path d="M8.5 11.5l3 3 8.5-9"/>',
  news:      '<path d="M4 5.5h12V20H6a2 2 0 0 1-2-2z"/><path d="M16 9.5h3a1 1 0 0 1 1 1V18a2 2 0 0 1-2 2"/><path d="M7 9h6M7 12h6M7 15h4"/>',

  note:      '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8l6-6V5a2 2 0 0 0-2-2z"/><path d="M20 15h-4a2 2 0 0 0-2 2v4"/>',
  links:     '<path d="M10.5 13.5a5 5 0 0 0 7.1 0l2.1-2.1a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M13.5 10.5a5 5 0 0 0-7.1 0l-2.1 2.1a5 5 0 0 0 7.1 7.1l1.1-1.1"/>',
  embed:     '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M3 9.5h18M6.5 7h.01M9.5 7h.01"/>',
  countdown: '<path d="M7 3h10M7 21h10"/><path d="M17 3v3.4a5 5 0 0 1-10 0V3"/><path d="M7 21v-3.4a5 5 0 0 1 10 0V21"/>',
  clock:     '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.2V12l3.2 2"/>',
  mail:      '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.6 7l7.3 5.2a2 2 0 0 0 2.2 0L20.4 7"/>',
  signout:   '<path d="M15 4.5h3.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H15"/><path d="M10.5 8.5L7 12l3.5 3.5"/><path d="M7 12h9"/>'
};

const svg = (name, size = 16) =>
  `<svg class="ic" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none"
        stroke="currentColor" stroke-width="1.7" stroke-linecap="round"
        stroke-linejoin="round" aria-hidden="true">${ICON[name] || ''}</svg>`;

/* WMO weather codes → emoji + label */
const WMO = {
  0:['☀️','Clear','Ведро'], 1:['🌤️','Mainly clear','Претежно ведро'],
  2:['⛅','Partly cloudy','Делумно облачно'], 3:['☁️','Overcast','Облачно'],
  45:['🌫️','Fog','Магла'], 48:['🌫️','Rime fog','Ледена магла'],
  51:['🌦️','Light drizzle','Слаб ромон'], 53:['🌦️','Drizzle','Ромон'], 55:['🌦️','Heavy drizzle','Силен ромон'],
  56:['🌧️','Freezing drizzle','Леден ромон'], 57:['🌧️','Freezing drizzle','Леден ромон'],
  61:['🌧️','Light rain','Слаб дожд'], 63:['🌧️','Rain','Дожд'], 65:['🌧️','Heavy rain','Силен дожд'],
  66:['🌧️','Freezing rain','Леден дожд'], 67:['🌧️','Freezing rain','Леден дожд'],
  71:['🌨️','Light snow','Слаб снег'], 73:['🌨️','Snow','Снег'], 75:['❄️','Heavy snow','Силен снег'],
  77:['🌨️','Snow grains','Снежни зрна'],
  80:['🌦️','Rain showers','Плусок'], 81:['🌧️','Rain showers','Плусок'], 82:['⛈️','Violent showers','Силен плусок'],
  85:['🌨️','Snow showers','Снежни врнежи'], 86:['❄️','Snow showers','Снежни врнежи'],
  95:['⛈️','Thunderstorm','Грмежи'], 96:['⛈️','Thunder + hail','Грмежи со град'], 99:['⛈️','Thunder + hail','Грмежи со град']
};
const wmo = c => WMO[c] || ['❓', '—', '—'];

/* ═══════════ search engines ═══════════ */

const ENGINES = [
  { id: 'ddg',   name: 'DuckDuckGo', url: q => `https://duckduckgo.com/?q=${q}` },
  { id: 'goog',  name: 'Google',     url: q => `https://www.google.com/search?q=${q}` },
  { id: 'wiki',  name: 'Wikipedia',  url: q => `https://${cfg.lang === 'mk' ? 'mk' : 'en'}.wikipedia.org/w/index.php?search=${q}` },
  { id: 'yt',    name: 'YouTube',    url: q => `https://www.youtube.com/results?search_query=${q}` },
  { id: 'osm',   name: 'Maps',       url: q => `https://www.openstreetmap.org/search?query=${q}` },
  { id: 'trans', name: 'Translate',  url: q => `https://translate.google.com/?sl=auto&tl=${cfg.lang === 'mk' ? 'mk' : 'en'}&text=${q}` }
];

function renderEngines() {
  const box = $('#engines');
  box.innerHTML = '';
  ENGINES.forEach(e => {
    const b = el('button', cfg.engine === e.id ? 'on' : '', e.name);
    b.type = 'button';
    b.onclick = () => { cfg.engine = e.id; save(); renderEngines(); $('#q').focus(); };
    box.append(b);
  });
}

/* where a typed query should go: straight to a site, or to the chosen engine */
function targetFor(raw) {
  const q = (raw || '').trim();
  if (!q) return null;
  if (/^https?:\/\//i.test(q)) return { kind: 'url', url: q };
  if (/^[\w-]+(\.[\w-]+)*\.[a-z]{2,}(\/\S*)?$/i.test(q)) return { kind: 'url', url: 'https://' + q };
  const e = ENGINES.find(x => x.id === cfg.engine) || ENGINES[0];
  return { kind: 'search', engine: e.id, url: e.url(encodeURIComponent(q)) };
}

$('#searchForm').addEventListener('submit', ev => {
  ev.preventDefault();
  const to = targetFor($('#q').value);
  if (to) window.open(to.url, '_blank', 'noopener');
});

/* ═══════════ Gmail ═══════════
   Read-only, in the browser, with your own free OAuth client ID. No secret,
   no server, no third party in the middle. The access token lives in memory
   only — it is never written to storage — so closing the tab drops it.
   Message bodies are rendered as PLAIN TEXT, never as HTML: an email is
   untrusted input, and text cannot carry a tracking pixel or a script.   */

/* ── who can sign in ──────────────────────────────────────────────────
 * The card is not tied to any one mailbox: whoever authorises it is the
 * mailbox that gets shown, read from Gmail's own /profile.
 *
 * Put a client ID here and *everyone* who opens this page can sign in with
 * their own Gmail without any setup — provided the consent screen for that
 * client is set to "In production". Google caps an unverified app with a
 * restricted scope at roughly 100 accounts and shows a warning screen; going
 * past that needs a paid annual security assessment.
 *
 * Leave it empty and each person pastes their own free client ID in
 * Settings instead — unlimited, no warning, ten minutes of setup each.
 */
const DEFAULT_GMAIL_ID = '';

const gmailId = () => (cfg.gmailId || DEFAULT_GMAIL_ID).trim();

const GIS = 'https://accounts.google.com/gsi/client';
const GAPI = 'https://gmail.googleapis.com/gmail/v1/users/me';
const SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

const mail = {
  token: null, exp: 0, client: null, who: '',
  list: [], open: null, bodies: new Map(),
  err: '', busy: false, primed: false, timer: null
};

const seenIds = {
  get: () => new Set(cache.get('mailSeen')?.v || []),
  add(ids) {
    const all = [...ids, ...(cache.get('mailSeen')?.v || [])].slice(0, 300);
    cache.set('mailSeen', all);
  }
};

let gisReady = null;
function loadGIS() {
  if (gisReady) return gisReady;
  gisReady = new Promise((res, rej) => {
    if (window.google?.accounts?.oauth2) return res();
    const s = document.createElement('script');
    s.src = GIS; s.async = true;
    s.onload = res; s.onerror = () => rej(new Error('GIS blocked'));
    document.head.append(s);
  });
  return gisReady;
}

/* interactive=false tries to renew silently, without a popup */
async function gmailAuth(interactive) {
  if (!gmailId()) throw new Error(t('mailNoId'));
  if (location.protocol === 'file:') throw new Error(t('mailFileOrigin'));
  await loadGIS();
  return new Promise((res, rej) => {
    mail.client = google.accounts.oauth2.initTokenClient({
      client_id: gmailId(),
      scope: SCOPE,
      prompt: interactive ? 'consent' : '',
      callback: r => {
        if (!r.access_token) return rej(new Error(r.error || 'no token'));
        mail.token = r.access_token;
        mail.exp = Date.now() + (Number(r.expires_in || 3600) - 60) * 1000;
        res(r.access_token);
      },
      error_callback: e => rej(new Error(e.type || 'auth failed'))
    });
    mail.client.requestAccessToken();
  });
}

async function gmailGet(path) {
  if (!mail.token || Date.now() > mail.exp) await gmailAuth(false);
  const r = await fetch(GAPI + path, { headers: { Authorization: 'Bearer ' + mail.token } });
  if (r.status === 401) { mail.token = null; throw new Error('unauthorised'); }
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

/* ── message decoding ─────────────────────────────────── */

function b64url(data) {
  const s = String(data || '').replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  try {
    return new TextDecoder('utf-8').decode(Uint8Array.from(atob(s + pad), c => c.charCodeAt(0)));
  } catch { return ''; }
}

const headerOf = (headers, name) =>
  (headers || []).find(h => (h.name || '').toLowerCase() === name)?.value || '';

/* "Ime Prezime" <a@b.mk>  →  Ime Prezime */
function fromName(v) {
  const m = String(v || '').match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  return m ? (m[1].trim() || m[2].trim()) : String(v || '').trim();
}

/* today → 09:14, this year → 7 Aug, older → 7 Aug 25 */
function mailWhen(raw) {
  const d = new Date(raw);
  if (isNaN(d)) return '';
  const loc = cfg.lang === 'mk' ? 'mk-MK' : 'en-GB';
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return hhmm(d);
  if (d.getFullYear() === now.getFullYear())
    return d.toLocaleDateString(loc, { day: 'numeric', month: 'short' });
  return d.toLocaleDateString(loc, { day: 'numeric', month: 'short', year: '2-digit' });
}

/* walk the MIME tree, preferring the plain-text part */
function pickBody(payload) {
  let text = '', html = '';
  (function walk(p) {
    if (!p) return;
    const mime = (p.mimeType || '').toLowerCase();
    if (p.body?.data) {
      if (mime.startsWith('text/plain') && !text) text = b64url(p.body.data);
      else if (mime.startsWith('text/html') && !html) html = b64url(p.body.data);
    }
    (p.parts || []).forEach(walk);
  })(payload);
  return text || htmlToText(html);
}

function htmlToText(h) {
  return String(h || '')
    .replace(/<(script|style|head)[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h[1-6]|table)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/&(amp|lt|gt|quot|apos|#39);/gi, (m, n) =>
      ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'" }[n.toLowerCase()] || m))
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* ── fetching ─────────────────────────────────────────── */

async function mailRefresh() {
  if (mail.busy) return;
  mail.busy = true; mail.err = '';
  try {
    if (!mail.who) mail.who = (await gmailGet('/profile')).emailAddress || '';
    const ids = (await gmailGet('/messages?q=' + encodeURIComponent('is:unread in:inbox') + '&maxResults=15')).messages || [];
    mail.list = await Promise.all(ids.map(async ({ id }) => {
      const m = await gmailGet(`/messages/${id}?format=metadata` +
        '&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date');
      const h = m.payload?.headers;
      return {
        id, threadId: m.threadId,
        from: fromName(headerOf(h, 'from')),
        subject: headerOf(h, 'subject') || '(no subject)',
        date: headerOf(h, 'date'),
        snippet: htmlToText(m.snippet || '')
      };
    }));
    notifyNew(mail.list);
  } catch (e) {
    mail.err = /unauthor|no token|auth/i.test(e.message) ? t('mailFailed') : e.message;
    if (/unauthor/i.test(e.message)) cfg.mailConnected = false;
  } finally {
    mail.busy = false;
    renderWidget('mail');
  }
}

async function mailBody(id) {
  if (mail.bodies.has(id)) return mail.bodies.get(id);
  const m = await gmailGet(`/messages/${id}?format=full`);
  const text = pickBody(m.payload) || htmlToText(m.snippet || '');
  mail.bodies.set(id, text);
  return text;
}

/* a desktop notification for anything not seen before */
function notifyNew(list) {
  const seen = seenIds.get();
  const fresh = list.filter(m => !seen.has(m.id));
  seenIds.add(list.map(m => m.id));
  if (!mail.primed) { mail.primed = true; return; }   // first load is not "new"
  if (!cfg.mailNotify || !fresh.length) return;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  fresh.slice(0, 3).forEach(m => {
    try {
      const n = new Notification(m.subject, { body: `${m.from}\n${m.snippet.slice(0, 120)}`, tag: m.id });
      n.onclick = () => { window.open('https://mail.google.com/mail/u/0/#inbox/' + m.id, '_blank', 'noopener'); n.close(); };
    } catch {}
  });
}

function mailSchedule() {
  clearInterval(mail.timer);
  if (cfg.mailConnected) mail.timer = setInterval(mailRefresh, Math.max(1, cfg.mailPoll) * 60000);
}

async function mailConnect() {
  try {
    if (typeof Notification !== 'undefined' && cfg.mailNotify && Notification.permission === 'default')
      await Notification.requestPermission();
    await gmailAuth(true);
    cfg.mailConnected = true; save();
    mail.primed = false;
    renderGrid();                         // the header gains its sign-out tool
    await mailRefresh();
    mailSchedule();
  } catch (e) {
    mail.err = e.message;
    renderWidget('mail');
  }
}

/* Hands the token back to Google and wipes every trace of the mailbox from
   this browser: subjects, senders, message bodies, and the record of which
   ids have already been notified — that last one is per-account, and leaving
   it behind would mute the next person's first genuinely new mail. */
function mailDisconnect() {
  try { google.accounts.oauth2.revoke(mail.token, () => {}); } catch {}
  mail.token = null; mail.exp = 0; mail.list = []; mail.who = '';
  mail.bodies.clear(); mail.open = null; mail.err = '';
  mail.primed = false;                    // the next sign-in primes quietly
  try { localStorage.removeItem('portal.cache.mailSeen'); } catch {}
  cfg.mailConnected = false; save();
  clearInterval(mail.timer);
}

/* Sign out and stay out. */
function mailSignOut() {
  mailDisconnect();
  renderGrid();                           // the header tools change, not just the body
}

/* Sign out, then straight back in as whoever the user picks. */
function mailSwitchAccount() {
  mailDisconnect();
  renderGrid();
  mailConnect();
}

/* Shown when no client ID is available anywhere: the whole setup, in the
   card, so any person can do it without reading the README. */
function mailSetupPanel(body) {
  body.innerHTML = `
    <div class="mail-setup">
      <p class="mail-lead">${esc(t('mailSetupLead'))}</p>
      <ol class="mail-steps">
        ${[1, 2, 3, 4, 5].map(n => `<li>${esc(t('mailStep' + n))}</li>`).join('')}
      </ol>
      <div class="row wrap">
        <a class="btn" href="https://console.cloud.google.com/apis/credentials"
           target="_blank" rel="noopener">${esc(t('mailOpenConsole'))} ↗</a>
        <button class="btn primary" type="button" id="mailSetupGo">${esc(t('settings'))}</button>
      </div>
      <p class="hint">${esc(t('mailOrigin'))} <code>${esc(location.origin)}</code></p>
      <p class="hint">${esc(t('mailReadOnly'))}</p>
    </div>`;
  $('#mailSetupGo', body).onclick = () => $('#settingsBtn').click();
}

/* ═══════════ widgets ═══════════ */

const WIDGETS = {

  /* ── weather ───────────────────────────────────────── */
  weather: {
    title: () => t('weather'),
    tools: [{ icon: 'refresh', act: id => refresh(id) }],
    async render(body) {
      if (!cfg.loc) { body.innerHTML = `<div class="empty">${t('noLocation')}</div>`; return; }
      body.innerHTML = `<div class="empty">${t('loading')}</div>`;

      const u = `https://api.open-meteo.com/v1/forecast?latitude=${cfg.loc.lat}&longitude=${cfg.loc.lon}` +
        `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
        `&timezone=auto&forecast_days=5`;

      const usable = x => !!(x && x.current && x.daily && Array.isArray(x.daily.time));

      let d, stale = false;
      try {
        d = await getJSON(u);
        // a 200 with the wrong body — rate limit, maintenance, changed schema —
        // is a failure, not something to render
        if (!usable(d)) throw new Error('unexpected response');
        cache.set('wx', d);
      } catch {
        const c = cache.get('wx');
        if (!usable(c?.v)) { body.innerHTML = `<div class="err">${t('failed')}</div>`; return; }
        d = c.v; stale = true;
      }
      sunData = d;                    // shared with the sun widget
      renderWidget('sun');

      const cur = d.current, [ico, en, mk] = wmo(cur.weather_code);
      const desc = cfg.lang === 'mk' ? mk : en;

      body.innerHTML = `
        <div class="wx-now">
          <div class="wx-icon">${ico}</div>
          <div>
            <div class="wx-temp">${Math.round(cur.temperature_2m)}°</div>
            <div class="wx-desc">${esc(desc)} · ${esc(cfg.loc.name)}</div>
          </div>
        </div>
        <div class="wx-meta">
          <span>${t('feels')} ${Math.round(cur.apparent_temperature)}°</span>
          <span>${t('humidity')} ${cur.relative_humidity_2m}%</span>
          <span>${t('wind')} ${Math.round(cur.wind_speed_10m)} km/h</span>
        </div>
        <div class="wx-days">${d.daily.time.map((iso, i) => {
          const dt = new Date(iso + 'T12:00');
          const day = dt.toLocaleDateString(cfg.lang === 'mk' ? 'mk-MK' : 'en-GB', { weekday: 'short' });
          return `<div class="wx-day">
                    <div class="d">${i === 0 ? '·' : esc(day)}</div>
                    <div class="i">${wmo(d.daily.weather_code[i])[0]}</div>
                    <div class="t">${Math.round(d.daily.temperature_2m_max[i])}<small>/${Math.round(d.daily.temperature_2m_min[i])}</small></div>
                  </div>`;
        }).join('')}</div>
        ${stale ? `<p class="hint">${t('offline')}</p>` : ''}`;
    }
  },

  /* ── sun ───────────────────────────────────────────── */
  sun: {
    title: () => t('sun'),
    render(body) {
      const d = sunData || cache.get('wx')?.v;
      if (!d?.daily?.sunrise) { body.innerHTML = `<div class="empty">${t('loading')}</div>`; return; }
      const rise = new Date(d.daily.sunrise[0]), set = new Date(d.daily.sunset[0]);
      const noon = new Date((rise.getTime() + set.getTime()) / 2);
      const len  = set - rise;
      const h = Math.floor(len / 36e5), m = Math.round((len % 36e5) / 6e4);
      const now = Date.now();
      const pct = Math.max(0, Math.min(100, ((now - rise) / len) * 100));

      body.innerHTML = `
        <div class="sun-row"><span>🌅 ${t('sunrise')}</span><span>${hhmm(rise)}</span></div>
        <div class="sun-bar"><i style="width:${pct.toFixed(1)}%"></i></div>
        <div class="sun-row"><span>🌇 ${t('sunset')}</span><span>${hhmm(set)}</span></div>
        <div class="sun-row"><span>🕛 ${t('noon')}</span><span>${hhmm(noon)}</span></div>
        <div class="sun-row"><span>⏳ ${t('daylight')}</span><span>${h}h ${m}m</span></div>`;
    }
  },

  /* ── exchange rates ────────────────────────────────── */
  rates: {
    title: () => t('rates'),
    tools: [{ icon: 'refresh', act: id => refresh(id) }],
    async render(body) {
      body.innerHTML = `<div class="empty">${t('loading')}</div>`;
      const base = (cfg.base || 'EUR').toUpperCase();
      const want = (cfg.symbols || 'USD').toUpperCase().split(',').map(s => s.trim()).filter(Boolean);
      const PEG  = 61.5;                       // MKD is pegged to EUR by the NBRM
      const ask  = [...new Set(want.filter(s => s !== 'MKD' && s !== base))];
      if (want.includes('MKD') && base !== 'EUR' && !ask.includes('EUR')) ask.push('EUR');

      const usable = x => isObj(x) && isObj(x.rates);

      let d, stale = false;
      try {
        d = ask.length
          ? await getJSON(`https://api.frankfurter.dev/v1/latest?base=${base}&symbols=${ask.join(',')}`)
          : { base, date: isoDay(), rates: {} };
        if (!usable(d)) throw new Error('unexpected response');
        cache.set('fx', d);
      } catch {
        const c = cache.get('fx');
        if (!usable(c?.v)) { body.innerHTML = `<div class="err">${t('failed')}</div>`; return; }
        d = c.v; stale = true;
      }

      const rows = want.map(sym => {
        if (sym === base) return '';
        let val, peg = false;
        if (sym === 'MKD') {
          val = base === 'EUR' ? PEG : (d.rates.EUR ? d.rates.EUR * PEG : null);
          peg = true;
        } else val = d.rates[sym];
        if (val == null) return '';
        return `<tr><td>1 ${esc(base)} → ${esc(sym)}${peg ? `<span class="tag">peg</span>` : ''}</td>
                    <td>${val.toFixed(val < 10 ? 4 : 2)}</td></tr>`;
      }).join('');

      body.innerHTML = `<table class="rates">${rows || `<tr><td class="empty">—</td></tr>`}</table>
        <p class="hint">${stale ? t('offline') : 'ECB · ' + esc(d.date)}</p>`;
    }
  },

  /* ── bookmarks ─────────────────────────────────────── */
  bookmarks: {
    title: () => t('bookmarks'),
    tight: true,
    tools: [{ icon: 'edit', act: () => editList('bookmarks') }],
    render(body) {
      const b = (cfg.bookmarks || []).filter(x => safeUrl(x.url));
      body.innerHTML = b.length
        ? `<ul class="list">${b.map(x =>
            `<li><a href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener">${esc(x.icon || '🔗')} ${esc(x.title)}</a></li>`
          ).join('')}</ul>`
        : `<div class="empty">—</div>`;
    }
  },

  /* ── app launcher ──────────────────────────────────── */
  apps: {
    title: () => t('apps'),
    tools: [{ icon: 'edit', act: () => editList('apps') }],
    render(body) {
      const a = (cfg.apps || []).filter(x => safeUrl(x.url));
      body.innerHTML = a.length
        ? `<div class="tiles">${a.map(x =>
            `<a class="tile" href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener" title="${esc(x.title)}">
               <span class="ico">${esc(x.icon || '📦')}</span><span class="lbl">${esc(x.title)}</span>
             </a>`).join('')}</div>`
        : `<div class="empty">${esc(t('appsEmpty'))}</div>`;
    }
  },

  /* ── todo ──────────────────────────────────────────── */
  todo: {
    title: () => t('todo'),
    render(body) {
      body.innerHTML = `
        <div class="todo-add">
          <input type="text" id="todoIn" placeholder="${esc(t('addTodo'))}">
          <button class="btn" id="todoAdd" type="button">${svg('plus', 15)}</button>
        </div>
        <div id="todoList"></div>`;

      const list = $('#todoList', body);
      const draw = () => {
        if (!cfg.todo.length) { list.innerHTML = `<div class="empty">${t('noTodo')}</div>`; return; }
        list.innerHTML = '';
        cfg.todo.forEach((it, i) => {
          const row = el('div', 'todo-item' + (it.done ? ' done' : ''));
          const cb = el('input'); cb.type = 'checkbox'; cb.checked = !!it.done;
          cb.onchange = () => { cfg.todo[i].done = cb.checked; save(); draw(); };
          const sp = el('span', null, esc(it.text));
          const x = el('button', 'x', svg('close', 14));
          x.onclick = () => { cfg.todo.splice(i, 1); save(); draw(); };
          row.append(cb, sp, x);
          list.append(row);
        });
      };
      const add = () => {
        const v = $('#todoIn', body).value.trim();
        if (!v) return;
        cfg.todo.push({ text: v, done: false }); save();
        $('#todoIn', body).value = ''; draw();
      };
      $('#todoAdd', body).onclick = add;
      $('#todoIn', body).addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
      draw();
    }
  },

  /* ── notes ─────────────────────────────────────────── */
  notes: {
    title: () => t('notes'),
    render(body) {
      const ta = el('textarea', 'notes-area');
      ta.placeholder = t('notesPh');
      ta.value = cfg.notes || '';
      let tmr;
      ta.addEventListener('input', () => {
        clearTimeout(tmr);
        tmr = setTimeout(() => { cfg.notes = ta.value; save(); }, 400);
      });
      body.innerHTML = ''; body.append(ta);
    }
  },

  /* ── mail ──────────────────────────────────────────── */
  mail: {
    title: () => mail.list.length ? `${t('mail')} · ${mail.list.length}` : t('mail'),
    tight: true,
    scroll: true,
    /* a getter, not a fixed array: sign-out only exists once signed in, and
       the header must never scroll away behind a long list */
    get tools() {
      return cfg.mailConnected
        ? [{ icon: 'refresh', title: 'refresh', act: () => mailRefresh() },
           { icon: 'signout', title: 'mailSignOut', act: () => mailSignOut() }]
        : [];
    },
    render(body) {
      if (!gmailId()) { mailSetupPanel(body); return; }
      if (!cfg.mailConnected) {
        body.innerHTML = `<div class="mail-connect">
            <button class="btn primary" type="button" id="mailGo">${esc(t('mailConnect'))}</button>
            <p class="hint">${esc(t('mailReadOnly'))}</p>
            ${mail.err ? `<p class="err">${esc(mail.err)}</p>` : ''}
          </div>`;
        $('#mailGo', body).onclick = mailConnect;
        return;
      }
      if (mail.busy && !mail.list.length) {
        body.innerHTML = `<div class="empty">${t('loading')}</div>`;
        return;
      }
      if (mail.err) {
        body.innerHTML = `<div class="empty"><span class="err">${esc(mail.err)}</span></div>
          <div class="mail-connect"><button class="btn" type="button" id="mailGo">${esc(t('mailConnect'))}</button></div>`;
        $('#mailGo', body).onclick = mailConnect;
        return;
      }
      if (!mail.list.length) {
        body.innerHTML = `<div class="empty">${esc(t('mailEmpty'))}</div>
          <p class="hint mail-who">${esc(mail.who)} · <button type="button" class="linkish" id="mailOut">${esc(t('mailSignOut'))}</button> · <button type="button" class="linkish" id="mailSwap">${esc(t('mailSwitch'))}</button></p>`;
        $('#mailSwap', body).onclick = mailSwitchAccount;
        $('#mailOut', body).onclick = mailSignOut;
        return;
      }

      body.innerHTML = `<ul class="list mail-list">${mail.list.map(m => `
        <li class="mail-item${mail.open === m.id ? ' open' : ''}" data-id="${esc(m.id)}">
          <button type="button" class="mail-row">
            <span class="mail-dot"></span>
            <span class="mail-txt">
              <span class="mail-from">${esc(m.from)}</span>
              <span class="mail-subj">${esc(m.subject)}</span>
              <span class="mail-snip">${esc(m.snippet.slice(0, 110))}</span>
            </span>
            <span class="mail-when">${esc(mailWhen(m.date))}</span>
          </button>
          ${mail.open === m.id ? `<div class="mail-body" id="mb_${esc(m.id)}">${t('mailBodyLoad')}</div>
            <div class="mail-foot"><a href="https://mail.google.com/mail/u/0/#inbox/${esc(m.id)}"
               target="_blank" rel="noopener">${t('mailOpenGmail')} ↗</a></div>` : ''}
        </li>`).join('')}</ul>
        <p class="hint mail-who">${esc(mail.who)} · <button type="button" class="linkish" id="mailOut">${esc(t('mailSignOut'))}</button> · <button type="button" class="linkish" id="mailSwap">${esc(t('mailSwitch'))}</button></p>`;

      $('#mailSwap', body).onclick = mailSwitchAccount;
      $('#mailOut', body).onclick = mailSignOut;
      $$('.mail-item', body).forEach(li => {
        $('.mail-row', li).onclick = async () => {
          const id = li.dataset.id;
          mail.open = mail.open === id ? null : id;
          renderWidget('mail');
          if (!mail.open) return;
          try {
            const text = await mailBody(id);
            const box = $('#mb_' + id);
            if (box) box.textContent = text || '—';
          } catch (e) {
            const box = $('#mb_' + id);
            if (box) box.textContent = t('mailFailed');
          }
        };
      });
    }
  },

  /* ── news (reads feeds.json written by fetch-feeds.js) ─ */
  news: {
    title: () => t('news'),
    tight: true,
    scroll: true,
    tools: [{ icon: 'refresh', act: id => refresh(id) }],
    async render(body) {
      body.innerHTML = `<div class="empty">${t('loading')}</div>`;
      let d;
      try { d = await getJSON('feeds.json', 4000); }
      catch { body.innerHTML = `<div class="empty">${esc(t('noNews'))}</div>`; return; }

      const items = (d.items || []).slice(0, 18);
      if (!items.length) { body.innerHTML = `<div class="empty">${esc(t('noNews'))}</div>`; return; }

      body.innerHTML = `<ul class="list">${items.map(i =>
        `<li><a href="${esc(i.link)}" target="_blank" rel="noopener" title="${esc(i.title)}">
           ${esc(i.title)}<br><span class="meta">${esc(i.source || '')}${i.date ? ' · ' + esc(new Date(i.date).toLocaleDateString()) : ''}</span>
         </a></li>`).join('')}</ul>
        ${d.updated ? `<p class="hint">${t('updated')} ${esc(new Date(d.updated).toLocaleString())}</p>` : ''}`;
    }
  }
};

let sunData = null;

/* ═══════════ cards you add yourself ═══════════ */

const TYPES = {

  note: {
    fields: [{ k: 'text', kind: 'textarea' }],
    live: false,
    render(body, c) {
      body.innerHTML = c.text
        ? `<div class="usernote">${esc(c.text).replace(/\n/g, '<br>')}</div>`
        : `<div class="empty">${t('emptyCard')}</div>`;
    }
  },

  links: {
    tight: true,
    fields: [{ k: 'list', kind: 'textarea', hint: 'listHint' }],
    render(body, c) {
      const items = (c.list || '').split('\n').map(l => {
        const p = l.split('|').map(s => s.trim());
        return p[0] && safeUrl(p[1]) ? { title: p[0], url: safeUrl(p[1]), icon: p[2] || '🔗' } : null;
      }).filter(Boolean);
      body.innerHTML = items.length
        ? `<ul class="list">${items.map(x =>
            `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.icon)} ${esc(x.title)}</a></li>`
          ).join('')}</ul>`
        : `<div class="empty">${t('emptyCard')}</div>`;
    }
  },

  embed: {
    tight: true,
    fields: [
      { k: 'url', kind: 'text', ph: 'https://…  or  ../nevreme/index.html' },
      { k: 'h',   kind: 'number', def: 320 }
    ],
    render(body, c) {
      const url = safeUrl(c.url);
      if (!url) { body.innerHTML = `<div class="empty">${t('noUrl')}</div>`; return; }
      body.innerHTML =
        `<iframe class="embed" src="${esc(url)}" style="height:${Math.max(80, +c.h || 320)}px"
                 loading="lazy" referrerpolicy="no-referrer"></iframe>
         <div class="embed-foot"><a href="${esc(url)}" target="_blank" rel="noopener">${t('openTab')} ↗</a></div>`;
    }
  },

  countdown: {
    live: true,
    fields: [{ k: 'date', kind: 'date' }, { k: 'note', kind: 'text' }],
    render(body, c) {
      if (!c.date) { body.innerHTML = `<div class="empty">${t('emptyCard')}</div>`; return; }
      const target = new Date(c.date + 'T00:00:00');
      const day0 = new Date(); day0.setHours(0, 0, 0, 0);
      const days = Math.round((target - day0) / 864e5);
      const label = days === 0 ? t('today') : `${Math.abs(days)} ${days > 0 ? t('daysLeft') : t('daysAgo')}`;
      body.innerHTML = `
        <div class="cd ${days < 0 ? 'past' : ''}">
          <div class="cd-num">${days === 0 ? '🎉' : Math.abs(days)}</div>
          <div class="cd-lbl">${esc(label)}</div>
        </div>
        ${c.note ? `<div class="cd-note">${esc(c.note)}</div>` : ''}
        <div class="cd-date">${target.toLocaleDateString(cfg.lang === 'mk' ? 'mk-MK' : 'en-GB',
          { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>`;
    }
  },

  clock: {
    live: true,
    fields: [{ k: 'tz', kind: 'tz' }],
    render(body, c) {
      const loc = cfg.lang === 'mk' ? 'mk-MK' : 'en-GB';
      try {
        const now = new Date();
        body.innerHTML = `
          <div class="wclock">${now.toLocaleTimeString(loc, { timeZone: c.tz, hour: '2-digit', minute: '2-digit', hour12: false })}</div>
          <div class="wclock-sub">${esc((c.tz || '').replace(/_/g, ' '))}</div>
          <div class="wclock-sub">${now.toLocaleDateString(loc, { timeZone: c.tz, weekday: 'short', day: 'numeric', month: 'short' })}</div>`;
      } catch { body.innerHTML = `<div class="err">${t('badTz')}</div>`; }
    }
  }
};

/* a card id is either a built-in key or 'x:<n>' for a card you made */
const isCustom = id => id.startsWith('x:');

function descriptor(id) {
  if (!isCustom(id)) return WIDGETS[id] || null;
  const c = cfg.custom[id];
  if (!c) return null;
  const type = TYPES[c.type];
  if (!type) return null;
  return {
    title: () => c.title || t('t_' + c.type),
    tight: type.tight,
    render: body => type.render(body, c),
    custom: true
  };
}

const allIds = () => [...Object.keys(WIDGETS), ...Object.keys(cfg.custom)];

/* ═══════════ grid rendering ═══════════ */

function renderGrid() {
  const grid = $('#grid');
  grid.innerHTML = '';
  const order = cfg.order.filter(id => descriptor(id));
  allIds().forEach(id => { if (!order.includes(id)) order.push(id); });
  cfg.order = order;

  order.forEach(id => {
    if (cfg.off.includes(id)) return;
    const w = descriptor(id);
    if (!w) return;
    const card = el('article', 'card');
    card.dataset.id = id;

    const head = el('header', 'card-head');
    head.append(el('span', 'card-icon', svg(isCustom(id) ? cfg.custom[id].type : id, 15)));
    head.append(el('h2', null, esc(w.title())));

    (w.tools || []).forEach(tool => {
      const b = el('button', 'tool', svg(tool.icon, 15));
      b.type = 'button';
      b.title = t(tool.title || (tool.icon === 'edit' ? 'edit' : 'refresh'));
      b.onclick = () => tool.act(id);
      head.append(b);
    });

    if (w.custom) {                                   // ✎ edit your own card
      const e = el('button', 'tool', svg('edit', 15));
      e.type = 'button'; e.title = t('edit');
      e.onclick = () => editCard(id);
      head.append(e);
    }

    const x = el('button', 'tool close', svg('close', 15));   // every card can go
    x.type = 'button'; x.title = t('remove');
    x.onclick = () => removeCard(id);
    head.append(x);

    const body = el('div', 'card-body' + (w.tight ? ' tight' : '') + (w.scroll ? ' scroll' : ''));
    card.append(head, body);
    grid.append(card);

    makeDraggable(card, head);
    safeRender(w, body);
  });
}

function renderWidget(id) {
  const card = $(`.card[data-id="${CSS.escape(id)}"]`);
  const w = descriptor(id);
  if (!card || !w) return;
  safeRender(w, $('.card-body', card));
}

/* Most cards render asynchronously, so a plain try/catch would let a late
   failure escape as an unhandled rejection and leave the card stuck on
   "Loading…" for ever. Catch both shapes. */
function safeRender(w, body) {
  const boom = e => { body.innerHTML = `<div class="err">${esc(e?.message || t('failed'))}</div>`; };
  try {
    const r = w.render(body);
    if (r && typeof r.catch === 'function') r.catch(boom);
  } catch (e) { boom(e); }
}

/* ═══════════ add / edit / remove a card ═══════════ */

function removeCard(id) {
  if (isCustom(id)) {
    if (!confirm(t('delAsk'))) return;
    delete cfg.custom[id];
    cfg.order = cfg.order.filter(x => x !== id);
  } else {
    if (!cfg.off.includes(id)) cfg.off.push(id);      // hidden, not lost
  }
  save(); renderGrid();
}

function openAdd() {
  const box = $('#typeGrid');
  box.innerHTML = '';
  Object.keys(TYPES).forEach(k => {
    const b = el('button', 'type-btn');
    b.type = 'button';
    b.innerHTML = `<span class="ti">${svg(k, 17)}</span>
                   <span class="tn">${esc(t('t_' + k))}</span>
                   <span class="td">${esc(t('d_' + k))}</span>`;
    b.onclick = () => { $('#addDlg').close(); addCard(k); };
    box.append(b);
  });

  const hid = $('#hiddenList');
  const hidden = cfg.off.filter(id => descriptor(id));
  hid.innerHTML = '';
  if (!hidden.length) hid.innerHTML = `<div class="empty">${t('nothingHidden')}</div>`;
  hidden.forEach(id => {
    const b = el('button', 'btn');
    b.type = 'button';
    b.textContent = '+ ' + descriptor(id).title();
    b.onclick = () => {
      cfg.off = cfg.off.filter(x => x !== id);
      save(); renderGrid(); openAdd();
    };
    hid.append(b);
  });

  $('#addDlg').showModal();
}

let seq = 0;
function addCard(type) {
  // a counter as well as the clock — two cards added in the same
  // millisecond must not share an id and overwrite each other
  const id = 'x:' + Date.now().toString(36) + (seq++).toString(36);
  cfg.custom[id] = { type };
  TYPES[type].fields.forEach(f => { if (f.def != null) cfg.custom[id][f.k] = f.def; });
  cfg.order.unshift(id);
  save(); renderGrid();
  editCard(id);
}

let editing = null;

function editCard(id) {
  const c = cfg.custom[id];
  if (!c) return;
  editing = id;
  $('#cardDlgTitle').textContent = t('t_' + c.type);

  const box = $('#cardFields');
  box.innerHTML = '';

  const titleRow = el('label', 'row');
  titleRow.append(el('span', null, t('f_title')));
  const ti = el('input'); ti.type = 'text'; ti.id = 'fld_title';
  ti.value = c.title || '';
  ti.placeholder = t('t_' + c.type);      // a hint, not text to delete first
  titleRow.append(ti);
  box.append(titleRow);

  TYPES[c.type].fields.forEach(f => {
    if (f.kind === 'textarea') {
      box.append(el('div', null, `<span class="fld-lbl">${esc(t('f_' + f.k))}</span>`));
      const ta = el('textarea'); ta.rows = 8; ta.id = 'fld_' + f.k; ta.value = c[f.k] || '';
      ta.spellcheck = false;
      box.append(ta);
      if (f.hint) box.append(el('p', 'hint', esc(t(f.hint))));
      return;
    }
    const row = el('label', 'row');
    row.append(el('span', null, t('f_' + f.k)));
    const inp = el('input');
    inp.id = 'fld_' + f.k;
    inp.type = f.kind === 'number' ? 'number' : f.kind === 'date' ? 'date' : 'text';
    if (f.ph) inp.placeholder = f.ph;
    if (f.kind === 'tz') {
      inp.setAttribute('list', 'tzList');
      inp.placeholder = 'Europe/Skopje';
    }
    inp.value = c[f.k] ?? '';
    row.append(inp);
    box.append(row);
    if (f.k === 'url') box.append(el('p', 'hint', esc(t('embedHint'))));
  });

  $('#cardDlg').showModal();
}

/* read the inputs on submit — the close event fires later, by which time
   the form may already have been rebuilt for another card */
$('#cardDlg form').addEventListener('submit', ev => {
  const id = editing;
  if (!id || !cfg.custom[id]) return;
  if ((ev.submitter?.value || 'save') !== 'save') return;

  const c = cfg.custom[id];
  c.title = $('#fld_title').value.trim() || t('t_' + c.type);
  TYPES[c.type].fields.forEach(f => {
    const n = $('#fld_' + f.k);
    if (n) c[f.k] = f.kind === 'number' ? (+n.value || f.def) : n.value;
  });
  save(); renderGrid();
});

$('#cardDlg').addEventListener('close', () => {
  const id = editing;
  editing = null;
  if (id && cfg.custom[id] && $('#cardDlg').returnValue === 'delete') removeCard(id);
});

/* time-zone suggestions — from the browser, no data file needed */
function fillTimeZones() {
  const dl = $('#tzList');
  if (!dl || dl.childElementCount) return;
  let zones = [];
  try { zones = Intl.supportedValuesOf('timeZone'); }
  catch { zones = ['Europe/Skopje', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'Asia/Tokyo', 'UTC']; }
  dl.innerHTML = zones.map(z => `<option value="${esc(z)}">`).join('');
}
const refresh = id => renderWidget(id);

/* drag to reorder */
let dragId = null;
function makeDraggable(card, head) {
  head.addEventListener('mousedown', () => { card.draggable = true; });
  card.addEventListener('dragstart', e => {
    dragId = card.dataset.id;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragId);
  });
  card.addEventListener('dragend', () => {
    card.draggable = false;
    card.classList.remove('dragging');
    $$('.card').forEach(c => c.classList.remove('dragover'));
  });
  card.addEventListener('dragover', e => {
    if (!dragId || dragId === card.dataset.id) return;
    e.preventDefault();
    card.classList.add('dragover');
  });
  card.addEventListener('dragleave', () => card.classList.remove('dragover'));
  card.addEventListener('drop', e => {
    e.preventDefault();
    card.classList.remove('dragover');
    if (!dragId || dragId === card.dataset.id) return;
    if (moveCard(dragId, card.dataset.id)) { save(); renderGrid(); }
  });
}

/* drop `moved` in front of `before`; returns false if nothing changed */
function moveCard(moved, before) {
  const from = cfg.order.indexOf(moved);
  if (from < 0 || moved === before) return false;
  const [it] = cfg.order.splice(from, 1);
  const to = cfg.order.indexOf(before);
  cfg.order.splice(to < 0 ? cfg.order.length : to, 0, it);
  return true;
}

/* ═══════════ link list editor ═══════════ */

let listKind = null;
function editList(kind) {
  listKind = kind;
  $('#listDlgTitle').textContent = t(kind);
  $('#listText').value = (cfg[kind] || [])
    .map(x => [x.title, x.url, x.icon].filter(Boolean).join(' | ')).join('\n');
  $('#listDlg').showModal();
}
$('#listDlg').addEventListener('close', () => {
  if ($('#listDlg').returnValue !== 'save' || !listKind) return;
  cfg[listKind] = $('#listText').value.split('\n').map(line => {
    const p = line.split('|').map(s => s.trim());
    if (!p[0] || !p[1]) return null;
    return { title: p[0], url: p[1], icon: p[2] || '' };
  }).filter(Boolean);
  save(); renderWidget(listKind);
});

/* ═══════════ clock + greeting ═══════════ */

function tickClock() {
  const now = new Date();
  const loc = cfg.lang === 'mk' ? 'mk-MK' : 'en-GB';
  $('#clockTime').textContent = hhmm(now);
  $('#clockDate').textContent = now.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' });
  const h = now.getHours();
  const part = h < 5 ? 'night' : h < 12 ? 'morning' : h < 18 ? 'afternoon' : h < 23 ? 'evening' : 'night';
  $('#greeting').textContent = t(part) + '.';

  // cards that show the passing of time refresh with it
  Object.entries(cfg.custom).forEach(([id, c]) => {
    if (TYPES[c.type]?.live && !cfg.off.includes(id)) renderWidget(id);
  });
}

/* ═══════════ settings ═══════════ */

function applyChrome() {
  T = I18N[cfg.lang] || I18N.en;
  document.documentElement.lang = cfg.lang;
  const dark = cfg.theme === 'dark' ||
    (cfg.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.body.dataset.density = cfg.density;
  $('#q').placeholder = cfg.lang === 'mk' ? 'Барај' : 'Search';
  $('#footNote').textContent = t('free');
  $$('[data-i18n]').forEach(n => { n.textContent = t(n.dataset.i18n); });

  $('#searchIcon').innerHTML  = svg('search', 16);
  $('#goBtn').innerHTML       = svg('go', 16);
  $('#addBtn').innerHTML      = svg('plus', 17);
  $('#settingsBtn').innerHTML = svg('settings', 17);
  $('#themeBtn').innerHTML    = svg(dark ? 'sunLight' : 'moon', 17);   // what it switches to
  $('#geoBtn').innerHTML      = svg('target', 16);
  $('#addBtn').title      = t('addCard');
  $('#settingsBtn').title = t('settings');
  $('#themeBtn').title    = t('theme');
}

$('#addBtn').onclick = openAdd;

$('#themeBtn').onclick = () => {
  cfg.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  save(); applyChrome();
};

$('#settingsBtn').onclick = () => {
  $('#setTheme').value    = cfg.theme;
  $('#setLang').value     = cfg.lang;
  $('#setDensity').value  = cfg.density;
  $('#setBase').value     = cfg.base;
  $('#setSymbols').value  = cfg.symbols;
  $('#setGmailId').value  = cfg.gmailId;
  $('#setMailPoll').value = cfg.mailPoll;
  $('#setMailNotify').checked = cfg.mailNotify;
  $('#mailState').textContent = cfg.mailConnected && mail.who ? t('mailSignedIn') + ' ' + mail.who : '';
  $('#mailOff').hidden = !cfg.mailConnected;
  $('#currentLoc').textContent = cfg.loc ? `${cfg.loc.name} (${cfg.loc.lat.toFixed(3)}, ${cfg.loc.lon.toFixed(3)})` : '—';
  $('#cityResults').innerHTML = '';

  const box = $('#widgetToggles');
  box.innerHTML = '';
  Object.keys(WIDGETS).forEach(id => {
    const lab = el('label');
    const cb = el('input'); cb.type = 'checkbox'; cb.checked = !cfg.off.includes(id);
    cb.dataset.id = id;
    lab.append(cb, el('span', null, esc(WIDGETS[id].title())));
    box.append(lab);
  });
  $('#settingsDlg').showModal();
};

$('#settingsDlg').addEventListener('close', () => {
  if ($('#settingsDlg').returnValue !== 'save') return;
  cfg.theme   = $('#setTheme').value;
  cfg.lang    = $('#setLang').value;
  cfg.density = $('#setDensity').value;
  cfg.base    = ($('#setBase').value || 'EUR').toUpperCase().slice(0, 3);
  cfg.symbols = $('#setSymbols').value.toUpperCase().replace(/\s+/g, '');
  cfg.gmailId = $('#setGmailId').value.trim();
  cfg.mailPoll = Math.min(60, Math.max(1, +$('#setMailPoll').value || 5));
  cfg.mailNotify = $('#setMailNotify').checked;
  cfg.off     =$$('#widgetToggles input').filter(i => !i.checked).map(i => i.dataset.id);
  save(); applyChrome(); renderEngines(); renderGrid(); tickClock(); mailSchedule();
});

$('#mailOff').onclick = () => { mailSignOut(); $('#settingsDlg').close(); };

/* city lookup — Open-Meteo geocoding, free and keyless */
$('#citySearchBtn').onclick = async () => {
  const q = $('#citySearch').value.trim();
  if (!q) return;
  const out = $('#cityResults');
  out.innerHTML = `<div class="empty">${t('loading')}</div>`;
  try {
    const d = await getJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=${cfg.lang}&format=json`);
    if (!d.results?.length) { out.innerHTML = `<div class="empty">—</div>`; return; }
    out.innerHTML = '';
    d.results.forEach(r => {
      const b = el('button', null, `${esc(r.name)}${r.admin1 ? ', ' + esc(r.admin1) : ''} · ${esc(r.country_code || '')}`);
      b.type = 'button';
      b.onclick = () => {
        cfg.loc = { name: r.name, country: r.country_code, lat: r.latitude, lon: r.longitude };
        cfg.locFrom = 'user';
        save();
        $('#currentLoc').textContent = `${r.name} (${r.latitude.toFixed(3)}, ${r.longitude.toFixed(3)})`;
        out.innerHTML = '';
        renderWidget('weather');
      };
      out.append(b);
    });
  } catch { out.innerHTML = `<div class="err">${t('failed')}</div>`; }
};

$('#geoBtn').onclick = () => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(p => {
    cfg.locFrom = 'user';
    cfg.loc = { name: cfg.lang === 'mk' ? 'Моја локација' : 'My location',
                lat: p.coords.latitude, lon: p.coords.longitude };
    save();
    $('#currentLoc').textContent = `${cfg.loc.name} (${cfg.loc.lat.toFixed(3)}, ${cfg.loc.lon.toFixed(3)})`;
    renderWidget('weather');
  }, () => {}, { timeout: 8000 });
};

/* export / import / reset */
$('#exportBtn').onclick = () => {
  const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
  const a = el('a');
  a.href = URL.createObjectURL(blob);
  a.download = `portal-backup-${isoDay()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};
$('#importBtn').onclick = () => $('#importFile').click();
$('#importFile').onchange = async e => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    cfg = sane(JSON.parse(await f.text()));
    save(); applyChrome(); renderEngines(); renderGrid(); tickClock();
    $('#settingsDlg').close();
  } catch { alert(t('failed')); }
};
$('#resetBtn').onclick = () => {
  if (!confirm(t('resetAsk'))) return;
  localStorage.removeItem(KEY);
  cfg = structuredClone(DEFAULTS);
  save(); applyChrome(); renderEngines(); renderGrid(); tickClock();
  $('#settingsDlg').close();
};

/* First visit: work out the city from the browser's own time zone. No
   permission prompt, no IP lookup, no third party — a zone name is already a
   place ("Europe/Berlin"), and Open-Meteo's free geocoder turns it into
   coordinates. Without this, a stranger opening the published page would see
   the author's weather instead of their own. */
async function detectLocation() {
  if (cfg.locFrom !== 'default') return;      // guessed once, or chosen outright
  let zone = '';
  try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch {}
  const city = zone.split('/').pop().replace(/_/g, ' ').trim();
  if (!city) return;
  try {
    const d = await getJSON('https://geocoding-api.open-meteo.com/v1/search?name=' +
      encodeURIComponent(city) + '&count=1&language=' + cfg.lang + '&format=json');
    const r = d.results?.[0];
    if (!r) return;
    cfg.loc = { name: r.name, country: r.country_code, lat: r.latitude, lon: r.longitude };
    cfg.locFrom = 'auto';
    save();
    renderWidget('weather');                  // which republishes the sun times too
  } catch { /* keep the default; the card still works */ }
}

/* ═══════════ boot ═══════════ */

applyChrome();
fillTimeZones();
renderEngines();
renderGrid();
tickClock();
detectLocation();          // first visit only, and never over a chosen city
setInterval(tickClock, 15000);
setInterval(() => { renderWidget('weather'); renderWidget('news'); }, 20 * 60 * 1000);

/* if Gmail was connected before, try to renew quietly — no popup on load */
if (cfg.mailConnected && gmailId()) {
  gmailAuth(false)
    .then(() => { mail.primed = false; return mailRefresh(); })
    .then(mailSchedule)
    .catch(() => { mail.err = ''; renderWidget('mail'); });
}

document.addEventListener('keydown', e => {
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    e.preventDefault(); $('#q').focus();
  }
});
$('#q').focus();
