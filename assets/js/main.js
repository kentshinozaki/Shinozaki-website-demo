(() => {
  const root = document.documentElement;
  const STORAGE_KEY = "shinozaki-lang";

  /* ---------- language toggle ----------
     Every bilingual element keeps its original Japanese markup as the
     DOM's source of truth and carries `data-en` / `data-ko` / `data-zh`
     attributes with the translated replacement. On first run we cache
     each element's original (Japanese) innerHTML; toggling then just
     swaps innerHTML in place. An element doesn't need every language —
     if Korean or Chinese is selected but an element has no data-ko/data-zh
     yet, it falls back to English (still readable to most visitors)
     before finally falling back to the original Japanese. */
  const LANGS = ["ja", "en", "ko", "zh"];
  const FALLBACK = { en: [], ko: ["en"], zh: ["en"] };
  const HTML_LANG = { ja: "ja", en: "en", ko: "ko", zh: "zh-Hans" };
  const jaCache = new WeakMap();

  function collectBilingualEls(){
    return Array.from(document.querySelectorAll("[data-en],[data-ko],[data-zh]"));
  }

  function setLang(lang){
    if(!LANGS.includes(lang)) lang = "ja";
    const els = collectBilingualEls();
    els.forEach(el => {
      if(!jaCache.has(el)) jaCache.set(el, el.innerHTML);
      let translated = null;
      if(lang !== "ja"){
        for(const candidate of [lang, ...(FALLBACK[lang] || [])]){
          const v = el.getAttribute(`data-${candidate}`);
          if(v !== null){ translated = v; break; }
        }
      }
      el.innerHTML = translated !== null ? translated : jaCache.get(el);
    });

    root.setAttribute("data-lang", lang);
    root.setAttribute("lang", HTML_LANG[lang] || "ja");
    document.querySelectorAll("[data-lang-btn]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.langBtn === lang);
    });
    try{ localStorage.setItem(STORAGE_KEY, lang); }catch(e){}
  }

  function initLang(){
    // prime the cache with the untouched Japanese markup first
    collectBilingualEls().forEach(el => jaCache.set(el, el.innerHTML));

    let saved = "ja";
    try{ saved = localStorage.getItem(STORAGE_KEY) || "ja"; }catch(e){}
    setLang(saved);
    document.querySelectorAll("[data-lang-btn]").forEach(btn => {
      btn.addEventListener("click", () => setLang(btn.dataset.langBtn));
    });
  }

  /* ---------- header scroll state ---------- */
  function initHeader(){
    const header = document.querySelector(".site-header");
    if(!header) return;
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive:true });
  }

  /* ---------- mobile nav drawer ---------- */
  function initDrawer(){
    const toggle = document.querySelector(".nav-toggle");
    const drawer = document.querySelector(".nav-drawer");
    if(!toggle || !drawer) return;
    const close = drawer.querySelector(".close");
    toggle.addEventListener("click", () => drawer.classList.add("open"));
    close && close.addEventListener("click", () => drawer.classList.remove("open"));
    drawer.querySelectorAll("a").forEach(a => a.addEventListener("click", () => drawer.classList.remove("open")));
  }

  /* ---------- scroll reveal ---------- */
  function initReveal(){
    const items = document.querySelectorAll(".reveal");
    if(!("IntersectionObserver" in window) || !items.length){
      items.forEach(el => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold:.15, rootMargin:"0px 0px -60px 0px" });
    items.forEach(el => io.observe(el));
  }

  /* ---------- menu tabs (menu.html) ---------- */
  function initMenuTabs(){
    const tabs = document.querySelectorAll(".menu-tab");
    if(!tabs.length) return;
    // the tabs themselves carry data-store too (to say what they filter by) —
    // exclude them from the set of things the filter hides, or clicking one
    // store tab hides the other tab buttons along with the menu items.
    const items = Array.from(document.querySelectorAll("[data-store]")).filter(el => !el.classList.contains("menu-tab"));
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        const store = tab.dataset.store;
        items.forEach(el => {
          const list = el.dataset.store.split(" ");
          el.style.display = (store === "all" || list.includes(store)) ? "" : "none";
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initLang();
    initHeader();
    initDrawer();
    initReveal();
    initMenuTabs();
  });
})();
