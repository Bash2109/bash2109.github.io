/* ============================================================
   0. ОБЩЕЕ
   ============================================================ */
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}


/* ============================================================
   1. ЗАГОЛОВОК: «РАСШИФРОВКА» ПРИ ЗАГРУЗКЕ
   Буквы по очереди проявляются из случайных символов.
   Для скринридеров заголовок остаётся обычным текстом (aria-label).
   ============================================================ */
function decryptHeading(h) {
  const text = h.textContent.trim();
  h.setAttribute("aria-label", text);
  h.textContent = "";

  const GLYPHS = "0123456789#*+=<>?/|~$";
  const randomGlyph = function () { return GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length)); };

  const words = text.split(" ");
  const cells = [];
  words.forEach(function (word, wi) {
    const w = el("span", "dw");
    w.setAttribute("aria-hidden", "true");
    Array.from(word).forEach(function (ch) {
      const c = el("span", "dc", ch);
      w.append(c);
      cells.push({ node: c, ch: ch });
    });
    h.append(w);
    if (wi < words.length - 1) h.append(" ");
  });

  // Фиксируем ширину каждой буквы, чтобы текст не «прыгал» во время анимации
  cells.forEach(function (c) { c.width = c.node.getBoundingClientRect().width; });
  cells.forEach(function (c) {
    c.node.style.width = c.width + "px";
    c.node.textContent = randomGlyph();
  });
  h.classList.add("ready");

  const start = performance.now();
  cells.forEach(function (c, i) { c.at = 250 + i * 34 + Math.random() * 120; });

  function frame(now) {
    const t = now - start;
    let done = true;
    cells.forEach(function (c) {
      if (t >= c.at) {
        if (!c.fixed) {
          c.node.textContent = c.ch;
          c.node.classList.add("on");
          c.fixed = true;
        }
      } else {
        done = false;
        if (!c.last || now - c.last > 55) {
          c.node.textContent = randomGlyph();
          c.last = now;
        }
      }
    });
    if (done) {
      cells.forEach(function (c) { c.node.style.width = ""; });
    } else {
      requestAnimationFrame(frame);
    }
  }
  requestAnimationFrame(frame);
}

(function initHero() {
  const h1 = document.querySelector(".hero h1");
  if (!h1) return;

  // Страховка: если что-то пошло не так, заголовок всё равно появится
  setTimeout(function () { h1.classList.add("ready"); }, 2500);

  if (prefersReduced) { h1.classList.add("ready"); return; }

  // Ждём загрузки шрифта, чтобы измерить буквы правильно
  const fontLoad = document.fonts && document.fonts.load
    ? document.fonts.load('600 1em "Unbounded"')
    : Promise.resolve();
  const timeout = new Promise(function (resolve) { setTimeout(resolve, 1500); });
  Promise.race([fontLoad, timeout]).then(function () { decryptHeading(h1); }, function () { decryptHeading(h1); });
})();


/* ============================================================
   2. МЕНЮ: подсветка текущего раздела
   ============================================================ */
(function initNav() {
  const links = Array.from(document.querySelectorAll(".nav a"));
  const sections = links
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);
  if (!("IntersectionObserver" in window) || sections.length === 0) return;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      links.forEach(function (a) {
        const active = a.getAttribute("href") === "#" + e.target.id;
        a.classList.toggle("active", active);
        if (active) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });

  sections.forEach(function (s) { observer.observe(s); });
})();


/* ============================================================
   3. ВИКТОРИНА
   Чтобы изменить вопросы, правьте массив QUESTIONS.
   correct — номер правильного варианта (начиная с 0).
   ============================================================ */
