import { BuffOption } from "../Buff";
import { SRElement, SREvent, SRPath, Selector, TargetType, battleEventEmitter } from "../Data";
import { BaseStat, Entity, Target, Skill} from "../Entity";
import { Enemy } from "../enemy/Enemy";

export interface CharacterBaseStat extends BaseStat {
	base_taunt: number;
	max_energy: number
}

export enum Trace {
	LEVEL1, ASCESION2, ASCENSION3_UPPER, ASCENSION3_LOWER, ASCENSION4, ASCENSION5_UPPER, ASCENSION5_LOWER, ASCENSION6, LEVEL75, LEVEL80
}

export enum SkillType {
	BASIC, SKILL, ULTIMATE, TALENT
}

export enum TraceType {
	TALENT, BONUS, STAT_BOOST
}

export interface CharacterStat {
	
	lightcone: Lightcone;
	eidolon: number;
	trace: {
		basic: number,
		skill: number,
		ultimate: number,
		talent: number,
		bonus: [boolean, boolean, boolean],
		stat_boost: {
			[key: string]: boolean 
		}
	}

	relic: {
		head: Relic;
		hands: Relic;
		body: Relic;
		feet: Relic;
		planar_sphere: Relic;
		link_rope: Relic;
	}
}

export enum RelicPosition {
	HEAD, HANDS, BODY, FEET, PLANAR_SPHERE, LINK_ROPE
}

export interface Lightcone {
	id: string;
	level: number;
	superimpose: number;
}

export class Relic {
	gear_id: string;
	rarity: number;
	level: number;
	main_entry: RelicEntry
	sub_entry: [ RelicEntry?, RelicEntry?, RelicEntry?, RelicEntry? ]
	getMainEntry(): RelicEntry { return this.main_entry }
	getSubEntry(count: number): RelicEntry | undefined { return this.sub_entry[count] }
}

export interface RelicEntry {
	name: string;
	amount: number;
}

export enum TechniqueType {
	ASSIST, ENTER
}

export abstract class Character extends Entity {
	constructor(stat: CharacterStat){
		super();
		this.stat = stat;
	}
	private path: SRPath;
	private element: SRElement;
	getElement(): SRElement { return this.element }
	
	private shield: number;
	getShield(): number { return this.shield }
	setShield(amount: number): void { this.shield = Math.max(this.shield, amount) }
	breakShield(amount: number): number {
		this.shield = Math.max(this.shield - amount, 0);
		return Math.max(amount - this.shield, 0)
	}
	private crit_rate: number;
	getCritRate(): number { return this.crit_rate }
	private crit_damage: number;
	getCritDamage(): number { return this.crit_damage }
	private break_effect: number;
	getBreakEffect(): number { return this.break_effect }
	private outgoing_healing_boost: number;
	getOutgoingHealingBoost(): number {return this.outgoing_healing_boost}

	private damage_boost: {
		physical: number;
		fire: number;
		ice: number;
		lighting: number;
		wind: number;
		quantum: number;
		imaginary: number;
	}
	getDamageBoostValue(element: SRElement): number { return this.stat[element] }
	
	private stat: CharacterStat;
	
	getLightcone(): Lightcone { return this.stat.lightcone }
	getRelic(pos: RelicPosition): Relic { return this.stat.relic[pos] }
	
	private energy_regeneration_rate: number;
	private max_energy: number;
	private energy: number;
	getEnergyRegenerationRate(): number { return this.energy_regeneration_rate }
	setEnergyRegenerationRate(energy_regeneration_rate: number): void { this.energy_regeneration_rate = energy_regeneration_rate }
	getMaxEnergy(): number { return this.max_energy } 
	getEnergy(): number { return this.energy }
	addEnergy(energy: number, ignore_energy_regeneration_rate?: boolean): void {
		energy = (ignore_energy_regeneration_rate ? 1 : (1 + this.getEnergyRegenerationRate()))
		this.energy += energy
		battleEventEmitter.emit("onEnergyAdded", this, energy)
		battleEventEmitter.emit("onEnergyChanged", this, energy)
		if (this.energy >= this.getMaxEnergy()) {
			this.energy = this.getMaxEnergy();
			battleEventEmitter.emit("onEnergyFilled", this, energy);
		}
	}
	removeEnergy(energy: number): void {
		this.energy -= energy
		battleEventEmitter.emit("onEnergyRemoved", this, energy);
		battleEventEmitter.emit("onEnergyChanged", this, -energy);
		if (this.energy <= 0) {
			this.energy = 0;
			battleEventEmitter.emit("onEnergyEmptied", this, energy);
		}
	}
	clearEnergy(): void {
		battleEventEmitter.emit("onEnergyChanged", this, -this.getEnergy());
		this.energy = 0;
	}

	
	base_stat: CharacterBaseStat;
	buff_option: {
		[index: string]: BuffOption;
	}

