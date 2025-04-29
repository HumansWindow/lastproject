import { Module, Global } from '@nestjs/common';
import { DeviceDetectorService } from './services/device-detector.service';
import { BcryptService } from './services/bcrypt.service';
import { MemoryMonitorService } from './services/memory-monitor.service';
import { ErrorHandlingService } from './services/error-handling.service';

@Global() // Make this module global so its providers are available everywhere
@Module({
  providers: [DeviceDetectorService, BcryptService, MemoryMonitorService, ErrorHandlingService],
  exports: [DeviceDetectorService, BcryptService, ErrorHandlingService],
})
export class SharedModule {}
