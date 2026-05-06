// ==========================================================================
// ====== DeviceLibrary ====== Класс с раскладкой клавиатуры K580 Vata ======
// ==========================================================================

class deviceLibrary {
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
}

// ==================================================================
// ====== DeviceController ====== Класс управления устройством ======
// ==================================================================

class DeviceController {
    constructor() {
        this.config = {
            modelID: null,
            deviceName: null,
            endpoint: null,
            ledNames: [],
            ledPositions: [],
            leds: [],
            productId: null,
            layout: null,
        };
    }

    // -----------------------------
    // ИНИЦИАЛИЗАЦИЯ УСТРОЙСТВА
    // -----------------------------
    initialize() {
        try {
            this.config.productId = device.productId();
            const deviceHID = device.getDeviceInfo();

            const modelID = (typeof forcedModel !== "undefined" && forcedModel !== "None")
                ? forcedModel
                : deviceHID.product;

            this.loadModel(modelID);
        } catch (err) {
            console.error("❌ Error during initialization:", err);
            device.notify("❌ Ошибка инициализации", "Не удалось инициализировать устройство. Попробуйте переподключить клавиатуру.", 3);
        }
    }

    // -----------------------------
    // ЗАГРУЗКА МОДЕЛИ
    // -----------------------------
    loadModel(modelID) {
        if (modelID === "None") {
            this.config.layout = "None";
            device.notify("🌑 Подсветка отключена", "Режим 'None' выбран — управление подсветкой выключено.", 1);
            device.log("🌑 Lighting disabled due to 'None' mode.");
            return;
        }

        const props = EVISIONdeviceLibrary.LEDLibrary["Redragon K580 Vata"];
        if (!props) {
            device.notify("Ошибка", "Не удалось загрузить свойства для Redragon K580 Vata.", 3);
            device.log("❌ Model not found in library!");
            return;
        }

        this.config.modelID = "Redragon K580 Vata";
        this.config.deviceName = props.name;
        this.config.ledNames = props.vLedNames;
        this.config.ledPositions = props.vLedPositions;
        this.config.leds = props.vLeds;
        this.config.layout = props.layout || "default";

        device.log(`✅ Device model found: ${this.config.deviceName}`);
        device.setName(this.config.deviceName);

        console.log("🖼️ Loading Image...");
        device.setImageFromUrl(props.image);

        this.findEndpoint(props);
        device.setSize(props.size);
        device.setControllableLeds(this.config.ledNames, this.config.ledPositions);

        device.notify("✅ Устройство готово", "Redragon K580 Vata успешно инициализировано.", 1);
        device.log("🚀 Initialization complete for Redragon K580 Vata.");
    }

    // -----------------------------
    // ПОИСК HID-ЭНДПОИНТА
    // -----------------------------
    findEndpoint(deviceLibrary) {
        console.log("🔍 Searching for endpoints...");

        const deviceEndpoints = device.getHidEndpoints();

        for (let i = 0; i < deviceLibrary.endpoint.length; i++) {
            const expected = deviceLibrary.endpoint[i];

            for (let j = 0; j < deviceEndpoints.length; j++) {
                const current = deviceEndpoints[j];

                if (
                    expected.interface === current.interface &&
                    expected.usage === current.usage &&
                    expected.usage_page === current.usage_page &&
                    expected.collection === current.collection
                ) {
                    this.config.endpoint = current;

                    device.set_endpoint(
                        current.interface,
                        current.usage,
                        current.usage_page,
                        current.collection
                    );

                    console.log("🔌 Endpoint found:", JSON.stringify(current));
                    device.notify("✅ Эндпоинт найден", "Устройство успешно подключено и готово к работе.", 1);
                    return;
                }
            }
        }

        console.log(`❌ Endpoints not found! Expected: ${JSON.stringify(deviceLibrary.endpoint)}`);
        device.notify("❌ Эндпоинт не найден", "Не удалось найти HID-эндпоинт для устройства. Проверьте драйвер или кабель.", 2);
        device.log("❌ Endpoint search failed");
    }

