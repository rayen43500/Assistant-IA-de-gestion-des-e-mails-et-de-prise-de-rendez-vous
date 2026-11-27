/**
 * Campagne de tests qualité ISO/IEC 25010 — une seule commande, en local (cmd / PowerShell) comme en CI.
 *
 *   node run-all.js                 → toutes les couches
 *   node run-all.js unit api e2e    → couches choisies
 *
 * Couches : unit, python, lint, dup, sca, sast, api, e2e, perf, dast, zap, portability
 * Chaque couche écrit son journal brut dans quality/reports/<couche>.log ;
 * le résumé (résultats réellement mesurés) est écrit dans quality/reports/summary.md et summary.json.
 */
import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { startStack, stopStack, QA } from './stack.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const REPORTS = path.join(HERE, 'reports');
fs.mkdirSync(REPORTS, { recursive: true });

const IS_WIN = process.platform === 'win32';
const BIN = (name) => path.join(HERE, 'node_modules', '.bin', IS_WIN ? `${name}.cmd` : name);

const ALL = ['unit', 'python', 'lint', 'dup', 'sca', 'sast', 'api', 'e2e', 'perf', 'dast', 'zap', 'portability'];
const NEEDS_STACK = new Set(['api', 'e2e', 'perf', 'dast', 'zap']);
const selected = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const layers = selected.length ? selected : ALL;
const unknown = layers.filter((l) => !ALL.includes(l));
if (unknown.length) {
  console.error(`Couche(s) inconnue(s) : ${unknown.join(', ')}\nCouches disponibles : ${ALL.join(', ')}`);
  process.exit(2);
}

/** Exécute une commande, affiche la sortie en direct et la conserve dans reports/<log>.log */
function sh(cmd, args, { cwd = ROOT, env = process.env, log } = {}) {
  return new Promise((resolve) => {
    const out = fs.createWriteStream(path.join(REPORTS, `${log}.log`), { flags: 'a' });
    out.write(`$ ${cmd} ${args.join(' ')}\n`);
    // Windows : commande passée en une seule chaîne (pas de concaténation implicite d'arguments)
    const quote = (a) => (/[s&()]/.test(a) && !/^".*"$/.test(a) ? `"${a}"` : a);
    const p = IS_WIN
      ? spawn([cmd, ...args].map(quote).join(' '), { cwd, env, shell: true })
      : spawn(cmd, args, { cwd, env });
    let text = '';
    const onData = (d) => { text += d; out.write(d); if (process.env.QA_VERBOSE) process.stdout.write(d); };
    p.stdout.on('data', onData);
    p.stderr.on('data', onData);
    p.on('close', (code) => { out.end(); resolve({ code, text }); });
  });
}

function hasCommand(cmd, args = ['--version']) {
  const r = spawnSync(cmd, args, { shell: IS_WIN, encoding: 'utf8' });
  return r.status === 0;
}

function pythonExe() {
  if (process.env.PYTHON) return process.env.PYTHON;
  const venv = path.join(ROOT, 'ai-service', '.venv', IS_WIN ? 'Scripts/python.exe' : 'bin/python');
  if (fs.existsSync(venv)) return venv;
  // Création automatique de l'environnement Python au premier lancement
  for (const [cmd, args] of [['py', ['-3.12']], ['python3', []], ['python', []]]) {
    if (!hasCommand(cmd, [...args, '-m', 'pip', '--version'])) continue;
    console.log('  → création de ai-service/.venv …');
    spawnSync(cmd, [...args, '-m', 'venv', path.join(ROOT, 'ai-service', '.venv')], { shell: IS_WIN, stdio: 'inherit' });
    spawnSync(venv, ['-m', 'pip', 'install', '-q', '-r', 'requirements-dev.txt'], { cwd: path.join(ROOT, 'ai-service'), stdio: 'inherit' });
    return venv;
  }
  return null;
}

const readJson = (f) => { try { return JSON.parse(fs.readFileSync(path.join(REPORTS, f), 'utf8')); } catch { return null; } };

