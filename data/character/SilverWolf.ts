import { SRElement, SREvent, SRPath, Selector, TargetType, battleEventEmitter, translateSRElement } from '../Data';
import { Character, CharacterStat, SkillType, TechniqueType } from './Character';
import { Enemy } from '../enemy/Enemy';
import { BuffOption, BuffStand, EffectType, BuffType } from '../Buff';
import { Skill, Target } from '../Entity';

class SilverWolf extends Character{
	static char_name: "silver_wolf";
	static id: 1006;
	static path: SRPath.NIHILITY;
	static element: SRElement.QUANTUM;
	static base_stat: {
		base_health: 1038,
		base_attack: 640,
		base_defense: 461,
		base_speed: 107,
		base_taunt: 100,
		max_energy: 110
	}
	constructor(stat: CharacterStat){
		super(stat);
		this.buff_option = {     
			defense_decrease: new BuffOption(buff => {
				var value = (buff.getApplier() as Character).getSkillVariable(SkillType.ULTIMATE, 0);
				buff.setOption({
					stand: BuffStand.NEGATIVE,
					name: "防御降低",
					description: `防御力降低<span class=\"buff_value\">${value}%</span>`,
					uuid: "cbbdd139-0329-4441-9a42-d66d335d017c",
					effect_list: [
						{
							effect: EffectType.DEFENSE_DECREASE,
							value: value
						}
					],
					max_layer: 1,
					dispellable: true
				})
			}),
			extra_weakness: new BuffOption(buff => {
				var weakness = (buff.getApplier() as Character).getSkillAdditionalVariable(SkillType.SKILL, "weakness");
				var weakness_trans = translateSRElement(weakness);
				buff.setOption({
					stand: BuffStand.NEGATIVE,
					name: `额外${weakness_trans}弱点`,
					description: `被添加的额外${weakness_trans}弱点, ${weakness_trans}属性抗性额外降低<span class="buff_value">20%</span>`,
					uuid: "a7149d1e-41cb-4c69-ba94-c88745868533",
					effect_list: [
						{
							effect: EffectType.EXTRA_WEAKNESS,
							value: weakness
						},{
							effect: EffectType.ALL_ELEMENTS_RESISTANCE_DECREASE,
							value: 0.2
						}
					],
					max_layer: 1,
					dispellable: true
				})
			}),
			resistance_decrease: new BuffOption(buff => {
				var if_trace = (buff.getApplier() as Character).hasBonusTrace(0);
				var if_target_debuff_count = buff.getOwner().getBuffsByStand(BuffStand.NEGATIVE).length >= 3;
				var value = (buff.getApplier() as Character).getSkillVariable(SkillType.SKILL, 2);
				buff.setOption({
					stand: BuffStand.NEGATIVE,
					name: "全属性抗性降低",
					description: `全属性抗性降低<span class="buff_value">${((value + (if_trace && if_target_debuff_count ? 0.03 : 0.0))) * 100}%</span>`,
					uuid: "1ace6680-eee7-4518-a3c8-683759c01b4d",
					effect_list: [
						{
							effect: EffectType.ALL_ELEMENTS_RESISTANCE_DECREASE,
							value: value
						}
					],
					max_layer: 1,
					dispellable: true
				})
			}),
			bug_1: new BuffOption(buff => {
				var value = (buff.getApplier() as Character).getSkillVariable(SkillType.TALENT, 0);
				buff.setOption({
					stand: BuffStand.NEGATIVE,
					name: "缺陷1型",
					description: `攻击力降低<span class="buff_value">${value * 100}%</span>`,
					uuid: "99164985-2363-425b-a09d-d0911b02db7a",
					effect_list: [
						{
							effect: EffectType.ATTACK_DECREASE,
							value: value
						}
					],
					max_layer: 1,
					dispellable: true
				})
			}),
			bug_2: new BuffOption(buff => {
				var value = (buff.getApplier() as Character).getSkillVariable(SkillType.TALENT, 1);
				buff.setOption({
					stand: BuffStand.NEGATIVE,
					name: "缺陷2型",
					description: `防御力降低<span class="buff_value">${value * 100}%</span>`,
					uuid: "f641ff69-a1c8-43ff-8201-958f4dd2d2cc",
					effect_list: [
						{
							effect: EffectType.DEFENSE_DECREASE,
							value: value
						}
					],
					max_layer: 1,
					dispellable: true
				})
			}),
			bug_3: new BuffOption(buff => {
				var value = (buff.getApplier() as Character).getSkillVariable(SkillType.TALENT, 2);
				buff.setOption({
					stand: BuffStand.NEGATIVE,
					name: "缺陷3型",
					description: `速度降低<span class="buff_value">${value * 100}%</span>`,
					uuid: "c14599fe-9b5f-40b4-926f-e78e4772def7",
					effect_list: [
						{
							effect: EffectType.SPEED_DECREASE,
							value: value
						}
					],
					max_layer: 1,
					dispellable: true
				})
			}),
			effect_resistance_decrease: new BuffOption(buff => {
				buff.setOption({
					stand: BuffStand.NEGATIVE,
					name: "效果抵抗降低",
					description: `效果抵抗降低<span class="buff_value">20%</span>`,
					uuid: "320a7e0f-19a1-4886-8c89-dd8d14309304",
					effect_list: [
						{
							effect: EffectType.EFFECT_RESISTANCE_DECREASE,
							value: 0.2
						}
					],
					max_layer: 1,
					dispellable: false
				})
			})
		}
		this.skill_list = {
			basic: {
				target: TargetType.ENEMY,
				selector: Selector.SINGLE,
				variable: [
					Array(0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3)[this.getSkillLevel(SkillType.BASIC)]
				],
				additional_variable: {},
				trigger: (_battle_instance, targets) => {
					this.attack(targets.getSingleTarget() as Enemy, this.getSkillVariable(SkillType.BASIC, 0), 1.0)
					this.addEnergy(20);
					battleEventEmitter.emit(SREvent.CHARACTER_BASIC_TRIGGERED, this);
				}
			},
			skill: {
				target: TargetType.ENEMY,
				selector: Selector.SINGLE,
				variable: [
					Array(0.98, 1.078, 1.176, 1.274, 1.372, 1.47, 1.5925, 1.715, 1.8375, 1.96, 2.058, 2.156, 2.254, 2.352, 2.45)[this.getSkillLevel(SkillType.SKILL)],
					Array(0.75, 0.76, 0.77, 0.78, 0.79, 0.80, 0.8125, 0.825, 0.8375, 0.85, 0.8375, 0.85, 0.86, 0.87, 0.88, 0.89, 0.90)[this.getSkillLevel(SkillType.SKILL)],
					Array(0.075, 0.0775, 0.08, 0.0825, 0.085, 0.0875, 0.090625, 0.09375, 0.096875, 0.10, 0.1025, 0.105, 0.1075, 0.11, 0.1125)[this.getSkillLevel(SkillType.SKILL)]
				],
				additional_variable: {
					weakness: "UNKNOWN"
				},
				trigger: (battle_instance, targets) => {
					battleEventEmitter.emit(SREvent.CHARACTER_SKILL_TRIGGERED, this);
					var elements = Array<SRElement>();
					var target = targets.getSingleTarget() as Enemy;
					battle_instance.getCharacterList().forEach((ally: Character) => {
						var element = ally.getElement();
						if(elements.indexOf(element) != -1 && target.getWeakness().indexOf(element) == -1){
							elements.push(element);
						}
					});
					target.weakness.push(elements[Math.floor(Math.random() * elements.length)]);
					target.applyBuff(this, this.getBuffOption("extra_weakness"), this.hasBonusTrace(1) ? 3 : 2, this.getSkillVariable(SkillType.SKILL, 1));
					target.applyBuff(this, this.getBuffOption("resistance_decrease"), 2, 1.0);
					this.attack(target, this.getAttack() * this.getSkillVariable(SkillType.SKILL, 0), 2.0);
					this.addEnergy(30);
				}
			},
			ultimate: {
				target: TargetType.ENEMY,
				selector: Selector.SINGLE,
				variable: [
					Array(2.28, 2.432, 2.584, 2.736, 2.888, 3.04, 3.23, 3.42, 3.61, 3.8, 3.952, 4.104, 4.256, 4.408, 4.56)[this.getSkillLevel(SkillType.ULTIMATE)],
					Array(0.85, 0.865, 0.88, 0.895, 0.91, 0.925, 0.94375, 0.9625, 0.98125, 1.0, 1.015, 1.03, 1.045, 1.06, 1.075)[this.getSkillLevel(SkillType.ULTIMATE)],
					Array(0.36, 0.369, 0.378, 0.387, 0.396, 0.405, 0.41625, 0.4275, 0.43875, 0.45, 0.459, 0.468, 0.477, 0.486, 0.495)[this.getSkillLevel(SkillType.ULTIMATE)]
				],
				additional_variable: {},
				trigger: (_battle_instance, targets) =>{
					battleEventEmitter.emit(SREvent.CHARACTER_ULTIMATE_TRIGGERED, this);

					this.clearEnergy();

					var target = targets.getSingleTarget() as Enemy;
					target.applyBuff(this, this.getBuffOption("defense_decrease"), 3, BuffType.A, this.getSkillVariable(SkillType.ULTIMATE, 1))

					this.attack(target, this.getSkillVariable(SkillType.ULTIMATE, 0), 3.0)
					if (this.hasEidolon(3)){
						for (let i = 0; i < Math.min(target.getBuffsByStand(BuffStand.NEGATIVE).length, 5); i++) {
							this.attack(target, 0.2, 0)
						}
					}

					this.addEnergy(5);
					if (this.hasEidolon(0)) {
						this.addEnergy(7 * Math.min(target.getBuffsByStand(BuffStand.NEGATIVE).length, 5))
					}
				}
			}
		}
		this.talent = {
			variable: [
				Array(0.05, 0.055, 0.06, 0.065, 0.07, 0.075, 0.08125, 0.0875, 0.09375, 0.1, 0.105, 0.11, 0.115, 0.12, 0.125)[this.getSkillLevel(SkillType.TALENT)],
				Array(0.04, 0.044, 0.048, 0.052, 0.056, 0.06, 0.065, 0.07, 0.075, 0.08, 0.084, 0.088, 0.092, 0.096, 0.10)[this.getSkillLevel(SkillType.TALENT)],
				Array(0.03, 0.033, 0.036, 0.039, 0.042, 0.045, 0.04875, 0.0525, 0.05625, 0.06, 0.063, 0.066, 0.069, 0.072, 0.075)[this.getSkillLevel(SkillType.TALENT)],
				Array(0.6, 0.612, 0.624, 0.636, 0.648, 0.66, 0.675, 0.69, 0.705, 0.72, 0.732, 0.744, 0.756, 0.768, 0.78)[this.getSkillLevel(SkillType.TALENT)]
			],
			trigger: () => {
				battleEventEmitter.on(SREvent.ENEMY_ENTERED, (_battle_instance, target: Enemy) => {
					target.applyBuff(this, this.getBuffOption("effect_resistance_decrease"), -1, BuffType.A);
				});
				battleEventEmitter.on(SREvent.CHARACTER_ATTACKED, (_battle_instance, targets: Target) => {
					var target = targets.getAllTarget();
					target.forEach(target => {
						var buff_list: BuffOption[] = [];
						for (var option_name in ["bug_1", "bug_2", "bug_3"])
							if(!target.hasBuff(this.getBuffOption(option_name).getUUID())) buff_list.push(this.getBuffOption(option_name));
						target.applyBuff(this, buff_list[Math.floor(Math.random() * buff_list.length)], this.hasBonusTrace(2) ? 4 : 3, BuffType.A, this.getSkillVariable(SkillType.TALENT, 3))
					});
				}); 
				battleEventEmitter.on(SREvent.ENEMY_BREAKED, (_battle_instance, target: Enemy) => {
					var buff_list: BuffOption[] = [];
					for (var option_name in ["bug_1", "bug_2", "bug_3"])
						if(!target.hasBuff(this.getBuffOption(option_name).getUUID())) buff_list.push(this.getBuffOption(option_name));
					target.applyBuff(this, buff_list[Math.floor(Math.random() * buff_list.length)], this.hasBonusTrace(2) ? 4 : 3, BuffType.A, 0.65);
				});
			}
		}
		this.technique = {
			type: TechniqueType.ENTER,
			trigger: (_battle_instance, target) => {
				var targets = target.main;
				this.attack(targets, 0.8, 2.0, true);
			}
		}
	}
}