    // -----------------------------
    // SOFTWARE MODE
    // -----------------------------
    setSoftwareMode() {
        try {
            device.write([0x04, 0x8c, 0x00, 0x0b, 0x30, 0x50, 0x01], 64);
            device.pause(50);
        } catch (err) {
            console.error("❌ Error setting software mode:", err);
            device.notify("❌ Ошибка подключения", "Не удалось перевести устройство в программный режим. Проверьте кабель или драйвер.", 2);
        }
    }

    // -----------------------------
    // ГЕТТЕРЫ
    // -----------------------------
    getEndpoint() { return this.config.endpoint; }
    getLedNames() { return this.config.ledNames; }
    getLedPositions() { return this.config.ledPositions; }
    getLeds() { return this.config.leds; }
    getModelID() { return this.config.modelID; }
    getDeviceName() { return this.config.deviceName; }
}

// ===========================================================
// ====== FrameBuilder ====== Класс создания RGB‑кадров ======
// ===========================================================

class FrameBuilder {
    constructor(deviceController) {
        this.device = deviceController;

        this.prevFrame = null;     // Кэш предыдущего кадра
        this.frameSize = 0;        // Размер RGB-буфера (байты)
    }

    // ---------------------------------------------------------
    // Создание основного RGB кадра
    // ---------------------------------------------------------
    buildFrame() {
        const ledPositions = this.device.getLedPositions();
        const leds = this.device.getLeds();

        if (!ledPositions || !leds || leds.length === 0) {
            return null;
        }

        // Размер кадра = количество светодиодов * 3
        const totalBytes = leds.length * 3;

        // Создаём Uint8Array (быстрее обычного массива)
        const frame = new Uint8Array(totalBytes);

        for (let i = 0; i < leds.length; i++) {
            const [px, py] = ledPositions[i];
            const ledIndex = leds[i] * 3;

            let rgb;

            // Forced / Canvas
            if (typeof LightingMode !== "undefined" && LightingMode === "Forced") {
                rgb = this.hexToRgb(forcedColor || "#009bde");
            } else {
                rgb = device.color(px, py);
            }

            // Монохром
            if (typeof monochrome !== "undefined" && monochrome) {
                rgb = this.applyMonochrome(rgb);
            }

            frame[ledIndex]     = rgb[0];
            frame[ledIndex + 1] = rgb[1];
            frame[ledIndex + 2] = rgb[2];
        }

        return frame;
    }

    // ---------------------------------------------------------
    // Кадр для выключения устройства
    // ---------------------------------------------------------
    buildShutdownFrame(color) {
        const leds = this.device.getLeds();
        const totalBytes = leds.length * 3;

        const frame = new Uint8Array(totalBytes);
        const rgb = this.hexToRgb(color || "#000000");

        for (let i = 0; i < leds.length; i++) {
            const idx = leds[i] * 3;
            frame[idx]     = rgb[0];
            frame[idx + 1] = rgb[1];
            frame[idx + 2] = rgb[2];
        }

        return frame;
    }

    // ---------------------------------------------------------
    // Проверка: изменился ли кадр?
    // ---------------------------------------------------------
    isFrameChanged(frame) {
        if (!frame) return false;

        if (!this.prevFrame) {
            this.prevFrame = frame;
            return true;
        }

        if (frame.length !== this.prevFrame.length) {
            this.prevFrame = frame;
            return true;
        }

        // Быстрое сравнение Uint8Array
        for (let i = 0; i < frame.length; i++) {
            if (frame[i] !== this.prevFrame[i]) {
                this.prevFrame = frame;
                return true;
            }
        }

        return false; // кадр не изменился → пропускаем рендер
    }

    // ---------------------------------------------------------
    // Монохромные режимы
    // ---------------------------------------------------------
    applyMonochrome([r, g, b]) {
        let gray;

        switch (monochromeMode) {
            case "Average":
                gray = (r + g + b) / 3;
                break;

            case "Luma":
                gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                break;

            case "Max":
            default:
                gray = Math.max(r, g, b);
                break;
        }

        gray = gray & 0xFF;
        return [gray, gray, gray];
    }

