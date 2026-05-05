// === Метаданные устройства ===
export function Name() { return "Redragon K580 Vata"; }
export function VendorId() { return 0x320F; }
export function ProductId() { return 0x5000; }
export function Publisher() { return "Custom"; }
export function Size() { return [24, 8]; }
export function DeviceType() { return "keyboard"; }

// Более строгая валидация по HID
export function Validate(endpoint) {
	return endpoint.interface === 1 &&
	       endpoint.usage === 0x0092 &&
	       endpoint.usage_page === 0xFF1C &&
	       endpoint.collection === 0x0004 &&
	       endpoint.vendor_id === 0x320F &&
	       endpoint.product_id === 0x5000;
}

export function ImageUrl() {
	return "https://assets.signalrgb.com/devices/default/misc/usb-drive-render.png";
}

// === Параметры управления ===
export function ControllableParameters() {
	return [
		{ property: "forcedModel",   group: "lighting", label: "Модель клавиатуры",           type: "combobox", values: ["Redragon K580 Vata", "None"], default: "None" },
		{ property: "LightingMode",  group: "lighting", label: "Режим подсветки",             type: "combobox", values: ["Canvas", "Forced"],           default: "Canvas" },
		{ property: "shutdownColor", group: "lighting", label: "Цвет при выключении",         type: "color",    default: "#000000" },
		{ property: "forcedColor",   group: "lighting", label: "Принудительный цвет",         type: "color",    default: "#FF0000" },
		{ property: "monochrome",    group: "lighting", label: "Монохромный режим",           type: "boolean",  default: false },
		{ property: "monochromeMode",group: "lighting", label: "Метод яркости монохрома",     type: "combobox", values: ["Max", "Average", "Luma"],     default: "Max" },

		{ property: "packetSize",    group: "settings", label: "📦 Размер пакета (байт)",     type: "combobox", values: [24, 32, 33, 42, 48, 56],       default: 48 },
		{ property: "packetPause",   group: "settings", label: "⏱️ Пауза между пакетами (мс)", type: "combobox", values: [1, 2, 3, 5, 8, 10, 15],        default: 3 },
		{ property: "useChecksum",   group: "settings", label: "🔒 Использовать контрольную сумму", type: "boolean", default: true },
		{ property: "fps",           group: "settings", label: "🎞️ FPS (кадров в секунду)",   type: "combobox", values: [15, 30, 45, 60],               default: 30 },
		{ property: "logLevel",      group: "settings", label: "📋 Уровень логов",            type: "combobox", values: ["None", "Basic", "Verbose"],   default: "Basic" },
	];
}

// === Жизненный цикл ===
export function Initialize() {
	EVISION.Initialize();
}

export function Render() {
	EVISION.sendColors();

	if (!EVISION.renderNotified) {
		device.notify("✨ Подсветка активна", "Клавиатура успешно управляется через SignalRGB.", 1);
		EVISION.renderNotified = true;
		device.log("✨ Подсветка активна");
	}
}

export function Shutdown(SystemSuspending) {
	const color = SystemSuspending
		? "#000000"
		: device.getProperty("shutdownColor");

	EVISION.sendColors(color);
	device.pause(20);
}

export function onforcedModelChanged() {
	EVISION.updateModel(device.getProperty("forcedModel"));
}

// ============================================================================
// === КЛАСС ПРОТОКОЛА УСТРОЙСТВА =============================================
// ============================================================================

export class EVISION_Device_Protocol {
	constructor() {
		this.Config = {
			ModelID: undefined,
			LedNames: [],
			LedPositions: [],
			Leds: [],
			layout: undefined,
			Endpoint: undefined,
			ProductId: undefined,
			DeviceName: undefined,
		};

		// Кэш параметров отправки
		this.prevPacketSize = null;
		this.prevPauseTime = null;
		this.prevUseChecksum = null;
		this.prevFPS = null;
		this.prevTotalPackets = null;

		// Кэш кадров
		this.prevFrame = null;
		this.lastFrameId = null;
		this.forcedSent = false;
		this.lastMode = null;

		// Счётчики и флаги логов
		this.totalPacketsSent = 0;
		this.basicPacketsPrinted = false;
		this.packetInfoPrinted = false;
		this.paramsInfoPrinted = false;
		this.checksumInfoPrinted = false;

		this.LOGLEVEL = "Basic";
	}

