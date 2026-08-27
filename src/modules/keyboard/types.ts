import type { ParseKeys } from "i18next";
import type { WritableAtom } from "jotai";
import type { RESET_KEYBINDING } from "$/utils/keybindings";

export type I18nKey = ParseKeys<"translation"> | (string & {});
export type KeyBindingsConfig = string[];

export interface KeyBindingCommand {
	id: string;
	defaultKeys: KeyBindingsConfig;
	description: I18nKey;
	fallback?: string;
	category: string;
	atom: WritableAtom<
		KeyBindingsConfig,
		[update?: KeyBindingsConfig | typeof RESET_KEYBINDING | undefined],
		Promise<void>
	>;
}
