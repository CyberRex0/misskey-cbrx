/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApp, defineComponent, h } from "vue";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type * as Misskey from "misskey-js";
import type { ReactiveNoteData } from "@/composables/use-note-capture.js";
import type { MisskeyEntity } from "@/utility/paginator.js";
import { globalEvents } from "@/events.js";
import { Paginator } from "@/utility/paginator.js";

const streamHarness = vi.hoisted(() => {
	type Listener = (...args: unknown[]) => void;
	const listeners = new Map<string, Set<Listener>>();
	return {
		listeners,
		send: vi.fn(),
		on: vi.fn((event: string, listener: Listener) => {
			const eventListeners = listeners.get(event) ?? new Set<Listener>();
			eventListeners.add(listener);
			listeners.set(event, eventListeners);
		}),
		off: vi.fn((event: string, listener: Listener) => {
			listeners.get(event)?.delete(listener);
		}),
		emit(event: string, payload?: unknown) {
			for (const listener of listeners.get(event) ?? []) listener(payload);
		},
	};
});

vi.mock("@@/js/interval.js", () => ({
	createVisibilityAwareInterval: vi.fn(),
}));
vi.mock("@/i.js", () => ({
	$i: { id: "signed-in-user" },
}));
vi.mock("@/store.js", () => ({
	store: { s: { realtimeMode: true } },
}));
vi.mock("@/stream.js", () => ({
	useStream: () => streamHarness,
}));

const { useNoteCapture } = await import("@/composables/use-note-capture.js");

type TimelineItem = Misskey.entities.Note & MisskeyEntity;

function timelineItem(id: string, text = id): TimelineItem {
	return {
		id,
		createdAt: new Date().toISOString(),
		text,
	} as TimelineItem;
}

function createPaginator(): Paginator<"notes/timeline"> {
	return new Paginator("notes/timeline", {});
}

function capturableNote(): Misskey.entities.Note {
	return {
		id: "captured-note",
		createdAt: new Date().toISOString(),
		reactions: {},
		reactionCount: 0,
		reactionEmojis: {},
		myReaction: null,
		poll: null,
	} as Misskey.entities.Note;
}

beforeEach(() => {
	streamHarness.listeners.clear();
	streamHarness.send.mockClear();
	streamHarness.on.mockClear();
	streamHarness.off.mockClear();
});

describe("v1が利用するタイムライン状態管理", () => {
	test("ストリーム項目を先頭へ追加する", () => {
		const paginator = createPaginator();
		paginator.items.value = [timelineItem("older")];

		paginator.prepend(timelineItem("newer"));

		expect(paginator.items.value.map((item) => item.id)).toEqual([
			"newer",
			"older",
		]);
	});

	test("同じIDの追加とキュー解放を重複させない", () => {
		const paginator = createPaginator();
		paginator.items.value = [timelineItem("existing")];

		paginator.prepend(timelineItem("existing"));
		paginator.enqueue(timelineItem("existing"));
		paginator.enqueue(timelineItem("queued"));
		paginator.releaseQueue();

		expect(paginator.items.value.map((item) => item.id)).toEqual([
			"queued",
			"existing",
		]);
		expect(paginator.queuedAheadItemsCount.value).toBe(0);
	});

	test("既存項目を更新する", () => {
		const paginator = createPaginator();
		paginator.items.value = [timelineItem("note", "before")];

		paginator.updateItem("note", (item) => ({ ...item, text: "after" }));

		expect(paginator.items.value[0].text).toBe("after");
	});

	test("削除イベントの対象を一覧から除去する", () => {
		const paginator = createPaginator();
		paginator.items.value = [timelineItem("keep"), timelineItem("delete")];
		const remove = (noteId: string) => paginator.removeItem(noteId);
		globalEvents.on("noteDeleted", remove);

		globalEvents.emit("noteDeleted", "delete");

		expect(paginator.items.value.map((item) => item.id)).toEqual(["keep"]);
		globalEvents.off("noteDeleted", remove);
	});
});

describe("v1ノートが利用するリアルタイム購読", () => {
	test("更新を反映し、重複を抑止し、再接続時に再購読して破棄時に解除する", () => {
		const captured = { state: null as ReactiveNoteData | null };
		const host = window.document.createElement("div");
		const app = createApp(
			defineComponent({
				setup() {
					captured.state = useNoteCapture({
						note: capturableNote(),
						parentNote: null,
					}).$note;
					return () => h("div");
				},
			}),
		);
		app.mount(host);

		expect(streamHarness.send).toHaveBeenCalledWith("sr", {
			id: "captured-note",
		});
		streamHarness.emit("noteUpdated", {
			type: "reacted",
			id: "captured-note",
			body: { userId: "remote-user", reaction: "👍", emoji: null },
		});
		streamHarness.emit("noteUpdated", {
			type: "reacted",
			id: "captured-note",
			body: { userId: "remote-user", reaction: "👍", emoji: null },
		});
		expect(captured.state?.reactionCount).toBe(1);
		expect(captured.state?.reactions).toEqual({ "👍": 1 });

		streamHarness.emit("_connected_");
		expect(streamHarness.send).toHaveBeenNthCalledWith(2, "sr", {
			id: "captured-note",
		});
		expect(streamHarness.listeners.get("noteUpdated")?.size).toBe(1);

		app.unmount();
		expect(streamHarness.send).toHaveBeenLastCalledWith("un", {
			id: "captured-note",
		});
		expect(streamHarness.listeners.get("noteUpdated")?.size).toBe(0);
		expect(streamHarness.listeners.get("_connected_")?.size).toBe(0);
	});
});