    // ---------------------------------------------------------
    // HEX → RGB
    // ---------------------------------------------------------
    hexToRgb(hex) {
        hex = hex.replace(/^#/, '');
        const bigint = parseInt(hex, 16);
        return [
            (bigint >> 16) & 255,
            (bigint >> 8) & 255,
            bigint & 255
        ];
    }
}

// ============================================================
// ====== PacketSender ====== Класс отправка пакетов HID ======
// ============================================================

class PacketSender {
    constructor(deviceController) {
        this.device = deviceController;

        // Кэш параметров
        this.prevPacketSize = null;
        this.prevPauseTime = null;
        this.prevUseChecksum = null;

        // Логирование
        this.packetInfoPrinted = false;
        this.basicPacketsPrinted = false;

        // Счётчики
        this.totalPacketsSent = 0;

        // Предвыделённый буфер под пакет (64 байта HID)
        this.packetBuffer = new Uint8Array(64);
    }

    // ---------------------------------------------------------
    // Отправка полного кадра
    // ---------------------------------------------------------
    sendFrame(frame) {
        if (!frame) return;

        const bytesToSend = packetSize || 48;
        const pauseTime   = packetPause || 3;
        const useCS       = useChecksum || false;

        const totalPackets = Math.ceil(frame.length / bytesToSend);

        // Логирование параметров (один раз)
        this.printPacketParams(bytesToSend, pauseTime, useCS, totalPackets);

        // Основной цикл отправки
        for (let index = 0; index < totalPackets; index++) {

            const start = index * bytesToSend;
            const end   = start + bytesToSend;

            // subarray — БЕЗ копирования
            const data = frame.subarray(start, end);

            // Заполняем пакет
            this.buildPacket(index, data, bytesToSend, useCS);

            // Отправляем HID-пакет
            try {
                device.send_report(this.packetBuffer);
                device.pause(pauseTime);
            } catch (err) {
                console.error("❌ Error writing RGB packet:", err);
                device.notify("❌ Ошибка передачи", `Сбой при отправке пакета #${index + 1}.`, 2);
                return;
            }

            // Логирование пакетов
            this.logPacket(index, totalPackets);
        }

        this.totalPacketsSent += totalPackets;
    }

    // ---------------------------------------------------------
    // Формирование HID-пакета
    // ---------------------------------------------------------
    buildPacket(index, data, bytesToSend, useChecksum) {

        // 1) Заголовок
        const checksum = useChecksum
            ? this.calculateChecksum(data, index, bytesToSend)
            : { low: 0, high: 0 };

        const offset = index * bytesToSend;

        this.packetBuffer[0] = 0x04;
        this.packetBuffer[1] = checksum.low;
        this.packetBuffer[2] = checksum.high;
        this.packetBuffer[3] = 0x12;
        this.packetBuffer[4] = bytesToSend;
        this.packetBuffer[5] = offset & 0xFF;
        this.packetBuffer[6] = (offset >>> 8) & 0xFF;
        this.packetBuffer[7] = 0x00;

        // 2) Данные (копируем в буфер)
        for (let i = 0; i < bytesToSend; i++) {
            this.packetBuffer[8 + i] = data[i] || 0;
        }

        // Остальное пространство HID-пакета заполняем нулями
        for (let i = 8 + bytesToSend; i < 64; i++) {
            this.packetBuffer[i] = 0;
        }
    }

    // ---------------------------------------------------------
    // Расчёт контрольной суммы
    // ---------------------------------------------------------
    calculateChecksum(data, index, bytesToSend) {
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data[i];
        }

        let result;
        if (index >= 5) {
            result = this.getHighLow(sum + ((index - 5) * bytesToSend) + 99);
        } else {
            result = this.getHighLow(sum + (index * bytesToSend) + 74);
        }

        return result;
    }

    getHighLow(value) {
        return {
            low: value & 0xFF,
            high: (value >>> 8) & 0xFF
        };
    }

