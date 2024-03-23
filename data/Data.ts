import EventEmitter from 'events';
export const battleEventEmitter = new EventEmitter();

export enum SRPath {
	THE_HUNT, DESTRUCTION, ERUDITION, NIHILITY, HARMONY, PRESERVATION, ABUNDANCE
}

export enum SRElement {
	PHYSICAL, FIRE, ICE, LIGHTNING, WIND, QUANTUM, IMAGINARY
}

export enum SREvent {
	ENEMY_ENTERED = "onEnemyEntered",
	CHARACTER_ATTACKED = "onCharacterAttacked",
	ENEMY_BREAKED = "onEnemyBreaked",
	CHARACTER_ULTIMATE_TRIGGERED = "onCharacterUltimateTriggered",
	CHARACTER_SKILL_TRIGGERED = "onCharacterSkillTriggered",
	CHARACTER_BASIC_TRIGGERED = "onCharacterBasicTriggered",
	ENTITY_HEALTH_CHANGED = "onEntityHealthChanged",
	ENEMY_KILLED = "onEnemyKilled",
	CHARACTER_KNOCKED_DOWN = "onCharacterKnockedDown",
	CHARACTER_BEFORE_ATTACK = "onCharacterBeforeAttack",
	CHARACTER_CRITED = "onCharacterCrited",
	CHARACTER_TALENT_TRIGGERED = "onCharacterTalentTriggered",
}

export function translateSRElement(element: SRElement){
	switch (element) {
		case SRElement.PHYSICAL: return "物理";
		case SRElement.FIRE: return "火";
		case SRElement.ICE: return "冰";
		case SRElement.LIGHTNING: return "雷";
		case SRElement.WIND: return "风";
		case SRElement.QUANTUM: return "量子";
		case SRElement.IMAGINARY: return "虚数";
		default: return "未知";
	}
}

export enum TargetType {
	ALLY, ENEMY
}

export enum Selector {
	SINGLE, BLAST, AOE, BOUNCE
}