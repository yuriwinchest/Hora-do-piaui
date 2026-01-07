const fs = require('fs');
const path = require('path');

// Usar o arquivo BACKUP
const inputPath = path.join(__dirname, '../public/assets/favicon-backup.png');
const outputPath = path.join(__dirname, '../public/logo-circle.svg');

try {
    if (!fs.existsSync(inputPath)) {
        console.error('Arquivo de entrada não encontrado:', inputPath);
        process.exit(1);
    }

    const imageBuffer = fs.readFileSync(inputPath);
    const base64Image = imageBuffer.toString('base64');

    // Cor verde do tema: #16a34a
    // REMOVIDO O FILTRO BRANCO para preservar as cores originais do desenho (H e Relógio)
    const svgContent = `<svg width="100%" height="100%" viewBox="0 0 100 100" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  
  <!-- Fundo Circular Verde -->
  <circle cx="50" cy="50" r="50" fill="#16a34a" />
  
  <!-- Imagem Original Centralizada (mantendo cores originais) -->
  <image x="15" y="15" width="70" height="70" 
         preserveAspectRatio="xMidYMid meet" 
         xlink:href="data:image/png;base64,${base64Image}" />
</svg>`;

    fs.writeFileSync(outputPath, svgContent);
    console.log('Favicon (Original Colors) criado com sucesso em:', outputPath);
} catch (error) {
    console.error('Erro ao processar favicon:', error);
    process.exit(1);
}