// ------------------------------------------------------------------------------------------
// Définition des couches : iso = caractéristique ISO 25010, tool = outil réellement exécuté
// ------------------------------------------------------------------------------------------
const LAYERS = {
  async unit() {
    const lcov = path.join(REPORTS, 'backend-lcov.info');
    const r = await sh('node', ['--test', '--experimental-test-coverage', '--test-coverage-include=src/**',
      '--test-coverage-lines=70', '--test-coverage-branches=60', '--test-coverage-functions=60',
      '--test-reporter=spec', '--test-reporter-destination=stdout',
      '--test-reporter=lcov', `--test-reporter-destination=${lcov}`], { cwd: path.join(ROOT, 'backend'), log: 'unit' });
    const n = (k) => Number((r.text.match(new RegExp(`ℹ ${k} (\\d+)`)) || [])[1] || 0);
    const cov = r.text.match(/all files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)/);
    return {
      iso: '6.1 Aptitude fonctionnelle · 6.5 Fiabilité · 6.7 Maintenabilité',
      tool: 'node:test (unitaires + intégration MongoDB + fiabilité) + couverture native',
      ok: r.code === 0,
      result: `${n('pass')}/${n('tests')} tests réussis, ${n('fail')} échec(s)` + (cov ? ` — couverture lignes ${cov[1]} %, branches ${cov[2]} %, fonctions ${cov[3]} % (seuils 70/60/60)` : ''),
      report: 'reports/unit.log, reports/backend-lcov.info',
    };
  },

  async python() {
    const py = pythonExe();
    if (!py) return { iso: '6.1 Aptitude fonctionnelle', tool: 'pytest', ok: null, result: 'NON EXÉCUTÉ : aucun interpréteur Python avec pip trouvé', report: '-' };
    const r = await sh(py, ['-m', 'pytest', '-q', '--cov=main', '--cov-report=term', `--junitxml=${path.join(REPORTS, 'pytest-junit.xml')}`], { cwd: path.join(ROOT, 'ai-service'), log: 'python' });
    const passed = (r.text.match(/(\d+) passed/) || [])[1] || 0;
    const failed = (r.text.match(/(\d+) failed/) || [])[1] || 0;
    const cov = (r.text.match(/TOTAL\s+\d+\s+\d+\s+(\d+)%/) || [])[1];
    return {
      iso: '6.1 Aptitude fonctionnelle · 6.7 Maintenabilité', tool: 'pytest + pytest-cov + FastAPI TestClient (service IA)',
      ok: r.code === 0, result: `${passed} réussis, ${failed} échec(s)${cov ? ` — couverture ${cov} %` : ''}`, report: 'reports/python.log, reports/pytest-junit.xml',
    };
  },

  async lint() {
    const out = path.join(REPORTS, 'eslint.json');
    const r = await sh(BIN('eslint'), ['-c', 'quality/eslint.config.js', 'backend/src', 'frontend/src', '-f', 'json', '-o', out], { log: 'lint' });
    const data = readJson('eslint.json') || [];
    let errors = 0, warnings = 0, complexity = 0;
    for (const f of data) { errors += f.errorCount; warnings += f.warningCount; complexity += f.messages.filter((m) => m.ruleId === 'complexity').length; }
    return {
      iso: '6.6 Sécurité (SAST) · 6.7 Maintenabilité', tool: 'ESLint 9 + eslint-plugin-security + règles de complexité',
      ok: r.code === 0 && errors === 0, result: `${data.length} fichiers analysés — ${errors} erreur(s), ${warnings} avertissement(s) dont ${complexity} fonction(s) de complexité > 20`, report: 'reports/eslint.json',
    };
  },

  async dup() {
    const r = await sh(BIN('jscpd'), ['backend/src', 'frontend/src', 'ai-service/main.py', 'ai-service/server.js', '--ignore', '"**/seed.js"',
      '--min-lines', '8', '--min-tokens', '70', '--threshold', '10', '--reporters', 'console,json,html', '--output', 'quality/reports/jscpd'], { log: 'dup' });
    const rep = readJson('jscpd/jscpd-report.json');
    const pct = rep?.statistics?.total?.percentage;
    return {
      iso: '6.7 Maintenabilité', tool: 'jscpd (duplication de code)',
      ok: r.code === 0, result: pct !== undefined ? `${pct} % de lignes dupliquées (seuil 10 %), ${rep.statistics.total.clones} clone(s)` : 'voir journal', report: 'reports/jscpd/',
    };
  },

  async sca() {
    const parts = [];
    let ok = true;
    for (const dir of ['backend', 'frontend']) {
      const r = await sh('npm', ['audit', '--omit=dev', '--json'], { cwd: path.join(ROOT, dir), log: 'sca' });
      let v = null;
      try { v = JSON.parse(r.text.slice(r.text.indexOf('{'))).metadata.vulnerabilities; } catch { /* sortie inattendue */ }
      fs.writeFileSync(path.join(REPORTS, `npm-audit-${dir}.json`), r.text.slice(r.text.indexOf('{')));
      const high = v ? v.high + v.critical : NaN;
      if (!(high === 0)) ok = false;
      parts.push(v ? `${dir} : ${v.critical} critique, ${v.high} haute, ${v.moderate} modérée` : `${dir} : audit impossible (réseau ?)`);
    }
    const py = pythonExe();
    if (py) {
      const r = await sh(py, ['-m', 'pip_audit', '-r', 'requirements.txt', '-f', 'json', '-o', path.join(REPORTS, 'pip-audit.json')], { cwd: path.join(ROOT, 'ai-service'), log: 'sca' });
      const rep = readJson('pip-audit.json');
      const n = rep ? rep.dependencies.reduce((s, d) => s + (d.vulns?.length || 0), 0) : NaN;
      if (r.code !== 0) ok = false;
      parts.push(Number.isNaN(n) ? 'ai-service : pip-audit en échec (voir journal)' : `ai-service : ${n} vulnérabilité(s)`);
    } else parts.push('ai-service : NON EXÉCUTÉ (Python absent)');
    return { iso: '6.6 Sécurité (SCA)', tool: 'npm audit + pip-audit', ok, result: parts.join(' · '), report: 'reports/npm-audit-*.json, reports/pip-audit.json' };
  },

  async sast() {
    const py = pythonExe();
    if (!py) return { iso: '6.6 Sécurité (SAST)', tool: 'Bandit', ok: null, result: 'NON EXÉCUTÉ (Python absent)', report: '-' };
    const r = await sh(py, ['-m', 'bandit', '-r', 'main.py', 'train_model.py', '-ll', '-f', 'json', '-o', path.join(REPORTS, 'bandit.json')], { cwd: path.join(ROOT, 'ai-service'), log: 'sast' });
    const rep = readJson('bandit.json');
    const issues = rep ? rep.results.length : NaN;
    return { iso: '6.6 Sécurité (SAST)', tool: 'Bandit (service IA Python)', ok: r.code === 0, result: `${issues} problème(s) de sévérité moyenne ou haute`, report: 'reports/bandit.json' };
  },

  async api() {
    await sh('node', ['api/build-collection.js'], { cwd: HERE, log: 'api' });
    const r = await sh(BIN('newman'), ['run', 'api/medilaw.postman_collection.json',
      '--env-var', `baseUrl=${QA.backendUrl}`, '--env-var', `internalKey=${QA.internalKey}`,
      '-r', 'cli,junit,json,htmlextra',
      '--reporter-junit-export', 'reports/newman-junit.xml',
      '--reporter-json-export', 'reports/newman.json',
      '--reporter-htmlextra-export', 'reports/newman.html'], { cwd: HERE, log: 'api' });
    const st = readJson('newman.json')?.run?.stats;
    return {
      iso: '6.1 Aptitude fonctionnelle · 6.3 Compatibilité (contrat) · 6.6 Sécurité', tool: 'Postman / Newman',
      ok: r.code === 0,
      result: st ? `${st.requests.total} requêtes, ${st.assertions.total - st.assertions.failed}/${st.assertions.total} assertions réussies` : 'voir journal',
      report: 'reports/newman.html, reports/newman-junit.xml',
    };
  },

  async e2e() {
    const r = await sh(BIN('playwright'), ['test'], { cwd: HERE, env: { ...process.env, QA_FRONTEND_URL: QA.frontendUrl }, log: 'e2e' });
    const s = readJson('e2e-results.json')?.stats;
    const axe = ['accueil', 'praticien'].map((n) => readJson(`axe-${n}.json`)).filter(Boolean).flat();
    const serious = axe.filter((v) => v.impact === 'serious').length;
    return {
      iso: '6.1 Aptitude fonctionnelle · 6.3 Compatibilité (Chromium, Firefox, mobile) · 6.4 Facilité d’utilisation', tool: 'Playwright + axe-core',
      ok: r.code === 0,
      result: s ? `${s.expected} réussis, ${s.unexpected} échec(s), ${s.flaky} instable(s), ${s.skipped} ignoré(s) — accessibilité : 0 critique exigé, ${serious} règle(s) « serious » à corriger` : 'voir journal',
      report: 'reports/e2e-html/index.html, reports/e2e-junit.xml, reports/axe-*.json',
    };
  },

  async perf() {
    const r = await sh('node', ['perf/load-test.js', QA.backendUrl], { cwd: HERE, log: 'perf' });
    const res = readJson('perf-results.json')?.results || [];
    const reads = res.filter((x) => x.seuilP975Ms === 500);
    const worst = reads.reduce((m, x) => Math.max(m, x.p975Ms), 0);
    const login = res.find((x) => /login/.test(x.scenario));
    return {
      iso: '6.2 Efficacité de performance', tool: 'autocannon (charge HTTP, 20 connexions simultanées)',
      ok: r.code === 0,
      result: res.length ? `${reads.length} parcours de lecture : pire p97,5 = ${worst} ms (seuil 500 ms)` + (login ? ` · connexion bcrypt : p97,5 = ${login.p975Ms} ms (seuil 2000 ms)` : '') + `, ${res.reduce((s, x) => s + x.erreurs, 0)} erreur(s)` : 'voir journal',
      report: 'reports/perf-results.json',
    };
  },

  async dast() {
    const r = await sh('node', ['dast/security-probe.js', QA.backendUrl], { cwd: HERE, log: 'dast' });
    const c = readJson('dast-probe.json')?.checks || [];
    return {
      iso: '6.6 Sécurité (DAST)', tool: 'Sondes OWASP Top 10 sur l’application en marche',
      ok: r.code === 0, result: `${c.filter((x) => x.ok).length}/${c.length} contrôles conformes`, report: 'reports/dast-probe.json',
    };
  },

  async zap() {
    if (!hasCommand('docker', ['info'])) {
      return { iso: '6.6 Sécurité (DAST)', tool: 'OWASP ZAP baseline', ok: null, result: 'NON EXÉCUTÉ localement : Docker absent. Exécuté dans le pipeline CI (job « dast-zap »)', report: '-' };
    }
    const target = QA.backendUrl.replace('localhost', 'host.docker.internal');
    const r = await sh('docker', ['run', '--rm', '-v', `${REPORTS}:/zap/wrk:rw`, '--add-host=host.docker.internal:host-gateway',
      'ghcr.io/zaproxy/zaproxy:stable', 'zap-baseline.py', '-t', `${target}/api/public/doctors`, '-r', 'zap-report.html', '-J', 'zap-report.json', '-I'], { log: 'zap' });
    const rep = readJson('zap-report.json');
    const alerts = rep?.site?.flatMap((s) => s.alerts) || [];
    const high = alerts.filter((a) => Number(a.riskcode) >= 3).length;
    return { iso: '6.6 Sécurité (DAST)', tool: 'OWASP ZAP baseline (Docker)', ok: r.code === 0 && high === 0, result: `${alerts.length} alerte(s), dont ${high} de risque élevé`, report: 'reports/zap-report.html' };
  },

  async portability() {
    if (!hasCommand('docker', ['compose', 'version'])) {
      return { iso: '6.8 Portabilité', tool: 'Docker Compose', ok: null, result: 'NON EXÉCUTÉ localement : Docker absent. Exécuté dans le pipeline CI (job « portability »). Installation sans Docker vérifiée par ce script (npm ci + stack de test).', report: '-' };
    }
    const env = { ...process.env, JWT_SECRET: QA.jwtSecret, INTERNAL_API_KEY: QA.internalKey };
    const cfg = await sh('docker', ['compose', 'config', '-q'], { env, log: 'portability' });
    const build = await sh('docker', ['compose', 'build'], { env, log: 'portability' });
    return { iso: '6.8 Portabilité', tool: 'Docker Compose', ok: cfg.code === 0 && build.code === 0, result: `configuration ${cfg.code === 0 ? 'valide' : 'invalide'}, build des images ${build.code === 0 ? 'réussi' : 'en échec'}`, report: 'reports/portability.log' };
  },
};