const QUESTIONS = [
  {
    q: "Какой из этих паролей самый надёжный?",
    options: ["Qwerty123", "Ivan2008", "Кот-Лампа-Дождь-47-Река", "12345678"],
    correct: 2,
    explain: "Длинная фраза из нескольких слов запоминается легче и подбирается намного дольше, чем короткие и популярные пароли."
  },
  {
    q: "Вам звонит «сотрудник банка» и просит назвать код из СМС. Что делать?",
    options: [
      "Назвать код, чтобы защитить деньги",
      "Положить трубку и перезвонить в банк по номеру с карты или официального сайта",
      "Попросить его представиться и назвать код, если он знает ФИО",
      "Назвать только половину кода"
    ],
    correct: 1,
    explain: "Настоящий банк никогда не спрашивает коды из СМС. Перезвонить нужно самому по официальному номеру."
  },
  {
    q: "Что такое двухфакторная аутентификация?",
    options: [
      "Два пароля, которые нужно придумать самому",
      "Вход с двух разных устройств одновременно",
      "Дополнительное подтверждение входа помимо пароля (код, приложение)",
      "Автоматическая смена пароля раз в месяц"
    ],
    correct: 2,
    explain: "Даже если пароль украден, без второго шага злоумышленник в аккаунт не войдёт."
  },
  {
    q: "На что важнее всего смотреть в адресной строке перед вводом данных?",
    options: [
      "На красивый дизайн страницы",
      "На точное написание домена сайта",
      "На количество картинок на странице",
      "Достаточно просто увидеть значок замка"
    ],
    correct: 1,
    explain: "Замок говорит только о шифровании соединения. Мошеннические сайты тоже могут его иметь, поэтому главное — убедиться, что домен написан точно."
  },
  {
    q: "Чем опасно использовать один пароль на нескольких сайтах?",
    options: [
      "Ничем, так проще запомнить",
      "Сайты начнут работать медленнее",
      "Утечка на одном сайте открывает доступ ко всем остальным аккаунтам",
      "Пароль быстрее устареет"
    ],
    correct: 2,
    explain: "Злоумышленники автоматически пробуют украденные пары логин-пароль на других популярных сервисах."
  },
  {
    q: "Как лучше защитить домашний Wi-Fi?",
    options: [
      "Оставить заводской пароль роутера",
      "Использовать пароль из цифр 12345678",
      "Сменить пароль администратора и задать длинный пароль сети с шифрованием WPA2/WPA3",
      "Сделать сеть открытой, чтобы не терять подключение"
    ],
    correct: 2,
    explain: "Заводские и простые пароли легко подобрать. Надёжная защита сети начинается со смены паролей и включения современного шифрования."
  },
  {
    q: "Знакомый в мессенджере прислал ссылку с текстом «Проголосуй за меня!». Что делать?",
    options: [
      "Перейти и проголосовать, это же знакомый",
      "Не переходить и уточнить у знакомого через звонок или другой канал связи",
      "Переслать ссылку друзьям, чтобы проверили они",
      "Перейти, но ничего не вводить"
    ],
    correct: 1,
    explain: "Скорее всего, аккаунт знакомого взломан. Переход по такой ссылке может привести на поддельную страницу входа."
  },
  {
    q: "Вы сидите в кафе и подключились к бесплатному Wi-Fi. Что безопаснее всего?",
    options: [
      "Зайти в онлайн-банк и оплатить покупки",
      "Не вводить пароли и данные карт, а для важных действий использовать мобильный интернет",
      "Отключить антивирус для скорости",
      "Ввести пароль от почты, но только на секунду"
    ],
    correct: 1,
    explain: "В открытых сетях трафик проще перехватить или подменить. Для важных операций надёжнее мобильный интернет."
  },
  {
    q: "Зачем нужно обновлять систему и приложения?",
    options: [
      "Только ради новых функций и дизайна",
      "Чтобы закрыть найденные уязвимости, которыми пользуются злоумышленники",
      "Чтобы телефон работал медленнее",
      "Обновления не нужны, если нет вирусов"
    ],
    correct: 1,
    explain: "Часть обновлений напрямую закрывает дыры в безопасности. Включите автоматическое обновление, чтобы не откладывать."
  },
  {
    q: "Пришло письмо: «Ваш аккаунт будет заблокирован через 24 часа! Перейдите по ссылке». Это...",
    options: [
      "Официальное уведомление, нужно срочно перейти по ссылке",
      "Признак фишинга: срочность и угрозы. Нужно зайти на сайт вручную и проверить",
      "Можно ответить на письмо и уточнить детали",
      "Можно открыть вложение, чтобы убедиться"
    ],
    correct: 1,
    explain: "Срочность и угрозы — классический приём мошенников. Не переходите по ссылке из письма, а откройте нужный сайт самостоятельно."
  }
];

const quizBox = document.getElementById("quiz-box");
let current = 0;
let score = 0;
let stepEl = null;

function renderQuestion() {
  const data = QUESTIONS[current];
  quizBox.innerHTML = "";
  stepEl = el("div", "quiz-step");

  const progress = el("div", "quiz-progress");
  progress.append(el("span", "", "Вопрос " + (current + 1) + " из " + QUESTIONS.length));
  progress.append(el("span", "", "Баллы: " + score));
  stepEl.append(progress);

  const bar = el("div", "quiz-bar");
  const fill = el("div");
  fill.style.width = (current / QUESTIONS.length * 100) + "%";
  bar.append(fill);
  stepEl.append(bar);

  stepEl.append(el("p", "quiz-q", data.q));

  const list = el("div", "quiz-options");
  const buttons = [];
  data.options.forEach(function (text, index) {
    const btn = el("button", "quiz-option", text);
    btn.type = "button";
    btn.addEventListener("click", function () { answer(index, buttons, data); });
    buttons.push(btn);
    list.append(btn);
  });
  stepEl.append(list);
  quizBox.append(stepEl);
}

