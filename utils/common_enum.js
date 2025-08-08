/**
 * 控制命令常量
 */
export const Command = {
	PASSWORD_PREFIX: "pswd=",
	PASSWORD_SUFFIX: "\u0000\n",
	DISCHARGE_OPEN: "fdopen\n",
	DISCHARGE_CLOSE: "fdclose\n",
	CHARGE_OPEN: "cdopen\n",
	CHARGE_CLOSE: "cdclose\n",
	REQUEST_DATA: "re",

	// 获取命令值的方法
	getValue(key) {
		return this[key] || '';
	},

	// 获取所有命令
	getAllCommands() {
		return Object.keys(this).filter(key => typeof this[key] === 'string');
	}
};

/**
 * 控制命令类型枚举
 */
export const CommandType = {
	NORMAL_VALUE: 'normalValue', // 普通值，例如：jhwd=
	INTEGER_VALUE: 'integerValue', // 整数值，例如：gyys=
	SPECIAL_COMMAND: 'specialCommand', // 特殊命令，例如：dl0
	BATTERY_TYPE: 'batteryType' // 电池类型命令，例如：okFe
};

/**
 * 密码验证响应枚举
 */
export const PasswordResponse = {
	SUCCESS: "pd1",
	FAILURE: "pd0",

	// 获取响应值的方法
	getValue(key) {
		return this[key] || '';
	},

	// 检查是否为成功响应
	isSuccess(response) {
		return response === this.SUCCESS;
	},

	// 检查是否为失败响应
	isFailure(response) {
		return response === this.FAILURE;
	},

	// 获取所有响应类型
	getAllResponses() {
		return Object.keys(this).filter(key => typeof this[key] === 'string');
	}
};