// ------------------------------------------------------------------------------------------
const results = [];
const started = new Date();
let stackUp = false;
process.on('SIGINT', () => { stopStack(); process.exit(130); });

for (const f of fs.readdirSync(REPORTS)) if (f.endsWith('.log')) fs.rmSync(path.join(REPORTS, f));

try {
  for (const layer of layers) {
    if (NEEDS_STACK.has(layer) && !stackUp) {
      process.stdout.write('▶ Démarrage du stack de test (MongoDB, backend :5050, frontend :4173) … ');
      const t = Date.now();
      try {
        await startStack({ frontend: layers.includes('e2e') });
        stackUp = true;
        console.log(`prêt en ${((Date.now() - t) / 1000).toFixed(0)} s`);
      } catch (e) {
        console.log('ÉCHEC');
        console.error(e.message);
        stopStack();
        // Toutes les couches dépendant du stack sont déclarées en échec (jamais « réussies » par défaut)
        for (const l of layers.filter((x) => NEEDS_STACK.has(x))) {
          results.push({ layer: l, ok: false, iso: '-', tool: '-', result: `Stack de test indisponible : ${e.message}`, report: 'reports/backend.log', seconds: 0 });
        }
      }
    }
    if (results.some((r) => r.layer === layer)) continue;
    process.stdout.write(`▶ ${layer.padEnd(12)} `);
    const t0 = Date.now();
    let res;
    try {
      res = await LAYERS[layer]();
    } catch (e) {
      res = { iso: '-', tool: '-', ok: false, result: `Erreur d’exécution : ${e.message}`, report: `reports/${layer}.log` };
    }
    res.layer = layer;
    res.seconds = Math.round((Date.now() - t0) / 1000);
    results.push(res);
    console.log(`${res.ok === true ? '✔ OK    ' : res.ok === null ? '○ N/A   ' : '✖ ÉCHEC '} (${res.seconds} s) ${res.result}`);
  }
} finally {
  if (stackUp) stopStack();
}

