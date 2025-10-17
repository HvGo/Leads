import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🔍 DIAGNÓSTICO COMPLETO - PÁGINA EN BLANCO\n');
console.log('='.repeat(60));

// 1. VERIFICAR BUILD
console.log('\n📦 1. VERIFICANDO BUILD...');
const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');

if (!fs.existsSync(distPath)) {
  console.log('❌ ERROR: Directorio dist/ NO EXISTE');
  console.log('   Solución: Ejecutar npm run build');
} else {
  console.log('✅ Directorio dist/ existe');
  
  if (!fs.existsSync(indexPath)) {
    console.log('❌ ERROR: index.html NO EXISTE en dist/');
  } else {
    console.log('✅ index.html existe');
    
    // Verificar contenido de index.html
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    const hasScripts = indexContent.includes('<script');
    const hasRoot = indexContent.includes('id="root"');
    
    console.log(`   - Tiene <script>: ${hasScripts ? '✅' : '❌'}`);
    console.log(`   - Tiene #root: ${hasRoot ? '✅' : '❌'}`);
    
    // Extraer rutas de scripts
    const scriptMatches = indexContent.match(/src="([^"]+\.js)"/g);
    if (scriptMatches) {
      console.log('\n   📄 Scripts encontrados:');
      scriptMatches.forEach(match => {
        const src = match.match(/src="([^"]+)"/)[1];
        const scriptPath = path.join(distPath, src.replace(/^\//, ''));
        const exists = fs.existsSync(scriptPath);
        console.log(`      ${exists ? '✅' : '❌'} ${src}`);
      });
    }
  }
  
  // Verificar directorio assets
  const assetsPath = path.join(distPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    const files = fs.readdirSync(assetsPath);
    console.log(`\n   📁 Assets (${files.length} archivos):`);
    files.slice(0, 5).forEach(file => {
      const size = fs.statSync(path.join(assetsPath, file)).size;
      console.log(`      - ${file} (${(size / 1024).toFixed(2)} KB)`);
    });
    if (files.length > 5) {
      console.log(`      ... y ${files.length - 5} más`);
    }
  } else {
    console.log('   ⚠️  Directorio assets/ no existe');
  }
}

// 2. VERIFICAR CONFIGURACIÓN DE VITE
console.log('\n\n⚙️  2. VERIFICANDO CONFIGURACIÓN DE VITE...');
const viteConfigPath = path.join(__dirname, 'vite.config.ts');
if (fs.existsSync(viteConfigPath)) {
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf-8');
  const hasBase = viteConfig.includes("base:");
  const baseValue = viteConfig.match(/base:\s*['"]([^'"]+)['"]/);
  
  console.log(`✅ vite.config.ts existe`);
  console.log(`   - Tiene 'base': ${hasBase ? '✅' : '❌'}`);
  if (baseValue) {
    console.log(`   - Valor de base: "${baseValue[1]}"`);
    if (baseValue[1] === './') {
      console.log('   ✅ Base configurado correctamente para rutas relativas');
    } else {
      console.log('   ⚠️  Base debería ser "./" para rutas relativas');
    }
  }
} else {
  console.log('❌ vite.config.ts NO EXISTE');
}

// 3. VERIFICAR SERVIDOR
console.log('\n\n🖥️  3. VERIFICANDO CONFIGURACIÓN DEL SERVIDOR...');
const serverPath = path.join(__dirname, 'server.js');
if (fs.existsSync(serverPath)) {
  const serverContent = fs.readFileSync(serverPath, 'utf-8');
  
  const hasStaticServe = serverContent.includes('express.static');
  const hasDistPath = serverContent.includes("'dist'") || serverContent.includes('"dist"');
  const hasHelmet = serverContent.includes('helmet(');
  const helmetDisabled = serverContent.includes('// app.use(helmet') || 
                         serverContent.includes('hsts: false');
  
  console.log('✅ server.js existe');
  console.log(`   - Sirve archivos estáticos: ${hasStaticServe ? '✅' : '❌'}`);
  console.log(`   - Configurado para dist/: ${hasDistPath ? '✅' : '❌'}`);
  console.log(`   - Helmet configurado: ${hasHelmet ? '✅' : '❌'}`);
  console.log(`   - HSTS deshabilitado: ${helmetDisabled ? '✅' : '❌'}`);
} else {
  console.log('❌ server.js NO EXISTE');
}

