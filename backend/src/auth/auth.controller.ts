import { Body, Controller, Post } from '@nestjs/common';
import { IsString } from 'class-validator';
import { AuthService } from './auth.service';

class TelegramAuthDto {
    @IsString()
    initData: string;
}

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('telegram')
    async authenticateWithTelegram(@Body() dto: TelegramAuthDto) {
        return this.authService.authenticateWithTelegram(dto.initData);
    }
}