function answer(index, buttons, data) {
  buttons.forEach(function (b, i) {
    b.disabled = true;
    if (i === data.correct) b.classList.add("correct");
  });
  if (index === data.correct) {
    score++;
  } else {
    buttons[index].classList.add("wrong");
  }

  const explain = el("div", "quiz-explain");
  explain.append(el("strong", "", index === data.correct ? "Верно! " : "Неверно. "));
  explain.append(document.createTextNode(data.explain));
  stepEl.append(explain);

  const isLast = current === QUESTIONS.length - 1;
  const next = el("button", "btn btn-primary quiz-next", isLast ? "Показать результат" : "Следующий вопрос");
  next.type = "button";
  next.addEventListener("click", function () {
    if (isLast) { renderResult(); } else { current++; renderQuestion(); }
  });
  stepEl.append(next);
  next.focus({ preventScroll: true });
}

function buildRing(value, total) {
  const NS = "http://www.w3.org/2000/svg";
  const r = 54;
  const circumference = 2 * Math.PI * r;

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 140 140");
  svg.setAttribute("class", "ring");
  svg.setAttribute("aria-hidden", "true");

  const track = document.createElementNS(NS, "circle");
  track.setAttribute("class", "ring-track");
  track.setAttribute("cx", "70"); track.setAttribute("cy", "70"); track.setAttribute("r", String(r));

  const bar = document.createElementNS(NS, "circle");
  bar.setAttribute("class", "ring-bar");
  bar.setAttribute("cx", "70"); bar.setAttribute("cy", "70"); bar.setAttribute("r", String(r));
  bar.style.strokeDasharray = String(circumference);
  bar.style.strokeDashoffset = String(circumference);

  svg.append(track, bar);

  // Два кадра подряд, чтобы браузер успел применить начальное состояние и показал анимацию
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      bar.style.strokeDashoffset = String(circumference * (1 - value / total));
    });
  });
  return svg;
}

