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
		{property:"packetSize", group:"settings", label:"Размер пакета (bit)", type:"combobox", values:[24, 33, 42, 32, 48, 56], default:48}, // новый параметр изменяет размер пакета bit
		{property:"packetPause", group:"settings", label:"Пауза между пакетами (мс)", type:"combobox", values:[1, 2, 3, 5, 8, 10, 15], default:3}, // новый параметр изменяет паузу при отправке пакетов
		{property:"useChecksum", group:"settings", label:"Использовать контрольную сумму", type:"boolean", default:true}, // новый параметр вкл.откл проверку useChecksum
		{property:"fps", group:"settings", label:"FPS (кадров в секунду)", type:"combobox", values:[15, 30, 45, 60], default:30}, // Частота обновления
        {property:"logLevel", group:"settings", label:"Уровень логов", type:"combobox", values:["None","Basic","Verbose"], default:"Basic"} // Гибкая настройка логов
	];
}

export function Initialize() { EVISION.Initialize(); }
export function Render() {
	EVISION.sendColors();
	if (!EVISION.renderNotified) {
		device.notify("✅ Подсветка активна", "Клавиатура успешно управляется через SignalRGB.", 1);
		EVISION.renderNotified = true;
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
			console.error("Error setting software mode:", err);
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
			this.updateModel(modelID);
		} catch (err) {
			console.error("Error during initialization:", err);
			device.notify("❌ Ошибка инициализации", "Не удалось инициализировать устройство. Попробуйте переподключить клавиатуру.", 3);
		}
	}

	sendColors(overrideColor) {
		if (!this.Config.ModelID || this.Config.layout === "None") return;

		const { LedPositions, Leds } = this.Config;
		const RGBData = [];

		for (let i = 0; i < Leds.length; i++) {
			const [px, py] = LedPositions[i];
			const mode = typeof LightingMode !== "undefined" ? LightingMode : "Canvas";
			const fColor = typeof forcedColor !== "undefined" ? forcedColor : "#009bde";
			const color = overrideColor
				? this.hexToRgb(overrideColor)
				: (mode === "Forced" ? this.hexToRgb(fColor) : device.color(px, py));

			const idx = Leds[i] * 3;
			if (typeof monochrome !== "undefined" && monochrome) {
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
						gray = Math.max(...color);
						break;
				}
				RGBData[idx] = gray;
				RGBData[idx + 1] = gray;
				RGBData[idx + 2] = gray;
			} else {
				RGBData[idx] = color[0];
				RGBData[idx + 1] = color[1];
				RGBData[idx + 2] = color[2];
			}
		}
		this.writeRGBPackage(RGBData);
	}

	writeRGBPackage(RGBData){
		// Берём напрямую из GUI, а если параметр не задан — используем дефолт
		const bytesToSend = packetSize || 48;
		const pauseTime   = packetPause || 3;
		const FPS = fps || 30;
		this.LOGLEVEL = logLevel || "Basic"; // "None", "Basic", "Verbose"

		
		// Количество пакетов рассчитывается на основе актуального размера
		const TotalPackets = Math.ceil(RGBData.length / bytesToSend);
		
		// вывод FPS
		if (this.prevFPS !== FPS) {
			console.log(`🎞️ Current FPS: ${FPS}`);
			this.prevFPS = FPS;
		}
		
		if (!this.packetInfoPrinted || TotalPackets !== this.prevTotalPackets) {
        console.log(`📦 TotalPackets=${TotalPackets}`);
        this.prevTotalPackets = TotalPackets;
        this.packetInfoPrinted = true;
		this.basicPacketsPrinted = false
		}

		
		// измеряем время отправки (Date.now вместо performance.now)
		const startTime = Date.now();
		
		// Выводим строку один раз при старте (если ещё не было значений) или если изменился размер пакета/пауза
		if (!this.paramsInfoPrinted ||
			bytesToSend !== this.prevPacketSize ||
			pauseTime !== this.prevPauseTime ||
			useChecksum !== this.prevUseChecksum) {
		
		if (bytesToSend !== this.prevPacketSize) {
			console.log(`⚙️ Packet Size изменён: ${this.prevPacketSize} → ${bytesToSend}`);
		}
		if (pauseTime !== this.prevPauseTime) {
			console.log(`⚙️ Packet Pause изменён: ${this.prevPauseTime} → ${pauseTime}`);
		}
		if (useChecksum !== this.prevUseChecksum) {
			console.log(`⚙️ UseChecksum изменён: ${this.prevUseChecksum} → ${useChecksum}`);
		}
		if (this.LOGLEVEL !== "None") {
            console.log(`📦 Packet Size=${bytesToSend}, Pause=${pauseTime}, UseChecksum=${useChecksum}, TotalPackets=${TotalPackets}`);
        }
		
			this.prevPacketSize = bytesToSend;
			this.prevPauseTime = pauseTime;
			this.prevUseChecksum = useChecksum;
			this.paramsInfoPrinted = true;
		}
		
		// Собирвем номера пакетов в массив
		let packetLines = [];
		let errorCount = 0; // счётчик ошибок

		for (let index = 0; index < TotalPackets; index++) {
			const start = index * bytesToSend;
			const data = RGBData.slice(start, start + bytesToSend);
			
			// Дозаполняем пакет нулями, если в конце осталось меньше байт
			while(data.length < bytesToSend) { data.push(0); }
			
			// Calculate bytes sent
			const bytesSent = this.getHighLow(index * bytesToSend);

			// Calculate checksum
			const checksum = (typeof useChecksum !== "undefined" && useChecksum)
				? this.calculateChecksum(data, index, bytesToSend)
				: { low: 0, high: 0 };	

			const header = [0x04, checksum.low, checksum.high, 0x12, bytesToSend, bytesSent.low, bytesSent.high, 0x00];
			const packet = header.concat(data);
			
			try {
				device.write(packet, 64);
				device.pause(pauseTime); // теперь пауза задаётся из GUI
			} catch (err) {
				console.error("Error writing RGB packet:", err);
				errorCount++;
				if (errorCount >= 3) {
					device.notify("❌ Критическая ошибка", "Устройство не отвечает на пакеты данных. Попробуйте переподключить клавиатуру.", 3);
					return;
				} else {
					device.notify("❌ Ошибка передачи", `Сбой при отправке пакета #${index + 1}. Попытка ${errorCount}/3.`, 2);
				}
			}

			// вывод пакетов зависит от уровня логов
			if (this.LOGLEVEL === "Basic" && !this.basicPacketsPrinted) {
				packetLines.push(`📦 Packet #${index + 1}/${TotalPackets}`)
			}
			
			// полный вывод пакета только в Verbose
			if (this.LOGLEVEL === "Verbose") {
				console.log(`📦 Packet #${index + 1}/${TotalPackets}:`, packet);
			}
		}
		// выводим список пакетов один раз за цикл
		if (this.LOGLEVEL === "Basic" && packetLines.length > 0 && !this.basicPacketsPrinted) {
			console.log(packetLines.join("\n"));
			this.basicPacketsPrinted = true;
			console.log("✅ Все пакеты успешно отправлены");
		}
				
		// считаем общее количество отправленных пакетов
		this.totalPacketsSent += TotalPackets;
		
		const endTime = Date.now();
		if (this.LOGLEVEL === "Verbose") {
			console.log(`⏱️ Packets sent in ${(endTime - startTime)} ms`);
			console.log(`📦 Total packets sent so far: ${this.totalPacketsSent}`);
		}
	}

	calculateChecksum(packet, index, bytesToSend) {
		const packetSum = packet.reduce((sum, num) => sum + num, 0);

		let result;
		if (index >= 5) {
			result = this.getHighLow(packetSum +(( index - 5 ) * bytesToSend) + 99);
		} else {
			result = this.getHighLow(packetSum + (index * bytesToSend) + 74);
		}
		if (this.LOGLEVEL !== "None" && !this.checksumInfoPrinted) {
			console.log(`Checksum calc | index=${index}, sum=${packetSum}, result.low=${result.low}, result.high=${result.high}`);
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
			device.notify("❌ Подсветка отключена", "Режим 'None' выбран — управление подсветкой выключено.", 1);
			device.log("❌ Lighting disabled due to 'None' mode.");
			return;
		}

		const DeviceProperties = this.getDeviceProperties("Redragon K580 Vata");

		if (DeviceProperties) {
			this.setModelID("Redragon K580 Vata");
			this.setDeviceName(DeviceProperties.name);

			device.log(`✅ Device model found: ${this.getDeviceName()}`);
			device.setName(this.getDeviceName());
			device.setImageFromUrl(DeviceProperties.image);

			this.setLedNames(DeviceProperties.vLedNames);
			this.setLedPositions(DeviceProperties.vLedPositions);
			this.setLeds(DeviceProperties.vLeds);

			this.detectDeviceEndpoint(DeviceProperties);

			device.setSize(DeviceProperties.size);
			device.setControllableLeds(this.getLedNames(), this.getLedPositions());

			device.notify("Устройство готово", "Redragon K580 Vata успешно инициализировано.", 1);
			device.log("Initialization complete for Redragon K580 Vata.");
		} else {
			device.notify("Ошибка", "Не удалось загрузить свойства для Redragon K580 Vata.", 3);
			device.log("❌ Model not found in library!");
		}
	}
	
	detectDeviceEndpoint(deviceLibrary) {

		console.log("Searching for endpoints...");

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

					console.log("Endpoint " + JSON.stringify(currentEndpoint) + " found!");
					device.notify("✅ Эндпоинт найден", "Устройство успешно подключено и готово к работе.", 1)
					return;
				}
			}
		}

		console.log(`Endpoints not found in the device! - ${JSON.stringify(deviceLibrary.endpoint)}`);
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