    // ---------------------------------------------------------
    // Логирование параметров
    // ---------------------------------------------------------
    printPacketParams(bytesToSend, pauseTime, useChecksum, totalPackets) {
        if (
            !this.packetInfoPrinted ||
            bytesToSend !== this.prevPacketSize ||
            pauseTime !== this.prevPauseTime ||
            useChecksum !== this.prevUseChecksum
        ) {
            console.log(`📦 Packet Size=${bytesToSend}, Pause=${pauseTime}, UseChecksum=${useChecksum}, TotalPackets=${totalPackets}`);

            this.prevPacketSize = bytesToSend;
            this.prevPauseTime = pauseTime;
            this.prevUseChecksum = useChecksum;

            this.packetInfoPrinted = true;
            this.basicPacketsPrinted = false;
        }
    }

    // ---------------------------------------------------------
    // Логирование пакетов
    // ---------------------------------------------------------
    logPacket(index, totalPackets) {
        if (logLevel === "Verbose") {
            console.log(`📦 Packet #${index + 1}/${totalPackets}`);
        }

        if (logLevel === "Basic" && !this.basicPacketsPrinted) {
            if (index === totalPackets - 1) {
                console.log(`📦 Total packets: ${totalPackets}`);
                this.basicPacketsPrinted = true;
            }
        }
    }
}

// ======================================================
// ====== Logger ====== Класс уровней логгирования ======
// ======================================================

class Logger {
    constructor() {
        this.level = typeof logLevel !== "undefined" ? logLevel : "Basic";
    }

    // ---------------------------------------------------------
    // Основной метод логирования
    // ---------------------------------------------------------
    log(level, message) {
        const order = {
            "None": 0,
            "Basic": 1,
            "Verbose": 2,
            "Debug": 3,
            "Error": 4
        };

        // Если уровень сообщения ниже установленного — пропускаем
        if (order[level] > order[this.level] && level !== "Error") return;

        const timestamp = this.getTimestamp();
        const formatted = `[${timestamp}] [${level}] ${message}`;

        // Error всегда выводим
        if (level === "Error") {
            console.error(formatted);
            return;
        }

        // Debug
        if (level === "Debug") {
            console.debug(formatted);
            return;
        }

        // Verbose
        if (level === "Verbose") {
            console.log(formatted);
            return;
        }

        // Basic
        if (level === "Basic") {
            console.log(formatted);
            return;
        }
    }

    // ---------------------------------------------------------
    // Уровни логов
    // ---------------------------------------------------------
    basic(msg) { this.log("Basic", msg); }
    verbose(msg) { this.log("Verbose", msg); }
    debug(msg) { this.log("Debug", msg); }
    error(msg) { this.log("Error", msg); }

    // ---------------------------------------------------------
    // Timestamp
    // ---------------------------------------------------------
    getTimestamp() {
        const d = new Date();
        return `${this.pad(d.getHours())}:${this.pad(d.getMinutes())}:${this.pad(d.getSeconds())}`;
    }

    pad(n) {
        return n < 10 ? "0" + n : n;
    }
}

// ==================================
// ====== Главный блок плагина ======
// ==================================

const deviceController = new DeviceController();
const frameBuilder = new FrameBuilder(deviceController);
const packetSender = new PacketSender(deviceController);
const logger = new Logger();

export function Initialize() {
    deviceController.initialize();
    deviceController.setSoftwareMode();
}

export function Render() {
    const frame = frameBuilder.buildFrame();
    if (!frameBuilder.isFrameChanged(frame)) return;
    packetSender.sendFrame(frame);
}

export function Shutdown() {
    const frame = frameBuilder.buildShutdownFrame("#000000");
    packetSender.sendFrame(frame);
}

export function ControllableParameters() {
    return [
        { name: "packetSize", type: "number", min: 16, max: 48, default: 48 },
        { name: "packetPause", type: "number", min: 0, max: 10, default: 3 },
        { name: "useChecksum", type: "boolean", default: false },
        { name: "LightingMode", type: "list", values: ["Canvas", "Forced"], default: "Canvas" },
        { name: "forcedColor", type: "color", default: "#009bde" },
        { name: "monochrome", type: "boolean", default: false },
        { name: "monochromeMode", type: "list", values: ["Max", "Average", "Luma"], default: "Max" },
        { name: "logLevel", type: "list", values: ["None", "Basic", "Verbose", "Debug"], default: "Basic" }
    ];
}
