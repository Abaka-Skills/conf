// Shared site footer for the portal and every planner page.
// Usage: <footer id="site-footer" data-source-url="…" data-source-label="…"></footer>
//        <script src="assets/footer.js"></script>   (planners: ../assets/footer.js)
// data-source-* is optional: planners name their data source, the portal leaves it out.
// data-width (optional) matches the page's content width so the footer lines up with it.
// A script (not fetched HTML) so pages keep working when opened via file://.
(function () {
  const f = document.getElementById('site-footer');
  if (!f) return;
  const LINKS = [
    ['abaka.ai', 'https://abaka.ai'],
    ['GitHub', 'https://github.com/Abaka-Skills/conf'],
    ['about me', 'https://neutrinoliu.github.io'],
  ];
  const a = (label, href) => '<a href="' + href + '" target="_blank" rel="noopener">' + label + '</a>';
  const src = f.dataset.sourceUrl;
  const left = src
    ? 'Data from ' + a(f.dataset.sourceLabel || src, src) + ' · favorites stay in this browser'
    : "Schedule data belongs to each conference's organizers";
  const style = document.createElement('style');
  style.textContent =
    'footer.sitefoot{border-top:1px solid #262a40;padding:16px 24px 22px;margin:0;color:#9aa3c0;font-size:12.5px;text-align:left}' +
    'footer.sitefoot .in{max-width:var(--foot-w,1452px);margin:0 auto;display:flex;justify-content:space-between;align-items:center;gap:8px 24px;flex-wrap:wrap}' +
    'footer.sitefoot a{color:#9aa3c0;text-decoration:none}footer.sitefoot a:hover{color:#e9ecf5;text-decoration:underline}' +
    'footer.sitefoot nav{display:flex;gap:18px;flex-wrap:wrap}footer.sitefoot span a{text-decoration:underline dotted}' +
    '@media (max-width:700px){footer.sitefoot .in{justify-content:center;text-align:center}}';
  document.head.appendChild(style);
  f.className = 'sitefoot';
  if (f.dataset.width) f.style.setProperty('--foot-w', f.dataset.width);
  f.innerHTML = '<div class="in"><span>' + left + '</span><nav>' + LINKS.map(l => a(l[0], l[1])).join('') + '</nav></div>';
})();