	// === Логирование ===
	log(level, message) {
		const setting = device.getProperty("logLevel") || "Basic";

		if (setting === "None") return;
		if (setting === "Basic" && level === "verbose") return;

		const tag =
			level === "error"   ? "❌ ERROR" :
			level === "warn"    ? "⚠️ WARN" :
			level === "verbose" ? "🔍 VERBOSE" :
			                      "ℹ️ INFO";

		device.log(`${tag}: ${message}`);
	}

	// === HEX → RGB ===
	hexToRgb(hex) {
		hex = (hex || "#000000").replace(/^#/, "");
		const bigint = parseInt(hex, 16);
		const r = (bigint >> 16) & 255;
		const g = (bigint >> 8) & 255;
		const b = bigint & 255;
		return [r, g, b];
	}

	// === Геттеры/сеттеры ===
	setModelID(id) { this.Config.ModelID = id; }
	getModelID() { return this.Config.ModelID; }

	setDeviceName(name) { this.Config.DeviceName = name; }
	getDeviceName() { return this.Config.DeviceName; }

	setLedLayout(layout) { this.Config.layout = layout; }
	getLedLayout() { return this.Config.layout; }

	setLedNames(names) { this.Config.LedNames = names; }
	getLedNames() { return this.Config.LedNames; }

	setLedPositions(positions) { this.Config.LedPositions = positions; }
	getLedPositions() { return this.Config.LedPositions; }

	setLeds(leds) { this.Config.Leds = leds; }
	getLeds() { return this.Config.Leds; }

	setDeviceEndpoint(endpoint) { this.Config.Endpoint = endpoint; }
	getDeviceEndpoint() { return this.Config.Endpoint; }

	setDeviceProductId(productId) { this.Config.ProductId = productId; }
	getDeviceProductId() { return this.Config.ProductId; }

	// === Свойства устройства из библиотеки ===
	getDeviceProperties(modelID) {
		if (EVISIONdeviceLibrary &&
			EVISIONdeviceLibrary.LEDLibrary &&
			EVISIONdeviceLibrary.LEDLibrary[modelID]) {
			return EVISIONdeviceLibrary.LEDLibrary[modelID];
		}
		return null;
	}

	// === Перевод в программный режим (если нужен) ===
	setSoftwareMode() {
		try {
			device.write([0x04, 0x8c, 0x00, 0x0b, 0x30, 0x50, 0x01], 64);
			device.pause(50);
		} catch (err) {
			this.log("error", `Error setting software mode: ${err}`);
			device.notify(
				"❌ Ошибка подключения",
				"Не удалось перевести устройство в программный режим. Проверьте кабель или драйвер.",
				2
			);
		}
	}

	// === Инициализация ===
	Initialize() {
		try {
			this.setDeviceProductId(device.productId());

			const deviceHID = device.getDeviceInfo();
			const forced = device.getProperty("forcedModel") || "None";
			const modelID = forced === "None" ? deviceHID.product : forced;

			this.log("info", "Initializing Redragon K580 Vata...");
			this.updateModel(modelID);
		} catch (err) {
			this.log("error", `Error during initialization: ${err}`);
			device.notify(
				"❌ Ошибка инициализации",
				"Не удалось инициализировать устройство. Попробуйте переподключить клавиатуру.",
				3
			);
		}
	}

	// === Основной рендер ===
	sendColors(overrideColor) {
		if (!this.getModelID() || this.getLedLayout() === "None") return;

		const LedPositions = this.getLedPositions();
		const Leds = this.getLeds();

		if (!LedPositions || !Leds || Leds.length === 0) return;

		const mode = device.getProperty("LightingMode") || "Canvas";

		// Сброс forcedSent при смене режима
		if (mode !== this.lastMode) {
			this.forcedSent = false;
			this.lastMode = mode;
		}

		// Forced Mode — один статический кадр
		if (mode === "Forced" && !overrideColor) {
			if (this.forcedSent) return;
			this.forcedSent = true;
		}

		const frameId = device.getFrameId();
		if (frameId === this.lastFrameId && !overrideColor && mode !== "Forced") {
			return;
		}
		this.lastFrameId = frameId;

		const canvas = device.canvas();
		if (!canvas && !overrideColor && mode !== "Forced") return;

		const count = Leds.length;
		const RGBData = new Uint8Array(count * 3);

		const forcedColorHex = device.getProperty("forcedColor") || "#FF0000";
		const forcedRGB = mode === "Forced" ? this.hexToRgb(forcedColorHex) : null;
		const overrideRGB = overrideColor ? this.hexToRgb(overrideColor) : null;

		const monochrome = device.getProperty("monochrome") || false;
		const monochromeMode = device.getProperty("monochromeMode") || "Max";

		for (let i = 0; i < count; i++) {
			const pos = LedPositions[i];
			if (!pos) continue;

			const [px, py] = pos;

			let color =
				overrideRGB ||
				forcedRGB ||
				(canvas ? canvas.getPixel(px, py) : [0, 0, 0]);

			if (!color || color.length !== 3) {
				color = [0, 0, 0];
			}

			if (monochrome) {
				let gray;
				switch (monochromeMode) {
					case "Average":
						gray = Math.round((color[0] + color[1] + color[2]) / 3);
						break;
					case "Luma":
						gray = Math.round(0.2126 * color[0] + 0.7152 * color[1] + 0.0722 * color[2]);
						break;
					case "Max":
					default:
						gray = Math.max(color[0], color[1], color[2]);
						break;
				}
				color = [gray, gray, gray];
			}

			const ledIndex = Leds[i];
			const base = ledIndex * 3;

			if (base + 2 >= RGBData.length) continue;

			RGBData[base]     = color[0];
			RGBData[base + 1] = color[1];
			RGBData[base + 2] = color[2];
		}

		// Кэш кадров — пропускаем, если кадр не изменился
		if (this.prevFrame && this.prevFrame.length === RGBData.length) {
			let same = true;
			for (let i = 0; i < RGBData.length; i++) {
				if (RGBData[i] !== this.prevFrame[i]) {
					same = false;
					break;
				}
			}
			if (same) {
				this.log("verbose", "Frame unchanged — skipping USB write.");
				return;
			}
		}

		this.prevFrame = RGBData.slice();

		this.writeRGBPackage(Array.from(RGBData));
	}

	// === Отправка пакетов ===
	writeRGBPackage(RGBData) {
		const bytesToSend = device.getProperty("packetSize")  || 48;
		const pauseTime   = device.getProperty("packetPause") || 3;
		const FPS         = device.getProperty("fps")         || 30;
		this.LOGLEVEL     = device.getProperty("logLevel")    || "Basic";

		const useChecksum = device.getProperty("useChecksum");
		const TotalPackets = Math.ceil(RGBData.length / bytesToSend);

		if (this.prevFPS !== FPS) {
			this.log("info", `🎞️ Current FPS: ${FPS}`);
			this.prevFPS = FPS;
		}

		if (!this.packetInfoPrinted || TotalPackets !== this.prevTotalPackets) {
			if (this.LOGLEVEL !== "None") {
				this.log("info", `📦 TotalPackets=${TotalPackets}`);
			}
			this.prevTotalPackets = TotalPackets;
			this.packetInfoPrinted = true;
			this.basicPacketsPrinted = false;
		}

		const startTime = Date.now();

		if (!this.paramsInfoPrinted ||
			bytesToSend !== this.prevPacketSize ||
			pauseTime   !== this.prevPauseTime ||
			useChecksum !== this.prevUseChecksum) {

			if (bytesToSend !== this.prevPacketSize && this.prevPacketSize !== null) {
				this.log("info", `⚙️ Packet Size изменён: ${this.prevPacketSize} → ${bytesToSend}`);
			}
			if (pauseTime !== this.prevPauseTime && this.prevPauseTime !== null) {
				this.log("info", `⏱️ Packet Pause изменён: ${this.prevPauseTime} → ${pauseTime}`);
			}
			if (useChecksum !== this.prevUseChecksum && this.prevUseChecksum !== null) {
				this.log("info", `🔒 UseChecksum изменён: ${this.prevUseChecksum} → ${useChecksum}`);
			}

			if (this.LOGLEVEL !== "None") {
				this.log(
					"info",
					`📦 Packet Size=${bytesToSend}, Pause=${pauseTime}, UseChecksum=${useChecksum}, TotalPackets=${TotalPackets}`
				);
			}

			this.prevPacketSize = bytesToSend;
			this.prevPauseTime = pauseTime;
			this.prevUseChecksum = useChecksum;
			this.paramsInfoPrinted = true;
		}

		let packetLines = [];
		let errorCount = 0;

		for (let index = 0; index < TotalPackets; index++) {
			const start = index * bytesToSend;
			const data = RGBData.slice(start, start + bytesToSend);

			while (data.length < bytesToSend) data.push(0);

			const bytesSent = this.getHighLow(index * bytesToSend);

			const checksum = (typeof useChecksum !== "undefined" && useChecksum)
				? this.calculateChecksum(data, index, bytesToSend)
				: { low: 0, high: 0 };

			const header = [0x04, checksum.low, checksum.high, 0x12, bytesToSend, bytesSent.low, bytesSent.high, 0x00];
			const packet = header.concat(data);

			try {
				device.write(packet, 64);
				device.pause(pauseTime);
			} catch (err) {
				this.log("error", `Error writing RGB packet: ${err}`);
				errorCount++;
				if (errorCount >= 3) {
					device.notify(
						"❌ Критическая ошибка",
						"Устройство не отвечает на пакеты данных. Попробуйте переподключить клавиатуру.",
						3
					);
					return;
				} else {
					device.notify(
						"❌ Ошибка передачи",
						`Сбой при отправке пакета #${index + 1}. Попытка ${errorCount}/3.`,
						2
					);
				}
			}

			if (this.LOGLEVEL === "Basic" && !this.basicPacketsPrinted) {
				packetLines.push(`📦 Packet #${index + 1}/${TotalPackets}`);
			}

			if (this.LOGLEVEL === "Verbose") {
				this.log("verbose", `Packet #${index + 1}/${TotalPackets}: ${JSON.stringify(packet)}`);
			}
		}

		if (this.LOGLEVEL === "Basic" && packetLines.length > 0 && !this.basicPacketsPrinted) {
			for (const line of packetLines) {
				this.log("info", line);
			}
			this.basicPacketsPrinted = true;
			this.log("info", "✅ Все пакеты успешно отправлены");
		}

		this.totalPacketsSent += TotalPackets;

		const endTime = Date.now();
		if (this.LOGLEVEL === "Verbose") {
			this.log("verbose", `⏱️ Packets sent in ${endTime - startTime} ms`);
			this.log("verbose", `📦 Total packets sent so far: ${this.totalPacketsSent}`);
		}
	}

	calculateChecksum(packet, index, bytesToSend) {
		const packetSum = packet.reduce((sum, num) => sum + num, 0);

		let result;
		if (index >= 5) {
			result = this.getHighLow(packetSum + ((index - 5) * bytesToSend) + 99);
		} else {
			result = this.getHighLow(packetSum + (index * bytesToSend) + 74);
		}

		if (this.LOGLEVEL !== "None" && !this.checksumInfoPrinted) {
			this.log(
				"info",
				`🔑 Checksum calc | index=${index}, sum=${packetSum}, result.low=${result.low}, result.high=${result.high}`
			);
			this.checksumInfoPrinted = true;
		}
		return result;
	}

	getHighLow(value) {
		const high = (value >>> 8) & 0xFF;
		const low = value & 0xFF;
		return { high, low };
	}

	// === Обновление модели ===
	updateModel(modelID) {
		if (modelID === "None") {
			this.setLedLayout("None");
			device.notify("🌑 Подсветка отключена", "Режим 'None' выбран — управление подсветкой выключено.", 1);
			this.log("info", "🌑 Lighting disabled due to 'None' mode.");
			return;
		}

		const DeviceProperties = this.getDeviceProperties("Redragon K580 Vata");

		if (DeviceProperties) {
			this.setModelID("Redragon K580 Vata");
			this.setDeviceName(DeviceProperties.name);

			this.log("info", `✅ Device model found: ${this.getDeviceName()}`);
			device.setName(this.getDeviceName());
			this.log("info", "🖼️ Loading Image...");
			device.setImageFromUrl(DeviceProperties.image);

			this.setLedNames(DeviceProperties.vLedNames);
			this.setLedPositions(DeviceProperties.vLedPositions);
			this.setLeds(DeviceProperties.vLeds);

			this.detectDeviceEndpoint(DeviceProperties);

			device.setSize(DeviceProperties.size);
			device.setControllableLeds(this.getLedNames(), this.getLedPositions());

			device.notify("✅ Устройство готово", "Redragon K580 Vata успешно инициализировано.", 1);
			this.log("info", "🚀 Initialization complete for Redragon K580 Vata.");
		} else {
			device.notify("Ошибка", "Не удалось загрузить свойства для Redragon K580 Vata.", 3);
			this.log("error", "Model not found in library!");
		}
	}

	// Заглушка — если нужно будет реально выбирать endpoint
	detectDeviceEndpoint(DeviceProperties) {
		if (DeviceProperties.endpoint && DeviceProperties.endpoint.length > 0) {
			this.setDeviceEndpoint(DeviceProperties.endpoint[0]);
		}
	}
}

// ============================================================================
// === БИБЛИОТЕКА УСТРОЙСТВА ==================================================
// ============================================================================

export class deviceLibrary {
	constructor() {
		this.LEDLibrary = {
			"Redragon K580 Vata": {
				name: "Redragon K580 Vata",
				image: "https://assets.signalrgb.com/devices/brands/redragon/keyboards/k580.png",
				vLedNames: [
					"Left strip 1",                                                                                                                         "Right strip 1",
					"Left strip 2", "Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "Print Screen", "Scroll Lock", "Pause Break", "Right strip 2",
					"Left strip 3", "`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "+", "Backspace", "Insert", "Home", "Page Up", "NumLock", "Num /", "Num *", "Num -", "Right strip 3",
					"Left strip 4", "Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\", "Del", "End", "Page Down", "Num 7", "Num 8", "Num 9", "Num +", "Right strip 4",
					"Left strip 5", "CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter", "Num 4", "Num 5", "Num 6", "Right strip 5",
					"Left strip 6", "Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift", "Up Arrow", "Num 1", "Num 2", "Num 3", "Num Enter", "Right strip 6",
					"Left strip 7", "Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl", "Left Arrow", "Down Arrow", "Right Arrow", "Num 0", "Num .", "Right strip 7",
					"Left strip 8",                                                                                                                         "Right strip 8",
				],
				vLeds: [
					7,                                                                                     127,
					15, 0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120,                   119,
					23, 1, 9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105, 113, 121, 129, 128, 136, 137, 138, 111,
					31, 2, 10, 18, 26, 34, 42, 50, 58, 66, 74, 82, 90, 98, 106, 114, 122, 130, 115, 123, 131, 139, 103,
					39, 3, 11, 19, 27, 35, 43, 51, 59, 67, 75, 83, 91, 107, 124, 132, 140, 95,
					47, 4, 20, 28, 36, 44, 52, 60, 68, 76, 84, 92, 108, 116, 109, 117, 125, 133, 87,
					55, 5, 13, 21, 29, 37, 45, 53, 61, 69, 77, 85, 93, 101, 79,
					63,                                                                                     71,
				],
				vLedPositions: [
					[0, 0],                                                                                 [22, 0],
					[0, 1], [1, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1], [15, 1], [16, 1], [17, 1], [22, 1],
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2], [15, 2], [16, 2], [17, 2], [18, 2], [19, 2], [20, 2], [21, 2], [22, 2],
					[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3], [15, 3], [16, 3], [17, 3], [18, 3], [19, 3], [20, 3], [21, 3], [22, 3],
					[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [14, 4], [18, 4], [19, 4], [20, 4], [22, 4],
					[0, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], [14, 5], [16, 5], [18, 5], [19, 5], [20, 5], [21, 5], [22, 5],
					[0, 6], [1, 6], [2, 6], [3, 6], [6, 6], [11, 6], [12, 6], [13, 6], [14, 6], [15, 6], [16, 6], [17, 6], [18, 6], [20, 6], [22, 7],
					[0, 7],                                                                                 [22, 7],
				],
				size: [24, 8],
				endpoint: [{ interface: 1, usage: 0x0092, usage_page: 0xFF1C, collection: 0x0004 }],
				layout: "Redragon_K580",
			},
			"None": {
				name: "EVision Device",
				image: "https://assets.signalrgb.com/devices/default/misc/usb-drive-render.png",
				layout: "None",
			},
		};
	}
}

const EVISIONdeviceLibrary = new deviceLibrary();
const EVISION = new EVISION_Device_Protocol();
