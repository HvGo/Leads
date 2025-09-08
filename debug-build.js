import fs from 'fs';
import path from 'path';

console.log('🔍 DIAGNÓSTICO DE BUILD');
console.log('======================\n');

// Verificar directorio dist
const distPath = path.join(process.cwd(), 'dist');
console.log('📁 Verificando directorio dist...');
console.log('Ruta:', distPath);

if (fs.existsSync(distPath)) {
  console.log('✅ Directorio dist existe');
  
  const files = fs.readdirSync(distPath);
  console.log('📄 Archivos en dist:', files.length);
  files.forEach(file => {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    console.log(`  - ${file} (${stats.size} bytes)`);
  });
  
  // Verificar index.html
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    console.log('✅ index.html existe');
    const content = fs.readFileSync(indexPath, 'utf8');
    console.log('📝 Primeras líneas de index.html:');
    console.log(content.substring(0, 200) + '...');
  } else {
    console.log('❌ index.html NO existe');
  }
} else {
  console.log('❌ Directorio dist NO existe');
  console.log('💡 Ejecuta: npm run build');
}

// Verificar package.json scripts
console.log('\n📋 Scripts disponibles:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
Object.entries(packageJson.scripts).forEach(([name, script]) => {
  console.log(`  ${name}: ${script}`);
});

console.log('\n🌐 Variables de entorno relevantes:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('VITE_API_URL:', process.env.VITE_API_URL || 'undefined');
