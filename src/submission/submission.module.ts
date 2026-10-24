import { Module } from '@nestjs/common';
import { SubmissionController } from './submission.controller.js';
import { SubmissionService } from './submission.service.js';

@Module({
  controllers: [SubmissionController],
  providers: [SubmissionService],
})
export class SubmissionModule {}
