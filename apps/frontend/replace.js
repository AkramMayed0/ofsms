const fs = require('fs');
const path = require('path');

const emojis = {
  '🔍': 'Search',
  '⚠': 'AlertTriangle',
  '✕': 'X',
  '👦': 'User',
  '👨‍👩‍👧': 'Users',
  '🤝': 'Handshake',
  '؟': 'User',
  '📞': 'Phone',
  '✉': 'Mail',
  '🔗': 'Link',
  '✅': 'CheckCircle2',
  '❌': 'XCircle',
  'ℹ': 'Info',
  '📝': 'FileEdit',
  '⚙': 'Settings',
  '➕': 'Plus',
  '➖': 'Minus',
  '🔽': 'ChevronDown',
  '◀': 'ChevronLeft',
  '▶': 'ChevronRight',
  '📄': 'FileText',
  '✓': 'Check'
};

const srcDir = 'd:/Githubrepo/ofsms/apps/frontend/src';

function getAllFiles(dirPath, arrayOfFiles) {
  let files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
    } else {
      if (file.endsWith('.jsx')) {
        arrayOfFiles.push(path.join(dirPath, file));
      }
    }
  });
  return arrayOfFiles;
}

const files = getAllFiles(srcDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  let neededIcons = new Set();
  
  Object.entries(emojis).forEach(([emoji, iconName]) => {
    if (content.includes(emoji)) {
      neededIcons.add(iconName);
      
      // Specifically for common patterns
      if (emoji === '🔍') content = content.replace(new RegExp(emoji, 'g'), '<Search size={16} />');
      if (emoji === '⚠') content = content.replace(new RegExp(emoji, 'g'), '<AlertTriangle size={18} />');
      if (emoji === '✕') content = content.replace(new RegExp(emoji, 'g'), '<X size={16} />');
      if (emoji === '🤝') content = content.replace(new RegExp(emoji, 'g'), '<Handshake size={32} />');
      if (emoji === '👨‍👩‍👧') content = content.replace(new RegExp(emoji, 'g'), '<Users size={18} />');
      if (emoji === '👦') content = content.replace(new RegExp(emoji, 'g'), '<User size={18} />');
      if (emoji === '✅') content = content.replace(new RegExp(emoji, 'g'), '<CheckCircle2 size={16} />');
      if (emoji === '❌') content = content.replace(new RegExp(emoji, 'g'), '<XCircle size={16} />');
      if (emoji === '📄') content = content.replace(new RegExp(emoji, 'g'), '<FileText size={16} />');
      if (emoji === '✓') content = content.replace(new RegExp(emoji, 'g'), '<Check size={16} />');
      if (emoji === '؟') content = content.replace(new RegExp('\\\\؟', 'g'), '<User size={16} />');
    }
  });

  if (neededIcons.size > 0 && content !== original) {
    const iconsArray = Array.from(neededIcons).join(', ');
    if (!content.includes('lucide-react')) {
      const importStmt = `\nimport { ${iconsArray} } from 'lucide-react';\n`;
      const firstImportMatch = content.match(/^import .*?;$/m);
      if (firstImportMatch) {
        content = content.replace(firstImportMatch[0], firstImportMatch[0] + importStmt);
      } else {
        content = importStmt + content;
      }
    } else {
      const lucideImportMatch = content.match(/import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/);
      if (lucideImportMatch) {
        let existing = lucideImportMatch[1].split(',').map(s => s.trim());
        let toAdd = Array.from(neededIcons).filter(i => !existing.includes(i));
        if (toAdd.length > 0) {
          const newImport = `import { ${existing.concat(toAdd).join(', ')} } from 'lucide-react'`;
          content = content.replace(lucideImportMatch[0], newImport);
        }
      }
    }
    
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
