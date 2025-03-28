import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      dropSchema: true,
      entities: [__dirname + '/../**/*.entity.{js,ts}'],
      logging: false,
    }),
  ],
})
export class MockAppModule {}