// 4. VERIFICAR VARIABLES DE ENTORNO
console.log('\n\n🔐 4. VERIFICANDO VARIABLES DE ENTORNO...');
const envProdPath = path.join(__dirname, '.env.production');
if (fs.existsSync(envProdPath)) {
  const envContent = fs.readFileSync(envProdPath, 'utf-8');
  const lines = envContent.split('\n').filter(l => l.trim() && !l.startsWith('#'));
  
  console.log('✅ .env.production existe');
  console.log(`   Variables configuradas: ${lines.length}`);
  
  const hasDbUrl = lines.some(l => l.startsWith('DATABASE_URL='));
  const hasJwtSecret = lines.some(l => l.startsWith('JWT_SECRET='));
  const hasNodeEnv = lines.some(l => l.startsWith('NODE_ENV='));
  
  console.log(`   - DATABASE_URL: ${hasDbUrl ? '✅' : '❌'}`);
  console.log(`   - JWT_SECRET: ${hasJwtSecret ? '✅' : '❌'}`);
  console.log(`   - NODE_ENV: ${hasNodeEnv ? '✅' : '❌'}`);
} else {
  console.log('⚠️  .env.production NO EXISTE');
}

// 5. VERIFICAR ARCHIVOS REACT PRINCIPALES
console.log('\n\n⚛️  5. VERIFICANDO ARCHIVOS REACT...');
const reactFiles = [
  'src/main.tsx',
  'src/App.tsx',
  'src/context/AuthContext.tsx',
  'src/services/api.ts'
];

reactFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  
  if (exists && file === 'src/services/api.ts') {
    const content = fs.readFileSync(filePath, 'utf-8');
    const hasBaseURL = content.includes('baseURL');
    const hasAxios = content.includes('axios');
    console.log(`      - Configuración de Axios: ${hasAxios ? '✅' : '❌'}`);
    console.log(`      - BaseURL configurado: ${hasBaseURL ? '✅' : '❌'}`);
  }
});

// 6. VERIFICAR DEPENDENCIAS
console.log('\n\n📚 6. VERIFICANDO DEPENDENCIAS...');
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('✅ node_modules/ existe');
  
  const criticalDeps = ['react', 'react-dom', 'react-router-dom', 'axios', 'express'];
  criticalDeps.forEach(dep => {
    const depPath = path.join(nodeModulesPath, dep);
    const exists = fs.existsSync(depPath);
    console.log(`   ${exists ? '✅' : '❌'} ${dep}`);
  });
} else {
  console.log('❌ node_modules/ NO EXISTE');
  console.log('   Solución: Ejecutar npm install');
}

// RESUMEN Y RECOMENDACIONES
console.log('\n\n' + '='.repeat(60));
console.log('📋 RESUMEN Y RECOMENDACIONES\n');

const issues = [];
const solutions = [];

if (!fs.existsSync(distPath)) {
  issues.push('Build no ejecutado');
  solutions.push('1. Ejecutar: npm run build');
}

if (!fs.existsSync(nodeModulesPath)) {
  issues.push('Dependencias no instaladas');
  solutions.push('2. Ejecutar: npm install');
}

if (issues.length === 0) {
  console.log('✅ No se detectaron problemas obvios en el código local.\n');
  console.log('🔍 SIGUIENTE PASO: Verificar en el servidor de producción:\n');
  console.log('   En tu droplet, ejecuta:');
  console.log('   1. cd /ruta/a/tu/proyecto');
  console.log('   2. node diagnose-blank-page.js');
  console.log('   3. pm2 logs crm-api --lines 50');
  console.log('   4. curl http://localhost:3001/test');
  console.log('   5. curl http://localhost:3001/api/health');
  console.log('\n   Luego verifica en el navegador:');
  console.log('   - Abre DevTools (F12)');
  console.log('   - Pestaña Console: busca errores JavaScript');
  console.log('   - Pestaña Network: verifica que los archivos .js se carguen (200)');
  console.log('   - Pestaña Application: verifica localStorage/cookies');
} else {
  console.log('❌ PROBLEMAS DETECTADOS:\n');
  issues.forEach((issue, i) => {
    console.log(`   ${i + 1}. ${issue}`);
  });
  
  console.log('\n💡 SOLUCIONES:\n');
  solutions.forEach(solution => {
    console.log(`   ${solution}`);
  });
}

console.log('\n' + '='.repeat(60) + '\n');
