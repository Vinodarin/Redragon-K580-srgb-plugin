import {Assert} from "@SignalRGB/Errors.js";
import DeviceDiscovery from "@SignalRGB/DeviceDiscovery";

export function Name() { return "Redragon K580 Vata"; }
export function VendorId() { return 0x320F; }
export function ProductId() { return 0x5000; }
export function Publisher() { return "Custom"; }
export function Size() { return [24, 8]; }
export function DeviceType(){ return "keyboard"; }
export function Validate(endpoint) { return endpoint.interface === 1 || endpoint.interface === 2; }
export function ImageUrl() { return "https://assets.signalrgb.com/devices/default/misc/usb-drive-render.png"; }

/* global
forcedModel:readonly
LightingMode:readonly
shutdownColor:readonly
forcedColor:readonly
monochrome:readonly
monochromeMode
packetSize
packetPause
useChecksum
debugMode
fps
logLevel

*/

export function ControllableParameters(){
	return [
		{property:"forcedModel", group:"lighting", label:"Модель клавиатуры", type:"combobox", values: ["Redragon K580 Vata", "None"], default: "None"},
		{property:"LightingMode", group:"lighting", label:"Режим подсветки", type:"combobox", values:["Canvas", "Forced"], default:"Canvas"},
		{property:"shutdownColor", group:"lighting", label:"Цвет при выключении", type:"color", default:"#000000"},
		{property:"forcedColor", group:"lighting", label:"Принудительный цвет", type:"color", default:"#FF0000"},
		{property:"monochrome", group:"lighting", label:"Монохромный режим", type:"boolean", default:false},
		{property:"monochromeMode", group:"lighting", label:"Метод яркости монохрома", type:"combobox", values:["Max", "Average", "Luma"], default:"Max"}, // новый параметр - "Max" - берётся максимальное значение из R, G, B "Average" - берётся среднее арифметическое "Luma" - берётся яркость по формуле восприятия (учитывает, что глаз сильнее реагирует на зелёный)
		// новые параметры в отдельной группе "settings"
		{property:"packetSize", group:"settings", label:"📦 Размер пакета (bit)", type:"combobox", values:[24, 33, 42, 32, 48, 56], default:48}, // новый параметр изменяет размер пакета bit
		{property:"packetPause", group:"settings", label:"⏱️ Пауза между пакетами (мс)", type:"combobox", values:[1, 2, 3, 5, 8, 10, 15], default:3}, // новый параметр изменяет паузу при отправке пакетов
		{property:"useChecksum", group:"settings", label:"🔒 Использовать контрольную сумму", type:"boolean", default:true}, // новый параметр вкл.откл проверку useChecksum
		{property:"fps", group:"settings", label:"🎞️ FPS (кадров в секунду)", type:"combobox", values:[15, 30, 45, 60], default:30}, // Частота обновления
        {property:"logLevel", group:"settings", label:"📋 Уровень логов", type:"combobox", values:["None","Basic","Verbose"], default:"Basic"} // Гибкая настройка логов
	];
}

export function Initialize() { EVISION.Initialize(); }
export function Render() {
	EVISION.sendColors();
	if (!EVISION.renderNotified) {
		device.notify("✨ Подсветка активна", "Клавиатура успешно управляется через SignalRGB.", 1);
		EVISION.renderNotified = true;
		device.log("✨ Подсветка активна");
	}
}
export function Shutdown(SystemSuspending) {
	const color = SystemSuspending ? "#000000" : shutdownColor;
	EVISION.sendColors(color);
	device.pause(20);
}
export function onforcedModelChanged() { EVISION.updateModel(forcedModel); }

