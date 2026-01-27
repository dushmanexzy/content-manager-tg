import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
    @Get()
    getRoot(): string {
        return 'OK';
    }

    @Get('health')
    getHealth(): { status: string } {
        return { status: 'ok' };
    }
}
