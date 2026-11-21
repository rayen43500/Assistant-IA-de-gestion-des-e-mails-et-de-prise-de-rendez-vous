/**
 * Health check & validation script for all 4 services
 */

const services = [
  { name: 'Microservice IA', url: 'http://localhost:8000/health' },
  { name: 'Moteur n8n Automatisations', url: 'http://localhost:5678/health' },
  { name: 'Backend API Express', url: 'http://localhost:5000/health' },
  { name: 'Frontend React', url: 'http://localhost:5173' }
];

async function checkAll() {
  console.log('=======================================================');
  console.log('🩺 BILAN DE SANTÉ DES SERVICES LOCAUX (PRODUCTION 2026)');
  console.log('=======================================================');

  for (const s of services) {
    try {
      const res = await fetch(s.url);
      const isJson = (res.headers.get('content-type') || '').includes('json');
      const data = isJson ? await res.json() : { status: res.statusText };
      console.log(`✅ [${s.name}] : OPÉRATIONNEL (${res.status} OK) ->`, data.status || 'OK');
    } catch (e) {
      console.log(`⚠️ [${s.name}] : Non joignable (${e.message})`);
    }
  }
  console.log('=======================================================');
}

checkAll();
