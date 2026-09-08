import { bootstrapNestApp } from '@core-platform/common';
import { AppModule } from './app/app.module';

bootstrapNestApp(AppModule, { defaultPort: 3003, serviceName: 'cart-service' });
