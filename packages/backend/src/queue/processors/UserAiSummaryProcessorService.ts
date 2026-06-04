/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as Bull from 'bullmq';
import { UserAiSummaryService } from '@/core/UserAiSummaryService.js';
import { bindThis } from '@/decorators.js';
import type { UserAiSummaryJobData } from '../types.js';

@Injectable()
export class UserAiSummaryProcessorService {
	constructor(
		private userAiSummaryService: UserAiSummaryService,
	) {
	}

	@bindThis
	public async process(job: Bull.Job<UserAiSummaryJobData>): Promise<void> {
		if (job.id == null) {
			throw new Error('AI summary job ID is missing.');
		}

		await this.userAiSummaryService.processJob(job.data.userId, job.id);
	}
}
