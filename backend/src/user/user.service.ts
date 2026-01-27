import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type TelegramUserPayload = {
    telegramId: string;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
};

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: number) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    async findByTelegramId(telegramId: string) {
        return this.prisma.user.findUnique({
            where: { telegramId },
        });
    }

    async findOrCreateByTelegram(payload: TelegramUserPayload) {
        const { telegramId, username, firstName, lastName } = payload;

        return this.prisma.user.upsert({
            where: { telegramId },
            update: {
                username: username ?? undefined,
                firstName: firstName ?? undefined,
                lastName: lastName ?? undefined,
            },
            create: {
                telegramId,
                username: username ?? undefined,
                firstName: firstName ?? undefined,
                lastName: lastName ?? undefined,
            },
        });
    }
}
