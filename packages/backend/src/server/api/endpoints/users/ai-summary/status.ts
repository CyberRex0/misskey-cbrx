/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { UserAiSummaryService } from '@/core/UserAiSummaryService.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['users'],

	requireCredential: true,
	kind: 'read:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			status: { type: 'string', optional: false, nullable: false, enum: ['idle', 'ready', 'queued', 'processing', 'unavailable', 'failed'] },
			summary: { type: 'string', optional: false, nullable: true },
			cached: { type: 'boolean', optional: false, nullable: false },
		},
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '4999936a-0726-4c8c-b8fb-76a66e103d66',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private userAiSummaryService: UserAiSummaryService,
	) {
		super(meta, paramDef, async (ps) => {
			if (!await this.userAiSummaryService.userExists(ps.userId)) {
				throw new ApiError(meta.errors.noSuchUser);
			}

			return await this.userAiSummaryService.getStatus(ps.userId);
		});
	}
}
