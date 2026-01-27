import { Test, TestingModule } from '@nestjs/testing';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { UserService } from '../user/user.service';
import { SpaceService } from '../space/space.service';

describe('TelegramController', () => {
  let controller: TelegramController;

  const mockTelegramService = {
    sendMessage: jest.fn(),
    answerCallbackQuery: jest.fn(),
    editMessageText: jest.fn(),
  };

  const mockUserService = {
    findById: jest.fn(),
    findByTelegramId: jest.fn(),
    findOrCreateByTelegram: jest.fn(),
  };

  const mockSpaceService = {
    findByChatId: jest.fn(),
    findById: jest.fn(),
    findOrCreate: jest.fn(),
    updateTitle: jest.fn(),
    delete: jest.fn(),
    deleteByChatId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TelegramController],
      providers: [
        { provide: TelegramService, useValue: mockTelegramService },
        { provide: UserService, useValue: mockUserService },
        { provide: SpaceService, useValue: mockSpaceService },
      ],
    }).compile();

    controller = module.get<TelegramController>(TelegramController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
