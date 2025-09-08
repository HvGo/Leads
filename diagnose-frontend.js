import fs from 'fs';
import path from 'path';

console.log('🔍 DIAGNÓSTICO COMPLETO DEL FRONTEND');
console.log('=====================================\n');

// 1. Verificar directorio dist y archivos
console.log('📁 1. VERIFICANDO BUILD:');
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  console.log('✅ Directorio dist existe');
  const files = fs.readdirSync(distPath);
  console.log(`📄 Archivos: ${files.length}`);
  files.forEach(file => {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    console.log(`  - ${file} (${stats.size} bytes)`);
  });
  
  // Verificar index.html
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    console.log('\n📝 Contenido de index.html:');
    console.log(content.substring(0, 500) + '...\n');
    
    // Verificar que tenga el div root
    if (content.includes('<div id="root">')) {
      console.log('✅ Div root encontrado');
    } else {
      console.log('❌ Div root NO encontrado');
    }
    
    // Verificar scripts
    const scriptMatches = content.match(/src="[^"]*\.js"/g);
    if (scriptMatches) {
      console.log('✅ Scripts encontrados:', scriptMatches.length);
      scriptMatches.forEach(script => console.log(`  - ${script}`));
    } else {
      console.log('❌ No se encontraron scripts');
    }
  } else {
    console.log('❌ index.html NO existe');
  }
} else {
  console.log('❌ Directorio dist NO existe - ejecutar npm run build');
}

// 2. Verificar configuración de Vite
console.log('\n🔧 2. CONFIGURACIÓN VITE:');
if (fs.existsSync('vite.config.ts')) {
  const viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
  if (viteConfig.includes("base: './'")) {
    console.log('✅ Base configurada como relativa');
  } else {
    console.log('❌ Base NO configurada como relativa');
  }
} else {
  console.log('❌ vite.config.ts no encontrado');
}

// 3. Verificar variables de entorno
console.log('\n🌐 3. VARIABLES DE ENTORNO:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('VITE_API_URL:', process.env.VITE_API_URL || 'undefined');

// 4. Verificar archivos críticos del frontend
console.log('\n📋 4. ARCHIVOS CRÍTICOS:');
const criticalFiles = [
  'src/App.tsx',
  'src/main.tsx',
  'src/index.css',
  'src/context/AuthContext.tsx',
  'src/services/api.ts'
];

criticalFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

// 5. Comandos de diagnóstico para el servidor
console.log('\n🔧 5. COMANDOS PARA EJECUTAR EN EL DROPLET:');
console.log('# Verificar que el servidor esté sirviendo archivos estáticos:');
console.log('curl -I http://159.65.169.239:3001/');
console.log('curl -I http://159.65.169.239:3001/assets/index-[HASH].js');
console.log('');
console.log('# Verificar API:');
console.log('curl http://159.65.169.239:3001/api/health');
console.log('');
console.log('# Ver logs del servidor:');
console.log('pm2 logs crm-api --lines 50');
console.log('');
console.log('# Verificar proceso:');
console.log('pm2 status');
console.log('ps aux | grep node');

console.log('\n💡 6. POSIBLES CAUSAS:');
console.log('1. Build no ejecutado o incompleto');
console.log('2. Archivos JavaScript no se cargan (error 404)');
console.log('3. Error en la inicialización de React');
console.log('4. Problema de CORS en las llamadas API');
console.log('5. Error en el AuthContext al verificar token');
console.log('6. Servidor no sirviendo archivos estáticos correctamente');

console.log('\n🚀 SOLUCIONES RECOMENDADAS:');
console.log('1. Reconstruir: npm run build');
console.log('2. Verificar logs del navegador (F12 > Console)');
console.log('3. Verificar Network tab para ver qué archivos fallan');
console.log('4. Probar en modo incógnito');
console.log('5. Limpiar cache del navegador');
