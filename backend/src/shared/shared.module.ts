import { Module, Global } from '@nestjs/common';
import { DeviceDetectorService } from './services/device-detector.service';
import { BcryptService } from './services/bcrypt.service';

@Global() // Make this module global so its providers are available everywhere
@Module({
  providers: [DeviceDetectorService, BcryptService],
  exports: [DeviceDetectorService, BcryptService],
})
export class SharedModule {}
