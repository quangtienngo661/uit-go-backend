export enum VerificationStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

export enum VehicleType {
    BIKE = 'bike',
    SEDAN = 'sedan',
    SUV = 'suv',
    SEVEN_SEAT = '7seat'
}

export enum Role {
    PASSENGER = 'passenger',
    DRIVER = 'driver'
}

export enum TripStatus {
    SEARCHING = 'searching',
    ACCEPTED = 'accepted',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

export enum DriverStatus {
    OFFLINE = 'offline',
    ONLINE = 'online',
    BUSY = 'busy'
}