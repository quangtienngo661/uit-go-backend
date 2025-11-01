import { Controller, Inject, Logger } from "@nestjs/common";
import { Ctx, MessagePattern, Payload, RmqContext } from "@nestjs/microservices";
// import { RmqService } from "./rmq.service";
import { TripsService } from "../trips/trips.service";

@Controller()
export class TripsListener {
    constructor(
        // private readonly rmqService: RmqService, 
        private readonly tripService: TripsService
    ) { }

    private readonly logger = new Logger(TripsListener.name);


    @MessagePattern('invite.driver')
    async handleInviteDriver(@Payload() data: any, @Ctx() context: RmqContext) {
        this.logger.log(`📩 Received invite.driver: ${JSON.stringify(data)}`);

        this.tripService.inviteDriver(data);
    }

    @MessagePattern('driver.accepted')
    async handleDriverAccepted(@Payload() data: any, @Ctx() context: RmqContext) {
        this.logger.log(`📩 Received driver.accepted: ${JSON.stringify(data)}`);

        this.tripService.assignDriver({ tripId: data.tripId, driverId: data.driverId })
    }

    @MessagePattern('driver.rejected')
    async handleDriverRejected(@Payload() data: any, @Ctx() context: RmqContext) {
        this.logger.log(`📩 Received driver.rejected: ${JSON.stringify(data)}`);

        this.tripService.rejectTrip({ tripId: data.tripId })
    }
}