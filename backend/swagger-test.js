try {
  const swagger = require('@nestjs/swagger');
  console.log('✅ @nestjs/swagger can be imported');
  console.log('Available exports:', Object.keys(swagger));
} catch (e) {
  console.log('❌ Error importing @nestjs/swagger:', e.message);
}

try {
  const swaggerUI = require('swagger-ui-express');
  console.log('✅ swagger-ui-express can be imported');
  console.log('Available exports:', Object.keys(swaggerUI));
} catch (e) {
  console.log('❌ Error importing swagger-ui-express:', e.message);
}
