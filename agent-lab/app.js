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

  /* ---------- 시작 화면 ---------- */
  var renderHome = function () {
    $('studioLink').href = safeUrl(C.studioUrl);
    $('warmupLink').href = safeUrl(C.warmupUrl);
    $('zipLink').href = fileUrl(D.zip);
    $('zipLink').setAttribute('download', D.zip);

    $('homeLevels').innerHTML = D.parts.map(function (p) {
      return '<section class="level-section"><div class="level-head"><div><span class="level-kicker">' + esc(p.kicker) + '</span><h2>' + esc(p.title) +
        '</h2></div><p>' + esc(p.desc) + '</p></div><div class="lesson-grid">' + p.lessons.map(function (id) {
          var l = byId[id];
          return '<a class="lesson-card' + (isDone(l) ? ' is-done' : '') + '" href="#' + l.id + '" data-lesson="' + l.id + '">' +
            '<span class="lesson-code">' + esc(l.code + ' · ' + l.time) + '</span><h3>' + esc(l.title) + '</h3><p>' + esc(l.sum) + '</p>' +
            '<div class="lesson-output"><span>완성 결과물</span> · ' + esc(l.out) + '</div><div class="lesson-arrow">실습 시작하기 →</div></a>';
        }).join('') + '</div></section>';
    }).join('');

    $('downloadGroups').innerHTML = D.lessons.map(function (l) {
      return '<h3 class="dl-h">' + esc(l.code + ' · ' + l.agent) + '</h3><div class="file-list">' + l.files.map(function (f) {
        return '<div class="file-row"><div><strong>' + esc(f.name) + '</strong><span>' + esc(f.label) + ' · <em>' + esc(f.role) + '</em></span></div>' + dlLink(f) + '</div>';
      }).join('') + '</div>';
    }).join('') +
      '<h3 class="dl-h">교육 뒤 · 내 Claude에 등록하는 스킬 (선택)</h3><p class="lead dl-lead">claude.ai → 설정 → 기능 → 스킬에서 압축을 풀지 않고 그대로 올립니다. 스튜디오로 실습할 때는 필요 없습니다.</p><div class="dl-grid">' +
      D.skills.map(function (s) {
        return '<div class="dl-item"><div><strong>' + esc(s.name) + '.zip</strong><span>' + esc(s.lesson + ' · ' + s.agent) + '</span></div>' +
          dlLink({ path: s.path, name: s.name + '.zip' }) + '</div>';
      }).join('') + '</div>';

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
      el.classList.toggle('is-done', isDone(byId[el.getAttribute('data-lesson')]));
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
      '<p>아래 파일을 내 컴퓨터에 받아 둡니다. 전체 압축 파일을 이미 받았다면 건너뜁니다.</p><div class="file-list">' +
      l.files.map(function (f) {
        return '<div class="file-row"><div><strong>' + esc(f.name) + '</strong><span>' + esc(f.label) + ' · <em>' + esc(f.role) + '</em></span></div>' + dlLink(f, '파일 받기') + '</div>';
      }).join('') + '</div>', '자료 받기');

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
      '<div class="go-studio"><p><b>스튜디오를 새 탭으로 엽니다.</b> 왼쪽 목록에서 "' + esc(l.agent) + '"을 고른 뒤, 아래 값을 하나씩 복사해 같은 이름의 칸에 붙여넣습니다.</p>' +
      '<a class="g-btn" href="' + esc(studio) + '" target="_blank" rel="noopener noreferrer">스튜디오 열기</a></div>' +
      '<div class="val-list">' + vals + '</div>' + pick, '넣을 값');

    add('run', '실행 순서', olist(l.steps) +
      (l.tips.length ? '<h3>바꿔 보기</h3><ul class="plain">' + l.tips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : ''), '실행 순서');

    var c = checks[l.id] || [];
    add('review', '결과 검수',
      '<p>아래 항목을 직접 확인하면 실습이 완료됩니다.</p><div class="checklist">' + l.checks.map(function (t, i) {
        return '<label class="check-item"><input type="checkbox" data-check="' + i + '"' + (c[i] ? ' checked' : '') + '><span>' + esc(t) + '</span></label>';
      }).join('') + '</div><div class="local-note">체크 상태는 지금 쓰는 기기에만 저장됩니다.</div>', '결과 검수');

    add('human', '사람이 마무리할 일',
      '<ul class="plain">' + l.after.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      l.sheets.map(function (s) {
        return '<details class="fold"' + (l.sheets.length === 1 ? ' open' : '') + '><summary>' + esc(s.title) + '</summary><div class="fold-b"><div class="sheet-actions">' +
          copyBtn(s.text, '양식 글 복사', 'g-btn ghost') + dlLink({ path: s.path, name: s.file }, '파일 받기') + '</div><div class="md">' + md(s.text) + '</div></div></details>';
      }).join(''), '사람이 할 일');

    add('prompt', 'Claude 채팅에서 하기 (복사해서 쓰는 지시문)',
      '<p>스튜디오가 열리지 않을 때, 또는 Claude 채팅에서 직접 해 보고 싶을 때 씁니다. 결과는 같은 순서로 나옵니다(파일 받기 단추만 없습니다).</p>' +
      olist(l.bSteps) +
      '<div class="go-studio"><p><b>지시문을 복사한 뒤</b> Claude 새 채팅을 열어 붙여넣습니다.</p><a class="g-btn" href="' + esc(chat) + '" target="_blank" rel="noopener noreferrer">Claude 새 채팅 열기</a></div>' +
      '<div class="prompt-box tall"><span class="box-label">지시문 전체</span>' + copyBtn(l.prompt, '지시문 복사') + '<pre>' + esc(l.prompt) + '</pre></div>', '복사 지시문');

    var prev = D.lessons[l.index - 1], next = D.lessons[l.index + 1];
    var navA = function (x, cls, label) {
      return x ? '<a class="' + cls + '" href="#' + x.id + '"><span>' + label + '</span><strong>' + esc(x.code + ' · ' + x.title) + '</strong></a>'
        : '<a class="' + cls + '" href="#home"><span>' + label + '</span><strong>전체 실습으로</strong></a>';
    };
    $('lessonBody').innerHTML = parts.join('') + '<nav class="lesson-navigation" aria-label="이전 · 다음 실습">' +
      navA(prev, 'lesson-prev', '← 이전') + navA(next, 'lesson-next', '다음 →') + '</nav>';
    $('toc').innerHTML = '<strong>실습 목차</strong>' + toc.map(function (t) {
      return '<a href="#' + t[0] + '" data-jump="' + t[0] + '">' + esc(t[1]) + '</a>';
    }).join('');

    if (l.inquiries) {
      var sel = $('qPick'), show = function () { $('qText').textContent = l.inquiries[+sel.value].q; };
      sel.addEventListener('change', show); show();
    }
    $('lessonBody').querySelectorAll('[data-check]').forEach(function (el) {
      el.addEventListener('change', function () {
        var a = checks[l.id] || (checks[l.id] = []);
        a[+el.getAttribute('data-check')] = el.checked;
        saveChecks(); updateProgress();
      });
    });
  };

  /* 실습 화면 안의 목차는 주소(#)를 바꾸지 않고 그 자리로만 옮긴다 */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-jump]');
    if (!a) return;
    e.preventDefault();
    var el = $(a.getAttribute('data-jump'));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ---------- 화면 전환 ---------- */
  var shown = null;
  var route = function () {
    var h = (location.hash || '').slice(1);
    var l = Object.prototype.hasOwnProperty.call(byId, h) ? byId[h] : null;
    $('viewHome').hidden = !!l;
    $('viewLesson').hidden = !l;
    if (l) {
      if (shown !== l.id) { renderLesson(l); shown = l.id; }
      window.scrollTo(0, 0);
      document.title = l.code + ' ' + l.title + ' | 업무 에이전트 실습실';
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
