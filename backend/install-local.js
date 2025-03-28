const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Main function to install dependencies locally
function installDependenciesLocally() {
  console.log('Installing dependencies locally in backend directory...');
  
  try {
    // Create temporary directories
    if (!fs.existsSync('./node_modules_local')) {
      fs.mkdirSync('./node_modules_local', { recursive: true });
    }
    
    // Create a temporary package.json with only the dependencies we need
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const tempPackage = {
      name: 'temp-package',
      version: '1.0.0',
      dependencies: {
        '@nestjs/core': packageJson.dependencies['@nestjs/core'],
        '@nestjs/common': packageJson.dependencies['@nestjs/common'],
        '@nestjs/event-emitter': packageJson.dependencies['@nestjs/event-emitter'],
        '@nestjs/platform-express': packageJson.dependencies['@nestjs/platform-express'],
        'reflect-metadata': packageJson.dependencies['reflect-metadata'],
        'nestjs-real-ip': packageJson.dependencies['nestjs-real-ip']
      }
    };

    // Save temporary package.json
    fs.writeFileSync('./temp-package.json', JSON.stringify(tempPackage, null, 2));
    
    // Install the dependencies directly to node_modules
    console.log('Installing critical dependencies...');
    execSync('npm install --no-save', { stdio: 'inherit' });
    
    // Setup node_modules structure
    setupNodeModules();
    
    // Clean up the temporary file
    if (fs.existsSync('./temp-package.json')) {
      fs.unlinkSync('./temp-package.json');
    }
    
    console.log('Dependencies set up successfully!');
  } catch (error) {
    console.error('Error installing dependencies:', error);
    process.exit(1);
  }
}

function setupNodeModules() {
  console.log('Setting up proper node_modules structure...');
  
  // Copy modules from parent to local
  const copyModulesToLocal = () => {
    const parentNodeModules = path.resolve('../node_modules');
    const localNodeModules = path.resolve('./node_modules');
    
    if (fs.existsSync(parentNodeModules)) {
      if (!fs.existsSync(localNodeModules)) {
        fs.mkdirSync(localNodeModules, { recursive: true });
      }
      
      // Create symlink for entire @nestjs directory
      const parentNestDir = path.join(parentNodeModules, '@nestjs');
      const localNestDir = path.join(localNodeModules, '@nestjs');
      
      if (fs.existsSync(parentNestDir)) {
        if (!fs.existsSync(localNestDir)) {
          fs.mkdirSync(localNestDir, { recursive: true });
        }
        
        // Get all directories in parent @nestjs and copy them
        const nestPackages = fs.readdirSync(parentNestDir)
          .filter(item => fs.statSync(path.join(parentNestDir, item)).isDirectory());
        
        nestPackages.forEach(pkg => {
          const srcPath = path.join(parentNestDir, pkg);
          const destPath = path.join(localNestDir, pkg);
          
          if (!fs.existsSync(destPath)) {
            console.log(`Copying @nestjs/${pkg} to local modules...`);
            execSync(`cp -r "${srcPath}" "${destPath}"`, { stdio: 'inherit' });
          }
        });
      }
      
      // Copy nestjs-real-ip package if it exists in parent
      const parentRealIp = path.join(parentNodeModules, 'nestjs-real-ip');
      const localRealIp = path.join(localNodeModules, 'nestjs-real-ip');
      
      if (fs.existsSync(parentRealIp) && !fs.existsSync(localRealIp)) {
        console.log('Copying nestjs-real-ip to local modules...');
        execSync(`cp -r "${parentRealIp}" "${localRealIp}"`, { stdio: 'inherit' });
      }
      
      // Other packages that might be directly required
      const otherPackages = ['rxjs', 'passport', 'typeorm', 'class-validator', 'class-transformer'];
      otherPackages.forEach(pkg => {
        const srcPath = path.join(parentNodeModules, pkg);
        const destPath = path.join(localNodeModules, pkg);
        
        if (fs.existsSync(srcPath) && !fs.existsSync(destPath)) {
          console.log(`Copying ${pkg} to local modules...`);
          execSync(`cp -r "${srcPath}" "${destPath}"`, { stdio: 'inherit' });
        }
      });
    }
  };
  
  // Additionally, create a link from local node_modules to parent node_modules for resolution
  const createNodeModulesLink = () => {
    const localNodeModules = path.resolve('./node_modules');
    const nodeModulesInNodeModules = path.join(localNodeModules, 'node_modules');
    
    if (!fs.existsSync(nodeModulesInNodeModules)) {
      const parentNodeModules = path.resolve('../node_modules');
      if (fs.existsSync(parentNodeModules)) {
        console.log('Creating node_modules symlink for nested resolution...');
        try {
          fs.symlinkSync(parentNodeModules, nodeModulesInNodeModules, 'junction');
        } catch (err) {
          console.log('Could not create symlink, trying to copy essential directories...');
          
          // If symlink fails, at least ensure nestjs-real-ip has its nested node_modules
          const realIpDir = path.join(localNodeModules, 'nestjs-real-ip');
          const realIpNodeModules = path.join(realIpDir, 'node_modules');
          
          if (fs.existsSync(realIpDir) && !fs.existsSync(realIpNodeModules)) {
            fs.mkdirSync(realIpNodeModules, { recursive: true });
            
            const realIpNestjsDir = path.join(realIpNodeModules, '@nestjs');
            fs.mkdirSync(realIpNestjsDir, { recursive: true });
            
            // Copy essential @nestjs packages for nestjs-real-ip
            ['common', 'core'].forEach(pkg => {
              const localPkg = path.join(localNodeModules, '@nestjs', pkg);
              const destPkg = path.join(realIpNestjsDir, pkg);
              
              if (fs.existsSync(localPkg) && !fs.existsSync(destPkg)) {
                execSync(`cp -r "${localPkg}" "${destPkg}"`, { stdio: 'inherit' });
              }
            });
          }
        }
      }
    }
  };
  
  // Force install critical packages locally
  const installCriticalPackages = () => {
    console.log('Installing critical packages locally...');
    execSync('npm install --no-save @nestjs/common@10.2.10 @nestjs/core@10.2.10 nestjs-real-ip@3.0.1 --force', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_PATH: './node_modules' }
    });
  };
  
  // Run setup steps
  installCriticalPackages();
  copyModulesToLocal();
  createNodeModulesLink();
}

installDependenciesLocally();
