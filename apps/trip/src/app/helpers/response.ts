import { roleFromDB, tripStatusFromDB, vehicleTypeFromDB } from "@uit-go-backend/shared";
import { Trip } from "../trips/entities/trip.entity";

export const tripResponse = (trip: Trip) => {
    const ratingsResponse = trip.ratings.map(rating => {
        return {
            id: rating.id,
            tripId: rating.trip.id,
            score: rating.rating,  // 1-5 stars
            comment: rating.comment,
            raterRole: {
                roleId: roleFromDB(rating.raterRole),
                raterRole: rating.raterRole
            }, // enum
            createdAt: rating.createdAt.toString()
        }
    })

    return {
        success: true,
        data: {
            id: trip.id,
            passengerId: trip.passengerId,
            driverId: trip.driverId,
            pickup: {
                lng: trip.pickupLng,
                lat: trip.pickupLat,
                address: trip.pickupAddress
            },
            dropoff: {
                lng: trip.dropoffLng,
                lat: trip.dropoffLat,
                address: trip.dropoffAddress
            },
            vehicleType: {
                typeId: vehicleTypeFromDB(trip.vehicleType),
                type: trip.vehicleType,
            },
            tripStatus: {
                statusId: tripStatusFromDB(trip.tripStatus),
                status: trip.tripStatus
            },
            distanceKm: trip.distanceKm,
            estimatedPrice: trip.estimatedPrice,
            finalPrice: trip.finalPrice,
            cancelledBy: trip.cancelledBy,
            createdAt: trip.createdAt?.toString() ?? "",
            acceptedAt: trip.acceptedAt?.toString() ?? "",
            completedAt: trip.completedAt?.toString() ?? "",
            cancelledAt: trip.cancelledAt?.toString() ?? "",
            updatedAt: trip.updatedAt?.toString() ?? "",
            ratings: ratingsResponse
        }
    }
}

export const tripsResponse = (userId: string, trips: Trip[]) => {
    return {
        userId,
        trips: trips.map(trip => {
            const ratingsResponse = trip.ratings.map(rating => {
                return {
                    id: rating.id,
                    tripId: rating.trip.id,
                    score: rating.rating,  // 1-5 stars
                    comment: rating.comment,
                    raterRole: {
                        roleId: roleFromDB(rating.raterRole),
                        raterRole: rating.raterRole
                    }, // enum
                    createdAt: rating.createdAt.toString()
                }
            })

            return {
                id: trip.id,
                passengerId: trip.passengerId,
                driverId: trip.driverId,
                pickup: {
                    lng: trip.pickupLng,
                    lat: trip.pickupLat,
                    address: trip.pickupAddress
                },
                dropoff: {
                    lng: trip.dropoffLng,
                    lat: trip.dropoffLat,
                    address: trip.dropoffAddress
                },
                vehicleType: {
                    typeId: vehicleTypeFromDB(trip.vehicleType),
                    type: trip.vehicleType,
                },
                tripStatus: {
                    statusId: tripStatusFromDB(trip.tripStatus),
                    status: trip.tripStatus
                },
                distanceKm: trip.distanceKm,
                estimatedPrice: trip.estimatedPrice,
                finalPrice: trip.finalPrice,
                cancelledBy: trip.cancelledBy,
                createdAt: trip.createdAt.toString(),
                acceptedAt: trip.acceptedAt.toString(),
                completedAt: trip.completedAt.toString(),
                cancelledAt: trip.cancelledAt.toString(),
                updatedAt: trip.updatedAt.toString(),
                ratings: ratingsResponse
            }
        })
    }
}