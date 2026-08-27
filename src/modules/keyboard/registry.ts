import { atomWithKeybindingStorage } from "$/utils/keybindings";
import type { I18nKey, KeyBindingCommand, KeyBindingsConfig } from "./types";

const commandsMap = new Map<string, KeyBindingCommand>();

export function registerCommand(
	id: string,
	defaultKeys: KeyBindingsConfig,
	description: I18nKey,
	category = "General",
	fallback?: string,
) {
	const commandAtom = atomWithKeybindingStorage(id, defaultKeys);

	const command: KeyBindingCommand = {
		id,
		defaultKeys,
		description,
		fallback,
		category,
		atom: commandAtom,
	};

	if (commandsMap.has(id)) {
		console.warn(`[Keyboard] Duplicate command registered: ${id}`);
	}
	commandsMap.set(id, command);

	return command;
}

export function getAllCommands(): KeyBindingCommand[] {
	return Array.from(commandsMap.values());
}

export function getCommandById(id: string): KeyBindingCommand | undefined {
	return commandsMap.get(id);
}
