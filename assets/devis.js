/* Formulaire de devis SoluPrint3D77 — envoie les réponses au Google Form existant */
(function () {
  var root = document.getElementById('devis');
  if (!root) return;
  var form = root.querySelector('form');
  var steps = Array.prototype.slice.call(root.querySelectorAll('.sp-step'));
  var layers = Array.prototype.slice.call(root.querySelectorAll('.sp-layer'));
  var prev = root.querySelector('[data-sp-prev]');
  var next = root.querySelector('[data-sp-next]');
  var done = root.querySelector('.sp-done');
  var current = 0;

  function show(i) {
    current = i;
    steps.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
    layers.forEach(function (l, k) {
      l.classList.toggle('is-done', k < i);
      l.classList.toggle('is-current', k === i);
    });
    prev.hidden = i === 0;
    next.textContent = i === steps.length - 1 ? 'Envoyer ma demande' : 'Continuer';
  }

  function scrollToTop() {
    var top = root.getBoundingClientRect().top + window.pageYOffset - 100;
    if (Math.abs(window.pageYOffset - top) > 40) window.scrollTo({ top: top, behavior: 'smooth' });
  }

  // Champs « Autre » : afficher la zone de texte quand l'option est cochée
  root.querySelectorAll('[data-sp-other]').forEach(function (group) {
    var box = group.querySelector('.sp-other');
    var input = box.querySelector('input');
    group.addEventListener('change', function () {
      var other = group.querySelector('input[value="__other_option__"]');
      var open = other && other.checked;
      box.classList.toggle('is-open', open);
      input.disabled = !open;
      if (open) input.focus();
    });
  });

  // Boutons + / − de la quantité
  root.querySelectorAll('[data-sp-qty]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = root.querySelector('#sp-qty');
      var v = parseInt(input.value, 10) || 0;
      v = Math.max(1, v + parseInt(btn.getAttribute('data-sp-qty'), 10));
      input.value = v;
      clearError(input.closest('[data-sp-required]'));
    });
  });

  function clearError(block) { if (block) block.classList.remove('sp-invalid'); }
  root.addEventListener('input', function (e) { clearError(e.target.closest('[data-sp-required]')); });
  root.addEventListener('change', function (e) { clearError(e.target.closest('[data-sp-required]')); });

  function blockValid(block) {
    var type = block.getAttribute('data-sp-required');
    if (type === 'choice') {
      var checked = block.querySelector('input:checked');
      if (!checked) return false;
      if (checked.value === '__other_option__') {
        var t = block.querySelector('.sp-other input');
        return !!(t && t.value.trim());
      }
      return true;
    }
    var field = block.querySelector('input, textarea');
    var val = field.value.trim();
    if (!val) return false;
    if (type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val);
    if (type === 'number') return parseInt(val, 10) >= 1;
    if (type === 'consent') return field.checked;
    return true;
  }

  function validate(step) {
    var first = null;
    step.querySelectorAll('[data-sp-required]').forEach(function (block) {
      var ok = blockValid(block);
      block.classList.toggle('sp-invalid', !ok);
      if (!ok && !first) first = block;
    });
    if (first) {
      var f = first.querySelector('input:not([type=hidden]):not([disabled]), textarea');
      if (f) f.focus({ preventScroll: true });
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  }

  prev.addEventListener('click', function () {
    if (current > 0) { show(current - 1); scrollToTop(); }
  });

  next.addEventListener('click', function () {
    if (!validate(steps[current])) return;
    if (current < steps.length - 1) { show(current + 1); scrollToTop(); return; }
    submit();
  });

  // Entrée dans un champ texte = passer à la suite (sauf dans les zones de texte)
  form.addEventListener('submit', function (e) { e.preventDefault(); next.click(); });

  function submit() {
    // Une option « Autre » cochée sans précision serait refusée par Google : on la retire
    root.querySelectorAll('input[value="__other_option__"]:checked').forEach(function (r) {
      var t = r.closest('[data-sp-other]').querySelector('.sp-other input');
      if (!t.value.trim()) { r.checked = false; t.disabled = true; }
    });
    next.disabled = true;
    next.textContent = 'Envoi en cours…';
    var sink = document.createElement('iframe');
    sink.name = 'sp-sink'; sink.title = 'envoi'; sink.style.display = 'none';
    document.body.appendChild(sink);
    var sent = false;
    sink.addEventListener('load', function () {
      if (!sent) return;
      form.style.display = 'none';
      done.classList.add('is-active');
      layers.forEach(function (l) { l.classList.add('is-done'); l.classList.remove('is-current'); });
      scrollToTop();
    });
    form.setAttribute('target', 'sp-sink');
    sent = true;
    HTMLFormElement.prototype.submit.call(form);
  }

  show(0);
})();
