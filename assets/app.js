/* ==========================================================================
   INYESOFT — Plano Técnico
   Router por hash · menú · catálogo + ficha · consulta y revocación por
   WhatsApp · flotante según ruta · restauración de scroll
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------- empresa --
     Los datos fiscales viven acá y en ningún otro lado. Cambiar estos dos
     valores actualiza el pie, los términos y el remito de recepción. */
  var EMPRESA = {
    razonSocial: '[RAZÓN SOCIAL]',
    cuit: '[00-00000000-0]'
  };

  /* --------------------------------------------------------------- áreas --
     Cada motivo tiene su número. El sitio ahora lo dice antes de enviar,
     en vez de elegirlo en silencio. */
  var AREAS = {
    Reparar:   { nombre: 'INYESOFT · DEL VISO',  tel: '+54 9 11 5962-2682', wa: '5491159622682' },
    Comprar:   { nombre: 'REPUESTOS · DEL VISO', tel: '+54 9 11 2458-1513', wa: '5491124581513' },
    Potenciar: { nombre: 'MD REPRO · ESCOBAR',   tel: '+54 9 11 6031-4972', wa: '5491160314972' }
  };

  var ROUTES = ['home', 'electronica', 'repuestos', 'mdrepro', 'nosotros', 'contacto', 'legales'];

  var ROUTE_AREA = {
    home: 'Reparar', electronica: 'Reparar', repuestos: 'Comprar',
    mdrepro: 'Potenciar', nosotros: 'Reparar', contacto: 'Reparar', legales: 'Comprar'
  };

  var ROUTE_SHEET = {
    home: '01', electronica: '02', repuestos: '03',
    mdrepro: '04', nosotros: '05', contacto: '06', legales: '07'
  };

  /* ------------------------------------------------------------ catálogo --
     Una entrada por fila de la tabla. `aplica` sólo afirma lo que está
     verificado; donde no lo está, lo dice y deriva a la consulta. */
  var PRODUCTOS = {
    '01': {
      titulo: 'ECU motor Bosch EDC17C10',
      sku: '0281 014 789 · OEM 9666843180',
      fotos: ['assets/img/prod-ecu-01.webp'],
      flag: 'ÚLTIMA UNIDAD',
      modulo: 'ECU motor Bosch EDC17C10',
      aplica: 'Peugeot 308 / 3008 · Citroën C4 / Berlingo · 1.6 HDi · 2010–2016',
      estado: 'Usada · verificada en banco',
      entrega: 'Emparejada a tu VIN · última unidad',
      precio: '$385.000',
      precioNota: 'IVA incluido',
      empareja: true
    },
    '02': {
      titulo: 'Módulo ABS Bosch 9.0',
      sku: 'ABS/ESP · BOSCH 9.0',
      fotos: ['assets/img/prod-abs-02.webp'],
      flag: null,
      modulo: 'Módulo ABS / ESP Bosch 9.0',
      aplica: 'A confirmar con tu VIN o patente. Pasanos el vehículo y verificamos la referencia antes de cotizar.',
      estado: 'Reacondicionado · verificado en banco',
      entrega: 'Se prepara una vez confirmada la compatibilidad',
      precio: 'Consultar',
      precioNota: 'se cotiza por unidad',
      empareja: false
    },
    '03': {
      titulo: 'Kit de arranque + BCM',
      sku: 'BCM + KIT',
      fotos: ['assets/img/prod-kit-03.webp'],
      flag: null,
      modulo: 'Kit de arranque completo con BCM',
      aplica: 'A confirmar con tu VIN o patente. El kit se arma según el vehículo.',
      estado: 'Nuevo · emparejamiento incluido',
      entrega: 'Emparejado a tu vehículo y a tus llaves',
      precio: 'Consultar',
      precioNota: 'se cotiza por vehículo',
      empareja: true
    },
    '04': {
      titulo: 'BSI Peugeot / Citroën',
      sku: 'BSI · PSA',
      fotos: ['assets/img/prod-bsi-04.webp'],
      flag: null,
      modulo: 'BSI (caja de servicio inteligente) PSA',
      aplica: 'Peugeot / Citroën. Modelo, año y referencia exacta a confirmar con tu VIN.',
      estado: 'Usada · verificada en banco',
      entrega: 'Se prepara una vez confirmada la compatibilidad',
      precio: 'Consultar',
      precioNota: 'se cotiza por unidad',
      empareja: false
    },
    '05': {
      titulo: 'Instrumental VW / Amarok',
      sku: 'TABLERO · VW',
      fotos: ['assets/img/prod-tablero-05.webp'],
      flag: null,
      modulo: 'Tablero / instrumental Volkswagen',
      aplica: 'Volkswagen. Versión y año a confirmar con tu VIN antes de reservar.',
      estado: 'Reparado · consultar stock',
      entrega: 'Se confirma disponibilidad antes de cobrar',
      precio: 'Consultar',
      precioNota: 'se cotiza por unidad',
      empareja: false
    }
  };

  var DEFAULT_TITLE = document.documentElement.getAttribute('data-route-title') || document.title;
  var root = document.documentElement;

  var routeEls = toArray(document.querySelectorAll('[data-route]'));
  var navLinks = toArray(document.querySelectorAll('a[href^="#/"]'));
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');

  function toArray(list) { return Array.prototype.slice.call(list); }

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function scrollToTop() {
    try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }
    catch (e) { window.scrollTo(0, 0); }
  }

  function scrollToY(y) {
    try { window.scrollTo({ top: y, left: 0, behavior: 'instant' }); }
    catch (e) { window.scrollTo(0, y); }
  }

  function scrollToEl(el) {
    if (!el) return;
    try { el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' }); }
    catch (e) { el.scrollIntoView(); }
  }

  /* ------------------------------------------------- motion de instrumento --
     Enhancement sobre valores que YA están en el DOM: los numerales se
     "asientan" (count-up) y el gauge barre su aguja al entrar a la ruta.
     Con prefers-reduced-motion no se anima nada (el valor final ya está). */

  function groupThousands(n) {
    n = Math.round(n);
    var neg = n < 0, s = String(Math.abs(n)), out = '';
    while (s.length > 3) { out = '.' + s.slice(-3) + out; s = s.slice(0, -3); }
    return (neg ? '-' : '') + s + out;
  }

  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (isNaN(target)) return;
    var finalText = el.getAttribute('data-final');
    if (finalText === null) { finalText = el.textContent; el.setAttribute('data-final', finalText); }
    if (prefersReducedMotion() || !window.requestAnimationFrame) { el.textContent = finalText; return; }

    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 720, start = null;
    var fmt = function (v) { return prefix + groupThousands(v) + suffix; };

    var done = false;
    var finish = function () { if (!done) { done = true; el.textContent = finalText; } };

    el.textContent = fmt(0);
    requestAnimationFrame(function step(ts) {
      if (done) return;
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);           // ease-out-cubic
      if (p < 1) { el.textContent = fmt(target * eased); requestAnimationFrame(step); }
      else { finish(); }                            // restaura el string exacto
    });
    // Red de seguridad: si rAF se demora (pestaña en segundo plano, etc.),
    // el valor final aterriza igual.
    window.setTimeout(finish, dur + 500);
  }

  function settleGauge(g) {
    var target = g.getAttribute('data-gauge') || '.82';
    if (prefersReducedMotion() || !window.requestAnimationFrame) {
      g.style.setProperty('--gauge', target);
      return;
    }
    g.style.setProperty('--gauge', '0');
    void g.offsetWidth;                              // fuerza reflow para que transite
    requestAnimationFrame(function () { g.style.setProperty('--gauge', target); });
  }

  function initInstruments(route) {
    var active = document.querySelector('[data-route="' + route + '"]');
    if (!active) return;
    toArray(active.querySelectorAll('[data-count]')).forEach(animateCount);
    toArray(active.querySelectorAll('.gauge[data-gauge]')).forEach(settleGauge);
  }

  /* --------------------------------------------------- datos de la empresa */
  toArray(document.querySelectorAll('[data-empresa]')).forEach(function (el) {
    var k = el.getAttribute('data-empresa');
    if (EMPRESA[k]) el.textContent = EMPRESA[k];
  });
  if (/^\[/.test(EMPRESA.razonSocial) || /^\[/.test(EMPRESA.cuit)) {
    if (window.console && console.warn) {
      console.warn('[INYESOFT] Faltan la razón social y el CUIT reales. Se editan en EMPRESA, arriba de assets/app.js.');
    }
  }

  /* --------------------------------------------------------------- router */

  function parseLocation() {
    var raw = (location.hash || '').replace(/^#\/?/, '');
    var parts = raw.split('?');
    var name = parts[0].split('#')[0];
    var query = {};
    if (parts[1]) {
      parts[1].split('&').forEach(function (pair) {
        if (!pair) return;
        var kv = pair.split('=');
        query[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' '));
      });
    }
    return { route: ROUTES.indexOf(name) > -1 ? name : 'home', q: query };
  }

  function routeOf(href) {
    return (href || '').replace(/^#\/?/, '').split('?')[0].split('#')[0] || 'home';
  }

  /* ---------------------------------------------- restauración de scroll --
     Antes: `scroll-behavior: smooth` en <html> + scrollTo(0,0) hacía que cada
     cambio de ruta fuera un vuelo animado de 3.900 px, y Atrás devolvía al
     tope. Ahora el salto es instantáneo y cada entrada del historial recuerda
     dónde estaba. */
  var lastY = 0;
  var navSeq = 0;
  var entry = 0;
  var positions = Object.create(null);

  if ('scrollRestoration' in history) {
    try { history.scrollRestoration = 'manual'; } catch (e) { /* noop */ }
  }
  try { history.replaceState({ i: 0 }, ''); } catch (e) { /* file:// puede negarse */ }

  function scrollTarget(loc) {
    if (loc.route === 'repuestos' && loc.q.ref && PRODUCTOS[loc.q.ref]) {
      return document.getElementById('pdp');
    }
    if (loc.route === 'legales' && loc.q.s) {
      return document.getElementById('s-' + loc.q.s);
    }
    return null;
  }

  function render(loc, opts) {
    opts = opts || {};
    var route = loc.route;

    routeEls.forEach(function (el) {
      var on = el.getAttribute('data-route') === route;
      el.classList.toggle('is-active', on);
      if (on) document.title = el.getAttribute('data-title') || DEFAULT_TITLE;
    });

    navLinks.forEach(function (a) {
      if (routeOf(a.getAttribute('href')) === route) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    root.setAttribute('data-route', route);
    syncRail(route);
    syncWhatsApp(route);
    closeMenu();

    if (route === 'repuestos') selectProducto(loc.q.ref || currentRef || '01', { silent: true });
    if (route === 'contacto') applyContactParams(loc.q);

    if (!opts.restore) initInstruments(route);   // count-up + barrido de aguja

    if (opts.restore) {                       // Atrás / Adelante
      scrollToY(opts.top || 0);
      return;
    }

    var target = scrollTarget(loc);
    if (target) {
      if (opts.initial) {
        // En la carga inicial el layout todavía se está asentando.
        window.setTimeout(function () { scrollToEl(target); focusSilently(target); }, 60);
      } else {
        scrollToEl(target);
        focusSilently(target);
      }
      return;
    }

    if (!opts.initial) scrollToTop();

    var active = document.querySelector('[data-route="' + route + '"]');
    var heading = active && active.querySelector('h1');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      focusSilently(heading);
    }
  }

  function focusSilently(el) {
    if (!el) return;
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
  }

  window.addEventListener('hashchange', function () {
    positions[entry] = lastY;

    var st = null;
    try { st = history.state; } catch (e) { /* noop */ }

    var restore = false, top = 0;
    if (st && typeof st.i === 'number') {
      entry = st.i;
      if (typeof positions[entry] === 'number') { restore = true; top = positions[entry]; }
    } else {
      entry = ++navSeq;
      try { history.replaceState({ i: entry }, ''); } catch (e) { /* noop */ }
    }

    render(parseLocation(), { restore: restore, top: top });
  });

  /* ---------------------------------------------------------- riel de hoja */
  var railItems = toArray(document.querySelectorAll('.edge-rail [data-sheet]'));
  function syncRail(route) {
    var sheet = ROUTE_SHEET[route];
    railItems.forEach(function (el) {
      if (el.getAttribute('data-sheet') === sheet) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
    });
  }

  /* ----------------------------------------------------------- menú móvil */

  function closeMenu() {
    if (!menu || !burger) return;
    menu.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Abrir menú');
  }

  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      menu.hidden = open;
      burger.setAttribute('aria-expanded', String(!open));
      burger.setAttribute('aria-label', open ? 'Abrir menú' : 'Cerrar menú');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        burger.focus();
      }
    });
  }

  /* ------------------------------------------------- clicks de navegación */
  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    if (e.target.closest('a[href="#"]')) { e.preventDefault(); return; }
    if (e.target.closest('a[href^="#/"]')) closeMenu();
  });

  /* -------------------------------------------------- WhatsApp según ruta */
  var waFloat = document.getElementById('wa-float');
  var waHeader = document.getElementById('wa-header');
  var waHeaderLabel = document.getElementById('wa-header-label');

  function syncWhatsApp(route) {
    var area = AREAS[ROUTE_AREA[route] || 'Reparar'];
    var etiqueta = 'Escribinos por WhatsApp — ' + area.nombre + ' · ' + area.tel;

    if (waHeader) {
      waHeader.href = 'https://wa.me/' + area.wa;
      waHeader.title = etiqueta;
    }
    if (waHeaderLabel) waHeaderLabel.textContent = etiqueta;

    if (waFloat) {
      waFloat.href = 'https://wa.me/' + area.wa;
      waFloat.title = etiqueta;
      waFloat.setAttribute('aria-label', etiqueta);
      // En Contacto y Legales el canal ya está en pantalla: el flotante sólo tapa.
      waFloat.hidden = (route === 'contacto' || route === 'legales');
      waFloat.classList.remove('is-away');
    }
  }

  /* El flotante se retira mientras se baja: en 390 px se paraba justo encima
     de la columna de precios del catálogo. */
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      if (waFloat && !waFloat.hidden) {
        if (y > lastY + 6 && y > 260) waFloat.classList.add('is-away');
        else if (y < lastY - 6 || y <= 260) waFloat.classList.remove('is-away');
      }
      lastY = y;
      ticking = false;
    });
  }, { passive: true });

  /* --------------------------------------------------- ficha de producto */

  var q = document.getElementById('cat-q');
  var qClear = document.getElementById('cat-clear');
  var catalog = document.getElementById('catalog');
  var countText = document.getElementById('cat-count-text');
  var reset = document.getElementById('cat-reset');
  var emptyReset = document.getElementById('empty-reset');
  var pdp = document.getElementById('pdp');
  var currentRef = null;
  var chipCat = '';
  var refreshCatalog = null;

  var pdpEls = {
    ref: document.getElementById('pdp-ref'),
    photo: document.getElementById('pdp-photo'),
    flag: document.getElementById('pdp-flag'),
    sku: document.getElementById('pdp-sku'),
    name: document.getElementById('pdp-name'),
    modulo: document.getElementById('pdp-modulo'),
    aplica: document.getElementById('pdp-aplica'),
    estado: document.getElementById('pdp-estado'),
    entrega: document.getElementById('pdp-entrega'),
    price: document.getElementById('pdp-price'),
    notice: document.getElementById('pdp-notice'),
    wa: document.getElementById('pdp-wa'),
    compat: document.getElementById('pdp-compat')
  };

  /* Galería de la ficha: imagen grande + miniaturas. Con una sola vista, no
     muestra miniaturas. Normaliza aspectos distintos con object-fit: cover. */
  function renderGallery(p) {
    var main = document.getElementById('pdp-main');
    var thumbs = document.getElementById('pdp-thumbs');
    if (!main) return;
    var fotos = (p.fotos && p.fotos.length) ? p.fotos : [];

    if (!fotos.length) {
      main.removeAttribute('src');
      main.alt = '';
      if (thumbs) { thumbs.innerHTML = ''; thumbs.hidden = true; }
      return;
    }

    function show(i) {
      main.src = fotos[i];
      main.alt = p.titulo + (fotos.length > 1 ? ' — vista ' + (i + 1) + ' de ' + fotos.length : '');
      if (thumbs) toArray(thumbs.children).forEach(function (b, j) {
        b.setAttribute('aria-current', String(j === i));
      });
    }

    if (thumbs) {
      thumbs.innerHTML = '';
      if (fotos.length > 1) {
        fotos.forEach(function (src, i) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'pdp__thumb';
          b.setAttribute('aria-label', 'Ver vista ' + (i + 1) + ' de ' + p.titulo);
          var im = document.createElement('img');
          im.src = src; im.alt = ''; im.loading = 'lazy'; im.decoding = 'async';
          b.appendChild(im);
          b.addEventListener('click', function () { show(i); });
          thumbs.appendChild(b);
        });
        thumbs.hidden = false;
      } else {
        thumbs.hidden = true;
      }
    }

    show(0);
  }

  function selectProducto(ref, opts) {
    opts = opts || {};
    var p = PRODUCTOS[ref];
    if (!p || !pdpEls.name) return;
    currentRef = ref;

    if (pdpEls.ref) pdpEls.ref.textContent = 'REF. ' + ref;
    renderGallery(p);
    if (pdpEls.flag) {
      pdpEls.flag.hidden = !p.flag;
      if (p.flag) pdpEls.flag.textContent = p.flag;
    }
    if (pdpEls.sku) pdpEls.sku.textContent = p.sku;
    pdpEls.name.textContent = p.titulo;
    if (pdpEls.modulo) pdpEls.modulo.textContent = p.modulo;
    if (pdpEls.aplica) pdpEls.aplica.textContent = p.aplica;
    if (pdpEls.estado) pdpEls.estado.textContent = p.estado;
    if (pdpEls.entrega) pdpEls.entrega.textContent = p.entrega;

    if (pdpEls.price) {
      pdpEls.price.innerHTML = p.precio + ' <small>' + p.precioNota + '</small>';
    }

    if (pdpEls.notice) {
      var texto = p.empareja
        ? 'Esta pieza se empareja a tu vehículo. Una vez emparejada no admite devolución; te pedimos confirmación por escrito antes de emparejarla.'
        : 'Si esta unidad necesita emparejarse con tu vehículo, te lo avisamos y te pedimos confirmación antes de prepararla.';
      pdpEls.notice.querySelector('p').innerHTML =
        texto + ' <a href="#/legales?s=cambios">Ver cambios y devoluciones</a>';
    }

    if (pdpEls.wa) {
      var msg = 'Hola, consulto por: ' + p.titulo + ' (REF. ' + ref + ' · ' + p.sku + ').';
      pdpEls.wa.href = 'https://wa.me/' + AREAS.Comprar.wa + '?text=' + encodeURIComponent(msg);
    }
    if (pdpEls.compat) pdpEls.compat.href = '#/contacto?m=Comprar&ref=' + ref;

    toArray(document.querySelectorAll('.catalog__row')).forEach(function (row) {
      var on = row.getAttribute('data-ref') === ref;
      row.classList.toggle('is-current', on);
      var link = row.querySelector('.catalog__link');
      if (link) {
        if (on) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      }
    });

    if (!opts.silent && pdp) { scrollToEl(pdp); focusSilently(pdp); }
  }

  /* ------------------------------------------------------ filtro catálogo */

  function norm(s) {
    return (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (catalog) {
    var rows = toArray(catalog.querySelectorAll('tbody tr[data-ref]'));
    var empty = catalog.querySelector('.catalog__empty');
    var chips = toArray(document.querySelectorAll('.chip'));

    // Un chip que no puede coincidir con nada es una trampa: se retira.
    chips.forEach(function (chip) {
      var cat = norm(chip.dataset.chip);
      var hits = rows.filter(function (r) { return norm(r.getAttribute('data-cat')).split(' ').indexOf(cat) > -1; });
      if (!hits.length) chip.hidden = true;
    });

    var visibleRefs = [];

    function applyFilter() {
      var needle = norm(q ? q.value : '');
      visibleRefs = [];

      rows.forEach(function (row) {
        var cats = norm(row.getAttribute('data-cat')).split(' ');
        var hay = norm(row.getAttribute('data-q') + ' ' + row.textContent);
        var okText = !needle || hay.indexOf(needle) > -1;
        var okCat = !chipCat || cats.indexOf(norm(chipCat)) > -1;
        var show = okText && okCat;
        row.hidden = !show;
        if (show) visibleRefs.push(row.getAttribute('data-ref'));
      });

      var hits = visibleRefs.length;
      if (empty) empty.hidden = hits !== 0;
      if (qClear) qClear.hidden = !(q && q.value);

      chips.forEach(function (chip) {
        chip.setAttribute('aria-pressed', String(norm(chip.dataset.chip) === norm(chipCat) && !!chipCat));
      });

      // Qué filtros están puestos, dicho con todas las letras: un chip sobre
      // una búsqueda vieja parecía un chip roto.
      var activos = [];
      if (chipCat) activos.push(chipCat);
      if (needle) activos.push('"' + q.value.trim() + '"');

      if (countText) {
        if (!activos.length) {
          countText.innerHTML = rows.length + ' MÓDULOS PUBLICADOS';
        } else if (hits === 0) {
          countText.innerHTML = '<b>0</b> DE ' + rows.length + ' · FILTRANDO POR ' + activos.join(' + ');
        } else {
          countText.innerHTML = '<b>' + hits + '</b> DE ' + rows.length + ' · FILTRANDO POR ' + activos.join(' + ');
        }
      }
      if (reset) reset.hidden = !activos.length;

      // La ficha no puede quedar mostrando un módulo que el filtro acaba de
      // sacar de la tabla: era la contradicción que dejaba el chip AIRBAG.
      if (pdp) {
        if (hits === 0) {
          pdp.hidden = true;
        } else {
          pdp.hidden = false;
          if (visibleRefs.indexOf(currentRef) === -1) selectProducto(visibleRefs[0], { silent: true });
        }
      }
    }

    if (q) {
      q.addEventListener('input', applyFilter);
      q.addEventListener('search', applyFilter);
    }

    if (qClear) {
      qClear.addEventListener('click', function () {
        if (q) { q.value = ''; q.focus(); }
        applyFilter();
      });
    }

    function limpiarTodo(foco) {
      if (q) q.value = '';
      chipCat = '';
      applyFilter();
      if (foco && q) q.focus();
    }

    if (reset) reset.addEventListener('click', function () { limpiarTodo(true); });
    if (emptyReset) emptyReset.addEventListener('click', function () { limpiarTodo(false); });

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var pressed = chip.getAttribute('aria-pressed') === 'true';
        chipCat = pressed ? '' : chip.dataset.chip;
        applyFilter();
      });
    });

    // Toda la fila es clicable, pero el destino real es el enlace del centro:
    // así funciona con teclado, con "abrir en pestaña nueva" y con lector.
    catalog.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      var row = e.target.closest('tr[data-ref]');
      if (!row) return;
      var link = row.querySelector('.catalog__link');
      if (link) location.hash = link.getAttribute('href').replace(/^#/, '');
    });

    refreshCatalog = applyFilter;
  }

  /* --------------------------------------------- formularios → WhatsApp */

  function fieldOf(input) { return input.closest('.form-field'); }

  function clearError(input) {
    var wrap = fieldOf(input);
    if (wrap) wrap.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
    var err = document.getElementById(input.id + '-err');
    if (err) { err.textContent = ''; err.hidden = true; }
  }

  function setError(input, msg) {
    var wrap = fieldOf(input);
    if (wrap) wrap.classList.add('is-invalid');
    input.setAttribute('aria-invalid', 'true');
    var err = document.getElementById(input.id + '-err');
    if (err) { err.textContent = msg; err.hidden = false; }
  }

  /* Nombra sólo lo que falta: "COMPLETÁ NOMBRE Y MENSAJE" cuando el nombre ya
     estaba cargado era el peor de los mensajes posibles. */
  function listar(nombres) {
    if (nombres.length === 1) return nombres[0];
    return nombres.slice(0, -1).join(', ') + ' y ' + nombres[nombres.length - 1];
  }

  function validate(reglas, status) {
    var faltan = [];
    var primero = null;

    reglas.forEach(function (r) {
      var input = r.el;
      if (!input) return;
      clearError(input);
      var val = (input.value || '').trim();
      var bad = r.test ? !r.test(val) : !val;
      if (bad) {
        setError(input, r.msg);
        faltan.push(r.nombre);
        if (!primero) primero = input;
      }
    });

    if (faltan.length) {
      if (status) {
        status.textContent = 'Falta ' + (faltan.length > 1 ? 'completar ' : '') + listar(faltan) + '.';
        status.setAttribute('data-state', 'error');
      }
      if (primero) {
        primero.focus();
        var wrap = fieldOf(primero);
        if (wrap && wrap.getBoundingClientRect().top < 70) scrollToEl(wrap);
      }
      return false;
    }

    if (status) { status.textContent = ''; status.removeAttribute('data-state'); }
    return true;
  }

  function copiar(texto, salida) {
    function ok() {
      if (!salida) return;
      salida.textContent = '· COPIADO';
      window.setTimeout(function () { salida.textContent = ''; }, 2600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(ok, function () { legacyCopy(texto, ok); });
    } else {
      legacyCopy(texto, ok);
    }
  }

  function legacyCopy(texto, ok) {
    var ta = document.createElement('textarea');
    ta.value = texto;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); ok(); } catch (e) { /* noop */ }
    ta.remove();
  }

  /* ------------------------------------------------- consulta (contacto) */

  var form = document.getElementById('consulta');
  var status = document.getElementById('form-status');
  var destV = document.getElementById('form-dest-v');
  var review = document.getElementById('form-review');
  var reviewDest = document.getElementById('review-dest');
  var reviewMsg = document.getElementById('review-msg');
  var reviewSend = document.getElementById('review-send');
  var reviewTel = document.getElementById('review-tel');
  var reviewEdit = document.getElementById('review-edit');
  var reviewCopy = document.getElementById('review-copy');
  var reviewCopied = document.getElementById('review-copied');

  var fMotivo = document.getElementById('f-motivo');
  var fNombre = document.getElementById('f-nombre');
  var fVehiculo = document.getElementById('f-vehiculo');
  var fTel = document.getElementById('f-tel');
  var fMsg = document.getElementById('f-msg');

  function areaActual() {
    return AREAS[(fMotivo && fMotivo.value) || 'Reparar'] || AREAS.Reparar;
  }

  function syncDestino() {
    if (!destV) return;
    var a = areaActual();
    destV.textContent = a.nombre + ' · ' + a.tel;
  }

  function applyContactParams(qs) {
    if (fMotivo && qs.m && AREAS[qs.m]) fMotivo.value = qs.m;
    if (fMsg && qs.ref && PRODUCTOS[qs.ref] && !fMsg.value.trim()) {
      var p = PRODUCTOS[qs.ref];
      fMsg.value = 'Consulto compatibilidad de: ' + p.titulo + ' (REF. ' + qs.ref + ' · ' + p.sku + ').\n\nMi vehículo es: ';
    }
    syncDestino();
  }

  if (fMotivo) fMotivo.addEventListener('change', function () {
    syncDestino();
    clearError(fMotivo);
  });

  if (form) {
    [fNombre, fMsg, fTel, fVehiculo].forEach(function (el) {
      if (el) el.addEventListener('input', function () { clearError(el); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var reglas = [
        { el: fNombre, nombre: 'tu nombre', msg: 'Poné tu nombre, así sabemos con quién hablamos.' },
        { el: fMsg, nombre: 'el mensaje', msg: 'Contanos qué le pasa al vehículo o qué módulo buscás.' },
        {
          el: fTel, nombre: 'un teléfono válido',
          test: function (v) { return !v || v.replace(/\D/g, '').length >= 8; },
          msg: 'Ese número parece incompleto. Ej.: 11 5962-2682.'
        }
      ];

      if (!validate(reglas, status)) return;

      var a = areaActual();
      var lines = [
        'Consulta desde la web · ' + fMotivo.value,
        'Nombre: ' + fNombre.value.trim()
      ];
      if (fVehiculo && fVehiculo.value.trim()) lines.push('Vehículo: ' + fVehiculo.value.trim());
      if (fTel && fTel.value.trim()) lines.push('Teléfono: ' + fTel.value.trim());
      lines.push('', fMsg.value.trim());

      var texto = lines.join('\n');
      var url = 'https://wa.me/' + a.wa + '?text=' + encodeURIComponent(texto);

      if (reviewDest) reviewDest.textContent = a.nombre + ' · ' + a.tel;
      if (reviewMsg) reviewMsg.textContent = texto;
      if (reviewSend) reviewSend.href = url;
      if (reviewTel) { reviewTel.href = 'https://wa.me/' + a.wa; reviewTel.textContent = a.tel; }
      if (reviewCopy) reviewCopy.onclick = function () { copiar(texto, reviewCopied); };

      form.hidden = true;
      if (review) { review.hidden = false; focusSilently(review); scrollToEl(review); }
    });
  }

  if (reviewEdit) {
    reviewEdit.addEventListener('click', function () {
      if (review) review.hidden = true;
      if (form) { form.hidden = false; scrollToEl(form); }
      if (fMsg) fMsg.focus();
      if (status) { status.textContent = ''; status.removeAttribute('data-state'); }
    });
  }

  /* ------------------------------------------- botón de arrepentimiento */

  var arrep = document.getElementById('arrepentimiento');
  var arrepStatus = document.getElementById('arrep-status');
  var arrepReview = document.getElementById('arrep-review');
  var arrepMsg = document.getElementById('arrep-msg');
  var arrepSend = document.getElementById('arrep-send');
  var arrepEdit = document.getElementById('arrep-edit');
  var arrepCopy = document.getElementById('arrep-copy');
  var arrepCopied = document.getElementById('arrep-copied');

  if (arrep) {
    var aNombre = document.getElementById('a-nombre');
    var aDoc = document.getElementById('a-doc');
    var aPedido = document.getElementById('a-pedido');
    var aFecha = document.getElementById('a-fecha');
    var aDetalle = document.getElementById('a-detalle');

    [aNombre, aDoc, aPedido, aFecha, aDetalle].forEach(function (el) {
      if (el) el.addEventListener('input', function () { clearError(el); });
    });

    arrep.addEventListener('submit', function (e) {
      e.preventDefault();

      var reglas = [
        { el: aNombre, nombre: 'tu nombre y apellido', msg: 'Poné el nombre tal como figura en la compra.' },
        {
          el: aDoc, nombre: 'tu DNI o CUIT',
          test: function (v) { return v.replace(/\D/g, '').length >= 7; },
          msg: 'Escribí el número sin puntos ni guiones.'
        },
        { el: aPedido, nombre: 'el número de pedido o factura', msg: 'Está en el comprobante que te enviamos.' },
        { el: aFecha, nombre: 'la fecha en que lo recibiste', msg: 'Desde esa fecha corren los 10 días.' },
        { el: aDetalle, nombre: 'el producto a devolver', msg: 'Decinos qué producto querés devolver.' }
      ];

      if (!validate(reglas, arrepStatus)) return;

      var fecha = aFecha.value;
      var lines = [
        'BOTÓN DE ARREPENTIMIENTO — pedido de revocación de compra',
        'Ley 24.240 art. 34 · CCyC art. 1110',
        '',
        'Nombre y apellido: ' + aNombre.value.trim(),
        'DNI / CUIT: ' + aDoc.value.trim(),
        'Pedido o factura: ' + aPedido.value.trim(),
        'Fecha de recepción: ' + fecha,
        '',
        'Producto a devolver: ' + aDetalle.value.trim()
      ];

      var texto = lines.join('\n');
      if (arrepMsg) arrepMsg.textContent = texto;
      if (arrepSend) arrepSend.href = 'https://wa.me/' + AREAS.Comprar.wa + '?text=' + encodeURIComponent(texto);
      if (arrepCopy) arrepCopy.onclick = function () { copiar(texto, arrepCopied); };

      arrep.hidden = true;
      if (arrepReview) { arrepReview.hidden = false; focusSilently(arrepReview); scrollToEl(arrepReview); }
    });
  }

  if (arrepEdit) {
    arrepEdit.addEventListener('click', function () {
      if (arrepReview) arrepReview.hidden = true;
      if (arrep) { arrep.hidden = false; scrollToEl(arrep); }
      if (arrepStatus) { arrepStatus.textContent = ''; arrepStatus.removeAttribute('data-state'); }
    });
  }

  /* ------------------------------------------------------------- arranque */
  render(parseLocation(), { initial: true });
  if (refreshCatalog) refreshCatalog();
})();
