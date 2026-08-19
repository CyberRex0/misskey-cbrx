/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type UiStyleResolutionOptions = {
	storedUiStyle: string | null;
	isSignedIn: boolean;
	searchParams: URLSearchParams;
	pathname: string;
	useSimpleDeckUiForNonRootPages: boolean;
};

export function resolveUiStyle(options: UiStyleResolutionOptions): string | null {
	let uiStyle = options.storedUiStyle;

	if (!options.isSignedIn) uiStyle = 'visitor';

	if (options.searchParams.has('zen')) uiStyle = 'zen';
	if (uiStyle === 'deck' && options.useSimpleDeckUiForNonRootPages && options.pathname !== '/') uiStyle = 'zen';

	if (options.searchParams.has('ui')) uiStyle = options.searchParams.get('ui');
	if (!options.isSignedIn && uiStyle === 'v1') uiStyle = 'visitor';

	return uiStyle;
}
