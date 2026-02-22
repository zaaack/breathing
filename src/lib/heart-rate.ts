/// <reference types="web-bluetooth" />

// 定义解析结果接口
interface HeartRateData {
  heartRate: number
  contactDetected?: boolean
  energyExpended?: number
  rrIntervals?: number[]
}

export class HeartRateParser {
  static parse(value: DataView): HeartRateData {
    const flags = value.getUint8(0)
    // 判断心率值是 8位 还是 16位 (第0位: 0 为 uint8, 1 为 uint16)
    const is16Bit = (flags & 0x01) !== 0

    let result: HeartRateData = { heartRate: 0 }
    let offset = 1

    if (is16Bit) {
      result.heartRate = value.getUint16(offset, true)
      offset += 2
    } else {
      result.heartRate = value.getUint8(offset)
      offset += 1
    }

    // 可选：解析接触检测、能量消耗、RR间期等（华为手环广播通常只含心率）
    return result
  }
}

export class HuaweiBandService {
  private device: BluetoothDevice | null = null
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null

  // 标准心率服务 UUID
  private readonly HEART_RATE_SERVICE = 'heart_rate'
  private readonly HEART_RATE_CHAR = 'heart_rate_measurement'

  async connect(): Promise<void> {
    try {
        navigator.bluetooth.getDevices().then(devices => {
            console.log(devices);
        })
      // 1. 请求设备 (必须由用户点击事件触发)
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [this.HEART_RATE_SERVICE] }],
        optionalServices: ['battery_service'], // 可选：顺便读取电量
      })

      // 2. 连接 GATT 服务器
      const server = await this.device.gatt?.connect()
      if (!server) throw new Error('无法连接到手环服务器')

      // 3. 获取服务和特征
      const service = await server.getPrimaryService(this.HEART_RATE_SERVICE)
      this.characteristic = await service.getCharacteristic(
        this.HEART_RATE_CHAR
      )

      // 4. 监听通知
      this.characteristic.addEventListener(
        'characteristicvaluechanged',
        (event: any) => {
          const value: DataView = event.target.value
          const data = HeartRateParser.parse(value)
          console.log(`[华为手环] 实时心率: ${data.heartRate} BPM`)

          // 这里可以分发事件到 UI 层
          window.dispatchEvent(new CustomEvent('hr-update', { detail: data }))
        }
      )

      await this.characteristic.startNotifications()
      console.log('心率订阅成功！')
    } catch (error) {
      console.error('连接失败:', error)
    }
  }

  disconnect() {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect()
      console.log('已断开连接')
    }
  }
}
