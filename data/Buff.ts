import { SREvent, battleEventEmitter } from "./Data";
import { Entity } from "./Entity";

export enum BuffStand {
	POSITIVE, NEGATIVE, STATUS, OTHER, UNKNOWN
}

export enum BuffType {
	A,		// 回合开始时判定当前回合结束时扣除回合数
	B,		// 回合结束时扣除回合数
	C,		// 回合开始时扣除回合数
	NONE	// 无限时长的Buff
}

export enum EffectType {
	MAX_HEALTH_INCREASE, ATTACK_INCREASE, DEFENSE_INCREASE, SPEED_INCREASE, DAMAGE_INCREASE, ELEMENT_RESISTANCE_PENETRATION_INCREASE, ALL_ELEMENTS_RESISTANCE_PENETRATION_INCREASE, EXTRA_WEAKNESS, TAUNT_INCREASE, EFFECT_RESISTANCE_INCREASE,
	MAX_HEALTH_DECREASE, ATTACK_DECREASE, DEFENSE_DECREASE, SPEED_DECREASE, DAMAGE_DECREASE, VULNERABILITY, ELEMENT_RESISTANCE_DECREASE, ALL_ELEMENTS_RESISTANCE_DECREASE, TAUNT_DECREASE, EFFECT_RESISTANCE_DECREASE,
	FREEZE, ENTANGLEMENT, IMPRISONMENT, BLEED, SHOCK, BURN, WIND_SHEAR 
}

export enum DoTDebuffType {
	BLEED, SHOCK, BURN, WIND_SHEAR
}

export enum additionalDamageDebuffType {
	FREEZE, ENTANGLEMENT
}

interface IBuffOption {
	stand: BuffStand;
	name: string;
	description: string;
	uuid: string;
	effect_list?: Array<{effect: EffectType, value: any, type?: any}>;
	max_layer: number;
	dispellable: boolean;
}

export class BuffOption {
	getValueByEffect(type: EffectType) {
		this.getEffectList().filter((object) => object.effect == type)[0].value;
	}
	option: IBuffOption;
	setOption(option: IBuffOption): void { this.option = option }
	getMaxLayer(): number { return this.option.max_layer };
	getIfDispellable(): boolean { return this.option.dispellable };
	getEffectList(): Array<{effect: EffectType, value: any, type?: any}> { return this.option.effect_list || []};
	hasEffect(type: EffectType): boolean {
		return (this.option.effect_list || []).filter(effect => effect.type == type).length > 0;
	}
	constructor(callback?: (buff: Buff) => void){
		callback ? callback(this.getBuff()) : false ;
	}
	getBuff: Function
	getUUID(): string { return this.option.uuid }
	getBuffStand(): BuffStand { return this.option.stand }
}

export class DoTBuffOption extends BuffOption {
	dot_type: DoTDebuffType
	constructor(callback?: (buff: Buff) => void){
		super(callback);
		this.option.stand = BuffStand.NEGATIVE;
	}
	getDoTType() { return this.dot_type }
}

export class Buff {
	static {
		battleEventEmitter.on(SREvent.BUFF_DURATION_CHANGED, (buff: Buff, _amount: number) => {
			if (buff.getDuration() == -1) return;
			if (buff.getDuration() <= 0) {
				battleEventEmitter.emit(SREvent.BUFF_EXPIRED, buff)
				buff.remove();
			}
		});
		battleEventEmitter.emit(SREvent.BUFF_APPLIED, (buff: Buff) => {
			var owner = buff.getOwner();
			buff.option.getEffectList().forEach(effect => {
				switch (effect.effect) {
					case EffectType.ALL_ELEMENTS_RESISTANCE_DECREASE: () => {
						owner.resistance
					}
				}
			})
		});
		battleEventEmitter.emit(SREvent.ENTITY_ROUND_STARTED, (entity: Entity) => {
			entity.getBuffs().forEach(buff => {
				if (buff.getDuration() == -1) return;
				switch (buff.getType()) {
					case BuffType.C: buff.removeDuration(1); break;
					case BuffType.A: buff.pre_duration_decrease = true; break;
				}
			});
		});
		battleEventEmitter.emit("onEntityRoundEnded", (entity: Entity) => {
			entity.getBuffs().forEach(buff => {
				if (buff.getDuration() == -1) return;
				switch (buff.getType()) {
					case BuffType.B: buff.removeDuration(1); break;
					case BuffType.A: buff.pre_duration_decrease ? () => {
						buff.pre_duration_decrease = false;
						buff.removeDuration(1);
					} : null; break;
				}
			});
		});
	}

	duration: number;
	getDuration(): number { return this.duration }
	addDuration(amount: number) {
		this.duration += amount;
		battleEventEmitter.emit(SREvent.BUFF_DURATION_ADDED, this, amount)
		battleEventEmitter.emit(SREvent.BUFF_DURATION_CHANGED, this, amount)
	}
	removeDuration(amount: number) {
		this.duration -= amount;
		battleEventEmitter.emit(SREvent.BUFF_DURATION_REMOVED, this, amount)
		battleEventEmitter.emit(SREvent.BUFF_DURATION_CHANGED, this, -amount)
	}
	layer: number;
	getLayer(): number { return this.layer }
	pre_duration_decrease: boolean;
	type: BuffType;
	getType(): BuffType { return this.type }
	applier: Entity;
	getApplier(): Entity { return this.applier }
	owner: Entity;
	getOwner(): Entity { return this.owner }
	option: BuffOption;
	getUUID: () => string;
	getBuffStand: () => BuffStand;
	getBuffOption: () => BuffOption
	setOption: (option: IBuffOption) => void;
	getIfDispellable: () => boolean;
	
	constructor(option: BuffOption, duration: number, type: BuffType, applier: Entity, owner: Entity) {
		option.getBuff = () => { return this };
		this.pre_duration_decrease = false;
		this.option = option;
		this.duration = duration;
		this.type = type;
		this.applier = applier;
		this.owner = owner;
		this.getUUID = this.option.getUUID;
		this.getBuffStand = this.option.getBuffStand;
		this.getBuffOption = () => { return this.option };
		this.setOption = this.option.setOption;
		this.getIfDispellable = this.option.getIfDispellable;
		battleEventEmitter.emit(SREvent.BUFF_APPLIED, this);
	}

	dispell(): void {
		if (!this.getIfDispellable()) {
			battleEventEmitter.emit(SREvent.BUFF_DISPELLING_FAILED, this);
			return;
		}
		battleEventEmitter.emit(SREvent.BUFF_DISPELLED, this);
		this.remove();
	}

	remove(): void {
		battleEventEmitter.emit(SREvent.BUFF_REMOVED, this)
		this.getOwner().removeBuff(this.getUUID())
	}
}

export class DoTBuff extends Buff {
	dot_multiplier: any;
	constructor(option: BuffOption, duration: number, type: BuffType, applier: Entity, owner: Entity, dot_multiplier: number) {
		super(option, duration, type, applier, owner);
		this.dot_multiplier = dot_multiplier;
	}
	getDoTMultiplier() { return this.dot_multiplier };
}