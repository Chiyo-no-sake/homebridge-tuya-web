import {
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
} from "homebridge";
import { TuyaWebGroupCharacteristic } from "./base";
import { DeviceState, ExtendedBoolean } from "../../api/response";
import { TuyaBoolean } from "../../helpers/TuyaBoolean";
import { LightGroup } from "../LightGroup";

export class OnGroupCharacteristic extends TuyaWebGroupCharacteristic<LightGroup> {
  public static Title = "Characteristic.On";

  public static HomekitCharacteristic(group: LightGroup) {
    return group.platform.Characteristic.On;
  }

  public static isSupportedByAccessory(accessory): boolean {
    return accessory.deviceConfig.data.state !== undefined;
  }

  // called by homekit to know our device state
  public getRemoteValue(callback: CharacteristicGetCallback): void {
    this.group.accessories.forEach(accessory => {
      accessory
        .getDeviceState()
        .then((data) => {
          this.debug("[GET] %s", data?.state);
          this.updateValue(data, callback);
        })
        .catch(accessory.handleError("GET", callback));
    })
      
  }

  // Called by homekit when setting our device state
  public setRemoteValue(
    homekitValue: CharacteristicValue,
    callback: CharacteristicSetCallback
  ): void {
    

    // Set device state in Tuya Web API
    const value = homekitValue ? 1 : 0;

    // Set the remote value for every accessory, then 
    Promise.all(
      this.group.accessories.map(accessory => {
        return accessory
        .setDeviceState("turnOnOff", { value }, { state: homekitValue })
        .then(() => {
          this.debug("[SET] %s %s", homekitValue, value);
          callback();
        })
        .catch(accessory.handleError("SET", callback));
      })
    ).then(() => callback())
  }

  // Refresh:
  // - receives the (emulated) device state from tuya
  // - updates the state of each accessory
  updateValue(data: DeviceState, callback?: CharacteristicGetCallback): void {
    if (data?.state !== undefined) {
      const stateValue = TuyaBoolean(data.state as ExtendedBoolean);
      this.group.accessories.forEach(d => {
        d.setCharacteristic(
          this.homekitCharacteristic,
          stateValue,
          !callback
        );
      })
      callback && callback(null, stateValue);
    } else {
      callback &&
        callback(new Error("Could not find required property 'state'"));
    }
  }
}
