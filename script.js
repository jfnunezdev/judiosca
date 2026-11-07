/* ==========================================================================
   MS JUDIOSCA - Seguridad Fisica y Electronica
   Vanilla JavaScript (sin dependencias externas)
   ========================================================================== */

(function () {
    'use strict';

    /* ------------------------------------------------------------------
       1. Constantes de configuracion
       ------------------------------------------------------------------ */
    var WHATSAPP_NUMBER = '584125784366';
    var WHATSAPP_BASE   = 'https://wa.me/' + WHATSAPP_NUMBER;

    var MOBILE_BREAKPOINT = 768; // px - coincide con el breakpoint de tablet

    /* ------------------------------------------------------------------
       2. Utilidades
       ------------------------------------------------------------------ */
    function $(selector, scope) {
        return (scope || document).querySelector(selector);
    }

    function $all(selector, scope) {
        return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
    }

    function isMobile() {
        return window.innerWidth < MOBILE_BREAKPOINT;
    }

    /* ------------------------------------------------------------------
       3. Menu movil (hamburguesa)
       ------------------------------------------------------------------ */
    function initMenu() {
        var toggle = $('#navToggle');
        var menu   = $('#navMenu');

        if (!toggle || !menu) return;

        var icon      = toggle.querySelector('i');
        var iconOpen  = 'fa-solid fa-xmark';
        var iconClose = 'fa-solid fa-bars';

        function setState(isOpen) {
            menu.classList.toggle('is-open', isOpen);
            toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            toggle.setAttribute('aria-label', isOpen ? 'Cerrar menu' : 'Abrir menu');
            document.body.classList.toggle('is-locked', isOpen && isMobile());

            if (icon) {
                icon.classList.toggle(iconOpen, isOpen);
                icon.classList.toggle(iconClose, !isOpen);
            }
        }

        function open()  { setState(true); }
        function close() { setState(false); }

        // Alternar el menu
        toggle.addEventListener('click', function () {
            var isOpen = toggle.getAttribute('aria-expanded') === 'true';
            if (isOpen) { close(); } else { open(); }
        });

        // Cerrar al hacer clic en un enlace del menu
        $all('.nav__link', menu).forEach(function (link) {
            link.addEventListener('click', close);
        });

        // Cerrar al hacer clic fuera del menu
        document.addEventListener('click', function (event) {
            if (!menu.classList.contains('is-open')) return;
            if (menu.contains(event.target) || toggle.contains(event.target)) return;
            close();
        });

        // Cerrar con la tecla Escape
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && menu.classList.contains('is-open')) {
                close();
                toggle.focus();
            }
        });

        // Restablecer el estado al pasar a escritorio
        window.addEventListener('resize', function () {
            if (!isMobile()) {
                close();
            }
        });
    }

    /* ------------------------------------------------------------------
       4. Animaciones 'fade-in' con IntersectionObserver
       ------------------------------------------------------------------ */
    function initRevealAnimations() {
        var elements = $all('.reveal');

        if (!elements.length) return;

        var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Sin soporte para IntersectionObserver o con movimiento reducido:
        // mostrar todo el contenido de inmediato.
        if (!('IntersectionObserver' in window) || prefersReducedMotion) {
            elements.forEach(function (el) {
                el.classList.add('is-visible');
            });
            return;
        }

        var observer = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;

                entry.target.classList.add('is-visible');
                obs.unobserve(entry.target); // animar una sola vez
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -60px 0px'
        });

        elements.forEach(function (el) {
            observer.observe(el);
        });
    }

    /* ------------------------------------------------------------------
       5. Resaltado del enlace activo segun la seccion visible
       ------------------------------------------------------------------ */
    function initScrollSpy() {
        var links = $all('.nav__link');
        var navbar = $('.navbar');

        if (!links.length) return;

        var sections = links.map(function (link) {
            var href = link.getAttribute('href');
            return href && href.charAt(0) === '#' ? $(href) : null;
        });

        function setActive(link) {
            links.forEach(function (item) {
                item.classList.toggle('is-active', item === link);
            });
        }

        // Sombra del navbar al hacer scroll
        if (navbar) {
            var onScroll = function () {
                navbar.classList.toggle('is-scrolled', window.scrollY > 20);
            };
            window.addEventListener('scroll', onScroll, { passive: true });
            onScroll();
        }

        if (!('IntersectionObserver' in window)) return;

        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;

                var index = sections.indexOf(entry.target);
                if (index !== -1) {
                    setActive(links[index]);
                }
            });
        }, {
            threshold: 0.4,
            rootMargin: '-130px 0px -45% 0px'
        });

        sections.forEach(function (section) {
            if (section) spy.observe(section);
        });
    }

    /* ------------------------------------------------------------------
       6. Validacion y envio de formularios por WhatsApp
       ------------------------------------------------------------------ */
    function sendFormToWhatsApp(form, requiredNames, createMessage, openNewTab) {
        var values = {};
        var firstInvalid = null;

        requiredNames.forEach(function (name) {
            var field = form.elements[name];
            var value = field.value.trim();
            values[name] = value;

            if (!value || !field.checkValidity()) {
                field.classList.add('is-invalid');
                if (!firstInvalid) firstInvalid = field;
            } else {
                field.classList.remove('is-invalid');
            }
        });

        if (firstInvalid) {
            firstInvalid.focus();
            return;
        }

        var url = WHATSAPP_BASE + '?text=' + encodeURIComponent(createMessage(values));
        if (openNewTab) {
            window.open(url, '_blank', 'noopener');
        } else {
            window.location.href = url;
        }
    }

    function clearFormErrors(form) {
        $all('.field input, .field select, .field textarea', form).forEach(function (field) {
            field.addEventListener('input', function () {
                field.classList.remove('is-invalid');
            });
            field.addEventListener('change', function () {
                field.classList.remove('is-invalid');
            });
        });
    }

    function initContactForm() {
        var form = $('#contactForm');
        if (!form) return;

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            sendFormToWhatsApp(form, ['nombre', 'telefono'], function (values) {
                return [
                    'Hola MS JUDIOSCA, solicito una asesoria.',
                    '',
                    'Nombre: ' + values.nombre,
                    'Telefono: ' + values.telefono,
                    'Servicio: ' + form.elements.servicio.value.trim(),
                    'Mensaje: ' + (form.elements.mensaje.value.trim() || 'Sin mensaje adicional')
                ].join('\n');
            }, true);
        });

        clearFormErrors(form);
    }

    function initEmploymentForm() {
        var form = $('#employmentForm');
        if (!form) return;

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            sendFormToWhatsApp(form, ['nombre', 'telefono', 'experiencia'], function (values) {
                return [
                    'Hola MS JUDIOSCA, deseo postularme para trabajar con ustedes.',
                    '',
                    'Nombre: ' + values.nombre,
                    'Telefono: ' + values.telefono,
                    'Experiencia previa o area de interes: ' + values.experiencia
                ].join('\n');
            }, false);
        });

        clearFormErrors(form);
    }

    /* ------------------------------------------------------------------
       8. Smooth scroll nativo (fallback para navegadores antiguos)
       ------------------------------------------------------------------ */
    function initSmoothScroll() {
        var supportsNative = 'scrollBehavior' in document.documentElement.style;
        if (supportsNative) return;

        $all('a[href^="#"]').forEach(function (link) {
            link.addEventListener('click', function (event) {
                var target = $(link.getAttribute('href'));
                if (!target) return;

                event.preventDefault();
                window.scrollTo(0, target.offsetTop - 110);
            });
        });
    }

    /* ------------------------------------------------------------------
       9. Inicializacion
       ------------------------------------------------------------------ */
    function init() {
        initMenu();
        initRevealAnimations();
        initScrollSpy();
        initContactForm();
        initEmploymentForm();
        initSmoothScroll();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();