import {
  commonPackage,
  DriverStatus,
  VehicleType as SharedVehicleType,
  Role as SharedRole,
  TripStatus as SharedTripStatus
} from "../../index";

export const protoToEntityDriverStatus = (protoStatus: commonPackage.DriverStatus) => {
    switch (protoStatus) {
        case commonPackage.DriverStatus.DRIVER_STATUS_UNSPECIFIED:
            return DriverStatus.UNSPECIFIED;
        case commonPackage.DriverStatus.DRIVER_STATUS_OFFLINE:
            return DriverStatus.OFFLINE;
        case commonPackage.DriverStatus.DRIVER_STATUS_ONLINE:
            return DriverStatus.ONLINE;
        case commonPackage.DriverStatus.DRIVER_STATUS_BUSY:
            return DriverStatus.BUSY;
        default:
            return DriverStatus.UNRECOGNIZED;
    }
}

export const entityToProtoDriverStatus = (entityStatus: DriverStatus): commonPackage.DriverStatus => {
  switch (entityStatus) {
    case DriverStatus.UNSPECIFIED:
      return commonPackage.DriverStatus.DRIVER_STATUS_UNSPECIFIED;
    case DriverStatus.OFFLINE:
      return commonPackage.DriverStatus.DRIVER_STATUS_OFFLINE;
    case DriverStatus.ONLINE:
      return commonPackage.DriverStatus.DRIVER_STATUS_ONLINE;
    case DriverStatus.BUSY:
      return commonPackage.DriverStatus.DRIVER_STATUS_BUSY;
    case DriverStatus.UNRECOGNIZED:
    default:
      return commonPackage.DriverStatus.DRIVER_STATUS_UNSPECIFIED; // hoặc DRIVER_STATUS_UNRECOGNIZED nếu proto có
  }
};

/** Helper function to create DriverStatusWrapper from entity status */
export function createDriverStatusWrapper(entityStatus: DriverStatus) {
  return {
    statusId: entityToProtoDriverStatus(entityStatus),
    status: entityStatus
  };
}


/** VehicleType Proto -> DB (shared string) */
export function vehicleTypeToDB(value: commonPackage.VehicleType): SharedVehicleType {
  switch (value) {
    case commonPackage.VehicleType.VEHICLE_TYPE_BIKE: return SharedVehicleType.BIKE;
    case commonPackage.VehicleType.VEHICLE_TYPE_SEDAN: return SharedVehicleType.SEDAN;
    case commonPackage.VehicleType.VEHICLE_TYPE_SUV: return SharedVehicleType.SUV;
    case commonPackage.VehicleType.VEHICLE_TYPE_SEVEN_SEAT: return SharedVehicleType.SEVEN_SEAT;
    default: return SharedVehicleType.BIKE; //
  }
}

/** Role Proto -> DB (passenger only) */
export function roleToDB(value: commonPackage.Role): SharedRole {
  switch (value) {
    case commonPackage.Role.ROLE_PASSENGER: return SharedRole.PASSENGER;
    default: return SharedRole.PASSENGER; // chỉ passenger hiện tại
  }
}

/** TripStatus Proto -> DB (shared string) */
export function tripStatusToDB(value: commonPackage.TripStatus): SharedTripStatus {
  switch (value) {
    case commonPackage.TripStatus.TRIP_STATUS_SEARCHING: return SharedTripStatus.SEARCHING;
    case commonPackage.TripStatus.TRIP_STATUS_ACCEPTED: return SharedTripStatus.ACCEPTED;
    case commonPackage.TripStatus.TRIP_STATUS_IN_PROGRESS: return SharedTripStatus.IN_PROGRESS;
    case commonPackage.TripStatus.TRIP_STATUS_COMPLETED: return SharedTripStatus.COMPLETED;
    case commonPackage.TripStatus.TRIP_STATUS_CANCELLED: return SharedTripStatus.CANCELLED;
    default: return SharedTripStatus.SEARCHING; // fallback
  }
}

/** Chuyển ngược DB -> Proto */

/** VehicleType DB -> Proto */
export function vehicleTypeFromDB(value: SharedVehicleType): commonPackage.VehicleType {
  switch (value) {
    case SharedVehicleType.BIKE: return commonPackage.VehicleType.VEHICLE_TYPE_BIKE;
    case SharedVehicleType.SEDAN: return commonPackage.VehicleType.VEHICLE_TYPE_SEDAN;
    case SharedVehicleType.SUV: return commonPackage.VehicleType.VEHICLE_TYPE_SUV;
    case SharedVehicleType.SEVEN_SEAT: return commonPackage.VehicleType.VEHICLE_TYPE_SEVEN_SEAT;
    default: return commonPackage.VehicleType.VEHICLE_TYPE_UNSPECIFIED;
  }
}

/** Role DB -> Proto */
export function roleFromDB(value: SharedRole): commonPackage.Role {
  switch (value) {
    case SharedRole.PASSENGER: return commonPackage.Role.ROLE_PASSENGER;
    default: return commonPackage.Role.ROLE_UNSPECIFIED;
  }
}

/** TripStatus DB -> Proto */
export function tripStatusFromDB(value: SharedTripStatus): commonPackage.TripStatus {
  switch (value) {
    case SharedTripStatus.SEARCHING: return commonPackage.TripStatus.TRIP_STATUS_SEARCHING;
    case SharedTripStatus.ACCEPTED: return commonPackage.TripStatus.TRIP_STATUS_ACCEPTED;
    case SharedTripStatus.IN_PROGRESS: return commonPackage.TripStatus.TRIP_STATUS_IN_PROGRESS;
    case SharedTripStatus.COMPLETED: return commonPackage.TripStatus.TRIP_STATUS_COMPLETED;
    case SharedTripStatus.CANCELLED: return commonPackage.TripStatus.TRIP_STATUS_CANCELLED;
    default: return commonPackage.TripStatus.TRIP_STATUS_UNSPECIFIED;
  }
}
