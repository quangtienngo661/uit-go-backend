import { Controller, Inject, Logger } from "@nestjs/common";
import { EventPattern, MessagePattern, Payload } from "@nestjs/microservices";
import { DriversService } from "../drivers/drivers.service";

@Controller()
export class DriversListener {
    constructor(
        private readonly driversService: DriversService
    ) { }

    private readonly logger = new Logger(DriversListener.name);

    @EventPattern('trip.created')
    async handleTripCreated(@Payload() data: any) {
        this.logger.log('Received trip.created: ' + JSON.stringify(data));
        this.driversService.handleTripCreated(data)
    }

    @EventPattern('trip.cancelled')
    async handleTripCancelled(@Payload() data: any) {
        this.logger.log('Received trip.cancelled: ' + JSON.stringify(data));
        this.driversService.handleTripCancelled(data)
    }

    @EventPattern('trip.completed')
    async handleTripCompleted(@Payload() data: any) {
        this.logger.log('Received trip.completed: ' + JSON.stringify(data));
        this.driversService.handleTripCompleted(data)
    }
}