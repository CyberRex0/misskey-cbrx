/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddAutoFollowBlock1789107712229 {
	name = 'AddAutoFollowBlock1789107712229';

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" ADD "enableAutoFollowBlock" boolean NOT NULL DEFAULT false`);
		await queryRunner.query(`ALTER TABLE "meta" ADD "autoFollowBlockThreshold" integer NOT NULL DEFAULT 1`);
		await queryRunner.query(`ALTER TABLE "meta" ADD "autoFollowBlockUnit" character varying(16) NOT NULL DEFAULT 'day'`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "autoFollowBlockUnit"`);
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "autoFollowBlockThreshold"`);
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableAutoFollowBlock"`);
	}
}
