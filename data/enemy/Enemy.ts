import { SRElement, battleEventEmitter } from "../Data";
import { Entity, Skill } from "../Entity";
import { Character } from "../character/Character";

export abstract class Enemy extends Entity {

	next_move: [Skill];

	damage_boost: number;
	
	weakness: Array<SRElement>;
	getWeakness(): Array<SRElement> { return this.weakness; }
	max_stance: number;
	getMaxStance(): number { return this.max_stance }
	stance: number
	getStance(): number { return this.stance }
	
	attack(target: Character, damage: number, element: SRElement): void{
		var defense_multiplier = (200 + 10 * this.getLevel()) / (200 + 10 * this.getLevel() + target.getDefense());
		var resistance_multiplier = 1 - target.getResistance(element);
		var final_damage = damage * this.damage_boost * defense_multiplier * resistance_multiplier;
		target.receiveDamage(final_damage, this);
	}

	recoverFromBreak(): void {
		this.stance = this.getMaxStance();
		battleEventEmitter.emit("onEnemyRecoveredFromBreak", this);
	}

	reduceStance(element: SRElement, value: number, ignore_weakness?: boolean): void {
		if (!ignore_weakness && this.weakness.indexOf(element) == -1) {
			return;
		}
		var stance_after = Math.max(this.getStance() - value, 0)
		if (stance_after == 0) {
			battleEventEmitter.emit("onEnemyBreaked", this);
		}
		this.stance = stance_after;
	}

	getDamageExemptionRatio(): number {
		return this.damage_exemption_ratio + (this.isBreaked() ? 0.0 : 0.1)
	}

	isBreaked(): boolean {
		return this.getStance() == 0;
	}
}