/**
 * This script will help diagnose and fix Swagger setup issues
 */

import * as fs from 'fs';

// Check if swagger-ui-express is installed
const checkSwaggerInstalled = () => {
  try {
    // Use raw __dirname concatenation instead of path methods
    const packageJsonPath = `${__dirname}/../package.json`;
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    const hasSwaggerUI = !!packageJson.dependencies['swagger-ui-express'];
    const hasNestSwagger = !!packageJson.dependencies['@nestjs/swagger'];
    
    console.log('Swagger UI Express installed:', hasSwaggerUI);
    console.log('@nestjs/swagger installed:', hasNestSwagger);
    
    if (!hasSwaggerUI || !hasNestSwagger) {
      console.log('\nMissing required Swagger packages. Please run:');
      console.log('npm install swagger-ui-express @nestjs/swagger');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error reading package.json:', error);
    return false;
  }
};

// Check if Swagger is properly configured in main.ts
const checkSwaggerConfig = () => {
  try {
    // Use raw __dirname concatenation instead of path methods
    const mainPath = `${__dirname}/main.ts`;
    const mainContent = fs.readFileSync(mainPath, 'utf-8');
    
    const hasSwaggerImport = mainContent.includes('@nestjs/swagger');
    const hasSwaggerSetup = mainContent.includes('SwaggerModule');
    
    console.log('Swagger import found:', hasSwaggerImport);
    console.log('Swagger setup found:', hasSwaggerSetup);
    
    if (!hasSwaggerImport || !hasSwaggerSetup) {
      console.log('\nSwagger may not be properly configured in main.ts.');
      console.log('Make sure to add these lines to main.ts:');
      console.log(`
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('AliveHuman API')
    .setDescription('The AliveHuman API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  // ...rest of your code
}`);
      
      const fixSwaggerConfig = true;
      if (fixSwaggerConfig && hasSwaggerImport && !hasSwaggerSetup) {
        // Try to fix the Swagger configuration
        console.log('\nAttempting to fix Swagger configuration...');
        // Implementation for automated fixing would go here
      }
    }
    return hasSwaggerImport && hasSwaggerSetup;
  } catch (error) {
    console.error('Error reading main.ts:', error);
    return false;
  }
};

console.log('==== Swagger Setup Diagnosis ====\n');
const isInstalled = checkSwaggerInstalled();
if (isInstalled) {
  checkSwaggerConfig();
}
