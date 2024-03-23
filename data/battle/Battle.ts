import { Entity } from "../Entity";
import { Character } from "../character/Character";
import { Enemy } from "../enemy/Enemy";

export class BattleInstance {
	
	ally_list: Array<Character>;
	enemy_list: Array<Enemy>;

	getEnemyList() {
		return this.enemy_list;
	}
	getAllyList() {
		return this.ally_list;
	}
	actionForward(entity: Entity, percent: number) {
		throw new Error('Method not implemented.');
	}
	createExtraRound(entity: Character, reason: string) {
		throw new Error('Method not implemented.');
	}
}