export class EVISION_Device_Protocol {
	constructor() {
		this.Config = {
			ModelID: undefined,
			LedNames: [],
			LedPositions: [],
			Leds: [],
			layout: undefined,
			Endpoint: undefined,
			ProductId: undefined
		};
		
		// Храним предыдущие значения
		this.prevPacketSize = null;
		this.prevPauseTime = null;
		this.prevUseChecksum = null;
		this.prevFPS = null;
		this.prevTotalPackets = null;
		
		// Счётчик пакетов
		this.totalPacketsSent = 0;
		this.basicPacketsPrinted = false;

		// --- Uint8Array буферы ---
		this.LED_COUNT = 120;
		this.frame = new Uint8Array(this.LED_COUNT * 3);
		this.packetHeader = new Uint8Array(8);
		this.packet = null;
	}
	// --- Сеттеры и геттеры ---
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

	// Вспомогательная функция для перевода HEX (#RRGGBB) в массив [R,G,B]
    hexToRgb(hex) {
        hex = hex.replace(/^#/, '');
        let bigint = parseInt(hex, 16);
        let r = (bigint >> 16) & 255;
        let g = (bigint >> 8) & 255;
        let b = bigint & 255;
        return [r, g, b];
    }

	setSoftwareMode() {
		try {
			device.write([0x04, 0x8c, 0x00, 0x0b, 0x30, 0x50, 0x01], 64);
			device.pause(50);
		} catch (err) {
			console.error("❌ Error setting software mode:", err);
			device.notify("❌ Ошибка подключения", "Не удалось перевести устройство в программный режим. Проверьте кабель или драйвер.", 2);
		}
	}

		getDeviceProperties(modelID) {
		if (typeof EVISIONdeviceLibrary !== "undefined" &&
			EVISIONdeviceLibrary.LEDLibrary &&
			EVISIONdeviceLibrary.LEDLibrary[modelID]) {
			return EVISIONdeviceLibrary.LEDLibrary[modelID];
		}
		return null;
	}

	Initialize() {
		try {
			this.setDeviceProductId(device.productId());
			const deviceHID = device.getDeviceInfo();
			const modelID = forcedModel === "None" ? deviceHID.product : forcedModel;
			console.log("⚡ Initializing HID...");
			this.updateModel(modelID);
		} catch (err) {
			console.error("❌ Error during initialization:", err);
			device.notify("❌ Ошибка инициализации", "Не удалось инициализировать устройство. Попробуйте переподключить клавиатуру.", 3);
		}
	}

	sendColors(overrideColor) {
    	if (!this.Config.ModelID || this.Config.layout === "None") return;

    	const { LedPositions, Leds } = this.Config;
    	const mode = typeof LightingMode !== "undefined" ? LightingMode : "Canvas";
    	const fColor = typeof forcedColor !== "undefined" ? forcedColor : "#009bde";
    	const mono = typeof monochrome !== "undefined" ? monochrome : false;
    	const monoMode = typeof monochromeMode !== "undefined" ? monochromeMode : "Max";

    	const frame = this.frame;

    	for (let i = 0; i < Leds.length; i++) {
        	const ledIndex = Leds[i] * 3;
        	const [px, py] = LedPositions[i];

        	let rgb = overrideColor
            	? this.hexToRgb(overrideColor)
            	: (mode === "Forced" ? this.hexToRgb(fColor) : device.color(px, py));

			if (mono) {
            	let gray;
            	switch (monoMode) {
                	case "Average":
						gray = (rgb[0] + rgb[1] + rgb[2]) / 3;
                    	break;
                	case "Luma":
                    	gray = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
                    	break;
                	default:
                    	gray = Math.max(rgb[0], rgb[1], rgb[2]);
            	}
            	gray |= 0;
            	frame[ledIndex]     = gray;
            	frame[ledIndex + 1] = gray;
            	frame[ledIndex + 2] = gray;
        	} else {
            	frame[ledIndex]     = rgb[0];
            	frame[ledIndex + 1] = rgb[1];
            	frame[ledIndex + 2] = rgb[2];
			}
    	}

		this.writeRGBPackage();
	}
	
	writeRGBPackage() {
    	const bytesToSend = packetSize || 48;
    	const pauseTime   = packetPause || 3;
    	const FPS         = fps || 30;
    	this.LOGLEVEL     = logLevel || "Basic";

    	const frame = this.frame;
    	const totalBytes = frame.length;
    	const TotalPackets = Math.ceil(totalBytes / bytesToSend);

    	if (!this.packet || this.packet.length !== (8 + bytesToSend)) {
        	this.packet = new Uint8Array(8 + bytesToSend);
    	}

    	const packet = this.packet;
    	const header = this.packetHeader;

		// FPS лог
    	if (this.prevFPS !== FPS) {
        	console.log(`🎞️ Current FPS: ${FPS}`);
        	this.prevFPS = FPS;
    	}

    	// Packet count лог
    	if (!this.packetInfoPrinted || TotalPackets !== this.prevTotalPackets) {
        	console.log(`📦 TotalPackets=${TotalPackets}`);
        	this.prevTotalPackets = TotalPackets;
        	this.packetInfoPrinted = true;
        	this.basicPacketsPrinted = false;
    	}

    	// Параметры
    	if (!this.paramsInfoPrinted ||
        	bytesToSend !== this.prevPacketSize ||
        	pauseTime !== this.prevPauseTime ||
        	useChecksum !== this.prevUseChecksum) {

        	if (bytesToSend !== this.prevPacketSize)
            	console.log(`⚙️ Packet Size изменён: ${this.prevPacketSize} → ${bytesToSend}`);

        	if (pauseTime !== this.prevPauseTime)
            	console.log(`⏱️ Packet Pause изменён: ${this.prevPauseTime} → ${pauseTime}`);

        	if (useChecksum !== this.prevUseChecksum)
            	console.log(`🔒 UseChecksum изменён: ${this.prevUseChecksum} → ${useChecksum}`);

        	console.log(`📦 Packet Size=${bytesToSend}, Pause=${pauseTime}, UseChecksum=${useChecksum}, TotalPackets=${TotalPackets}`);

        	this.prevPacketSize = bytesToSend;
        	this.prevPauseTime = pauseTime;
        	this.prevUseChecksum = useChecksum;
        	this.paramsInfoPrinted = true;
    	}

    	let errorCount = 0;
    	let packetLines = [];

    	for (let index = 0; index < TotalPackets; index++) {

        	const start = index * bytesToSend;
        	const end = Math.min(start + bytesToSend, totalBytes);

        	const chunk = frame.subarray(start, end);

        	const bytesSent = this.getHighLow(start);

        	header[0] = 0x04;

        	if (useChecksum) {
            	const cs = this.calculateChecksum(chunk, index, bytesToSend);
            	header[1] = cs.low;
            	header[2] = cs.high;
        	} else {
            	header[1] = 0;
            	header[2] = 0;
        	}

			header[3] = 0x12;
        	header[4] = bytesToSend;
        	header[5] = bytesSent.low;
        	header[6] = bytesSent.high;
        	header[7] = 0x00;

        	packet.set(header, 0);
        	packet.set(chunk, 8);

        	if (chunk.length < bytesToSend) {
            	packet.fill(0, 8 + chunk.length);
        	}

			try {
            	device.write(packet, 64);
            	device.pause(pauseTime);
        	} catch (err) {
            	console.error("Error writing RGB packet:", err);
            	errorCount++;
            	if (errorCount >= 3) {
                	device.notify("❌ Критическая ошибка", "Устройство не отвечает на пакеты данных.", 3);
                	return;
            	} else {
                	device.notify("❌ Ошибка передачи", `Сбой при отправке пакета #${index + 1}.`, 2);
            	}
        	}

        	if (this.LOGLEVEL === "Basic" && !this.basicPacketsPrinted) {
            	packetLines.push(`📦 Packet #${index + 1}/${TotalPackets}`);
        	}

        	if (this.LOGLEVEL === "Verbose") {
            	console.log(`📦 Packet #${index + 1}/${TotalPackets}:`, packet);
        	}
    	}

    	if (this.LOGLEVEL === "Basic" && packetLines.length > 0 && !this.basicPacketsPrinted) {
        	console.log(packetLines.join("\n"));
        	this.basicPacketsPrinted = true;
        	console.log("✅ Все пакеты успешно отправлены");
    	}

    	this.totalPacketsSent += TotalPackets;
	}
	
	calculateChecksum(chunk, index, bytesToSend) {
    	let sum = 0;
    	for (let i = 0; i < chunk.length; i++) sum += chunk[i];

    	const result = (index >= 5)
        	? this.getHighLow(sum + ((index - 5) * bytesToSend) + 99)
        	: this.getHighLow(sum + (index * bytesToSend) + 74);

    	if (this.LOGLEVEL !== "None" && !this.checksumInfoPrinted) {
        	console.log(`🔑 Checksum calc | index=${index}, sum=${sum}, result.low=${result.low}, result.high=${result.high}`);
        	this.checksumInfoPrinted = true;
    	}

    	return result;
	}

	getHighLow(value) {
		const high = (value >>> 8) & 0xFF;
		const low = value & 0xFF;

		return { high, low };
	}

	updateModel(modelID) {
		if (modelID === "None") {
			this.setLedLayout("None");
			device.notify("🌑 Подсветка отключена", "Режим 'None' выбран — управление подсветкой выключено.", 1);
			device.log("🌑 Lighting disabled due to 'None' mode.");
			return;
		}

		const DeviceProperties = this.getDeviceProperties("Redragon K580 Vata");

		if (DeviceProperties) {
			this.setModelID("Redragon K580 Vata");
			this.setDeviceName(DeviceProperties.name);

			device.log(`✅ Device model found: ${this.getDeviceName()}`);
			device.setName(this.getDeviceName());
			console.log("🖼️ Loading Image...");
			device.setImageFromUrl(DeviceProperties.image);

			this.setLedNames(DeviceProperties.vLedNames);
			this.setLedPositions(DeviceProperties.vLedPositions);
			this.setLeds(DeviceProperties.vLeds);

			this.detectDeviceEndpoint(DeviceProperties);

			device.setSize(DeviceProperties.size);
			device.setControllableLeds(this.getLedNames(), this.getLedPositions());

			device.notify("✅ Устройство готово", "Redragon K580 Vata успешно инициализировано.", 1);
			device.log("🚀 Initialization complete for Redragon K580 Vata.");
		} else {
			device.notify("Ошибка", "Не удалось загрузить свойства для Redragon K580 Vata.", 3);
			device.log("❌ Model not found in library!");
		}
	}
	
	detectDeviceEndpoint(deviceLibrary) {

		console.log("🔍 Searching for endpoints...");

		const deviceEndpoints = device.getHidEndpoints();

		for (let endpoints = 0; endpoints < deviceLibrary.endpoint.length; endpoints++) {
			const endpoint = deviceLibrary.endpoint[endpoints];

			for (let endpointList = 0; endpointList < deviceEndpoints.length; endpointList++) {
				const currentEndpoint = deviceEndpoints[endpointList];

				if (
					endpoint.interface	=== currentEndpoint.interface	&&
					endpoint.usage		=== currentEndpoint.usage		&&
					endpoint.usage_page	=== currentEndpoint.usage_page	&&
					endpoint.collection	=== currentEndpoint.collection	) {

					this.setDeviceEndpoint(currentEndpoint);
					device.set_endpoint(
						currentEndpoint.interface,
						currentEndpoint.usage,
						currentEndpoint.usage_page,
						currentEndpoint.collection,
					);

					console.log("🔌 Endpoint " + JSON.stringify(currentEndpoint) + " found!");
					device.notify("✅ Эндпоинт найден", "Устройство успешно подключено и готово к работе.", 1)
					return;
				}
			}
		}

		console.log(`❌ Endpoints not found in the device! - ${JSON.stringify(deviceLibrary.endpoint)}`);
		device.notify("❌ Эндпоинт не найден", "Не удалось найти HID-эндпоинт для устройства. Проверьте драйвер или кабель.", 2);
		device.log("❌ Endpoint search failed");
	}
}

export class deviceLibrary {
	constructor(){
		this.LEDLibrary	=	{

			"Redragon K580 Vata": {
				name: "Redragon K580 Vata",
				image: "https://assets.signalrgb.com/devices/brands/redragon/keyboards/k580.png",
				vLedNames: [
					"Left strip 1",																																															"Right strip 1",
					"Left strip 2",	"Esc",     "F1", "F2", "F3", "F4",   "F5", "F6", "F7", "F8",    "F9", "F10", "F11", "F12",		"Print Screen",	"Scroll Lock",	"Pause Break", 											"Right strip 2",
					"Left strip 3",	"`", "1",  "2", "3", "4", "5",  "6", "7", "8", "9", "0",  "-",   "+",  "Backspace",				"Insert",		"Home",			"Page Up",		"NumLock", "Num /", "Num *", "Num -", 	"Right strip 3",
					"Left strip 4",	"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",						"Del",			"End",			"Page Down",	"Num 7", "Num 8", "Num 9", "Num +", 	"Right strip 4",
					"Left strip 5",	"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", 			 "Enter",															"Num 4", "Num 5", "Num 6", 				"Right strip 5",
					"Left strip 6",	"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", 	  "Right Shift",							"Up Arrow",						"Num 1", "Num 2", "Num 3", "Num Enter", "Right strip 6",
					"Left strip 7",	"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Menu", "Right Ctrl",			"Left Arrow",	"Down Arrow",	"Right Arrow",	"Num 0",		  "Num .", 				"Right strip 7",
					"Left strip 8",																																															"Right strip 8",
				],
				vLeds:  [
					7, 																										127,
					15,   0,      8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96,    104, 112, 120,							119,
					23,   1,  9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97, 105,   113, 121, 129,    128, 136, 137, 138,	111,
					31,   2, 10, 18, 26, 34, 42, 50, 58, 66, 74, 82, 90, 98, 106,   114, 122, 130,    115, 123, 131, 139,	103,
					39,   3, 11, 19, 27, 35, 43, 51, 59, 67, 75, 83, 91,     107,					  124, 132, 140,		95,
					47,   4,     20, 28, 36, 44, 52, 60, 68, 76, 84, 92,	108,         116,		  109, 117, 125, 133,	87,
					55,   5, 13, 21,                 29,           37, 45, 53, 61,    69, 77, 85,      93,      101,		79,
					63,																										71,
				],
				vLedPositions: [
					[0, 0],																																															[22, 0], //2
					[0, 1], [1, 1],			[3, 1], [4, 1], [5, 1], [6, 1],	[7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1],	[15, 1], [16, 1], [17, 1],										[22, 1], //23
					[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2],	[15, 2], [16, 2], [17, 2],	[18, 2], [19, 2], [20, 2], [21, 2], [22, 2], //24
					[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3], 	[15, 3], [16, 3], [17, 3],	[18, 3], [19, 3], [20, 3], [21, 3], [22, 3], //24
					[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], 			[14, 4],								[18, 4], [19, 4], [20, 4],			[22, 4], //19
					[0, 5], 		[2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], 			[14, 5],			 [16, 5],			[18, 5], [19, 5], [20, 5], [21, 5], [22, 5], //19
					[0, 6], [1, 6], [2, 6], [3, 6],					[6, 6],									 [11, 6], [12, 6], [13, 6], [14, 6],	[15, 6], [16, 6], [17, 6], 	[18, 6],		  [20, 6],			[22, 7],
					[0, 7],																																															[22, 7],
				],
				size: [24, 8],
				endpoint: [{ "interface": 1, "usage": 0x0092, "usage_page": 0xFF1C, "collection": 0x0004 }]
			},
			"None": {
				name: "EVision Device",
				image: "https://assets.signalrgb.com/devices/default/misc/usb-drive-render.png",
				layout:	"None",
			},
		};
	}
}

const EVISIONdeviceLibrary = new deviceLibrary();
const EVISION = new EVISION_Device_Protocol();

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0];
}
