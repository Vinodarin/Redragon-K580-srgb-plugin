// ==================================================================
// ====== DeviceController ====== Класс управления устройством ======
// ==================================================================


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