	resistance_penetration: {
		physical: number;
		fire: number;
		ice: number;
		lighting: number;
		wind: number;
		quantum: number;
		imaginary: number;
	}
	getResistancePenetration(element: SRElement): number { return this.resistance_penetration[element] }

	defense_ignored_ratio: number;
	getDefenseIgnoredRatio(): number { return this.defense_ignored_ratio }

	skill_list: {
		basic: Skill;
		skill: Skill;
		ultimate: Skill;
	}
	
	talent: {
		variable: Array<number>;
		trigger(): void;
	}

	technique: {
		type: TechniqueType
		trigger(_battle_instance: any, target: any): void;
	}

	hasEidolon(eidolon: number): boolean {
		return this.stat.eidolon[eidolon];
	}

	hasStatTrace(id: Trace): boolean {
		return this.stat.trace.stat_boost[id.toString()]
	}

	hasBonusTrace(id: number): boolean {
		return this.stat.trace.bonus[id];
	}

	getSkillLevel(type: SkillType): number {
		return this.stat.trace[type.toString()];
	}

	getSkillVariable(type: SkillType, id: number): any {
		if (type == SkillType.TALENT) {
			return this.talent.variable[id];
		}
		return this.skill_list[type.toString()].variable[id];
	}

	getSkillAdditionalVariable(type: SkillType, id: string): any {
		return this.skill_list[type.toString()].additional_variable[id];
	}

	attack(target: Enemy, magnification: number, stance: number, ignore_weakness?: boolean): void{
		battleEventEmitter.emit(SREvent.CHARACTER_BEFORE_ATTACK, this);

		var attack_multiplier = this.getAttack();
		var magnification_multiplier = magnification;
		var defense_multiplier = (200 + 10 * this.getLevel()) / (200 + 10 * this.getLevel() + target.getDefense());
		var damage_boost_multiplier = this.getDamageBoostValue(this.getElement());
		var resistance_multiplier = 1 - target.getResistance(this.getElement()) + this.getResistancePenetration(this.getElement());
		var damage_exemption_multiplier = target.getDamageExemptionRatio();
		var if_crit = Math.random() <= this.getCritRate();
		var crit_multiplier = if_crit ? 1 + this.getCritDamage() : 1;
		var expect_crit_multiplier = this.getCritRate() * (1 + this.getCritDamage());
		var final_damage = attack_multiplier * magnification_multiplier * defense_multiplier * damage_boost_multiplier * resistance_multiplier * damage_exemption_multiplier * crit_multiplier;
		var expect_damage = attack_multiplier * magnification_multiplier * defense_multiplier * damage_boost_multiplier * resistance_multiplier * damage_exemption_multiplier * expect_crit_multiplier;

		target.reduceStance(this.getElement(), stance, ignore_weakness)
		target.receiveDamage(final_damage, this);

		battleEventEmitter.emit(SREvent.CHARACTER_ATTACKED, this, if_crit, final_damage, expect_damage);
		if (if_crit) {
			battleEventEmitter.emit(SREvent.CHARACTER_CRITED, this, final_damage);
		}
	}

	receiveDamage(final_damage: number, attacker: Entity): void {
		battleEventEmitter.emit("onCharactersRecievedDamage", this, attacker, final_damage);
		final_damage = this.breakShield(final_damage)

	}
}