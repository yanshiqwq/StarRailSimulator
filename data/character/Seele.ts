import { BuffOption, Buff, BuffStand, EffectType, BuffType } from '../Buff';
import { SRElement, SREvent, SRPath, Selector, TargetType, battleEventEmitter } from '../Data';
import { Entity, Target } from '../Entity';
import { BattleInstance } from '../battle/Battle';
import { Enemy } from '../enemy/Enemy';
import { Character, CharacterStat, SkillType } from './Character';
class Seele extends Character{
	static char_name: "seele";
	static id: 1102;
	static path: SRPath.THE_HUNT;
	static element: SRElement.QUANTUM;
	static base_stat: {
		base_health: 931,
		base_atk: 640,
		base_def: 364,
		base_speed: 115,
		base_taunt: 75,
		max_energy: 120
	}
	constructor(stat: CharacterStat){
		super(stat);
		this.buff_option = {
			amplification: new BuffOption((buff) => {
				var value = this.getSkillVariable(SkillType.SKILL, 0);
				var if_bonus_trace = this.hasBonusTrace(1);
				buff.setOption({
					stand: BuffStand.POSITIVE,
					name: "增幅",
					description: `造成的伤害提高<span class="buff_value">${value * 100}%</span>` + (if_bonus_trace ? `, 量子属性抗性穿透提高<span class="buff_value">20%</span>` : ""),
					uuid: "75d7d914-a428-44d2-aee2-5503cd5224c6",
					effect_list: [
						{
							effect: EffectType.DAMAGE_INCREASE,
							value: value
						}, {
							effect: EffectType.ELEMENT_RESISTANCE_PENETRATION_INCREASE,
							type: SRElement.QUANTUM,
							value: 0.2
						}
					],
					max_layer: 1,
					dispellable: true
				});
			}),
			speed_increase: new BuffOption((buff) =>{
				var if_eidolon = this.hasEidolon(1);
				buff.setOption({
					stand: BuffStand.POSITIVE,
					name: "加速",
					description: `速度提高<span class="buff_value">${0.25 * 100 * buff.getLayer()}%</span>`
						+ if_eidolon ? `该效果最多可叠加2层` : "",
					uuid: "fa8bf724-8cc0-48c0-9e13-eb51f5b0780d",
					effect_list: [
						{
							effect: EffectType.SPEED_INCREASE,
							value: 0.25
						}
					],
					max_layer: if_eidolon ? 2 : 1,
					dispellable: true
				});
				battleEventEmitter.on(SREvent.ENTITY_HEALTH_CHANGED, (_battle_instance, amount) => {
					if (this.getHealth() > this.getMaxHealth() / 2 && this.getHealth() - amount <= this.getMaxHealth() / 2) {
						buff.remove();
					}
				});
			}),
			taunt_decrease: new BuffOption((buff) => {
				buff.setOption({
					stand: BuffStand.POSITIVE,
					name: "夜行",
					description: `被敌方目标攻击的概率降低<span class="buff_value">50%</span>`,
					uuid: "1f9e5001-dfc4-41c8-8e5b-90df348deb96",
					effect_list: [
						{
							effect: EffectType.TAUNT_DECREASE,
							value: 0.5
						}
					],
					max_layer: 1,
					dispellable: true
				})
			}),
			butterfly_flurry: new BuffOption((buff) => {
				var applier = buff.getApplier() as Character;
				buff.setOption({
					stand: BuffStand.NEGATIVE,
					name: "乱蝶",
					description: "受到攻击后，额外受到1次等同于希儿终结技伤害15%的量子属性附加伤害",
					uuid: "5403dbb5-5cbf-49a7-a3ec-dd90f33cb820",
					max_layer: 1,
					dispellable: true
				});
				battleEventEmitter.on(SREvent.CHARACTER_ATTACKED, (_battle_instance, _attacker) =>{
					applier.attack(buff.getOwner() as Enemy, applier.getSkillVariable(SkillType.ULTIMATE, 0), 0);
				});
			})
		},
		this.skill_list = {
			basic: {
				target: TargetType.ENEMY,
				selector: Selector.SINGLE,
				variable: [Array(0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3)[this.getSkillLevel(SkillType.BASIC)]],
				additional_variable: {},
				trigger: (battle_instance, targets) => {
					this.attack(targets.getSingleTarget() as Enemy, this.getSkillVariable(SkillType.BASIC, 0), 1.0)
					if (this.hasBonusTrace(0) == true) battle_instance.actionForward(this, 0.2);
					this.addEnergy(20);
					battleEventEmitter.emit(SREvent.CHARACTER_BASIC_TRIGGERED, this);
				}
			},
			skill: {
				target: TargetType.ENEMY,
				selector: Selector.SINGLE,
				variable: [Array(1.1, 1.21, 1.32, 1.43, 1.54, 1.65, 1.7875, 1.925, 2.0625, 2.2, 2.31, 2.42, 2.53, 2.64, 2.75)[this.getSkillLevel(SkillType.SKILL)]],
				additional_variable: {},
				trigger: (_battle_instance, targets) => {
					this.applyBuff(this, this.getBuffOption("speed_increase"), 2, BuffType.A);
					this.attack(targets.getSingleTarget() as Enemy, this.getSkillVariable(SkillType.SKILL, 0), 2.0);
					this.addEnergy(30);
					battleEventEmitter.emit(SREvent.CHARACTER_SKILL_TRIGGERED, this);
				}
			},
			ultimate: {
				target: TargetType.ENEMY,
				selector: Selector.SINGLE,
				variable: [Array(2.55, 2.72, 2.89, 3.06, 3.23, 3.4, 3.6125, 3.825, 4.0375, 4.25, 4.42, 4.59, 4.76, 4.93, 5.1)[this.getSkillLevel(SkillType.ULTIMATE)]],
				additional_variable: {},
				trigger: (_battle_instance, targets) => {
					this.applyBuff(this, this.getBuffOption("amplification"), 1, BuffType.A);
					this.attack(targets.getSingleTarget() as Enemy, this.getSkillVariable(SkillType.ULTIMATE, 0), 3.0);
					this.addEnergy(5);
					battleEventEmitter.emit(SREvent.CHARACTER_ULTIMATE_TRIGGERED, this);
				}
			}
		}
		this.talent = {
			variable: [Array(0.4, 0.44, 0.48, 0.52, 0.56, 0.6, 0.65, 0.7, 0.75, 0.8, 0.84, 0.88, 0.92, 0.96, 1)[this.getSkillLevel(SkillType.TALENT)]],
			trigger: () => {
				battleEventEmitter.on(SREvent.CHARACTER_BEFORE_ATTACK, (_battle_instance, character: Character, targets: Target) => {
					var target = targets.getSingleTarget();
					if (this.hasEidolon(0) && target.getHealth() < target.getMaxHealth() * 0.8 && !this.hasBuff(this.getBuffOption("butterfly_flurry").getUUID())){
						this.applyBuff(this, this.getBuffOption("crit_rate_increase"), -1, BuffType.NONE);
					}
					if (this.hasEidolon(5) && !target.hasBuff(this.getBuffOption("butterfly_flurry").getUUID())) {
						target.applyBuff(this, this.getBuffOption("butterfly_flurry"), 1, BuffType.C);
					}
				});
				battleEventEmitter.emit(SREvent.CHARACTER_ATTACKED, () => {
					this.removeBuff(this.getBuffOption("crit_rate_increase").getUUID());
				});
				battleEventEmitter.on(SREvent.ENEMY_KILLED, (battle_instance: BattleInstance, killer: Entity, _enemy: Enemy) => {
					if (killer != this) return;
					if (this.hasEidolon(3)) this.addEnergy(15);
					this.applyBuff(this, this.getBuffOption("amplification"), 1, BuffType.A);
					battle_instance.createExtraRound(this, "SeeleTalent");
					battleEventEmitter.emit(SREvent.CHARACTER_TALENT_TRIGGERED, this);
				});
				battleEventEmitter.on(SREvent.ENTITY_HEALTH_CHANGED, (_battle_instance: BattleInstance, entity: Entity, amount: number) => {
					if (entity != this || !this.hasBonusTrace(2)) return;
					if (this.getHealth() <= this.getMaxHealth() / 2 && this.getHealth() - amount > this.getMaxHealth() / 2) {
						this.applyBuff(this, this.getBuffOption("taunt_decrease"), -1, BuffType.NONE);
					}
				});
				battleEventEmitter.on(SREvent.CHARACTER_KNOCKED_DOWN, (battle_instance: BattleInstance, character: Character, enemy: Enemy) => {
					if (character != this || !this.hasEidolon(5)) return;
					battle_instance.getEnemyList().forEach(enemy => enemy.removeBuff(this.buff_option.butterfly_flurry.getUUID()));
				});
			}
		}
	}
}