function countUp(node, to) {
  if (prefersReduced || to === 0) { node.textContent = String(to); return; }
  const t0 = performance.now();
  const duration = 900;
  function tick(now) {
    const p = Math.min(1, (now - t0) / duration);
    node.textContent = String(Math.round(to * p));
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function renderResult() {
  const total = QUESTIONS.length;
  let level, comment;
  if (score <= Math.floor(total * 0.4)) {
    level = "Новичок";
    comment = "Есть куда расти. Перечитайте раздел с правилами и попробуйте ещё раз.";
  } else if (score <= Math.floor(total * 0.7)) {
    level = "Уверенный пользователь";
    comment = "Хорошая база! Остались небольшие пробелы, посмотрите разделы по тем вопросам, где ошиблись.";
  } else if (score < total) {
    level = "Продвинутый пользователь";
    comment = "Отличный результат! Вы хорошо разбираетесь в основах цифровой безопасности.";
  } else {
    level = "Эксперт";
    comment = "Безошибочно! Поделитесь знаниями с друзьями и близкими.";
  }

  quizBox.innerHTML = "";
  const box = el("div", "quiz-result");
  box.append(el("p", "", "Ваш результат"));

  const wrap = el("div", "ring-wrap");
  wrap.setAttribute("role", "img");
  wrap.setAttribute("aria-label", score + " из " + total);
  wrap.append(buildRing(score, total));
  const center = el("div", "ring-center");
  center.setAttribute("aria-hidden", "true");
  const num = el("span", "ring-num", "0");
  center.append(num, el("span", "ring-of", "из " + total));
  wrap.append(center);
  box.append(wrap);
  countUp(num, score);

  box.append(el("div", "level", level));
  box.append(el("p", "", comment));
  const again = el("button", "btn btn-primary", "Пройти ещё раз");
  again.type = "button";
  again.addEventListener("click", function () { current = 0; score = 0; renderQuestion(); });
  box.append(again);
  quizBox.append(box);
}

renderQuestion();


/* ============================================================
   4. ПРОВЕРКА ПАРОЛЯ
   Всё считается в браузере, ничего никуда не отправляется.
   ============================================================ */
const COMMON_PARTS = [
  "password", "qwerty", "qwertyu", "123456", "12345678", "111111", "000000",
  "admin", "login", "welcome", "iloveyou", "letmein", "abc123",
  "пароль", "йцукен", "привет", "любовь", "qazwsx", "1q2w3e", "zxcvbn"
];

const pwInput = document.getElementById("pw-input");
const pwToggle = document.getElementById("pw-toggle");
const pwBar = document.getElementById("pw-bar");
const pwLevel = document.getElementById("pw-level");
const pwTips = document.getElementById("pw-tips");

function evaluatePassword(pw) {
  let score = 0;
  const tips = [];
  const lower = pw.toLowerCase();

  if (pw.length >= 16) score += 3;
  else if (pw.length >= 12) score += 2;
  else if (pw.length >= 8) score += 1;
  else tips.push("Пароль слишком короткий: сделайте его не короче 12 символов.");
  if (pw.length >= 8 && pw.length < 12) tips.push("Лучше увеличить длину до 12 символов и больше.");

  const classes = [
    /[a-zа-яё]/.test(pw),
    /[A-ZА-ЯЁ]/.test(pw),
    /[0-9]/.test(pw),
    /[^a-zа-яё0-9]/i.test(pw)
  ];
  const variety = classes.filter(Boolean).length;
  score += variety;
  if (variety < 3) tips.push("Добавьте заглавные буквы, цифры или символы, либо используйте длинную фразу из нескольких слов.");

  const hasCommon = COMMON_PARTS.some(function (part) { return lower.indexOf(part) !== -1; });
  if (hasCommon) {
    score = Math.min(score, 2);
    tips.push("В пароле есть популярная комбинация, такие пароли подбирают в первую очередь.");
  }
  if (/(.)\1{2,}/.test(pw)) {
    score -= 1;
    tips.push("Избегайте повторяющихся символов подряд («aaa», «111»).");
  }
  if (/^[0-9]+$/.test(pw)) {
    score = Math.min(score, 1);
    tips.push("Пароль только из цифр подбирается очень быстро.");
  }

  if (score < 0) score = 0;
  if (tips.length === 0) tips.push("Отличный пароль! Не используйте его больше нигде и не сообщайте никому.");
  return { score: score, tips: tips };
}

function updatePasswordMeter() {
  const pw = pwInput.value;
  pwTips.innerHTML = "";

  if (!pw) {
    pwBar.style.width = "0";
    pwBar.style.boxShadow = "none";
    pwLevel.textContent = "Введите пароль, чтобы увидеть оценку";
    return;
  }

  const result = evaluatePassword(pw);
  let label, color, width;
  if (result.score <= 2) { label = "Слабый"; color = "#ff7a90"; width = 25; }
  else if (result.score <= 4) { label = "Средний"; color = "#ffc766"; width = 50; }
  else if (result.score <= 5) { label = "Хороший"; color = "#a6e36e"; width = 75; }
  else { label = "Надёжный"; color = "#5eead4"; width = 100; }

  pwBar.style.width = width + "%";
  pwBar.style.background = color;
  pwBar.style.boxShadow = "0 0 14px " + color;
  pwLevel.textContent = "Оценка: " + label;
  result.tips.forEach(function (t) { pwTips.append(el("li", "", t)); });
}

pwInput.addEventListener("input", updatePasswordMeter);
pwToggle.addEventListener("click", function () {
  const hidden = pwInput.type === "password";
  pwInput.type = hidden ? "text" : "password";
  pwToggle.textContent = hidden ? "Скрыть" : "Показать";
});


/* ============================================================
   5. РЕЗУЛЬТАТЫ ОПРОСА
   Когда соберёте ответы, заполните массив SURVEY_RESULTS.
   Пример структуры (удалите комментарии и подставьте свои числа):

   const SURVEY_RESULTS = [
     {
       question: "Используете ли вы один пароль для нескольких сервисов?",
       answers: [
         { label: "Да", count: 27 },
         { label: "Нет", count: 13 }
       ]
     }
   ];
   ============================================================ */
const SURVEY_RESULTS = [];

const resultsBox = document.getElementById("results-box");

// Столбики «вырастают», когда карточка попадает в поле зрения
const barObserver = ("IntersectionObserver" in window && !prefersReduced)
  ? new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          barObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 })
  : null;

function renderResults() {
  resultsBox.innerHTML = "";

  if (SURVEY_RESULTS.length === 0) {
    resultsBox.append(el("div", "empty-note", "Опрос ещё идёт. Результаты появятся здесь после обработки ответов."));
    return;
  }

  SURVEY_RESULTS.forEach(function (item) {
    const total = item.answers.reduce(function (sum, a) { return sum + a.count; }, 0);
    const card = el("div", "survey-q glass");
    card.append(el("h3", "", item.question));

    item.answers.forEach(function (a) {
      const percent = total ? Math.round(a.count / total * 100) : 0;
      const row = el("div", "bar-row");
      const label = el("div", "bar-label");
      label.append(el("span", "", a.label));
      label.append(el("span", "", percent + "% (" + a.count + ")"));
      const track = el("div", "bar-track");
      const fill = el("div", "bar-fill");
      fill.style.setProperty("--w", percent + "%");
      track.append(fill);
      row.append(label, track);
      card.append(row);
    });

    resultsBox.append(card);
    if (barObserver) barObserver.observe(card); else card.classList.add("in");
  });
}

renderResults();
