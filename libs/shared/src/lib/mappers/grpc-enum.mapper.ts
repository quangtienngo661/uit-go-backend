import { VehicleType as HttpVehicleType } from '../enums/shared-enums';


// VehicleType Mappers
export function mapVehicleTypeToProto(type: HttpVehicleType): number {
  const mapping: Record<HttpVehicleType, number> = {
    [HttpVehicleType.BIKE]: 1,
    [HttpVehicleType.SEDAN]: 2,
    [HttpVehicleType.SUV]: 3,
    [HttpVehicleType.SEVEN_SEAT]: 4,
  };
  return mapping[type];
}

export function mapProtoToVehicleType(protoValue: number): HttpVehicleType {
  const mapping: Record<number, HttpVehicleType> = {
    1: HttpVehicleType.BIKE,
    2: HttpVehicleType.SEDAN,
    3: HttpVehicleType.SUV,
    4: HttpVehicleType.SEVEN_SEAT,
  };
  return mapping[protoValue];
}

