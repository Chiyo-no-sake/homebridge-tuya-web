import { BaseAccessory, CharacteristicConstructor } from "../../accessories";
import { LogLevel } from "homebridge";
import {
  Characteristic,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
} from "homebridge";
import { LightGroup } from "../LightGroup";
import { DeviceState } from "../../api/response";

export abstract class TuyaWebGroupCharacteristic<
  T extends LightGroup = LightGroup
> {
  public static Title: string;
  public static HomekitCharacteristic: (
    group: LightGroup
  ) => CharacteristicConstructor;

  public setProps(characteristic?: Characteristic): Characteristic | undefined {
    return characteristic;
  }

  constructor(protected group: LightGroup) {
    this.enable();
  }

  private get staticInstance(): typeof TuyaWebGroupCharacteristic {
    return <typeof TuyaWebGroupCharacteristic>this.constructor;
  }

  public get title(): string {
    return this.staticInstance.Title;
  }

  public get homekitCharacteristic(): CharacteristicConstructor {
    return this.staticInstance.HomekitCharacteristic(this.group);
  }

  private log(logLevel: LogLevel, message: string, ...args: unknown[]): void {
    this.group.log.log(
      logLevel,
      `[%s] %s - ${message}`,
      this.group.name,
      this.title,
      ...args
    );
  }

  protected debug(message: string, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  protected info(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  protected warn(message: string, ...args: unknown[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  protected error(message: string, ...args: unknown[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  /**
   * Getter tuya HomeKit;
   * Should provide HomeKit compatible data homeKit callback
   * @param callback
   */
  public getRemoteValue?(callback: CharacteristicGetCallback): void;

  /**
   * Setter homeKit HomeKit
   * Called when value is changed in HomeKit.
   * Must update remote value
   * Must call callback after completion
   * @param homekitValue
   * @param callback
   */
  public setRemoteValue?(
    homekitValue: CharacteristicValue,
    callback: CharacteristicSetCallback
  ): void;

  /**
   * Updates the cached value for the device.
   * @param data
   * @param callback
   */
  public updateValue?(
    data?: DeviceState | undefined,
    callback?: CharacteristicGetCallback
  ): void;

  private enable(): void {
    this.group.accessories.forEach(accessory => {
      const char = this.setProps(
        accessory.service?.getCharacteristic(this.homekitCharacteristic)
      );
  
      if (char) {
        this.debug(JSON.stringify(char.props));
        if (this.getRemoteValue) {
          char.on("get", this.getRemoteValue.bind(this));
        }
  
        if (this.setRemoteValue) {
          char.on("set", this.setRemoteValue.bind(this));
        }
      }
  
      if (this.updateValue) {
        accessory.addUpdateCallback(
          this.homekitCharacteristic,
          this.updateValue.bind(this)
        );
      }
    })
  }
}
