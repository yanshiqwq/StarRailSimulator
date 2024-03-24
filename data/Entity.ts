import { BuffOption, Buff, BuffType, BuffStand, DoTBuff } from "./Buff";
import { SRElement, SREvent, Selector, TargetType, battleEventEmitter } from "./Data";
import { BattleInstance } from "./battle/Battle";

export interface BaseStat {
	base_health: number;
	base_attack: number;
	base_defense: number;
	base_speed: number;
}

export class Skill {
	constructor(trigger: (battle_instance: BattleInstance, target: Target) => void) {
		this.trigger = trigger;
	}
	target: TargetType;
	selector: Selector;
	variable: Array<number>;
	additional_variable: {[index: string]: any};
	trigger: (battle_instance: BattleInstance, target: Target) => void;
}

export class Target {
	constructor(single: Entity, adjacent: Array<Entity>, aoe: Array<Entity>, bounce: Array<Entity>) {
		this.single = single;
		this.adjacent = adjacent;
		this.aoe = aoe;
		this.bounce = bounce;
	}
	getSingleTarget() { return this.single }
	getAdjacentTarget() { return this.adjacent }
	getAoETarget() { return this.aoe }
	getBounceTarget() { return this.bounce }
	getAllTarget() { return [this.getSingleTarget(), ...this.getAdjacentTarget(), ...this.getBounceTarget(), ...this.getAoETarget()] }
	single: Entity;
	adjacent: Array<Entity>;
	aoe: Array<Entity>;
	bounce: Array<Entity>;
}

export enum ResistableDebuffType {
	CONTROL, FREEZE, ENTANGLEMENT, IMPRISONMENT, BLEED, SHOCK, BURN, WIND_SHEAR
}

export abstract class Entity{
	level: number;
	getLevel(): number { return this.level }
	name: string;
	getName(): string { return this.name }
	id: number;
	base_stat: BaseStat;
	getBaseStat(): BaseStat { return this.base_stat }

	skill_list: {
		[index: string]: Skill
	}

	buff_option: {
		[index: string]: BuffOption;
	}
	buff_list: [ Buff ]

	max_health: number;
	getMaxHealth(): number { return this.max_health }
	setMaxHealth(value: number): void {
		battleEventEmitter.emit(SREvent.ENTITY_MAX_HEALTH_CHANGED, this, value);
		this.max_health = value
	}

	stat_health: number;
	getHealth(): number { return this.stat_health }
	recoverHealth(health: number): void {
		battleEventEmitter.emit(SREvent.ENTITY_HEALTH_RECOVERED, this, health);
		battleEventEmitter.emit(SREvent.ENTITY_HEALTH_CHANGED, this, health);
		this.stat_health = this.stat_health + health
		if ( health > this.getMaxHealth() - this.getHealth()) {
			this.stat_health = this.getMaxHealth();
			battleEventEmitter.emit(SREvent.ENTITY_OVERHEALED, this, health);
		}
	}
	damageHealth(damage: number): void {
		battleEventEmitter.emit(SREvent.ENTITY_HEALTH_DAMAGED, this, damage)
		battleEventEmitter.emit(SREvent.ENTITY_HEALTH_CHANGED, this, -damage);
		this.stat_health = this.stat_health - damage
		if (this.stat_health <= 0 ) {
			this.stat_health = 0;
			battleEventEmitter.emit(SREvent.ENTITY_ZERO_HEALTH, this, damage);
		}
	}
	stat_attack: number;
	getAttack(): number { return this.stat_attack }
	stat_defense: number;
	getDefense(): number { return this.stat_defense }
	stat_speed: number;
	getSpeed(): number { return this.stat_speed }

	effect_probability: number; // 效果命中
	getEffectProbability(): number { return this.effect_probability }
	effect_resistance: number; // 效果抵抗
	getEffectResistance(): number { return this.effect_resistance }

	damage_exemption_ratio: number; // 免伤
	getDamageExemptionRatio(): number { return this.damage_exemption_ratio }

	vulnerability: number; // 易伤
	getVulnerability(): number { return this.vulnerability }

	debuff_resistance: {
		control: number;
		freeze: number;
		entanglement: number;
		imprisonment: number;
		bleed: number;
		shock: number;
		burn: number;
		wind_shear: number;
	}
	getDebuffResistance(type: ResistableDebuffType): number { return this.debuff_resistance[type.toString()] }

	resistance: {
		[type: string]: number
		all: number;
	}
	addResistance(element: SRElement): void { this.resistance[Object.keys(element)[0]] += element}
	getResistance(element: SRElement): number { return this.resistance[Object.keys(element)[0]] + this.resistance["all"] }

	applyBuff(applier: Entity, buff: BuffOption, time: number, type: BuffType, base_chance?: number, fixed_chance?: number): void{
		if (base_chance != undefined){
			var final_chance = base_chance * (1 + applier.effect_probability) * (1 - this.effect_resistance);
		} else if (fixed_chance != undefined){
			var final_chance = fixed_chance;
		} else {
		   var final_chance = 1;
		}

		if (Math.random() <= final_chance) {
			var buff_obj = new Buff(buff, time, type, applier, this);
			this.buff_list.push(buff_obj);
			battleEventEmitter.emit(SREvent.BUFF_APPLIED, applier, this, buff_obj);
		} else {
			battleEventEmitter.emit(SREvent.BUFF_EFFECT_RESISTANCED, applier, this, buff);
		}
	}

	removeBuff(uuid: string): boolean {
		this.buff_list.forEach(buff => {
			if (buff.getUUID() == uuid) {
				battleEventEmitter.emit(SREvent.BUFF_REMOVED, this, buff);
				this.buff_list.splice(this.buff_list.indexOf(buff), 1);
				return true;
			}
		})
		return false;
	}

	getBuffOption(id: string): BuffOption {
		return this.buff_option[id];
	}

	getBuff(uuid: string): Buff{
		return this.buff_list.filter(buff => buff.getUUID() == uuid)[0];
	}

	getBuffs(): Array<Buff> {
		return this.buff_list;
	}

	getBuffsByStand(stand: BuffStand): Buff[] {
		return this.buff_list.filter(buff => buff.getBuffStand() == stand);
	}

	getDoTBuffs(): Array<DoTBuff> {
		return this.getBuffs().filter(buff => buff instanceof DoTBuff) as Array<DoTBuff>;
	}

	hasBuff(uuid: string): boolean {
		return this.buff_list.hasOwnProperty(uuid);
	}

	abstract receiveDamage(final_damage: number, attackr: Entity): void;
	abstract attack(target: Entity, ...args: any[]): void;
}