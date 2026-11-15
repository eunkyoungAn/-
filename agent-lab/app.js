/* 업무 에이전트 실습실 — 화면 동작.
   외부로 보내는 요청이 없다(CSP connect-src 'none'). 저장하는 것은 검수 표시뿐이며 이 기기 브라우저에만 남는다. */
(function () {
  'use strict';
  var D = window.LAB_DATA, C = window.LAB_CONFIG || {};
  if (!D) return;

  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var $ = function (id) { return document.getElementById(id); };
  /* 설정 파일의 주소는 claude.ai 만 허용한다 */
  var safeUrl = function (u) { return /^https:\/\/claude\.ai\//.test(u || '') ? u : 'https://claude.ai/'; };
  var fileUrl = function (p) { return 'files/' + p.split('/').map(encodeURIComponent).join('/'); };
  var byId = {};
  D.lessons.forEach(function (l, i) { byId[l.id] = l; l.index = i; });
  D.parts.forEach(function (p) { p.lessons.forEach(function (id) { byId[id].part = p; }); });

  /* ---------- 검수 표시 저장 (이 기기에만) ---------- */
  var KEY = 'agent-lab-checks-v1', checks = {};
  try { checks = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { checks = {}; }
  var saveChecks = function () { try { localStorage.setItem(KEY, JSON.stringify(checks)); } catch (e) { /* 저장이 막혀 있어도 화면은 동작함 */ } };
  var isDone = function (l) {
    if (!l || !l.checks) return false;
    var c = checks[l.id] || [];
    return l.checks.every(function (_, i) { return !!c[i]; });
  };

  /* ---------- 복사 ---------- */
  var store = {};           // data-copy 값 → 복사할 글
  var keySeq = 0;
  var keep = function (text) { var k = 'c' + (++keySeq); store[k] = text; return k; };
  var copyBtn = function (text, label, cls) {
    return '<button type="button" class="' + (cls || 'copy-button') + '" data-copy="' + keep(text) + '">' + esc(label || '복사') + '</button>';
  };
  var selectNear = function (btn) {
    var box = btn.closest('.prompt-box,.sample-note,.val-row,.pick-out,.sheet');
    var pre = box && box.querySelector('pre');
    if (!pre) return;
    var r = document.createRange(); r.selectNodeContents(pre);
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  };
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-copy]');
    if (!btn) return;
    var k = btn.getAttribute('data-copy');
    var text = Object.prototype.hasOwnProperty.call(store, k) ? store[k] : ($(k) ? $(k).textContent : '');
    var old = btn.getAttribute('data-label') || btn.textContent;
    btn.setAttribute('data-label', old);
    var flash = function (msg) { btn.textContent = msg; setTimeout(function () { btn.textContent = old; }, 1600); };
    var fail = function () { selectNear(btn); flash('Ctrl+C로 복사'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { flash('복사함'); }, fail);
    } else { fail(); }
  });

  /* ---------- 간단 마크다운(양식 표시용). 글자는 모두 esc 를 거친다 ---------- */
  var md = function (src) {
    var lines = String(src).split('\n'), o = '', i = 0, inUl = false, inOl = false;
    var close = function () { if (inUl) { o += '</ul>'; inUl = false; } if (inOl) { o += '</ol>'; inOl = false; } };
    var inl = function (t) {
      return esc(t).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/&lt;br&gt;/g, '<br>');
    };
    var cells = function (r) { return r.trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); }); };
    while (i < lines.length) {
      var L = lines[i], m;
      if (/^\s*\|/.test(L) && /^\s*\|[\s:|-]+\|?\s*$/.test(lines[i + 1] || '')) {
        close();
        var head = cells(L), body = ''; i += 2;
        while (i < lines.length && /^\s*\|/.test(lines[i])) {
          body += '<tr>' + cells(lines[i]).map(function (c) { return '<td>' + inl(c) + '</td>'; }).join('') + '</tr>'; i++;
        }
        o += '<table><thead><tr>' + head.map(function (c) { return '<th>' + inl(c) + '</th>'; }).join('') + '</tr></thead><tbody>' + body + '</tbody></table>';
        continue;
      }
      if ((m = L.match(/^(#{1,4})\s+(.*)$/))) { close(); o += '<h' + m[1].length + '>' + inl(m[2]) + '</h' + m[1].length + '>'; i++; continue; }
      if ((m = L.match(/^\s*[-*]\s+(.*)$/))) { if (inOl) { o += '</ol>'; inOl = false; } if (!inUl) { o += '<ul>'; inUl = true; } o += '<li>' + inl(m[1]) + '</li>'; i++; continue; }
      if ((m = L.match(/^\s*\d+[.)]\s+(.*)$/))) { if (inUl) { o += '</ul>'; inUl = false; } if (!inOl) { o += '<ol>'; inOl = true; } o += '<li>' + inl(m[1]) + '</li>'; i++; continue; }
      if ((m = L.match(/^\s*>\s?(.*)$/))) { close(); o += '<blockquote>' + inl(m[1]) + '</blockquote>'; i++; continue; }
      if (!L.trim()) { close(); i++; continue; }
      close(); o += '<p>' + inl(L) + '</p>'; i++;
    }
    close();
    return o;
  };

  var dlLink = function (f, label) {
    return '<a class="g-btn ghost" href="' + esc(fileUrl(f.path)) + '" download="' + esc(f.name) + '">' + esc(label || '받기') + '</a>';
  };

  var G = D.guide, P = D.project, B = D.basics, K = D.apikey, T = D.think, L = D.projectlab, SK = D.skillintro;
  var fileList = function (files, label) {
    return '<div class="file-list">' + files.map(function (f) {
      return '<div class="file-row"><div><strong>' + esc(f.name) + '</strong><span>' + esc(f.label) + ' · <em>' + esc(f.role) + '</em></span></div>' + dlLink(f, label) + '</div>';
    }).join('') + '</div>';
  };
  var errorsHtml = function () {
    return D.errors.map(function (g) {
      return '<h3 class="dl-h">' + esc(g.title) + '</h3><div class="g-table"><table><thead><tr><th>화면에 나온 것</th><th>왜 그런가</th><th>할 일</th></tr></thead><tbody>' +
        g.rows.map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    }).join('');
  };
  var checklistHtml = function (id, items) {
    var c = checks[id] || [];
    return '<div class="checklist">' + items.map(function (t, i) {
      return '<label class="check-item"><input type="checkbox" data-check="' + i + '"' + (c[i] ? ' checked' : '') + '><span>' + esc(t) + '</span></label>';
    }).join('') + '</div><div class="local-note">체크 상태는 지금 쓰는 기기에만 저장됩니다.</div>';
  };
  var bindChecks = function (id) {
    $('lessonBody').querySelectorAll('[data-check]').forEach(function (el) {
      el.addEventListener('change', function () {
        var a = checks[id] || (checks[id] = []);
        a[+el.getAttribute('data-check')] = el.checked;
        saveChecks(); updateProgress();
      });
    });
  };

  /* ---------- 시작 화면 ---------- */
  var renderHome = function () {
    $('studioLink').href = safeUrl(C.studioUrl);

    $('zipLink').href = fileUrl(D.zip);
    $('zipLink').setAttribute('download', D.zip);

    var card = function (l, arrow) {
      return '<a class="lesson-card' + (isDone(l) ? ' is-done' : '') + '" href="#' + l.id + '" data-lesson="' + l.id + '">' +
        '<span class="lesson-code">' + esc(l.code + ' · ' + l.time) + '</span><h3>' + esc(l.title) + '</h3><p>' + esc(l.sum) + '</p>' +
        '<div class="lesson-output"><span>완성 결과물</span> · ' + esc(l.out) + '</div><div class="lesson-arrow">' + arrow + ' →</div></a>';
    };
    var level = function (kicker, title, desc, cards) {
      return '<section class="level-section"><div class="level-head"><div><span class="level-kicker">' + esc(kicker) + '</span><h2>' + esc(title) +
        '</h2></div><p>' + esc(desc) + '</p></div><div class="lesson-grid">' + cards + '</div></section>';
    };
    $('homeLevels').innerHTML = level(B.kicker, B.partTitle, B.partDesc, card(B, '기본 개념 보기') + card(SK, '스킬 알아보기') + card(K, '언제 쓰는지 보기') + card(T, '내 직무에 적용해 보기')) + level(G.kicker, G.partTitle, G.partDesc, card(G, '만드는 방법 보기') +
      '<a class="lesson-card" href="#help"><span class="lesson-code">모음 · 6가지 상황</span><h3>오류가 나는 대표 사유</h3>' +
      '<p>실행이 안 될 때, 파일이 안 들어갈 때, 파일로 못 받을 때의 원인과 할 일을 한 번에 모았습니다.</p>' +
      '<div class="lesson-output"><span>바로 찾기</span> · 화면에 나온 문구로 찾습니다</div><div class="lesson-arrow">사유 한 번에 보기 →</div></a>') +
      D.parts.map(function (p) {
        return level(p.kicker, p.title, p.desc, p.lessons.map(function (id) { return card(byId[id], '실습 시작하기'); }).join(''));
      }).join('') +
      level(P.kicker, P.partTitle, P.partDesc, card(P, '방법과 실습 보기') +
      '<a class="lesson-card" href="#skills"><span class="lesson-code">교육 뒤 · 선택</span><h3>내 Claude에 스킬 등록하기</h3>' +
      '<p>일곱 에이전트를 스킬 파일로 받아 내 Claude에 등록합니다. 프로젝트 대화에서 불러 쓸 수 있습니다.</p>' +
      '<div class="lesson-output"><span>받는 것</span> · 스킬 zip 파일 7개</div><div class="lesson-arrow">스킬 받으러 가기 →</div></a>');
    $('errorGroups').innerHTML = errorsHtml();

    $('downloadGroups').innerHTML = D.lessons.map(function (l) {
      return '<h3 class="dl-h">' + esc(l.code + ' · ' + l.agent) + '</h3>' + fileList(l.files, '받기');
    }).join('') + '<h3 class="dl-h">선택 · 내 스튜디오 만들기</h3>' + fileList(G.files, '받기');
    var skillItem = function (s) {
      return '<div class="dl-item"><div><strong>' + esc(s.name) + '.zip</strong><span>' + esc(s.lesson + ' · ' + s.agent) + '</span></div>' +
        dlLink({ path: s.path, name: s.name + '.zip' }) + '</div>';
    };
    $('skillGrid').innerHTML = D.skills.map(skillItem).join('');
    $('reportSkillGrid').innerHTML = D.reportSkills.map(skillItem).join('');

    /* 오른쪽 위 바로가기: 모든 파트와 실습 */
    var mLink = function (href, code, title) {
      return '<a href="#' + href + '"><span>' + esc(code) + '</span>' + esc(title) + '</a>';
    };
    var mGroup = function (title, links) { return '<div class="menu-group"><strong>' + esc(title) + '</strong>' + links + '</div>'; };
    $('quickPanel').innerHTML =
      mGroup('시작 전', mLink(B.id, '기초', B.title) + mLink(SK.id, '기초', SK.title) + mLink(K.id, '기초', K.title) + mLink(T.id, '적용', T.title) + mLink(G.id, '준비', G.title)) +
      D.parts.map(function (p) {
        return mGroup(p.kicker + ' · ' + p.title, p.lessons.map(function (id) { return mLink(id, byId[id].code, byId[id].title); }).join(''));
      }).join('') +
      mGroup('교육 뒤', mLink(P.id, '프로젝트', P.title) + mLink(L.id, '실습', '데이터 에이전트 프로젝트 실습') + mLink('skills', '스킬', '내 Claude에 스킬 등록하기')) +
      mGroup('모음', mLink('home', '처음', '전체 실습 보기') + mLink('downloads', '자료', '자료 파일 한 곳에서 받기') + mLink('rules', '규칙', '공통 규칙 여덟 가지') +
        mLink('files', '파일', '결과를 파일로 받기') + mLink('help', '오류', '오류가 나는 대표 사유'));
    $('ruleGrid').innerHTML = D.rules.map(function (r) {
      return '<div class="rule-card"><b>' + esc(r[0]) + '</b><strong>' + esc(r[1]) + '</strong><p>' + esc(r[2]) + '</p></div>';
    }).join('');
    $('rulesText').textContent = D.rulesText;
    updateProgress();
  };

  var updateProgress = function () {
    var n = D.lessons.filter(isDone).length, t = D.lessons.length;
    $('pgNum').textContent = n + ' / ' + t;
    $('pgBar').style.width = Math.round(n / t * 100) + '%';
    document.querySelectorAll('.lesson-card').forEach(function (el) {
      var id = el.getAttribute('data-lesson');
      el.classList.toggle('is-done', isDone(id === G.id ? G : id === P.id ? P : id === B.id ? B : id === K.id ? K : id === T.id ? T : id === SK.id ? SK : byId[id]));
    });
  };

  /* ---------- 실습 화면 ---------- */
  var KIND = { pick: '단추에서 고르기', file: '파일 올리기' };
  var sec = function (no, id, title, body) {
    return '<section id="' + id + '"><span class="section-number">' + no + '</span><h2>' + esc(title) + '</h2>' + body + '</section>';
  };
  var olist = function (items) { return '<ol class="plain">' + items.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>'; };

  var renderLesson = function (l) {
    store = {}; keySeq = 0;
    $('bcPart').textContent = l.part.kicker + ' ' + l.part.title;
    $('bcCode').textContent = l.code;
    $('lhEyebrow').textContent = l.code + ' · ' + l.time;
    $('lhTitle').textContent = l.title;
    $('lhSum').textContent = l.sum;
    $('lhMeta').innerHTML = '<span class="meta-chip active">에이전트 · ' + esc(l.agent) + '</span><span class="meta-chip">결과물 · ' + esc(l.out) +
      '</span><span class="meta-chip">최종 확인 · 사람</span>';

    var studio = safeUrl(C.studioUrl), chat = safeUrl(C.chatUrl);
    var parts = [], toc = [], n = 0;
    var add = function (id, title, body, tocLabel) {
      n++; var no = (n < 10 ? '0' : '') + n;
      parts.push(sec(no, id, title, body)); toc.push([id, tocLabel || title]);
    };

    add('goal', '이번 실습에서 만들 것',
      '<div class="result-card"><strong>' + esc(l.out) + '</strong><p>' + esc(l.scene) + ' 걸리는 시간: ' + esc(l.timeNote) + '</p></div>' +
      (l.before ? '<div class="safety-box sp"><strong>시작 전에</strong><p>' + esc(l.before) + '</p></div>' : ''), '만들 것');

    add('prepare', '자료 파일 받기',
      '<p>아래 파일을 내 컴퓨터에 받아 둡니다. 전체 압축 파일을 이미 받았다면 건너뜁니다.</p>' + fileList(l.files, '파일 받기'), '자료 받기');

    var vals = l.values.map(function (v) {
      var action = v.kind === 'text' ? copyBtn(v.value, '복사', 'g-btn ghost') : '<span class="val-kind">' + KIND[v.kind] + '</span>';
      return '<div class="val-row"><div class="val-label">' + esc(v.label) + '</div><div class="val-body"><pre>' + esc(v.value) + '</pre>' +
        (v.note ? '<div class="val-note">' + esc(v.note) + '</div>' : '') + '</div>' + action + '</div>';
    }).join('');
    var pick = '';
    if (l.inquiries) {
      pick = '<div class="pick"><label for="qPick">다른 문의로 바꿔 보기 (문의 기록 30건)</label><select id="qPick">' + l.inquiries.map(function (q, i) {
        return '<option value="' + i + '"' + (q.id === 'Q009' ? ' selected' : '') + '>' + esc(q.id + ' · ' + q.type + ' · ' + q.q) + '</option>';
      }).join('') + '</select><div class="pick-out"><pre id="qText"></pre><button type="button" class="g-btn ghost" data-copy="qText">복사</button></div></div>';
    }
    add('values', '스튜디오에 넣을 값',
      '<div class="go-studio"><p><b>내 스튜디오를 엽니다.</b> 왼쪽 목록에서 "' + esc(l.agent) + '"을 고른 뒤, 아래 값을 하나씩 복사해 같은 이름의 칸에 붙여넣습니다. 실행은 만든 계정에서만 되므로, 아직 없다면 먼저 만듭니다.</p>' +
      '<a class="g-btn" href="#' + G.id + '">내 스튜디오 만들기</a><a class="g-btn ghost" href="' + esc(studio) + '" target="_blank" rel="noopener noreferrer">강사 스튜디오 보기</a></div>' +
      '<div class="val-list">' + vals + '</div>' + pick, '넣을 값');

    add('run', '실행 순서', olist(l.steps) +
      (l.tips.length ? '<h3>바꿔 보기</h3><ul class="plain">' + l.tips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : ''), '실행 순서');

    add('review', '결과 검수', '<p>아래 항목을 직접 확인하면 실습이 완료됩니다.</p>' + checklistHtml(l.id, l.checks), '결과 검수');

    add('human', '사람이 마무리할 일',
      '<ul class="plain">' + l.after.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      l.sheets.map(function (s) {
        return '<details class="fold"' + (l.sheets.length === 1 ? ' open' : '') + '><summary>' + esc(s.title) + '</summary><div class="fold-b"><div class="sheet-actions">' +
          copyBtn(s.text, '양식 글 복사', 'g-btn ghost') + dlLink({ path: s.path, name: s.file }, '파일 받기') + '</div><div class="md">' + md(s.text) + '</div></div></details>';
      }).join(''), '사람이 할 일');

    add('prompt', 'Claude 채팅에서 하기 (복사해서 쓰는 지시문)',
      '<p>스튜디오가 열리지 않을 때, 또는 Claude 채팅에서 직접 해 보고 싶을 때 씁니다. 결과는 같은 순서로 나옵니다(파일 받기 단추만 없습니다).</p>' +
      olist(l.bSteps.map(function (t) {
        l.files.forEach(function (f) { if (t.indexOf('<b>' + f.name) < 0) t = t.split(f.name).join('<b>' + f.name + '</b>'); });
        return t;
      })) + attachHtml(l) +
      '<div class="go-studio"><p><b>지시문을 복사한 뒤</b> Claude 새 채팅을 열어 붙여넣습니다.</p><a class="g-btn" href="' + esc(chat) + '" target="_blank" rel="noopener noreferrer">Claude 새 채팅 열기</a></div>' +
      '<div class="prompt-box tall"><span class="box-label">지시문 전체</span>' + copyBtn(l.prompt, '지시문 복사') + '<pre>' + esc(l.prompt) + '</pre></div>', '복사 지시문');

    var prev = D.lessons[l.index - 1], next = D.lessons[l.index + 1];
    var navA = function (x, cls, label) {
      return x ? '<a class="' + cls + '" href="#' + x.id + '"><span>' + label + '</span><strong>' + esc(x.code + ' · ' + x.title) + '</strong></a>'
        : '<a class="' + cls + '" href="#home"><span>' + label + '</span><strong>전체 실습으로</strong></a>';
    };
    $('lessonBody').innerHTML = parts.join('') + '<nav class="lesson-navigation" aria-label="이전 · 다음 실습">' +
      navA(prev, 'lesson-prev', '← 이전') + (next ? navA(next, 'lesson-next', '다음 →') :
        '<a class="lesson-next" href="#' + P.id + '"><span>다음 →</span><strong>' + esc(P.title) + '</strong></a>') + '</nav>';
    $('toc').innerHTML = '<strong>실습 목차</strong>' + toc.map(function (t) {
      return '<a href="#' + t[0] + '" data-jump="' + t[0] + '">' + esc(t[1]) + '</a>';
    }).join('');

    if (l.inquiries) {
      var sel = $('qPick'), show = function () { $('qText').textContent = l.inquiries[+sel.value].q; };
      sel.addEventListener('change', show); show();
    }
    bindChecks(l.id);
  };

  /* 보내기 전 확인: 첨부할 파일 · 양식 */
  var ATT = { '필수': ['must', '꼭 첨부'], '양식': ['form', '양식'], '금지': ['no', '올리지 않음'], '없음': ['none', '첨부 없음'] };
  var attachHtml = function (l) {
    var rows = l.attach.map(function (a) {
      var k = ATT[a.kind];
      return '<div class="att-row att-' + k[0] + '"><span class="att-tag">' + k[1] + '</span><div class="att-b"><strong>' + esc(a.name) + '</strong><p>' + esc(a.note) + '</p></div>' +
        (a.path ? dlLink({ path: a.path, name: a.path.split('/').pop() }, '파일 받기') : '') + '</div>';
    }).join('');
    var must = l.attach.filter(function (a) { return a.kind === '필수'; });
    var form = l.attach.filter(function (a) { return a.kind === '양식'; });
    var asks = [];
    if (must.length) asks.push('<b>파일을 넣었습니까?</b> ' + must.map(function (a) { return '<b>' + esc(a.name) + '</b>'; }).join(', '));
    else asks.push('<b>첨부할 파일은 없습니다.</b> 지시문만 보냅니다.');
    if (form.length) asks.push('<b>양식을 확인했습니까?</b> ' + form.map(function (a) { return '<b>' + esc(a.name) + '</b>'; }).join(', '));
    return '<div class="attach-box"><div class="attach-h">보내기 전 확인 · 첨부할 파일과 양식</div>' + rows +
      '<ul class="attach-ask">' + asks.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul></div>';
  };

  /* ---------- 내 스튜디오 만들기 화면 ---------- */
  var renderGuide = function () {
    store = {}; keySeq = 0;
    $('bcPart').textContent = G.kicker + ' ' + G.partTitle;
    $('bcCode').textContent = '만드는 방법';
    $('lhEyebrow').textContent = G.code + ' · ' + G.time;
    $('lhTitle').textContent = G.title;
    $('lhSum').textContent = G.sum;
    $('lhMeta').innerHTML = '<span class="meta-chip active">실행하려면 먼저</span><span class="meta-chip">결과물 · ' + esc(G.out) + '</span><span class="meta-chip">코드 작성 없음</span>';
    var chat = safeUrl(C.chatUrl), parts = [], toc = [], n = 0;
    var add = function (id, title, body, tocLabel) {
      n++; var no = (n < 10 ? '0' : '') + n;
      parts.push(sec(no, id, title, body)); toc.push([id, tocLabel || title]);
    };
    var code = safeUrl(C.codeUrl);
    add('goal', '만들 것', '<div class="result-card"><strong>' + esc(G.out) + '</strong><p>강사 스튜디오와 같은 화면을 내 계정에 만듭니다. 한 번 만들면 그 링크로 계속 씁니다.</p></div>' +
      '<div class="safety-box sp"><strong>실행하려면 내 계정의 스튜디오가 필요합니다</strong><p>링크로 공유받은 스튜디오는 화면만 보이고 "에이전트 실행"은 만든 사람 계정에서만 됩니다. 아래 순서대로 내 스튜디오를 만들면 그 링크에서 바로 실행할 수 있습니다.</p></div>', '만들 것');
    add('prepare', '파일 받기', '<p><b>index.html</b> 하나만 받으면 됩니다. 나머지 두 파일은 채팅으로 만들 때만 씁니다.</p>' + fileList(G.files, '파일 받기'), '파일 받기');
    add('code', 'Claude Code에서 만들기', olist(G.codeSteps) +
      '<div class="attach-box"><div class="attach-h">보내기 전 확인 · 첨부할 파일</div>' +
      '<div class="att-row att-must"><span class="att-tag">꼭 첨부</span><div class="att-b"><strong>index.html</strong><p>완성된 사이트 파일입니다. 내용을 복사해 붙여넣지 말고 파일로 첨부합니다.</p></div></div>' +
      '<ul class="attach-ask"><li><b>index.html을 첨부했습니까?</b> 입력 칸에 파일 이름 <b>index.html</b>이 보여야 합니다.</li></ul></div>' +
      '<div class="go-studio"><p><b>문장을 복사한 뒤</b> Claude Code를 열어 index.html을 첨부하고 붙여넣습니다.</p><a class="g-btn" href="' + esc(code) + '" target="_blank" rel="noopener noreferrer">Claude Code 열기</a></div>' +
      '<div class="prompt-box"><span class="box-label">Claude Code에 보낼 문장</span>' + copyBtn(G.codePrompt, '문장 복사') + '<pre>' + esc(G.codePrompt) + '</pre></div>', 'Claude Code로 만들기');
    add('use', '만든 사이트 써 보기', olist(G.useSteps) + '<h3>확인</h3>' + checklistHtml(G.id, G.checks), '써 보기');
    add('asks', '막혔을 때 Claude Code에 보낼 문장',
      '<p>만들던 그 화면에서 아래 문장을 복사해 보냅니다.</p><div class="val-list">' + G.codeAsks.map(function (a) {
        return '<div class="val-row"><div class="val-label">' + esc(a[0]) + '</div><div class="val-body"><pre>' + esc(a[1]) + '</pre></div>' + copyBtn(a[1], '복사', 'g-btn ghost') + '</div>';
      }).join('') + '</div>' +
      '<ul class="plain">' + G.keep.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>', '막혔을 때');
    add('where', 'Claude Code와 채팅의 차이',
      '<p>두 곳 모두 같은 사이트가 만들어집니다. <b>Claude Code로 합니다.</b> 올린 파일을 그대로 게시하기 때문에 만드는 도중에 틀어질 일이 적습니다. 채팅 방식은 Claude Code가 안 될 때만 씁니다.</p>' +
      '<div class="g-table sp"><table><thead><tr><th>비교</th><th>Claude Code (권장)</th><th>Claude 채팅</th></tr></thead><tbody>' +
      G.compare.map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<div class="local-note">' + esc(G.compareSource) + '</div>' +
      '<details class="fold"><summary>Claude Code가 안 될 때 · 채팅으로 만들기</summary><div class="fold-b">' + olist(G.makeSteps) +
      '<div class="attach-box"><div class="attach-h">보내기 전 확인 · 첨부할 파일</div>' +
      '<div class="att-row att-must"><span class="att-tag">꼭 첨부</span><div class="att-b"><strong>CLAUDE.md</strong><p>Claude가 따라 할 작업 순서입니다.</p></div></div>' +
      '<div class="att-row att-must"><span class="att-tag">꼭 첨부</span><div class="att-b"><strong>index.html</strong><p>완성된 사이트 파일입니다. 파일로 첨부합니다.</p></div></div>' +
      '<ul class="attach-ask"><li><b>두 파일을 함께 넣었습니까?</b> <b>CLAUDE.md</b>, <b>index.html</b></li></ul></div>' +
      '<div class="go-studio"><p><b>문장을 복사한 뒤</b> Claude 새 채팅을 열어 두 파일을 첨부하고 붙여넣습니다.</p><a class="g-btn" href="' + esc(chat) + '" target="_blank" rel="noopener noreferrer">Claude 새 채팅 열기</a></div>' +
      '<div class="prompt-box"><span class="box-label">Claude 채팅에 보낼 문장</span>' + copyBtn(G.makePrompt, '문장 복사') + '<pre>' + esc(G.makePrompt) + '</pre></div>' +
      '<h3>채팅으로 만든 뒤 보낼 문장</h3><div class="val-list">' + G.asks.map(function (a) {
        return '<div class="val-row"><div class="val-label">' + esc(a[0]) + '</div><div class="val-body"><pre>' + esc(a[1]) + '</pre></div>' + copyBtn(a[1], '복사', 'g-btn ghost') + '</div>';
      }).join('') + '</div>' +
      '<h3>(선택) 내 업무 정보 넣기</h3><p>채팅 방식에서는 CLAUDE.md를 메모장으로 열어 <b>0. 내 업무 정보</b>의 빈칸을 채우고 저장한 뒤 첨부하면 화면 이름과 기관명이 들어갑니다. 비워 둬도 됩니다.</p>' +
      '<div class="g-table sp"><table><thead><tr><th>항목</th><th>어디에 쓰이나</th><th>예</th></tr></thead><tbody>' +
      G.infoRows.map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td></tr>'; }).join('') + '</tbody></table></div></div></details>' +
      '<details class="fold"><summary>데스크톱 앱이나 터미널의 Claude Code로 만들기</summary><div class="fold-b">' + olist(G.folderSteps) + '</div></details>', 'Code와 채팅의 차이');
    add('errors', '오류가 나는 대표 사유', '<p>화면에 나온 문구로 찾습니다. 붉은 상자가 나오면 그 안의 안내를 먼저 따릅니다.</p>' + errorsHtml(), '오류 사유');
    $('lessonBody').innerHTML = parts.join('') + '<nav class="lesson-navigation" aria-label="이전 · 다음">' +
      '<a class="lesson-prev" href="#s8"><span>← 이전</span><strong>실습 8 · ' + esc(byId.s8.title) + '</strong></a>' +
      '<a class="lesson-next" href="#home"><span>다음 →</span><strong>전체 실습으로</strong></a></nav>';
    $('toc').innerHTML = '<strong>목차</strong>' + toc.map(function (t) { return '<a href="#' + t[0] + '" data-jump="' + t[0] + '">' + esc(t[1]) + '</a>'; }).join('');
    bindChecks(G.id);
  };

  /* ---------- 프로젝트로 진행하기 화면 ---------- */
  var renderProject = function () {
    store = {}; keySeq = 0;
    $('bcPart').textContent = P.kicker + ' ' + P.partTitle;
    $('bcCode').textContent = '프로젝트';
    $('lhEyebrow').textContent = P.code + ' · ' + P.time;
    $('lhTitle').textContent = P.title;
    $('lhSum').textContent = P.sum;
    $('lhMeta').innerHTML = '<span class="meta-chip active">반복 업무에 맞는 방식</span><span class="meta-chip">실습 · 데이터 에이전트</span><span class="meta-chip">결과물 · 한 장 보고서(워드)</span>';
    var parts = [], toc = [], n = 0;
    var add = function (id, title, body, tocLabel) {
      n++; var no = (n < 10 ? '0' : '') + n;
      parts.push(sec(no, id, title, body)); toc.push([id, tocLabel || title]);
    };
    var tbl = function (head, rows) {
      return '<div class="g-table sp"><table><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    };
    var stepGrid = function (rows) {
      return '<div class="step-grid">' + rows.map(function (r) {
        return '<div class="start-item"><b>' + esc(r[0]) + ' · ' + esc(r[1]) + '</b><strong>' + esc(r[2]) + '</strong><p>' + esc(r[3]) + '</p></div>';
      }).join('') + '</div>';
    };
    var ul = function (items) { return '<ul class="plain">' + items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>'; };
    var copyRow = function (label, text) {
      return '<div class="val-row"><div class="val-label">' + esc(label) + '</div><div class="val-body"><pre>' + esc(text) + '</pre></div>' + copyBtn(text, '복사', 'g-btn ghost') + '</div>';
    };

    add('who', '어떤 사람에게 맞는 방식인가',
      '<p>실습실에는 세 가지 진행 방식이 있습니다. <b>프로젝트는 같은 일을 반복하는 담당자</b>에게 맞습니다.</p>' +
      tbl(['방식', '이런 사람에게 맞습니다', '이럴 때는 맞지 않습니다'], P.who) +
      '<div class="safety-box sp"><strong>권하는 순서</strong><p>' + esc(P.whoNote) + '</p></div>' +
      '<div class="go-studio"><p><b>직접 해 보기</b> — "데이터 에이전트" 프로젝트를 만들어 가상 데이터를 분석하고 한 장 보고서까지 받는 실습이 있습니다.</p><a class="g-btn" href="#prepare" data-jump="lab">아래 실습으로 가기</a></div>', '누구에게 맞나');
    add('rule', '프로젝트는 각자 따로 움직입니다',
      '<p>프로젝트마다 지침 · 지식 · 메모리가 따로 있어서, 한 프로젝트에서 다른 프로젝트의 자료를 읽을 수 없습니다.</p>' +
      '<div class="two-col"><div class="result-card"><strong>안 되는 것</strong>' + ul(P.cannot) + '</div><div class="result-card"><strong>되는 것</strong>' + ul(P.can) + '</div></div>' +
      '<div class="safety-box sp"><strong>' + esc(P.point) + '</strong></div>' +
      '<h3>프로젝트에서 일이 흘러가는 순서</h3><p>' + esc(P.stepsLead) + '</p>' + stepGrid(P.steps) +
      '<div class="local-note">' + esc(P.stepsNote) + '</div>', '알아 둘 것');
    var chat = safeUrl(C.chatUrl);
    add('lab', '실습 · 데이터 에이전트 프로젝트 만들기',
      '<div class="result-card"><strong>' + esc(L.out) + '</strong><p>프로젝트에 지침을 한 번 넣어 두고, 대화에서는 파일을 올리고 짧은 말만 보냅니다. 분석이 끝나면 같은 대화에서 스킬을 불러 보고서 파일을 받습니다.</p></div>', '실습 시작');
    add('prepare', '실습 준비', olist(L.prepSteps) + fileList(L.files, '파일 받기'), '준비');
    add('make', '실습 1 · 프로젝트 만들기', olist(L.makeSteps) +
      '<div class="val-list">' + copyRow('프로젝트 이름', L.name) + copyRow('설명 (선택)', L.desc) + '</div>' +
      '<div class="prompt-box tall"><span class="box-label">지침 전체 · 그대로 붙여넣기</span>' + copyBtn(L.guide, '지침 복사') + '<pre>' + esc(L.guide) + '</pre></div>' +
      '<div class="go-studio"><p><b>지침을 복사한 뒤</b> claude.ai를 열어 프로젝트를 만듭니다.</p><a class="g-btn" href="' + esc(chat) + '" target="_blank" rel="noopener noreferrer">claude.ai 열기</a></div>', '프로젝트 만들기');
    add('run', '실습 2 · 데이터 분석하기', olist(L.runSteps) + attachHtml({ attach: L.attach }) +
      '<div class="val-list">' + copyRow('보낼 말 1', L.say1) + '</div>', '분석하기');
    add('funnel', '실습 3 · 기준 인원 확정하기',
      '<p>Claude가 낸 <b>기준 인원 확인표</b>를 보고, 비율을 몇 명 기준으로 계산할지 사람이 정합니다. 이 실습에서 사람이 판단하는 자리입니다.</p>' +
      '<div class="safety-box sp"><strong>기준 인원이란</strong><p>' + esc(L.funnelWhy) + '</p></div>' +
      '<div class="funnel">' + L.funnelFlow.map(function (f, i) {
        return (i ? '<span class="funnel-arrow" aria-hidden="true">→</span>' : '') +
          '<div class="funnel-step' + (i === L.funnelFlow.length - 1 ? ' is-result' : '') + '"><b>' + esc(f[0]) + '</b><strong>' + esc(f[1]) + '</strong><p>' + esc(f[2]) + '</p></div>';
      }).join('') + '</div>' +
      '<h3>표에서 볼 것</h3>' + ul(L.funnelLook) +
      '<div class="val-list">' + copyRow('보낼 말 2', L.say2) + '</div>', '기준 인원 확정');
    add('report', '실습 4 · 한 장 보고서 받기', olist(L.reportSteps) +
      '<div class="val-list">' + copyRow('보낼 말 3', L.say3) + '</div>' +
      '<h3>맞춰 볼 값</h3>' + tbl(['항목', '값', '기준'], L.answers) + '<div class="local-note">' + esc(L.answersNote) + '</div>', '보고서 받기');
    add('skill', '보고서 규칙을 스킬로 만들기',
      '<p>보고서 프로젝트에만 있는 규칙(문체, 독자, 기관 양식)을 스킬로 바꿔 두면 어느 프로젝트에서나 같은 방식으로 부를 수 있습니다.</p>' + stepGrid(P.skillSteps) +
      '<div class="val-list">' + copyRow('재료를 올리고 보낼 말', P.skillAsk) + copyRow('스킬 설명 예시 (언제 부를지를 정하는 한 줄)', P.skillDesc) + '</div>' +
      '<p class="sp">' + esc(P.skillNote) + '</p>', '스킬로 만들기');
    add('review', '결과 검수', '<p>아래 항목을 직접 확인하면 실습이 완료됩니다.</p>' + checklistHtml(P.id, L.checks) +
      '<h3>사람이 마무리할 일</h3>' + ul(L.after) +
      '<div class="go-studio"><p><b>강사 슬라이드</b>에서 프로젝트와 스킬 사용법을 네 장으로 볼 수 있습니다.</p><a class="g-btn ghost" href="' + esc(safeUrl(C.projectDeckUrl)) + '" target="_blank" rel="noopener noreferrer">슬라이드 보기</a></div>', '결과 검수');
    add('errors', '안 될 때', tbl(['화면에 나온 것', '왜 그런가', '할 일'], L.errors), '안 될 때');
    $('lessonBody').innerHTML = parts.join('') + '<nav class="lesson-navigation" aria-label="이전 · 다음">' +
      '<a class="lesson-prev" href="#s8"><span>← 이전</span><strong>실습 8 · ' + esc(byId.s8.title) + '</strong></a>' +
      '<a class="lesson-next" href="#skills"><span>다음 →</span><strong>내 Claude에 스킬 등록하기</strong></a></nav>';
    $('toc').innerHTML = '<strong>목차</strong>' + toc.map(function (t) { return '<a href="#' + t[0] + '" data-jump="' + t[0] + '">' + esc(t[1]) + '</a>'; }).join('');
    bindChecks(P.id);
  };

  /* ---------- Claude 기본 이해하기 화면 ---------- */
  var renderBasics = function () {
    store = {}; keySeq = 0;
    $('bcPart').textContent = B.partTitle;
    $('bcCode').textContent = '기본 개념';
    $('lhEyebrow').textContent = B.code + ' · ' + B.time;
    $('lhTitle').textContent = B.title;
    $('lhSum').textContent = B.sum;
    $('lhMeta').innerHTML = '<span class="meta-chip active">실습 전에 읽기</span><span class="meta-chip">프로젝트와 스킬</span><span class="meta-chip">Quality = 인간의 몫</span>';
    var parts = [], toc = [], n = 0;
    var add = function (id, title, body, tocLabel) {
      n++; var no = (n < 10 ? '0' : '') + n;
      parts.push(sec(no, id, title, body)); toc.push([id, tocLabel || title]);
    };
    var fig = function (file, alt, cap) {
      return '<figure class="fig"><img src="img/basics/' + file + '" alt="' + esc(alt) + '"><figcaption>' + esc(cap) + '</figcaption></figure>';
    };
    var tbl = function (head, rows) {
      return '<div class="g-table sp"><table><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    };
    var cards = function (rows, cols) {
      return '<div class="step-grid cols-' + cols + '">' + rows.map(function (r) {
        return '<div class="start-item"><strong>' + esc(r[0]) + '</strong><p>' + esc(r[1]) + '</p></div>';
      }).join('') + '</div>';
    };

    add('ai', 'AI는 무엇일까요',
      '<p>AI라는 큰 범위 안에 머신러닝, 딥러닝, LLM이 차례로 들어 있고, ChatGPT나 Claude 같은 생성형 AI는 그 가장 안쪽에 있습니다.</p>' +
      fig('ai-layers.jpg', 'AI, Machine Learning, Deep Learning, LLM, 생성형 AI의 포함 관계를 겹친 원으로 나타낸 그림', '출처: 생성형 AI가 생성한 이미지') +
      tbl(['범위', '뜻'], B.layers), 'AI란');
    add('llm', 'LLM이 무엇일까',
      '<p>질문을 받으면 관련 정보를 찾아 맥락과 함께 모델에 넘기고, 모델이 답변을 만듭니다.</p>' +
      '<ol class="flow-list">' + B.llmFlow.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol>' +
      '<div class="local-note">' + esc(B.llmSource) + '</div>', 'LLM이란');
    add('terms', '핵심 용어', tbl(['용어', '뜻'], B.terms), '핵심 용어');
    add('orchestra', '우리는 오케스트레이터로서 사용해야 합니다',
      fig('orchestrator.jpg', '가운데 오케스트레이터인 사람이 Claude, ChatGPT, GitHub Copilot, Gamma, Perplexity, Midjourney에 일을 나누는 그림', '출처: 생성형 AI 이미지') +
      '<div class="safety-box sp"><strong>사람이 가운데에 있습니다</strong><p>' + esc(B.orchestra) + '</p></div>', '오케스트레이터');
    add('token', '토큰이란', '<p><b>내가 작성한 글자는 몇 개의 토큰이 소비될까?</b></p><p>' + esc(B.token) + '</p>', '토큰');
    add('ps', 'Claude Project & Skills',
      fig('projects-skills.jpg', 'Projects는 작업용 방, Skills는 작업 매뉴얼이며 둘을 함께 사용한다는 그림', '출처: 생성형 AI 이미지') +
      cards(B.ps, 3) +
      '<div class="go-studio"><p><b>프로젝트로 이어 쓰는 방법</b>은 따로 정리해 두었습니다.</p><a class="g-btn ghost" href="#project">프로젝트로 진행하기</a></div>', '프로젝트와 스킬');
    add('skill', '우리도 바로 활용할 수 있는 Skill 기능',
      '<p>' + esc(B.skillGa) + '</p>' +
      fig('skill-equation.jpg', 'Claude AI에 특정 양식과 규칙을 더하면 전용 비서인 Claude Skill이 된다는 그림과 일반 대화, 스킬 활용 비교', '출처: claude.ai, 생성형 AI 이미지') +
      tbl(['방식', '차이'], B.skillVs), 'Skill 기능');
    add('make', 'Claude Skills로 보고서 작성하기', olist(B.skillSteps) +
      '<h3>스킬을 만드는 세 가지 방법</h3>' + tbl(['방법', '언제 쓰나'], B.skillWays) +
      '<div class="go-studio"><p><b>스킬을 더 자세히</b> 보려면 "Claude 스킬이란?"으로 갑니다. 스킬 파일은 스킬 등록에서 받습니다.</p><a class="g-btn" href="#' + SK.id + '">Claude 스킬이란?</a><a class="g-btn ghost" href="#skills">스킬 등록</a></div>', '스킬로 보고서');
    add('desc', 'Claude Skills description',
      '<p>' + esc(B.desc) + '</p>' +
      '<div class="prompt-box"><span class="box-label">설명 예시</span>' + copyBtn(B.descExample, '복사') + '<pre>' + esc(B.descExample) + '</pre></div>', 'description');
    add('quality', 'Quality = 인간의 몫',
      '<p>AI가 만든 결과가 쓸 만한지는 아래 여섯 가지로 사람이 봅니다.</p>' +
      '<div class="step-grid cols-3">' + B.quality.map(function (q) { return '<div class="start-item"><b>' + esc(q[0]) + '</b><strong>' + esc(q[1]) + '</strong></div>'; }).join('') + '</div>' +
      fig('quality.jpg', 'AI는 90퍼센트를, 나머지 10퍼센트는 우리가 완성한다는 그림. 제목 줄 바꿈, 페이지 수 조정, 촘촘한 텍스트를 사람이 손본다', '출처: 생성형 AI 이미지') +
      '<h3>사람이 직접 손보는 것</h3><ul class="plain">' + B.qualityHuman.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>', 'Quality');
    add('custom', '스킬은 만들어도 되고 가져다 써도 됩니다',
      '<div class="result-card"><strong>' + esc(B.custom) + '</strong><p>' + esc(B.customNote) + '</p></div>', '맞춤형 스킬');
    add('review', '확인', '<p>아래 항목을 스스로 확인한 뒤 실습으로 넘어갑니다.</p>' + checklistHtml(B.id, B.checks), '확인');
    $('lessonBody').innerHTML = parts.join('') + '<nav class="lesson-navigation" aria-label="이전 · 다음">' +
      '<a class="lesson-prev" href="#home"><span>← 이전</span><strong>전체 실습으로</strong></a>' +
      '<a class="lesson-next" href="#' + SK.id + '"><span>다음 →</span><strong>' + esc(SK.title) + '</strong></a></nav>';
    $('toc').innerHTML = '<strong>목차</strong>' + toc.map(function (t) { return '<a href="#' + t[0] + '" data-jump="' + t[0] + '">' + esc(t[1]) + '</a>'; }).join('');
    bindChecks(B.id);
  };

  /* ---------- API key란? 화면 ---------- */
  /* 그림: 사람은 로그인으로, 프로그램은 API key로 Claude를 부른다 */
  var apiKeySvg = function () {
    var box = function (x, y, w, h, t1, t2, fill) {
      return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="14" fill="' + fill + '" stroke="#111113" stroke-opacity=".14"/>' +
        '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 - (t2 ? 6 : -5)) + '" text-anchor="middle" font-size="17" font-weight="700" fill="#111113">' + t1 + '</text>' +
        (t2 ? '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 18) + '" text-anchor="middle" font-size="13" fill="#6e6e76">' + t2 + '</text>' : '');
    };
    var arrow = function (x1, x2, y, label, color) {
      return '<line x1="' + x1 + '" y1="' + y + '" x2="' + (x2 - 9) + '" y2="' + y + '" stroke="' + color + '" stroke-width="2"/>' +
        '<path d="M' + (x2 - 10) + ' ' + (y - 6) + ' L' + x2 + ' ' + y + ' L' + (x2 - 10) + ' ' + (y + 6) + ' Z" fill="' + color + '"/>' +
        '<text x="' + ((x1 + x2) / 2) + '" y="' + (y - 12) + '" text-anchor="middle" font-size="13.5" font-weight="700" fill="' + color + '">' + label + '</text>';
    };
    return '<figure class="fig"><svg class="diagram" viewBox="0 0 760 300" role="img" aria-label="사람은 claude.ai에 로그인해서 Claude를 쓰고, 프로그램은 요청에 API key를 함께 보내 Claude를 부른다는 그림" font-family="inherit">' +
      '<rect x="0" y="0" width="760" height="300" rx="16" fill="#ffffff"/>' +
      '<text x="24" y="34" font-size="12.5" font-weight="600" fill="#6e6e76" letter-spacing="1">이 과정에서 쓰는 길</text>' +
      box(24, 48, 190, 78, '사람', '수강생 · 담당자', '#f3f3f4') +
      arrow(214, 330, 87, '로그인', '#111113') +
      box(330, 48, 190, 78, 'claude.ai', '채팅 · 프로젝트 · 스튜디오', '#f3f3f4') +
      '<line x1="520" y1="87" x2="571" y2="87" stroke="#111113" stroke-width="2"/>' +
      '<text x="24" y="176" font-size="12.5" font-weight="600" fill="#0b64f4" letter-spacing="1">API key를 쓰는 길</text>' +
      box(24, 190, 190, 78, '프로그램', '내 코드 · 자동화 도구', '#eef4ff') +
      arrow(214, 330, 229, '요청 + API key', '#0b64f4') +
      box(330, 190, 190, 78, 'Claude API', '키를 확인하고 받음', '#eef4ff') +
      '<line x1="520" y1="229" x2="571" y2="229" stroke="#0b64f4" stroke-width="2"/>' +
      '<line x1="571" y1="87" x2="571" y2="229" stroke="#111113" stroke-opacity=".3" stroke-width="2"/>' +
      '<line x1="571" y1="158" x2="601" y2="158" stroke="#111113" stroke-opacity=".3" stroke-width="2"/>' +
      box(602, 118, 134, 80, 'Claude', '답변을 만듦', '#111113').replace('fill="#111113">Claude<', 'fill="#ffffff">Claude<').replace('fill="#6e6e76">답변을', 'fill="#c9c9cf">답변을') +
      '</svg><figcaption>사람은 로그인으로, 프로그램은 API key로 같은 Claude를 부릅니다.</figcaption></figure>';
  };
  var renderApiKey = function () {
    store = {}; keySeq = 0;
    $('bcPart').textContent = B.partTitle;
    $('bcCode').textContent = 'API key';
    $('lhEyebrow').textContent = K.code + ' · ' + K.time;
    $('lhTitle').textContent = K.title;
    $('lhSum').textContent = K.sum;
    $('lhMeta').innerHTML = '<span class="meta-chip active">이 과정에서는 필요 없음</span><span class="meta-chip">프로그램이 쓰는 비밀 문자열</span><span class="meta-chip">요금은 쓴 만큼 따로</span>';
    var parts = [], toc = [], n = 0;
    var add = function (id, title, body, tocLabel) {
      n++; var no = (n < 10 ? '0' : '') + n;
      parts.push(sec(no, id, title, body)); toc.push([id, tocLabel || title]);
    };
    var ul = function (items) { return '<ul class="plain">' + items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>'; };
    add('what', 'API key란', '<p>' + esc(K.what) + '</p>' + apiKeySvg() + ul(K.whatPoints), 'API key란');
    add('compare', '로그인과 API key의 차이',
      '<div class="g-table sp"><table><thead><tr><th>구분</th><th>로그인해서 쓰기</th><th>API key로 쓰기</th></tr></thead><tbody>' +
      K.compare.map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td></tr>'; }).join('') + '</tbody></table></div>', '차이');
    add('when', '언제 사용하나',
      '<div class="step-grid cols-3">' + K.when.map(function (w, i) {
        return '<div class="start-item"><b>경우 ' + (i + 1) + '</b><strong>' + esc(w[0]) + '</strong><p>' + esc(w[1]) + '</p></div>';
      }).join('') + '</div>' +
      '<div class="safety-box sp"><strong>이 과정에서는 필요 없습니다</strong><p>' + esc(K.notNeeded) + '</p></div>', '언제 쓰나');
    add('issue', '발급 방법',
      '<p>필요해졌을 때 아래 네 단계로 만듭니다. Claude Platform 공식 문서의 순서입니다.</p>' +
      '<ol class="flow-list wide">' + K.issueSteps.map(function (t) { return '<li><div><strong>' + esc(t[0]) + '</strong><p>' + esc(t[1]) + '</p></div></li>'; }).join('') + '</ol>' +
      '<ul class="plain">' + K.issueNotes.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>', '발급 방법');
    add('care', '다룰 때 지킬 것', ul(K.care) + '<div class="local-note">' + esc(K.source) + '</div>', '지킬 것');
    add('review', '확인', '<p>아래 항목을 스스로 확인합니다.</p>' + checklistHtml(K.id, K.checks), '확인');
    $('lessonBody').innerHTML = parts.join('') + '<nav class="lesson-navigation" aria-label="이전 · 다음">' +
      '<a class="lesson-prev" href="#' + SK.id + '"><span>← 이전</span><strong>' + esc(SK.title) + '</strong></a>' +
      '<a class="lesson-next" href="#' + T.id + '"><span>다음 →</span><strong>' + esc(T.title) + '</strong></a></nav>';
    $('toc').innerHTML = '<strong>목차</strong>' + toc.map(function (t) { return '<a href="#' + t[0] + '" data-jump="' + t[0] + '">' + esc(t[1]) + '</a>'; }).join('');
    bindChecks(K.id);
  };

  /* ---------- 고민해봅시다! (내 직무에 AI 적용하기) ---------- */
  var renderThink = function () {
    store = {}; keySeq = 0;
    $('bcPart').textContent = B.partTitle;
    $('bcCode').textContent = '내 직무에 적용';
    $('lhEyebrow').textContent = T.code + ' · ' + T.time;
    $('lhTitle').textContent = T.title;
    $('lhSum').textContent = T.sum;
    $('lhMeta').innerHTML = '<span class="meta-chip active">내 직무에 적용하기</span><span class="meta-chip">맡기기 좋은 일 네 가지</span><span class="meta-chip">직무별 예시</span><span class="meta-chip">내 업무 적용 질문지</span>';
    var parts = [], toc = [], n = 0;
    var add = function (id, title, body, tocLabel) {
      n++; var no = (n < 10 ? '0' : '') + n;
      parts.push(sec(no, id, title, body)); toc.push([id, tocLabel || title]);
    };
    add('types', 'AI에 맡기기 좋은 일 네 가지',
      '<p>' + esc(T.intro) + '</p><div class="rule-grid sp">' + T.types.map(function (r) {
        return '<div class="rule-card"><b>' + esc(r[0]) + '</b><strong>' + esc(r[1]) + '</strong><p>' + esc(r[2]) + '</p></div>';
      }).join('') + '</div>', '네 가지 유형');
    add('jobs', '직무별 예시',
      '<p>내 직무와 가까운 것을 펼쳐 봅니다. 유형 칸의 숫자는 위 네 가지 유형의 번호입니다.</p>' +
      T.jobs.map(function (j, i) {
        return '<details class="fold think-fold"' + (i === 0 ? ' open' : '') + '><summary>' + esc(j.name) + '</summary><div class="g-table think-table"><table>' +
          '<thead><tr><th>업무</th><th>이렇게 시켜 봅니다</th><th>유형</th><th>함께 해 볼 실습</th></tr></thead><tbody>' +
          j.rows.map(function (r) {
            var l = byId[r[3]];
            return '<tr><td>' + esc(r[0]) + '</td><td>"' + esc(r[1]) + '"</td><td>' +
              r[2].map(function (t) { return '<span class="think-tag">' + esc(t) + '</span>'; }).join(' ') + '</td><td>' +
              (l ? '<a href="#' + l.id + '">' + esc(l.code + ' · ' + l.agent) + '</a>' : '') + '</td></tr>';
          }).join('') + '</tbody></table></div></details>';
      }).join(''), '직무별 예시');
    add('safe', '넣어도 되는 자료인지 먼저 확인합니다',
      '<div class="safety-box sp think-safe"><div class="think-split"><p><b>바로 써 볼 수 있는 자료</b><br>' + esc(T.safeOk) + '</p>' +
      '<p><b>기관 지침을 먼저 확인할 자료</b><br>' + esc(T.safeAsk) + '</p></div><p class="think-check">' + esc(T.safeCheck) + '</p></div>' +
      '<div class="local-note">' + esc(T.source) + '</div>', '자료 확인');
    add('plan', '나는 AI를 어떻게 쓸 것인가',
      '<p>아래 세 단계로 정리합니다. 질문지를 복사해 Claude 채팅에 붙여 넣고, 대괄호와 빈 줄을 내 내용으로 채웁니다.</p>' +
      '<div class="step-grid cols-3">' + T.steps.map(function (s, i) {
        return '<div class="start-item"><b>' + (i + 1) + '단계</b><strong>' + esc(s[0]) + '</strong><p>' + esc(s[1]) + '</p></div>';
      }).join('') + '</div>' +
      '<div class="prompt-box"><span class="box-label">내 업무 적용 질문지 · Claude 채팅에 붙여 넣기</span>' + copyBtn(T.prompt, '질문지 복사') + '<pre>' + esc(T.prompt) + '</pre></div>' +
      '<details class="fold"><summary>' + esc(T.exampleTitle) + '</summary><div class="sample-note think-sample"><pre>' + esc(T.example) + '</pre></div></details>' +
      '<div class="go-studio"><p><b>정리한 표는 실습 8에서 내 업무용 에이전트로 만듭니다.</b> 1순위로 고른 업무를 실습 8의 설계 틀에 넣으면 됩니다.</p>' +
      '<a class="g-btn" href="#s8">' + esc(byId.s8.code + ' · ' + byId.s8.title) + '</a></div>', '3단계로 정리');
    add('review', '확인', '<p>아래 항목을 스스로 확인합니다.</p>' + checklistHtml(T.id, T.checks), '확인');
    $('lessonBody').innerHTML = parts.join('') + '<nav class="lesson-navigation" aria-label="이전 · 다음">' +
      '<a class="lesson-prev" href="#' + K.id + '"><span>← 이전</span><strong>' + esc(K.title) + '</strong></a>' +
      '<a class="lesson-next" href="#' + G.id + '"><span>다음 →</span><strong>' + esc(G.title) + '</strong></a></nav>';
    $('toc').innerHTML = '<strong>목차</strong>' + toc.map(function (t) { return '<a href="#' + t[0] + '" data-jump="' + t[0] + '">' + esc(t[1]) + '</a>'; }).join('');
    bindChecks(T.id);
  };

  /* ---------- Claude 스킬이란? 화면 ---------- */
  /* 그림: 화면에서의 위치와 파일로 본 스킬의 모양 */
  var skillWhereSvg = function () {
    var chip = function (x, label, on) {
      return '<rect x="' + x + '" y="62" width="128" height="44" rx="10" fill="' + (on ? '#111113' : '#f3f3f4') + '" stroke="#111113" stroke-opacity=".14"/>' +
        '<text x="' + (x + 64) + '" y="90" text-anchor="middle" font-size="15" font-weight="700" fill="' + (on ? '#ffffff' : '#111113') + '">' + label + '</text>';
    };
    var arr = function (x) { return '<path d="M' + x + ' 84 L' + (x + 14) + ' 84 M' + (x + 8) + ' 78 L' + (x + 14) + ' 84 L' + (x + 8) + ' 90" stroke="#6e6e76" stroke-width="2" fill="none"/>'; };
    var row = function (y, indent, icon, name, note, strong) {
      return '<text x="' + (54 + indent) + '" y="' + y + '" font-size="15" font-weight="' + (strong ? 700 : 600) + '" fill="#111113">' + icon + ' ' + name + '</text>' +
        '<text x="420" y="' + y + '" font-size="13.5" fill="#6e6e76">' + note + '</text>';
    };
    return '<figure class="fig"><svg class="diagram" viewBox="0 0 760 350" role="img" aria-label="스킬은 claude.ai의 설정, 기능, 스킬 화면에 있고, 파일로 보면 스킬 이름의 폴더 안에 SKILL.md와 양식 파일이 들어 있다는 그림" font-family="inherit">' +
      '<rect x="0" y="0" width="760" height="350" rx="16" fill="#ffffff"/>' +
      '<text x="24" y="40" font-size="12.5" font-weight="600" fill="#6e6e76" letter-spacing="1">화면에서 찾기</text>' +
      chip(24, 'claude.ai', false) + arr(158) + chip(178, '설정', false) + arr(312) + chip(332, '기능', false) + arr(466) + chip(486, '스킬', true) +
      '<text x="630" y="82" font-size="13" fill="#6e6e76">+ 를 눌러</text><text x="630" y="100" font-size="13" fill="#6e6e76">새로 추가</text>' +
      '<line x1="24" y1="140" x2="736" y2="140" stroke="#111113" stroke-opacity=".08"/>' +
      '<text x="24" y="178" font-size="12.5" font-weight="600" fill="#0b64f4" letter-spacing="1">파일로 보면 (zip 안의 모양)</text>' +
      '<rect x="24" y="194" width="712" height="134" rx="12" fill="#eef4ff" stroke="#0b64f4" stroke-opacity=".25"/>' +
      row(226, 0, '📁', 'one-page-report/', '스킬 이름과 같은 폴더', true).replace('📁 ', '') +
      row(262, 26, '·', 'SKILL.md', '이름 · 설명 · 지침이 적힌 글 파일', true) +
      row(298, 26, '·', 'assets/한장보고서_양식.hwpx', '함께 쓰는 양식 파일 (있을 때만)', false) +
      '</svg><figcaption>화면에서는 설정 → 기능 → 스킬에서 관리하고, 파일로는 폴더 하나(SKILL.md + 양식)를 zip으로 묶어 주고받습니다.</figcaption></figure>';
  };
  var renderSkillIntro = function () {
    store = {}; keySeq = 0;
    $('bcPart').textContent = B.partTitle;
    $('bcCode').textContent = '스킬';
    $('lhEyebrow').textContent = SK.code + ' · ' + SK.time;
    $('lhTitle').textContent = SK.title;
    $('lhSum').textContent = SK.sum;
    $('lhMeta').innerHTML = '<span class="meta-chip active">작업 매뉴얼</span><span class="meta-chip">어느 대화에서나 사용</span><span class="meta-chip">만드는 방법 3가지</span>';
    var chat = safeUrl(C.chatUrl), parts = [], toc = [], n = 0;
    var add = function (id, title, body, tocLabel) {
      n++; var no = (n < 10 ? '0' : '') + n;
      parts.push(sec(no, id, title, body)); toc.push([id, tocLabel || title]);
    };
    var tbl = function (head, rows) {
      return '<div class="g-table sp"><table><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    };
    var cards = function (rows, cols, label) {
      return '<div class="step-grid cols-' + cols + '">' + rows.map(function (r, i) {
        return '<div class="start-item">' + (label ? '<b>' + label + ' ' + (i + 1) + '</b>' : '') + '<strong>' + esc(r[0]) + '</strong><p>' + esc(r[1]) + '</p></div>';
      }).join('') + '</div>';
    };
    add('what', '스킬이란', '<p>' + esc(SK.what) + '</p>' +
      '<figure class="fig"><img src="img/basics/skill-equation.jpg" alt="Claude AI에 특정 양식과 규칙을 더하면 전용 비서인 Claude Skill이 된다는 그림과 일반 대화, 스킬 활용 비교"><figcaption>출처: claude.ai, 생성형 AI 이미지 (강의 슬라이드)</figcaption></figure>' +
      '<h3>스킬은 세 부분으로 되어 있습니다</h3>' + cards(SK.parts, 3, ''), '스킬이란');
    add('when', '언제 사용하나', cards(SK.when, 2, '경우') +
      '<h3>채팅 · 프로젝트 · 스킬 고르기</h3>' + tbl(['방식', '무엇을 담나', '이럴 때 씁니다'], SK.compare), '언제 쓰나');
    add('where', '스킬의 위치', skillWhereSvg() + '<ul class="plain">' + SK.where.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>', '스킬의 위치');
    add('make', '스킬을 만드는 방법', olist(SK.makeSteps), '만드는 방법');
    add('ways', '스킬을 만드는 세 가지 방법',
      '<div class="way-list">' + SK.ways.map(function (w, i) {
        return '<div class="way-card"><div class="way-head"><span class="way-no">' + (i + 1) + '</span><div><strong>' + esc(w.name) + '</strong><em>' + esc(w.tag) + '</em></div></div>' +
          '<p class="way-who"><b>이럴 때</b> ' + esc(w.who) + '</p><p>' + esc(w.how) + '</p>' +
          (w.copy ? '<div class="prompt-box' + (w.copy.length > 300 ? ' tall' : '') + '"><span class="box-label">' + esc(w.copyLabel) + '</span>' + copyBtn(w.copy, '복사') + '<pre>' + esc(w.copy) + '</pre></div>' :
            '<div class="go-studio"><p><b>이 실습실의 스킬 파일</b>(실습 에이전트 7종, 보고서 3종)을 받아 바로 올릴 수 있습니다.</p><a class="g-btn" href="#skills">스킬 파일 받기</a></div>') +
          '</div>';
      }).join('') + '</div>' +
      '<div class="safety-box sp"><strong>남이 만든 스킬을 올릴 때</strong><p>' + esc(SK.careful) + '</p></div>' +
      '<div class="local-note">' + esc(SK.source) + '</div>', '세 가지 방법');
    add('review', '확인', '<p>아래 항목을 스스로 확인합니다.</p>' + checklistHtml(SK.id, SK.checks) +
      '<div class="go-studio"><p><b>스킬을 프로젝트와 함께</b> 쓰는 실습은 "프로젝트로 진행"에 있습니다.</p><a class="g-btn ghost" href="#project">프로젝트로 진행</a></div>', '확인');
    $('lessonBody').innerHTML = parts.join('') + '<nav class="lesson-navigation" aria-label="이전 · 다음">' +
      '<a class="lesson-prev" href="#' + B.id + '"><span>← 이전</span><strong>' + esc(B.title) + '</strong></a>' +
      '<a class="lesson-next" href="#' + K.id + '"><span>다음 →</span><strong>' + esc(K.title) + '</strong></a></nav>';
    $('toc').innerHTML = '<strong>목차</strong>' + toc.map(function (t) { return '<a href="#' + t[0] + '" data-jump="' + t[0] + '">' + esc(t[1]) + '</a>'; }).join('');
    bindChecks(SK.id);
  };

  /* 실습 화면 안의 목차는 주소(#)를 바꾸지 않고 그 자리로만 옮긴다 */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-jump]');
    if (!a) return;
    e.preventDefault();
    var el = $(a.getAttribute('data-jump'));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* 바로가기 메뉴: 항목을 누르거나 바깥을 누르면 닫는다 */
  document.addEventListener('click', function (e) {
    var m = $('quickMenu');
    if (!m || !m.open) return;
    if (e.target.closest('#quickPanel a') || !e.target.closest('#quickMenu')) m.open = false;
  });
  document.addEventListener('keydown', function (e) { var m = $('quickMenu'); if (e.key === 'Escape' && m && m.open) m.open = false; });

  /* ---------- 화면 전환 ---------- */
  var shown = null;
  var route = function () {
    var h = (location.hash || '').slice(1);
    var l = Object.prototype.hasOwnProperty.call(byId, h) ? byId[h] : (h === G.id ? G : h === P.id ? P : h === B.id ? B : h === K.id ? K : h === T.id ? T : h === SK.id ? SK : h === L.id ? P : null);
    $('viewHome').hidden = !!l;
    $('viewLesson').hidden = !l;
    if (l) {
      if (shown !== l.id) { if (l === G) renderGuide(); else if (l === P) renderProject(); else if (l === B) renderBasics(); else if (l === K) renderApiKey(); else if (l === T) renderThink(); else if (l === SK) renderSkillIntro(); else renderLesson(l); shown = l.id; }
      var labEl = h === L.id ? $('lab') : null;
      if (labEl) labEl.scrollIntoView({ block: 'start' }); else window.scrollTo(0, 0);
      document.title = (l === G || l === P || l === B || l === K || l === T || l === SK ? l.title : l.code + ' ' + l.title) + ' | 업무 에이전트 실습실';
    } else {
      shown = null;
      updateProgress();
      document.title = '업무 에이전트 실습실 | 커리어캐쳐';
      var t = /^[a-z]+$/.test(h) ? $('sec-' + h) : null;
      if (t) t.scrollIntoView({ block: 'start' }); else window.scrollTo(0, 0);
    }
  };
  renderHome();
  window.addEventListener('hashchange', route);
  route();
})();
