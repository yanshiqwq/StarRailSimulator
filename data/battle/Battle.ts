import { Position, SREvent, Selector, battleEventEmitter } from "../Data";
import { Entity, Skill, Target } from "../Entity";
import { Character } from "../character/Character";
import { Enemy } from "../enemy/Enemy";

export interface Wave {
	[Position.ENEMY_0]: Enemy,
	[Position.ENEMY_1]: Enemy,
	[Position.ENEMY_2]: Enemy,
	[Position.ENEMY_3]: Enemy,
	[Position.ENEMY_4]: Enemy
}

export class Stage {
	constructor(wave: Array<Wave>){
		this.wave = wave;
	}
	wave: Array<Wave>;
	getTotalWave() { return this.wave.length };
}

export enum BattleState {
	RUNNING, FINISHED
}

export interface IActionValue {
	distance: number
	action_value: number;
}

export class Round {
	entity: Entity;
	instance: BattleInstance;
	constructor(entity: Entity, instance: BattleInstance) {
		this.entity = entity;
		this.instance = instance;
	}
	start() {
		battleEventEmitter.emit(SREvent.ENTITY_ROUND_STARTED, this);
		battleEventEmitter.emit(SREvent.ENTITY_BEFORE_DOT_SETTLE, this);
		this.entity.getBuffs()
		if (this.entity instanceof Character) {
			requireSelectorList(this.instance) // TODO
				.then((selector_list: Map<Selector, Position>) => {
					this.entity.skill_list
				})
		} else {
			
		}
	}
	end() {
		battleEventEmitter.emit(SREvent.ENTITY_ROUND_ENDED, this);
	}
}

export class Turn {

}

export class BattleInstance {
	constructor(characters: Array<Character>, stage: Stage){
		characters.forEach(character => { this.action_map.set(character, {distance: 10000, action_value: 10000 / character.getSpeed()}) });
		this.stage = stage;

		battleEventEmitter.on(SREvent.BATTLE_WAVE_CLEARED, (battle: BattleInstance) => {
			if (battle.stage.getTotalWave() == this.getWave()) {
				this.setState(BattleState.FINISHED);
				battleEventEmitter.emit(SREvent.BATTLE_FINISHED, this);
			} else {
				this.wave ++;
				battleEventEmitter.emit(SREvent.BATTLE_NEW_WAVE, this);
			}
		});
	}
	wave: number = 0;
	getWave(): number { return this.wave }
	state: BattleState;
	getState() { return this.state }
	setState(state: BattleState) { this.state = state }
	stage: Stage;
	action_map: Map<Entity, IActionValue>;

	current_round: Round;

	nextRound() {
		this.current_round.end();
	}
	
	updateActionSequence(key: Entity, action_value: number): void {
		var map = this.getActionValueMap();
		const original = map.get(key)!;
		map.delete(key);
		map.set(key, {action_value: action_value, distance: original.distance});
		const sortedEntries = Array.from(map.entries()).sort((a, b) => a[1].action_value - b[1].action_value);
		this.action_map = new Map(sortedEntries);
	}

	getEnemyList() {
		var enemy_list = new Array<Enemy>;
		this.action_map.forEach((_value, key) => {key instanceof Enemy ? enemy_list.push(key) : null})
		return enemy_list;
	}

	getCharacterList() {
		var character_list = new Array<Character>;
		this.action_map.forEach((_value, key) => {key instanceof Character ? character_list.push(key) : null})
		return character_list;
	}

	updateActionValue(entity: Entity) {
		battleEventEmitter.emit(SREvent.BATTLE_BEFORE_ACTION_VALUE_CHANGE, this, entity);
		if (entity.getSpeed() == 0) {
			this.assignNewActionValue(entity, Infinity);
		} else {
			this.assignNewActionValue(entity, this.getDistance(entity) / entity.getSpeed());
		}
		battleEventEmitter.emit(SREvent.BATTLE_ACTION_VALUE_CHANGED, this, entity);
	}

	getDistance(entity: Entity) {
		return this.getActionValueMap().get(entity)!.distance;
	}

	getActionValue(entity: Entity) {
		return this.getActionValueMap().get(entity)!.action_value;
	}

	assignNewActionValue(entity: Entity, action_value: number) {
		this.action_map.set(entity, {distance: entity.getSpeed() * action_value, action_value: action_value});
	}

	getActionValueMap() { return this.action_map }
	
	updateActionValueMap(action_map: Map<Entity, IActionValue>) { this.action_map = action_map }

	actionForward(entity: Entity, percent: number) {
		this.assignNewActionValue(entity, this.getActionValue(entity) * (1 - percent));
	}

	createExtraRound(entity: Character, reason: string) {
		throw new Error('Method not implemented.');
	}

	removeEnemy(enemy: Enemy) {
		this.action_map.delete(enemy);
		if (this.getEnemyList() == null) battleEventEmitter.emit(SREvent.BATTLE_WAVE_CLEARED, this)
	}
}