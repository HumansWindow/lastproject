const fs = require('fs');
const path = require('path');

// Function to completely disable the schedule module
function patchScheduleModule() {
  console.log('Disabling schedule module...');
  
  // 1. Replace schedule.module.js with a no-op version
  const scheduleModulePath = path.resolve('./node_modules/@nestjs/schedule/dist/schedule.module.js');
  if (fs.existsSync(scheduleModulePath)) {
    const simpleModule = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleModule = void 0;
const common_1 = require("@nestjs/common");

// No-op Schedule Module
let ScheduleModule = exports.ScheduleModule = class ScheduleModule {
    static forRoot(options = {}) {
        return {
            module: ScheduleModule,
            providers: []
        };
    }
    
    static forFeature() {
        return {
            module: ScheduleModule,
            providers: []
        };
    }
};
ScheduleModule = exports.ScheduleModule = __decorate([
    (0, common_1.Module)({})
], ScheduleModule);
`;
    fs.writeFileSync(scheduleModulePath, simpleModule, 'utf8');
    console.log('Schedule module patched to no-op version');
  } else {
    console.log('Schedule module file not found');
  }
  
  // 2. Create a dummy version of the required files
  const createDummyFile = (filePath, content) => {
    const fullPath = path.resolve(`./node_modules/@nestjs/schedule/dist/${filePath}`);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Created dummy file: ${filePath}`);
  };
  
  // Create minimal dummy files
  createDummyFile('scheduler.registry.js', `
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerRegistry = void 0;
const common_1 = require("@nestjs/common");
let SchedulerRegistry = exports.SchedulerRegistry = class SchedulerRegistry {
  constructor() {}
  getCronJob() { return null; }
  addCronJob() {}
  doesExist() { return false; }
};
exports.SchedulerRegistry = SchedulerRegistry;
  `);
  
  createDummyFile('schedule-metadata.accessor.js', `
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleMetadataAccessor = void 0;
const common_1 = require("@nestjs/common");
let ScheduleMetadataAccessor = exports.ScheduleMetadataAccessor = class ScheduleMetadataAccessor {};
exports.ScheduleMetadataAccessor = ScheduleMetadataAccessor;
  `);
  
  createDummyFile('discovery/discovery.service.js', `
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscoveryService = void 0;
const common_1 = require("@nestjs/common");
let DiscoveryService = exports.DiscoveryService = class DiscoveryService {
  getProviders() { return []; }
};
exports.DiscoveryService = DiscoveryService;
  `);
  
  console.log('Schedule module dependencies patched successfully');
}

// Execute the patch
try {
  patchScheduleModule();
} catch (error) {
  console.error('Error patching schedule module:', error);
}