const env = `Node ${process.version} · ${process.platform} ${process.arch}`;
const md = [
  `# Campagne de tests qualité ISO/IEC 25010`,
  ``,
  `- Date : ${started.toISOString()}`,
  `- Environnement : ${env}${process.env.CI ? ' · GitHub Actions' : ' · poste local'}`,
  `- Commande : \`node quality/run-all.js ${selected.join(' ')}\``,
  ``,
  `| Couche | Caractéristique ISO 25010 | Outil | Statut | Résultat mesuré | Preuve |`,
  `|---|---|---|---|---|---|`,
  ...results.map((r) => `| ${r.layer} | ${r.iso} | ${r.tool} | ${r.ok === true ? '✅ OK' : r.ok === null ? '⚪ Non exécuté' : '❌ Échec'} | ${r.result.replace(/\|/g, '/')} | ${r.report} |`),
  ``,
  `Toutes les valeurs ci-dessus sont extraites des sorties réelles des outils (journaux bruts dans \`quality/reports/*.log\`).`,
].join('\n');
fs.writeFileSync(path.join(REPORTS, 'summary.md'), md + '\n');
fs.writeFileSync(path.join(REPORTS, 'summary.json'), JSON.stringify({ date: started.toISOString(), env, results }, null, 2));
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');

const failed = results.filter((r) => r.ok === false);
console.log(`\nRésumé : ${results.filter((r) => r.ok).length} OK, ${failed.length} échec(s), ${results.filter((r) => r.ok === null).length} non exécutée(s) → quality/reports/summary.md`);
process.exit(failed.length ? 1 : 0);
